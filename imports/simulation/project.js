import _ from 'lodash';
import moment from 'moment';

import toposort from 'toposort-keys';

import { StartType, EstimateType } from '../collections/projects';
import simulateSolution, { CannotSimulate } from './solution';

import { getSuffix } from '../utils';

function sortInDependencyOrder(solutions) {
    const lookup = solutions.reduce((m, s, idx) => ({...m, [s._id]: idx}), {}); // id => index in array
    return toposort(
        solutions,
        (dag, idx) => dag[idx].startDependency? [lookup[dag[idx].startDependency]] : []
    ).map(idx => solutions[idx]);
}

function calculateStartDate(solution, lookup, projectStartDate, percentile) {

    switch(solution.startType) {
        
        case StartType.immediately:
            return projectStartDate;

        case StartType.fixedDate:
            return solution.startDate;

        case StartType.with:
        case StartType.after:

            const dependency = lookup[solution.startDependency];

            if(!dependency) {
                throw new CannotSimulate(`Solution ${solution._id} depends on solution ${solution.startDependency}, which was not found.`);
            }

            if(dependency.solution.estimateType === EstimateType.backlog) {
                const percentileDates = _.find(dependency.dates, d => d.percentile === percentile);
                
                if(!percentileDates) {
                    throw new CannotSimulate(`Solution ${solution._id} depends on solution ${solution.startDependency}, but no forecast was provided at the ${percentile}${getSuffix(percentile)} percentile.`);
                }
    
                if(solution.startType === StartType.with) {
                    return percentileDates.startDate;
                } else {
                    return moment.utc(percentileDates.endDate).add(1, 'day').toDate();
                }

            } else {

                if(dependency.dates.length === 0) {
                    return projectStartDate;
                }

                if(solution.startType === StartType.with) {
                    return dependency.dates[0].startDate;
                } else {
                    return moment.utc(dependency.dates[dependency.dates.length - 1].endDate).add(1, 'day').toDate();
                }

            }
        
        default:
            throw new CannotSimulate(`Solution ${solution._id} does not have a valid startType`);

    }

}

// calculate the dates list for one solution -- {startDate, endDate, percentile?, description}
function calculateDates(solution, lookup, projectStartDate, percentiles, runs, overflow, periodLength) {

    switch(solution.estimateType) {
        
        case EstimateType.backlog:

            let results = simulateSolution(solution, runs, false, overflow);
            results.sort((a, b) => (a.periods - b.periods));

            return percentiles.map(percentile => {
                const periods = results[Math.floor((results.length - 1) * (percentile / 100.0))].periods,
                      startDate = calculateStartDate(solution, lookup, projectStartDate, percentile),
                      endDate = moment.utc(startDate).add((periods * periodLength) - 1, 'days').toDate(),
                      description = `${percentile}${getSuffix(percentile)} percentile`;

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
        const dates = calculateDates(solution, lookup, project.startDate, percentiles, runs, overflow, periodLength);
        lookup[solution._id] = {solution, dates};
        return {solution, dates};
    });

}