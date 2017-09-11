import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';

import _ from 'lodash';
import SimpleSchema from 'simpl-schema';

const Integer = SimpleSchema.Integer;

export const THROUGHPUT_SAMPLES = "throughputSamples";
export const THROUGHPUT_ESTIMATE = "throughputEstimate";
export const WORK_PATTERN = "workPattern";

export const FIXED_DATE = "fixedDate";
export const AFTER = "after";
export const WITH = "with";

export const Solution = new SimpleSchema({

    _id: String,
    name: String,
    description: { type: String, optional: true },

    startType: { type: String, allowedValues: [FIXED_DATE, AFTER, WITH] },
    startDate: { type: Date, optional: true },  // fixed date of starting
    startDependency: { type: String, optional: true },  // id of other solution in this project

    estimateType: { type: String, allowedValues: [THROUGHPUT_SAMPLES, THROUGHPUT_ESTIMATE, WORK_PATTERN] },

    // definition of solution scope
    scope: { type: Object, optional: true },

    'scope.lowGuess': { type: Integer, min: 0, defaultValue: 0 },
    'scope.highGuess': { type: Integer, min: 0, defaultValue: 0 },
    'scope.lowSplitRate': { type: Number, min: 1, defaultValue: 1 },
    'scope.highSplitRate': { type: Number, min: 1, defaultValue: 1 },

    // possible risks that could increae scope
    'scope.risks': { type: Array, optional: true },
    'scope.risks.$': Object,
    'scope.risks.$.name': String,
    'scope.risks.$.description': { type: String, optional: true },
    'scope.risks.$.likelihood': { type: Number, min: 0, max: 1}, // percentage
    'scope.risks.$.lowImpact': { type: Integer, min: 0 },  // number of work items added if risk hits (low guess)
    'scope.risks.$.highImpact': { type: Integer, min: 0 }, // number of work items added if risk hits (high guess)

    // definition of team
    team: Object,

    'team.members': { type: Array, optional: true },
    'team.members.$': Object,
    'team.members.$.role': String,
    'team.members.$.description': { type: String, optional: true },
    'team.members.$.quantity': { type: Number, min: 0, defaultValue: 1 },

    // throughput calculations
    'team.throughputPeriodLength': { type: Number, min: 1, defaultValue: 1 }, // weeks 

    // team's historical throughput
    'team.throughputSamples': { type: Array, optional: true },
    'team.throughputSamples.$': Object,
    'team.throughputSamples.$.periodStartDate': Date, // e.g. start of week or sprint
    'team.throughputSamples.$.description': { type: String, optional: true },
    'team.throughputSamples.$.throughput': Integer, // number of work items during this period

    // guess of team's throughput (will be used if there are no historical samples)
    'team.throughputEstimate': { type: Object, optional: true },
    'team.throughputEstimate.lowGuess': { type: Integer, min: 0 }, // work items per period (low guess)
    'team.throughputEstimate.highGuess': { type: Integer, min: 0 }, // work items per period (high guess)

    // S-curve scaling
    'team.rampUp': { type: Object, optional: true },
    'team.rampUp.duration': { type: Number, min: 0 }, // number of periods of ramp up
    'team.rampUp.throughputScalingLowGuess': { type: Number, min: 0 }, // work items per period (low guess)
    'team.rampUp.throughputScalingHighGuess': { type: Number, min: 0 }, // work items per period (high guess)

    // team's work pattern (will be used if there are no samples or throughput guesses)
    'team.workPattern': { type: Array, optional: true },
    'team.workPattern.$': Object,
    'team.workPattern.$.startDate': Date,
    'team.workPattern.$.endDate': Date

});

export const Project = new SimpleSchema({
    _id: String,

    // security
    owner: String,
    readOnlyShares: [String],
    readWriteShares: [String],

    // basic metadata
    name: String,
    description: { type: String, optional: true },

    // list of solutions
    solutions: [Solution]
});

/**
 * Create a new minimal solution object
 */
export function newSolution({ name, ...rest }) {
    return Solution.clean(_.extend({
        _id: Random.id(),
        name,
        description: null,
        
        startType: FIXED_DATE,
        startDate: null,
        startDependency: null,
        
        estimateType: THROUGHPUT_ESTIMATE,
        
        scope: {
            lowGuess: 0,
            highGuess: 0,
            lowSplitRate: 1,
            highSplitRate: 1   
        },

        risks: [],
        
        team: {
            members: [],
            throughputPeriod: 1,
            throughputSamples: [],
            throughputEstimate: {
                lowGuess: 0,
                highGuess: 0
            },
            rampUp: null,
            workPattern: []
        }
    }, rest));
}

const Projects = new Mongo.Collection("Projects");
Projects.attachSchema(Project);

Projects.allow({

    insert(userId, doc) {
        return userId && doc.owner === userId;
    },

    update(userId, doc, fields, modifier) {
        return userId && (userId === doc.owner || _.includes(doc.readWriteShares, userId)) && !_.includes(fields, 'owner');
    },

    remove(userId, doc) {
        return userId && doc.owner === userId;
    },

    fetch: ['owner', 'readWriteShares']

});

export default Projects;

export function checkProjectOwnership(userId, projectId, canWrite) {
    if (!userId) {
        return false;
    }

    const project = Projects.findOne(projectId);
    if (!project) {
        return false;
    }

    return (
        project.owner === userId ||
        (!canWrite && _.includes(project.readOnlyShares, userId)) ||
        _.includes(project.readWriteShares, userId)
    );
}


if (Meteor.isServer) {

    Meteor.publish('projects', function () {
        if (!this.userId) {
            this.error(new Meteor.Error(401, 'Unauthorized'));
        } else {
            return Projects.find({
                $or: [
                    { owner: this.userId },
                    { readOnlyShares: this.userId },
                    { readWriteShares: this.userId }
                ]
            });
        }
    });
    
}
