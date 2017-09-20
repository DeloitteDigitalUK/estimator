import _ from 'lodash';

import { EstimateType, ThroughputType, Solution } from '../collections/projects';

import MonteCarloSimulator from './montecarlo';

export class CannotSimulate extends Error {}

export class SolutionSimulator extends MonteCarloSimulator {

    constructor(solution) {
        super();
        this.solution = solution;
        this.metadata = {};
    }

    beginSimulation(runs) {
        // sanity check

        Solution.validate(this.solution);

        if(this.solution.estimateType === EstimateType.workPattern) {
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
              splits = _.round(initialBacklog * splitRate);
        totalBacklog += splits;

        // adjust for risks: random number 0..1 vs risk `likelihood`, add betwen `risk.lowImpact` and `risk.highImpact` stories
        let risks = [];
        (backlog.risks || []).forEach(r => {

            const hit = _.random(0, 1, true) <= r.likelihood;
            if(hit) {
                const impact = _.random(r.lowImpact, r.highImpact);
                totalBacklog += impact;

                risks.push({
                    ...r,
                    impact
                });
            }

        });

        this.metadata = {
            totalBacklog,
            initialBacklog,
            splits,
            risks,
            periods: []
        };
    }

    endRun() {
        this.metadata = {};
    }

    getWorkItems() { 
        return this.metadata.totalBacklog;
    }
    
    getThroughputSample(periodNumber) {
        const team = this.solution.team;
        let periodThroughput = 0;

        if(team.throughputType === ThroughputType.samples) {
            periodThroughput = _.sample(team.throughputSamples.map(s => s.throughput))
        } else if(team.throughputType === ThroughputType.estimate) {
            periodThroughput = _.random(team.throughputEstimate.lowGuess, team.throughputEstimate.highGuess);
        }

        this.metadata.periods.push(periodThroughput);
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
 * @param {Integer} overflow Raise `OverflowException` if any run is not able to complete
 *                           in this many iterations.
 */
export default function simulateSolution(solution, runs, overflow=10000) {
    return SolutionSimulator(solution).run(runs, overflow);
}