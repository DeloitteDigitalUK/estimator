/**
 * A single run didn't complete in `overflow` iterations.
 */
export class OverflowException extends Error {}

/**
 * Simulation state machine. Subclass and override methods
 * to inform simulation run, then call `run()`.
 */
export default class MonteCarloSimulator {

    // state machine

    /**
     * Called when a new multi-run simulation begins
     * 
     * @param {Integer} runs The number of runs to be completed.
     */
    beginSimulation(runs) {}

    /**
     * Called when a new run of the simuation begins
     * @param {Integer} runNumber 0-indexed run number
     */
    beginRun(runNumber) {}
    
    /**
     * Called once per run to return the number of work
     * items for this simulation run.
     */
    getWorkItems() { return 0; }
    
    /**
     * Called repeatedly to get a throughput sample until
     * the simulationState ends. Period number is the current
     * period, so the first run has period number 1.
     */
    getThroughputSample(periodNumber) { return 1; }
    
    /**
     * Return an object that will be attached to the results
     * of this simulation run.
     */
    getMetadata() { return {}; }

    /**
     * Called when a run of the simluation ends.
     */
    endRun() {}

    /**
     * Called when a new multi-run simulation ends
     */
    endSimulation() {}

    // Execution

    /**
     * Run a single simulation of completing the work items and return the number of
     * periods required to do so.
     * 
     * @param {Integer} overflow Raise `OverflowException` if not complete in this many iterations.
     */
    singleRun(overflow=10000) {
        
        let workItemsRemaining = this.getWorkItems(),
            periodsElapsed = 0;
        
        while(workItemsRemaining > 0) {
            if(periodsElapsed > overflow) {
                throw new OverflowException();
            }
    
            ++periodsElapsed
            workItemsRemaining -= this.getThroughputSample(periodsElapsed);
        }
    
        return periodsElapsed;
    }

    /**
     * Run multiple simulations of completing the work items and return an array of
     * objects with keys `runNumber` (0-indexed run number), `periods` (number of
     * periods required to complete that run), and `metadata` as returned by the
     * `simulationState` for that run.
     * 
     * @param {Integer} runs The number of runs to complete
     * @param {Integer} overflow Raise `OverflowException` if any run is not able to complete
     *                           in this many iterations.
     */
    run(runs, overflow=10000) {
        
        let results = [];

        this.beginSimulation(runs);

        for(let runNumber = 0; runNumber < runs; ++runNumber) {

            this.beginRun(runNumber);

            results.push({
                runNumber,
                periods: this.singleRun(overflow),
                metadata: this.getMetadata()
            });

            this.endRun();
        }

        this.endSimulation();

        return results;
    }

}






