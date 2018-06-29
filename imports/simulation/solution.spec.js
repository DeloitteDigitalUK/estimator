import chai, { expect } from 'chai';
import { newSolution, EstimateType, ThroughputType, ActualsStatus } from '../collections/projects';
import simulateSolution from './solution';

chai.config.truncateThreshold = 0;

describe('Solution simulation', function() {
    
    it("throws for fixed work pattern solutions", function() {

        let solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.workPattern
        });

        expect(() => {simulateSolution(solution, 1)}).to.throw();

        solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog
        });

        expect(() => {simulateSolution(solution, 1)}).not.to.throw();

    });

    it("throws for no-throughput teams", function() {
        
        let solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            team: {
                members: [],
                throughputType: ThroughputType.none,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 0,
                    highGuess: 0
                },
                rampUp: null,
                workPattern: []
            },
        });

        expect(() => {simulateSolution(solution, 1)}).to.throw();

        solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 0,
                    highGuess: 0
                },
                rampUp: null,
                workPattern: []
            },
        });

        expect(() => {simulateSolution(solution, 1)}).not.to.throw();

    });

    it("validates the solution before running", function() {
        
        let solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 2,
                    highGuess: 1
                },
                rampUp: null,
                workPattern: []
            },
        });

        expect(() => {simulateSolution(solution, 1)}).to.throw();

        solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 1,
                    highGuess: 2
                },
                rampUp: null,
                workPattern: []
            },
        });

        expect(() => {simulateSolution(solution, 1)}).not.to.throw();
        
    });

    it("can set initial backlog based on a low/high guess", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 3, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 3,
                lowSplitRate: 1,
                highSplitRate: 1   
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 1,
                    highGuess: 1
                },
                rampUp: null,
                workPattern: []
            },
        });

        const results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 3,
            metadata: {
                totalBacklog: 3,
                initialBacklog: 3,
                actualsToDate: 0,
                splits: 0,
                risks: [],
                periods: [1, 1, 1]
            }
        } ]);

    });

    it("can add to backlog based on split rate", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 3, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 3,
                lowSplitRate: 1.5,
                highSplitRate: 1.5   
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 1,
                    highGuess: 1
                },
                rampUp: null,
                workPattern: []
            },
        });

        const results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 5,
            metadata: {
                totalBacklog: 5,
                initialBacklog: 3,
                actualsToDate: 0,
                splits: 2,
                risks: [],
                periods: [1, 1, 1, 1, 1]
            }
        } ]);

    });

    it("can add to backlog based on risks", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 3, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 3,
                lowSplitRate: 1,
                highSplitRate: 1,
                risks: [
                    {name: "A", likelihood: 0, lowImpact: 2, highImpact: 2}, // likelihood 0% or 100% to avoid randomness in test
                    {name: "B", likelihood: 1, lowImpact: 3, highImpact: 3},
                    {name: "C", likelihood: 1, lowImpact: 4, highImpact: 4},
                    {name: "D", likelihood: 0, lowImpact: 5, highImpact: 5},
                ]   
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 1,
                    highGuess: 1
                },
                rampUp: null,
                workPattern: []
            },
        });

        const results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 10,
            metadata: {
                totalBacklog: 10,
                initialBacklog: 3,
                actualsToDate: 0,
                splits: 0,
                risks: [
                    {name: "B", likelihood: 1, lowImpact: 3, highImpact: 3, impact: 3},
                    {name: "C", likelihood: 1, lowImpact: 4, highImpact: 4, impact: 4},
                ],
                periods: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            }
        } ]);

    });

    it("can reduce initial backlog based on actuals if started", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 3, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 3,
                lowSplitRate: 1,
                highSplitRate: 1   
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 1,
                    highGuess: 1
                },
                rampUp: null,
                workPattern: []
            },
            actuals: {
                status: ActualsStatus.started,
                startDate: new Date(2018, 0, 1),
                toDate: new Date(2018, 0, 15),
                workItems: 1
            }
        });

        const results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 2,
            metadata: {
                totalBacklog: 2,
                initialBacklog: 3,
                actualsToDate: 1,
                splits: 0,
                risks: [],
                periods: [1, 1]
            }
        } ]);

    });

    it("does not reduce initial backlog based on actuals if not started", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 3, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 3,
                lowSplitRate: 1,
                highSplitRate: 1   
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [],
                throughputEstimate: {
                    lowGuess: 1,
                    highGuess: 1
                },
                rampUp: null,
                workPattern: []
            },
            actuals: {
                status: ActualsStatus.notStarted,
                startDate: new Date(2018, 0, 1),
                toDate: new Date(2018, 0, 15),
                workItems: 1
            }
        });

        const results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 3,
            metadata: {
                totalBacklog: 3,
                initialBacklog: 3,
                actualsToDate: 0,
                splits: 0,
                risks: [],
                periods: [1, 1, 1]
            }
        } ]);

    });

    it("can base throughput on samples", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 8, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 8,
                lowSplitRate: 1,
                highSplitRate: 1   
            },
            team: {
                members: [],
                throughputType: ThroughputType.samples,
                throughputSamples: [ // setting to same value avoids randomness in test
                    {periodStartDate: new Date(2017, 0, 1), throughput: 2},
                    {periodStartDate: new Date(2017, 0, 8), throughput: 2},
                    {periodStartDate: new Date(2017, 0, 15), throughput: 2}
                ], 
                throughputEstimate: null,
                rampUp: null,
                workPattern: []
            },
        });

        const results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 4,
            metadata: {
                totalBacklog: 8,
                initialBacklog: 8,
                actualsToDate: 0,
                splits: 0,
                risks: [],
                periods: [2, 2, 2, 2]
            }
        } ]);

    });

    it("can base throughput on estimates", function() {
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 8, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 8,
                lowSplitRate: 1,
                highSplitRate: 1   
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [], 
                throughputEstimate: {
                    lowGuess: 2,
                    highGuess: 2
                },
                rampUp: null,
                workPattern: []
            },
        });

        const results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 4,
            metadata: {
                totalBacklog: 8,
                initialBacklog: 8,
                actualsToDate: 0,
                splits: 0,
                risks: [],
                periods: [2, 2, 2, 2]
            }
        } ]);
    });

    it("can scale throughput based on ramp-up", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 8, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 8,
                lowSplitRate: 1,
                highSplitRate: 1   
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [], 
                throughputEstimate: {
                    lowGuess: 2,
                    highGuess: 2
                },
                rampUp: {
                    duration: 2,
                    throughputScalingLowGuess: 0.5,
                    throughputScalingHighGuess: 0.5   
                },
                workPattern: []
            },
        });

        const results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 5,
            metadata: {
                totalBacklog: 8,
                initialBacklog: 8,
                actualsToDate: 0,
                splits: 0,
                risks: [],
                periods: [1, 1, 2, 2, 2]
            }
        }]);

    });

    it("can scale throughput based on ramp-up taking actual progress into account", function() {
        
        let solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 8, // setting high and low to the same value removes randomness for testing purposes
                highGuess: 8,
                lowSplitRate: 1,
                highSplitRate: 1   
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [], 
                throughputEstimate: {
                    lowGuess: 2,
                    highGuess: 2
                },
                rampUp: {
                    duration: 2,
                    throughputScalingLowGuess: 0.5,
                    throughputScalingHighGuess: 0.5   
                },
                workPattern: []
            },
            actuals: {
                status: ActualsStatus.started,
                startDate: new Date(2018, 0, 1),
                toDate: new Date(2018, 0, 15), // two weeks in, i.e. one ramp-up period
                workItems: 1,
            }
        });

        let results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 4,
            metadata: {
                totalBacklog: 7,
                initialBacklog: 8,
                actualsToDate: 1,
                splits: 0,
                risks: [],
                periods: [2, 2, 2, 2]
            }
        }]);

        // what if a different period length? in this case, 2 weeks = 1 period
        solution.throughputPeriodLength = 2;
        results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 4,
            metadata: {
                totalBacklog: 7,
                initialBacklog: 8,
                actualsToDate: 1,
                splits: 0,
                risks: [],
                periods: [1, 2, 2, 2]
            }
        }]);

        // what if not started?
        solution.throughputPeriodLength = 1;
        solution.actuals.status = ActualsStatus.notStarted;
        results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 5,
            metadata: {
                totalBacklog: 8,
                initialBacklog: 8,
                actualsToDate: 0,
                splits: 0,
                risks: [],
                periods: [1, 1, 2, 2, 2]
            }
        }]);

        // what if not an entire week?
        solution.actuals.toDate = new Date(2018, 0, 14);
        solution.actuals.status = ActualsStatus.started;

        results = simulateSolution(solution, 1);

        expect(results).to.eql([{
            runNumber: 0,
            periods: 4,
            metadata: {
                totalBacklog: 7,
                initialBacklog: 8,
                actualsToDate: 1,
                splits: 0,
                risks: [],
                periods: [1, 2, 2, 2]
            }
        }]);


    });

    it("can execute a large run with randomness based on throughput samples", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 300,
                highGuess: 350,
                lowSplitRate: 1.2,
                highSplitRate: 2.2,
                risks: [
                    {name: "A", likelihood: 0.1, lowImpact: 10, highImpact: 15},
                    {name: "B", likelihood: 0.2, lowImpact: 20, highImpact: 25},
                    {name: "C", likelihood: 0.3, lowImpact: 30, highImpact: 35},
                    {name: "D", likelihood: 0.4, lowImpact: 40, highImpact: 45},
                ]
            },
            team: {
                members: [],
                throughputType: ThroughputType.samples,
                throughputSamples: [
                    {periodStartDate: new Date(2017, 0,  2), throughput: 9},
                    {periodStartDate: new Date(2017, 0,  9), throughput: 14},
                    {periodStartDate: new Date(2017, 0, 16), throughput: 27},
                    {periodStartDate: new Date(2017, 0, 23), throughput: 1},
                    {periodStartDate: new Date(2017, 0, 30), throughput: 15},
                    {periodStartDate: new Date(2017, 1,  6), throughput: 18},
                    {periodStartDate: new Date(2017, 1, 13), throughput: 22},
                    {periodStartDate: new Date(2017, 1, 20), throughput: 16},
                    {periodStartDate: new Date(2017, 1, 27), throughput: 14},
                ], 
                throughputEstimate: null,
                rampUp: {
                    duration: 6,
                    throughputScalingLowGuess: 0.2,
                    throughputScalingHighGuess: 0.8   
                },
                workPattern: []
            },
        });

        const results = simulateSolution(solution, 2000, false);

        expect(results.length).to.eql(2000);
        
        for(let i = 0; i < 2000; ++i) {
            expect(results[0].metadata).to.eql({});
            expect(results[0].periods).to.be.greaterThan(13); // theoretical min
            expect(results[0].periods).to.be.lessThan(890); // theoretical min
        }

    });

    it("can execute a large run with randomness based on throughput guesses", function() {
        
        const solution = newSolution({
            name: "Test solution",
            estimateType: EstimateType.backlog,
            backlog: {
                lowGuess: 300,
                highGuess: 350,
                lowSplitRate: 1.2,
                highSplitRate: 2.2,
                risks: [
                    {name: "A", likelihood: 0.1, lowImpact: 10, highImpact: 15},
                    {name: "B", likelihood: 0.2, lowImpact: 20, highImpact: 25},
                    {name: "C", likelihood: 0.3, lowImpact: 30, highImpact: 35},
                    {name: "D", likelihood: 0.4, lowImpact: 40, highImpact: 45},
                ]
            },
            team: {
                members: [],
                throughputType: ThroughputType.estimate,
                throughputSamples: [], 
                throughputEstimate: {
                    lowGuess: 1,
                    highGuess: 27
                },
                rampUp: {
                    duration: 6,
                    throughputScalingLowGuess: 0.2,
                    throughputScalingHighGuess: 0.8   
                },
                workPattern: []
            },
        });

        const results = simulateSolution(solution, 2000, false);

        expect(results.length).to.eql(2000);
        
        for(let i = 0; i < 2000; ++i) {
            expect(results[0].metadata).to.eql({});
            expect(results[0].periods).to.be.greaterThan(13); // theoretical min
            expect(results[0].periods).to.be.lessThan(890); // theoretical min
        }

        
    });
    
});
