import _ from 'lodash';

import { EstimateType, ThroughputType, Solution } from '../collections/projects';

import MonteCarloSimulator from './montecarlo';

export class CannotSimulate extends Error {}

export class SolutionSimulator extends MonteCarloSimulator {

    constructor(solution, includeMetadata=true) {
        super();
        this.solution = solution;
        this.includeMetadata = includeMetadata;

        this.backlog = 0;
        this.metadata = {};
    }

    beginSimulation(runs) {
        // sanity check

        Solution.validate(this.solution);

        if(this.solution.estimateType === EstimateType.workPattern || this.solution.team.throughputType === ThroughputType.none) {
            throw new CannotSimulate(`Monte Carlo simulations only make sense for backlog-based forecasts, but solution ${this.solution._id} is based on a fixed work pattern`);
        }
    }

    beginRun(runNumber) {

        const backlog = this.solution.backlog;

        let totalBacklog = 0;

        // initial size: random number between `backlog.lowGuess` and `backlog.highGuess`
        const initialBacklog = _.random(backlog.lowGuess, backlog.highGuess);
        totalBacklog += initialBacklog;

        // adjust for story splits: random number between `backlog.lowSplitRate` and `backlog.highSplitRate` as multiplier
        const splitRate = _.random(backlog.lowSplitRate, backlog.highSplitRate, true),
              splits = _.round(initialBacklog * (splitRate - 1));
        totalBacklog += splits;

        // adjust for risks: random number 0..1 vs risk `likelihood`, add betwen `risk.lowImpact` and `risk.highImpact` stories
        let risks = [];
        (backlog.risks || []).forEach(r => {
            if(_.random(0, 1, true) <= r.likelihood) {
                const impact = _.random(r.lowImpact, r.highImpact);
                totalBacklog += impact;

                risks.push({
                    ...r,
                    impact
                });
            }
        });

        this.backlog = totalBacklog;

        if(this.includeMetadata) {
            this.metadata = {
                totalBacklog,
                initialBacklog,
                splits,
                risks,
                periods: []
            };
        }
        
    }

    endRun() {
        this.backlog = 0;
        this.metadata = {};
    }

    getWorkItems() { 
        return this.backlog;
    }
    
    getThroughputSample(periodNumber) {
        const team = this.solution.team;
        let periodThroughput = 0,
            scalingFactor = 1;

        if(team.throughputType === ThroughputType.samples) {
            periodThroughput = _.sample(team.throughputSamples.map(s => s.throughput))
        } else if(team.throughputType === ThroughputType.estimate) {
            periodThroughput = _.random(team.throughputEstimate.lowGuess, team.throughputEstimate.highGuess);
        }

        // account for ramp-up
        if(team.rampUp && periodNumber <= team.rampUp.duration) {
            scalingFactor = _.random(team.rampUp.throughputScalingLowGuess, team.rampUp.throughputScalingHighGuess, true);
            periodThroughput = _.round(periodThroughput * scalingFactor);
        }


        if(this.includeMetadata) {
            this.metadata.periods.push(periodThroughput);
        }

        return periodThroughput;
    }
    
    getMetadata() {
        return this.metadata;
    }

}

/**
 * Run multiple simulations of completing the work in the backlog of `solution`,
 * and return an array of objects with keys `runNumber` (0-indexed run number),
 * `periods` (number of periods required to complete that run), and `metadata`
 * containing keys `totalBacklog`, `initialBacklog`, `splits`, `risks` and `periods`.
 * 
 * @param {Object} solution The solution. Must have an `estimateType` of `EstimateType.backlog`.
 * @param {Integer} runs The number of runs to complete.
 * @param {Boolean} includeMetadata Set to `false` to not save metadata (reduces payload of results)
 * @param {Integer} overflow Raise `OverflowException` if any run is not able to complete
 *                           in this many iterations.
 */
export default function simulateSolution(solution, runs, includeMetadata=true, overflow=10000) {
    return new SolutionSimulator(solution, includeMetadata).run(runs, overflow);
}