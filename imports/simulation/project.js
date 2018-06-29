import _ from 'lodash';
import moment from 'moment';
import { quantile } from 'd3-array';
import toposort from 'toposort-keys';

import { StartType, EstimateType, ActualsStatus } from '../collections/projects';
import simulateSolution, { CannotSimulate } from './solution';

import { getSuffix, getPublicSetting } from '../utils';

const DATE_FORMAT = getPublicSetting('dateFormat');

function sortInDependencyOrder(solutions) {
    const lookup = solutions.reduce((m, s, idx) => ({...m, [s._id]: idx}), {}); // id => index in array
    return toposort(
        solutions,
        (dag, idx) => dag[idx].startDependency? [lookup[dag[idx].startDependency]] : []
    ).map(idx => solutions[idx]);
}

function calculateRelativeStartDate(solution, dependency, projectStartDate, percentile) {
    if(dependency.solution.estimateType === EstimateType.workPattern || (
        dependency.solution.estimateType === EstimateType.backlog &&
        !_.isEmpty(dependency.solution.actuals) &&
        dependency.solution.actuals.status === ActualsStatus.completed
    )) {

        if(dependency.dates.length === 0) {
            return projectStartDate;
        }

        if(solution.startType === StartType.with) {
            return dependency.dates[0].startDate;
        } else {
            return moment.utc(dependency.dates[dependency.dates.length - 1].endDate).add(1, 'day').toDate();
        }

    } else {
        const percentileDates = _.find(dependency.dates, d => d.percentile === percentile);
        
        if(!percentileDates) {
            throw new CannotSimulate(`Solution ${solution._id} depends on solution ${solution.startDependency}, but no forecast was provided at the ${percentile}${getSuffix(percentile)} percentile.`);
        }

        if(solution.startType === StartType.with) {
            return percentileDates.startDate;
        } else {
            return moment.utc(percentileDates.endDate).add(1, 'day').toDate();
        }
    }
}

function findPrecedingSolutionForTeam(solution, solutions, lookup) {
    let current = null;
    for(let s of solutions) {
        
        if(s._id === solution._id) {
            break;
        }

        if((!s.teamId && ! solution.teamId) || (s.teamId === solution.teamId)) {
            current = s;
        }
    }

    return current;
}

function calculateStartDate(solution, solutions, lookup, projectStartDate, percentile) {

    let dependency, previous;

    // use actual start date if recorded
    if(!_.isEmpty(solution.actuals) && solution.actuals.status !== ActualsStatus.notStarted) {
        return solution.actuals.startDate;
    } 

    // otherwise calculate from dependency
    switch(solution.startType) {
        
        case StartType.immediately:
            return projectStartDate;

        case StartType.fixedDate:
            return solution.startDate;

        case StartType.with:
        case StartType.after:

            dependency = lookup[solution.startDependency];

            if(!dependency) {
                throw new CannotSimulate(`Solution ${solution._id} depends on solution ${solution.startDependency}, which was not found.`);
            }

            return calculateRelativeStartDate(solution, dependency, projectStartDate, percentile)
        
        case StartType.teamNext:
            
            previous = findPrecedingSolutionForTeam(solution, solutions);

            if(!previous) {
                return projectStartDate;
            }

            dependency = lookup[previous._id];

            if(!dependency) {
                throw new CannotSimulate(`Solution ${solution._id} should start after solution ${previous._id}, which was not found.`);
            }

            return calculateRelativeStartDate(solution, dependency, projectStartDate, percentile)
    
        default:
            throw new CannotSimulate(`Solution ${solution._id} does not have a valid startType`);

    }

}

// calculate the dates list for one solution -- {startDate, endDate, percentile?, description}
function calculateDates(solution, solutions, lookup, projectStartDate, percentiles, runs, overflow, periodLength) {

    const actuals = solution.actuals;

    switch(solution.estimateType) {
        
        case EstimateType.backlog:

            // use actual start/end if we marked this as completed
            if(!_.isEmpty(actuals) && actuals.status === ActualsStatus.completed) {
                return [{
                    startDate: actuals.startDate,
                    endDate: actuals.toDate,
                    description: "Actual (completed)"
                }];
            }
            
            const results = simulateSolution(solution, runs, false, overflow);
            const distribution = _.sortBy(results, 'periods').map(s => s.periods);

            return percentiles.map(percentile => {
                const periods = quantile(distribution, percentile),
                      startDate = calculateStartDate(solution, solutions, lookup, projectStartDate, percentile);
                
                let simulationStartDate = startDate,
                    description = `${Math.round(percentile * 100.0)}${getSuffix(Math.round(percentile * 100.0))} percentile`;
                
                if(!_.isEmpty(actuals) && actuals.status === ActualsStatus.started) {
                    simulationStartDate = moment.utc(actuals.toDate).add(1, 'days').toDate();
                    description += ` (${actuals.workItems} work items completed to ${moment(actuals.toDate).format(DATE_FORMAT)})`;
                }

                const endDate = moment.utc(simulationStartDate).add((periods * periodLength) - 1, 'days').toDate();

                return {startDate, endDate, percentile, description};
            });

        case EstimateType.workPattern:
            return _.cloneDeep(solution.team.workPattern || []);

        default:
            throw new CannotSimulate(`Solution ${solution._id} does not have a valid estimateType`);
    
    }

}

/**
 * Return a simulated project plan - [{solution, dates: [{startDate, endDate, description}]}].
 * 
 * @param {Project} project The project to simulate
 * @param {Array<Integer>} percentiles A list of percentiles to simulate at. When solutions use
 *  backlog throughput estimation, these are the confidence intervals that will be used.
 * @param {Integer} runs Number of runs of the simulator to execute for each solution.
 * @param {Integer} overflow If a solution simulation doesn't complete after this many runs, abort.
 * @param {Integer} periodLength Number of days in a period (7 = periods in weeks)
 */
export default function simulateProject(project, percentiles, runs, overflow=10000, periodLength=7) {

    let solutions = sortInDependencyOrder(project.solutions),
        lookup = {}; // {[solution._id]: {solution, dates}}

    return solutions.map(solution => {
        const dates = calculateDates(solution, solutions, lookup, project.startDate, percentiles, runs, overflow, periodLength);
        lookup[solution._id] = {solution, dates};
        return {solution, dates};
    });

}