import chai, { expect } from 'chai';

import { Random } from 'meteor/random';

import { newProject, newSolution, EstimateType, StartType, ThroughputType, ActualsStatus } from '../collections/projects';

import simulateProject from './project';

import fullFixture from '../__tests__/fixture.full';

chai.config.truncateThreshold = 0;

describe('Project simulation', function() {
    
    it("Can simulate an empty project", function() {
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1)
        });

        const results = simulateProject(project, [.50, .85, .95], 100);

        expect(results).to.eql([]);
    });

    it("Can simulate a project with a single, work pattern solution", function() {
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 1",
                    estimateType: EstimateType.workPattern,
                    startType: StartType.immediately,
                    team: {
                        members: [],
                        throughputType: null,
                        workPattern: [{
                            startDate: new Date(2017, 0, 1),
                            endDate: new Date(2017, 0, 7)
                        },{
                            startDate: new Date(2017, 0, 15),
                            endDate: new Date(2017, 0, 20)
                        }]
                    }
                })
            ]
        });

        const results = simulateProject(project, [.50, .85, .95], 100);

        expect(results.length).to.eql(1);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 7)
        },{
            startDate: new Date(2017, 0, 15),
            endDate: new Date(2017, 0, 20)
        }]);
    });

    it("Can simulate a project with a single, backlog solution", function() {
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    backlog: {
                        lowGuess: 3,
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
                })
            ]
        });

        const results = simulateProject(project, [.50, .85, .95], 100);

        expect(results.length).to.eql(1);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 21),
            percentile: .50,
            description: '50th percentile'
        },{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 21),
            percentile: .85,
            description: '85th percentile'
        },{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 21),
            percentile: .95,
            description: '95th percentile'
        }]);
    });

    it("Can simulate a project with a single, backlog solution with a fixed start date", function() {
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 1, 1),
                    backlog: {
                        lowGuess: 3,
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
                })
            ]
        });

        const results = simulateProject(project, [.50, .85, .95], 100);

        expect(results.length).to.eql(1);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 21),
            percentile: .50,
            description: '50th percentile'
        },{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 21),
            percentile: .85,
            description: '85th percentile'
        },{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 21),
            percentile: .95,
            description: '95th percentile'
        }]);
    });

    it("Can simulate a project with a backlog solution dependent on another, finish-start", function() {

        const id1 = Random.id();

        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    _id: id1,
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 1, 1),
                    backlog: {
                        lowGuess: 3,
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
                }),
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.after,
                    startDependency: id1,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 21),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 1, 22),
            endDate: new Date(2017, 2, 7),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution dependent on another defined later, finish-start", function() {
        
        const id1 = Random.id();
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.after,
                    startDependency: id1,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    _id: id1,
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.immediately,
                    backlog: {
                        lowGuess: 3,
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
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 21),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 0, 22),
            endDate: new Date(2017, 1, 4),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution dependent on another defined later, start-start", function() {
        
        const id1 = Random.id();
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.with,
                    startDependency: id1,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    _id: id1,
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 1, 1),
                    backlog: {
                        lowGuess: 3,
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
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 21),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 14),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution transitively dependent on another defined later, finish-start", function() {
        
        const id1 = Random.id(),
              id2 = Random.id();
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 3",
                    estimateType: EstimateType.backlog,
                    startType: StartType.with,
                    startDependency: id2,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    _id: id2,
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.after,
                    startDependency: id1,
                    backlog: {
                        lowGuess: 1,
                        highGuess: 1,
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
                }),
                newSolution({
                    _id: id1,
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 1, 1),
                    backlog: {
                        lowGuess: 3,
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
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(3);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 21),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 1, 22),
            endDate: new Date(2017, 1, 28),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[2].solution.name).to.eql("Test 3");
        expect(results[2].dates).to.eql([{
            startDate: new Date(2017, 1, 22),
            endDate: new Date(2017, 2, 7),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution dependent on a fixed work solution, finish-start", function() {
        
        const id1 = Random.id();
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.after,
                    startDependency: id1,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    _id: id1,
                    name: "Test 1",
                    estimateType: EstimateType.workPattern,
                    startType: StartType.immediately,
                    team: {
                        members: [],
                        throughputType: null,
                        workPattern: [{
                            startDate: new Date(2017, 1, 1),
                            endDate: new Date(2017, 1, 7)
                        },{
                            startDate: new Date(2017, 1, 15),
                            endDate: new Date(2017, 1, 20)
                        }]
                    }
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 7)
        },{
            startDate: new Date(2017, 1, 15),
            endDate: new Date(2017, 1, 20)
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 1, 21),
            endDate: new Date(2017, 2, 6),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution dependent on a fixed work solution, start-start", function() {
        
        const id1 = Random.id();
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.with,
                    startDependency: id1,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    _id: id1,
                    name: "Test 1",
                    estimateType: EstimateType.workPattern,
                    startType: StartType.immediately,
                    team: {
                        members: [],
                        throughputType: null,
                        workPattern: [{
                            startDate: new Date(2017, 1, 1),
                            endDate: new Date(2017, 1, 7)
                        },{
                            startDate: new Date(2017, 1, 15),
                            endDate: new Date(2017, 1, 20)
                        }]
                    }
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 7)
        },{
            startDate: new Date(2017, 1, 15),
            endDate: new Date(2017, 1, 20)
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 14),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution dependent on a fixed work solution with no work pattern", function() {
        
        const id1 = Random.id();
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.after,
                    startDependency: id1,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    _id: id1,
                    name: "Test 1",
                    estimateType: EstimateType.workPattern,
                    startType: StartType.immediately,
                    team: {
                        members: [],
                        throughputType: null,
                        workPattern: []
                    }
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 14),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution sequenced by team order", function() {

        const t1 = Random.id(),
              t2 = Random.id();

        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            teams: [
                {_id: t1, name: "Front end team"},
                {_id: t2, name: "Back end team"}
            ],
            solutions: [
                newSolution({
                    name: "Test 1",
                    teamId: t1,
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 3,
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
                }),
                newSolution({
                    name: "Test 2",
                    teamId: t2,
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    name: "Test 3",
                    teamId: t1,
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(3);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 21),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 14),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[2].solution.name).to.eql("Test 3");
        expect(results[2].dates).to.eql([{
            startDate: new Date(2017, 0, 22),
            endDate: new Date(2017, 1, 4),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution sequenced by team order for default team", function() {

        const t2 = Random.id();

        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            teams: [
                {_id: t2, name: "Back end team"}
            ],
            solutions: [
                newSolution({
                    name: "Test 1",
                    // teamId: null,
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 3,
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
                }),
                newSolution({
                    name: "Test 2",
                    teamId: t2,
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    name: "Test 3",
                    // teamId: null,
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(3);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 21),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 14),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[2].solution.name).to.eql("Test 3");
        expect(results[2].dates).to.eql([{
            startDate: new Date(2017, 0, 22),
            endDate: new Date(2017, 1, 4),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with a backlog solution sequenced by team order after fixed start date", function() {

        const t1 = Random.id(),
              t2 = Random.id();

        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            teams: [
                {_id: t1, name: "Front end team"},
                {_id: t2, name: "Back end team"}
            ],
            solutions: [
                newSolution({
                    name: "Test 1",
                    teamId: t1,
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 1, 1),
                    backlog: {
                        lowGuess: 3,
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
                }),
                newSolution({
                    name: "Test 2",
                    teamId: t2,
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                }),
                newSolution({
                    name: "Test 3",
                    teamId: t1,
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(3);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 1, 1),
            endDate: new Date(2017, 1, 21),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 0, 1),
            endDate: new Date(2017, 0, 14),
            percentile: .50,
            description: '50th percentile'
        }]);

        expect(results[2].solution.name).to.eql("Test 3");
        expect(results[2].dates).to.eql([{
            startDate: new Date(2017, 1, 22),
            endDate: new Date(2017, 2, 7),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project with part finished work", function() {
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 0, 1),
                    backlog: {
                        lowGuess: 3,
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
                    actuals: {  // 1 done, 2 remaining from 4/1/2017
                        status: ActualsStatus.started,
                        startDate: new Date(2017, 0, 2),
                        toDate: new Date(2017, 0, 4),
                        workItems: 1
                    }
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(1);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 2),  // actual start
            endDate: new Date(2017, 0, 18),  // 2 periods from 4/1
            percentile: .50,
            description: '50th percentile (1 work items completed to 04/01/2017)'
        }]);

    });

    it("Can simulate a project with a solution dependent on another with part finished work", function() {
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 0, 1),
                    backlog: {
                        lowGuess: 3,
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
                    actuals: {  // 1 done, 2 remaining from 4/1/2017
                        status: ActualsStatus.started,
                        startDate: new Date(2017, 0, 2),
                        toDate: new Date(2017, 0, 4),
                        workItems: 1
                    }
                }),
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 2),  // actual start
            endDate: new Date(2017, 0, 18),  // 2 periods from 4/1
            percentile: .50,
            description: '50th percentile (1 work items completed to 04/01/2017)'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 0, 19),
            endDate: new Date(2017, 1, 1),
            percentile: .50,
            description: '50th percentile'
        }]);

    });

    it("Can simulate a project where actual start date overrides dependent start date", function() {

        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 0, 1),
                    backlog: {
                        lowGuess: 3,
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
                    actuals: {  // 1 done, 2 remaining from 4/1/2017
                        status: ActualsStatus.started,
                        startDate: new Date(2017, 0, 2),
                        toDate: new Date(2017, 0, 4),
                        workItems: 1
                    }
                }),
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                        startDate: new Date(2017, 0, 17),
                        toDate: new Date(2017, 0, 17),
                        workItems: 0,
                    }
                })
            ]
        });

        const results = simulateProject(project, [.50], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 2),  // actual start
            endDate: new Date(2017, 0, 18),  // 2 periods from 4/1
            percentile: .50,
            description: '50th percentile (1 work items completed to 04/01/2017)'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 0, 17),
            endDate: new Date(2017, 0, 31),
            percentile: .50,
            description: '50th percentile (0 work items completed to 17/01/2017)'
        }]);

    })

    it("Can simulate a project with completed work", function() {

        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 0, 1),
                    backlog: {
                        lowGuess: 3,
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
                        status: ActualsStatus.completed,
                        startDate: new Date(2017, 0, 2),
                        toDate: new Date(2017, 0, 4),
                        workItems: 5
                    }
                })
            ]
        });

        const results = simulateProject(project, [.50, .75], 100);

        expect(results.length).to.eql(1);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 2),
            endDate: new Date(2017, 0, 4),
            description: 'Actual (completed)'
        }]);

    });

    it("Can simulate a project with a solution dependent on another with completed work", function() {
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 1",
                    estimateType: EstimateType.backlog,
                    startType: StartType.fixedDate,
                    startDate: new Date(2017, 0, 1),
                    backlog: {
                        lowGuess: 3,
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
                        status: ActualsStatus.completed,
                        startDate: new Date(2017, 0, 2),
                        toDate: new Date(2017, 0, 4),
                        workItems: 5
                    }
                }),
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.teamNext,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                })
            ]
        });

        const results = simulateProject(project, [.50, .75], 100);

        expect(results.length).to.eql(2);

        expect(results[0].solution.name).to.eql("Test 1");
        expect(results[0].dates).to.eql([{
            startDate: new Date(2017, 0, 2),
            endDate: new Date(2017, 0, 4),
            description: 'Actual (completed)'
        }]);

        expect(results[1].solution.name).to.eql("Test 2");
        expect(results[1].dates).to.eql([{
            startDate: new Date(2017, 0, 5),
            endDate: new Date(2017, 0, 18),
            percentile: 0.5,
            description: '50th percentile'
        },{
            startDate: new Date(2017, 0, 5),
            endDate: new Date(2017, 0, 18),
            percentile: 0.75,
            description: '75th percentile'
        }]);

    });

    it("Throws if solution depends on a solution that doesn't exist in the same project", function() {
        const id1 = Random.id();
        
        const project = newProject({
            name: "Test project",
            owner: "abc1",
            startDate: new Date(2017, 0, 1),
            solutions: [
                newSolution({
                    name: "Test 2",
                    estimateType: EstimateType.backlog,
                    startType: StartType.after,
                    startDependency: id1,
                    backlog: {
                        lowGuess: 2,
                        highGuess: 2,
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
                })
            ]
        });

        expect(() => simulateProject(project, [.50], 100)).to.throw();
    });

    it("Can simulate a complex project", function() {
        
        const results = simulateProject(fullFixture, [.50, .75, .85, .95], 1000);

        expect(results.length).to.eql(3);
        
        expect(results[0].solution.name).to.eql("Front end");
        expect(results[1].solution.name).to.eql("Middleware");
        expect(results[2].solution.name).to.eql("Back end");
    });



});