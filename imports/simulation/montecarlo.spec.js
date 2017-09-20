import chai, { expect } from 'chai';
import MonteCarloSimulator from './montecarlo';

chai.config.truncateThreshold = 0;

describe('Simulator', function() {
    
    it("triggers hooks", function() {
        
        class TestSimulator extends MonteCarloSimulator {

            constructor() {
                super();
                this.simulationEvents = [];
                this.events = [];
            }

            beginSimulation(runs) {
                this.simulationEvents.push(['beginSimulation', runs]);
            }
            
            beginRun(runNumber) {
                this.events = [];
                this.events.push(['beginRun', runNumber]);
            }

            getWorkItems() { 
                this.events.push(['getWorkItems']);
                return 2;
            }
                
            getThroughputSample(periodNumber) { 
                this.events.push(['getThroughputSample', periodNumber]);
                return 1;
            }
                
            getMetadata() {
                return {events: this.events}
            }
            
            endRun() {
                this.events.push(['endRun']);
            }
            
            endSimulation() {
                this.simulationEvents.push(['endSimulation']);
            }

        }

        const simulator = new TestSimulator();
        const results = simulator.run(2);
        
        expect(results).to.eql([{
            runNumber: 0,
            periods: 2,
            metadata: {
                events: [
                    ["beginRun", 0],
                    ["getWorkItems"],
                    ["getThroughputSample", 1],
                    ["getThroughputSample", 2],
                    ["endRun"]
                ]
            }
        }, {
            runNumber: 1,
            periods: 2,
            metadata: {
                events: [
                    ["beginRun", 1],
                    ["getWorkItems"],
                    ["getThroughputSample", 1],
                    ["getThroughputSample", 2],
                    ["endRun"]
                ]
            }
        }]);

        expect(simulator.simulationEvents).to.eql([
            ['beginSimulation', 2],
            ['endSimulation']
        ]);

    });

    it("stops on zero", function() {
        
        class TestSimulator extends MonteCarloSimulator {

            getWorkItems() { 
                return 2;
            }
                
            getThroughputSample(periodNumber) { 
                return 1;
            }

        }

        const simulator = new TestSimulator();
        const results = simulator.run(2);
        
        expect(results).to.eql([{
            runNumber: 0,
            periods: 2,
            metadata: {}
        }, {
            runNumber: 1,
            periods: 2,
            metadata: {}
        }]);

    });

    it("stops on negative", function() {
        
        class TestSimulator extends MonteCarloSimulator {

            getWorkItems() { 
                return 5;
            }
                
            getThroughputSample(periodNumber) { 
                return 2;
            }

        }

        const simulator = new TestSimulator();
        const results = simulator.run(2);
        
        expect(results).to.eql([{
            runNumber: 0,
            periods: 3,
            metadata: {}
        }, {
            runNumber: 1,
            periods: 3,
            metadata: {}
        }]);

    });

    it("throws on overflow", function() {
        
        class TestSimulator extends MonteCarloSimulator {

            getWorkItems() { 
                return 5;
            }
                
            getThroughputSample(periodNumber) { 
                return 1;
            }

        }

        const simulator = new TestSimulator();
        expect(() => {simulator.run(1, 3)}).to.throw();
        
    });
    
});
