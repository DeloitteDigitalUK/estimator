import { expect } from 'chai';
import { Project, newProject, Solution, newSolution, EstimateType, ThroughputType, StartType } from './projects';

describe('Project factory', function() {
    
    it("Can create a valid project based on just name and owner", function() {
        Project.validate(newProject({name: "Test project", owner: "user123"}));
    });

    it("Can override fields", function() {
        const solution = newProject({name: "Test project", owner: "user123", _id: "abc1"});

        Project.validate(solution);
        expect(solution._id).to.equal("abc1");
    });

});
    

describe('Solution factory', function() {

    it("Can create a valid solution based on just name", function() {
        Solution.validate(newSolution({name: "Test solution"}));
    });

    it("Can override fields", function() {
        const solution = newSolution({name: "Test solution", _id: "abc1"});

        Solution.validate(solution);
        expect(solution._id).to.equal("abc1");
    });

});

describe('Validation', function() {
    
    it("Throughput period is required if estimate type is backlog", function() {

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                throughputPeriodLength: null
            }))
        }).to.throw();


        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.workPattern,
                throughputPeriodLength: null
            }))
        }).not.to.throw();

    });

    it("Start date is required if start type is fixed date", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                startType: StartType.fixedDate,
                startDate: null
            }))
        }).to.throw();


        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                startType: StartType.fixedDate,
                startDate: new Date(2017, 0, 1)
            }))
        }).not.to.throw();

    });

    it("Does not require start date or dependency if solution starts immediately", function() {

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                startType: StartType.immediately,
                startDate: null,
                startDependency: null
            }))
        }).not.to.throw();

    });

    it("Start dependency is required if start type is start-with", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                startType: StartType.with,
                startDependency: null
            }))
        }).to.throw();


        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                startType: StartType.with,
                startDependency: 'id123'
            }))
        }).not.to.throw();

    });

    it("Start dependency is required if start type is start-after", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                startType: StartType.after,
                startDependency: null
            }))
        }).to.throw();


        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                startType: StartType.after,
                startDependency: 'id123'
            }))
        }).not.to.throw();

    });

    it("Backlog is required if estimate type is backlog", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: null
            }))
        }).to.throw();


        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 0,
                    highGuess: 0,
                    lowSplitRate: 1,
                    highSplitRate: 1   
                }
            }))
        }).not.to.throw();

    });

    it("Backlog size high guess must be greater than low guess", function() {
       
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 2,
                    highGuess: 1,
                    lowSplitRate: 1,
                    highSplitRate: 1   
                }
            }))
        }).to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 1,
                    highGuess: 2,
                    lowSplitRate: 1,
                    highSplitRate: 1   
                }
            }))
        }).not.to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 2,
                    highGuess: 2,
                    lowSplitRate: 1,
                    highSplitRate: 1   
                }
            }))
        }).not.to.throw();

    });

    it("Backlog split rate high guess must be greater than low guess", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 0,
                    highGuess: 0,
                    lowSplitRate: 2.1,
                    highSplitRate: 1.2  
                }
            }))
        }).to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 0,
                    highGuess: 0,
                    lowSplitRate: 1.2,
                    highSplitRate: 2.1   
                }
            }))
        }).not.to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 0,
                    highGuess: 0,
                    lowSplitRate: 1.2,
                    highSplitRate: 1.2  
                }
            }))
        }).not.to.throw();

    });

    it("Backlog risk impact high guess must be greater than low guess", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 0,
                    highGuess: 0,
                    lowSplitRate: 1,
                    highSplitRate: 1,
                    risks: [{name: "A", likelihood: 0.5, lowImpact: 5, highImpact: 2}]
                }
            }))
        }).to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 0,
                    highGuess: 0,
                    lowSplitRate: 1,
                    highSplitRate: 1,
                    risks: [{name: "A", likelihood: 0.5, lowImpact: 2, highImpact: 5}]
                }
            }))
        }).not.to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                backlog: {
                    lowGuess: 0,
                    highGuess: 0,
                    lowSplitRate: 1,
                    highSplitRate: 1,
                    risks: [{name: "A", likelihood: 0.5, lowImpact: 2, highImpact: 2}]
                }
            }))
        }).not.to.throw();

    });

    it("Throughput samples are required if throughput type is samples", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                team: {
                    members: [],
                    throughputType: ThroughputType.samples,
                    throughputSamples: null,
                    throughputEstimate: null,
                    rampUp: null,
                    workPattern: []
                }
            }))
        }).to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                team: {
                    members: [],
                    throughputType: ThroughputType.samples,
                    throughputSamples: [],
                    throughputEstimate: null,
                    rampUp: null,
                    workPattern: []
                }
            }))
        }).to.throw();


        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                team: {
                    members: [],
                    throughputType: ThroughputType.samples,
                    throughputSamples: [{periodStartDate: new Date(2017, 0, 1), throughput: 1}],
                    throughputEstimate: null,
                    rampUp: null,
                    workPattern: []
                }
            }))
        }).not.to.throw();

    });

    it("Throughput estimate is required if throughput type is estimate", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                team: {
                    members: [],
                    throughputType: ThroughputType.estimate,
                    throughputSamples: [],
                    throughputEstimate: null,
                    rampUp: null,
                    workPattern: []
                }
            }))
        }).to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
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
                }
            }))
        }).not.to.throw();

    });

    it("Throughput high guess must be greater than low guess ", function() {
        
        expect(() => {
            Solution.validate(newSolution({
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
                }
            }))
        }).to.throw();

        expect(() => {
            Solution.validate(newSolution({
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
                }
            }))
        }).not.to.throw();
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
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
                }
            }))
        }).not.to.throw();
        
    });

    it("Ramp up throughput scaling high guess must be greater than low guess ", function() {
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                team: {
                    members: [],
                    throughputType: ThroughputType.estimate,
                    throughputSamples: [],
                    throughputEstimate: {
                        lowGuess: 1,
                        highGuess: 1
                    },
                    rampUp: {
                        duration: 1,
                        throughputScalingLowGuess: 0.2,
                        throughputScalingHighGuess: 0.1
                    },
                    workPattern: []
                }
            }))
        }).to.throw();

        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                team: {
                    members: [],
                    throughputType: ThroughputType.estimate,
                    throughputSamples: [],
                    throughputEstimate: {
                        lowGuess: 1,
                        highGuess: 1
                    },
                    rampUp: {
                        duration: 1,
                        throughputScalingLowGuess: 0.1,
                        throughputScalingHighGuess: 0.2
                    },
                    workPattern: []
                }
            }))
        }).not.to.throw();
        
        expect(() => {
            Solution.validate(newSolution({
                name: "Test solution",
                estimateType: EstimateType.backlog,
                team: {
                    members: [],
                    throughputType: ThroughputType.estimate,
                    throughputSamples: [],
                    throughputEstimate: {
                        lowGuess: 1,
                        highGuess: 1
                    },
                    rampUp: {
                        duration: 1,
                        throughputScalingLowGuess: 0.2,
                        throughputScalingHighGuess: 0.2
                    },
                    workPattern: []
                }
            }))
        }).not.to.throw();

    });


});
    