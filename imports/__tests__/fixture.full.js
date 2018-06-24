const firstSolutionId = 'YW74Dcpr2BvLQdtSB';

import { EstimateType, StartType, ThroughputType, newProject } from '../collections/projects';

export default newProject({
    _id: 'm2uNAAg6T5vYjAyDm',
    owner: 'CyLwgqZrGRckcyiGM',
    readOnlyShares: [],
    readWriteShares: [],
    name: "Full project",
    description: "A test project",
    startDate: new Date(2017, 0, 1),
    teams: [{
        _id: "2gTtH4bazGYkJ2pS6",
        name: "Front end team",
        description: "Works on the front end"
    },{
        _id: "CwbnFtWkY6iXpyKbL",
        name: "Back end team"
    }],
    workstreams: [{
        _id: "XaNWEqWYCcAdhutwD",
        name: "Channels",
        description: "Work in the channels"
    }],
    solutions: [{
        _id: firstSolutionId,
        name: "Front end",
        description: "Front end app and integrations",
        notes: "More details can go here",
        workstreamId: "XaNWEqWYCcAdhutwD",
        teamId: "2gTtH4bazGYkJ2pS6",
        estimateType: EstimateType.backlog,
        throughputPeriodLength: 2,
        startType: StartType.fixedDate,
        startDate: new Date(2017, 0, 1),
        backlog: {
            lowGuess: 100,
            highGuess: 120,
            lowSplitRate: 1,
            highSplitRate: 1.5,
            risks: [{
                name: "Limited business input",
                description: "Business could fail to engage",
                likelihood: 0.4,
                lowImpact: 5,
                highImpact: 10
            },{
                name: "Performance problems",
                likelihood: 0.2,
                lowImpact: 1,
                highImpact: 8
            }]
        },
        team: {
            members: [{
                role: "Manager",
                description: "Manages the project",
                quantity: 1
            },{
                role: "Developer",
                quantity: 5
            },{
                role: "Tester",
                quantity: 2
            }],
            throughputType: ThroughputType.samples,
            throughputSamples: [{
                periodStartDate: new Date(2017, 0, 1),
                description: "First period",
                throughput: 10
            }, {
                periodStartDate: new Date(2017, 0, 15),
                throughput: 15
            }],
            rampUp: {
                duration: 2,
                throughputScalingLowGuess: 0.1,
                throughputScalingHighGuess: 0.5,
            }
        }
    },{
        _id: 'fgFoRfMFTCQH5yACA',
        name: "Middleware",
        workstreamId: "XaNWEqWYCcAdhutwD",
        teamId: "CwbnFtWkY6iXpyKbL",
        estimateType: EstimateType.backlog,
        throughputPeriodLength: 1,
        startType: StartType.after,
        startDependency: firstSolutionId,
        backlog: {
            lowGuess: 100,
            highGuess: 120,
            lowSplitRate: 1,
            highSplitRate: 1.5
        },
        team: {
            members: [],
            throughputType: ThroughputType.estimate,
            throughputEstimate: {
                lowGuess: 10,
                highGuess: 15
            }
        }
    },{
        _id: 'uAxhHMCBjAfH4tyah',
        name: "Back end",
        workstreamId: null,
        teamId: "CwbnFtWkY6iXpyKbL",
        estimateType: EstimateType.workPattern,
        startType: StartType.with,
        startDependency: firstSolutionId,
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
    }]
});