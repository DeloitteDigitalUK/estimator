import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import _ from 'lodash';
import SimpleSchema from 'simpl-schema';

const Integer = SimpleSchema.Integer;

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
    'solutions': [Object],
    'solutions.$._id': String,
    'solutions.$.name': String,
    'solutions.$.description': { type: String, optional: true },

    'solutions.$.startDate': { type: Date, optional: true },    // fixed date of starting
    'solutions.$.startAfter': { type: String, optional: true }, // id of other solution in this project
    'solutions.$.startWith': { type: String, optional: true },  // id of other solution in this project

    // definition of solution scope
    'solutions.$.scope': { type: Object, optional: true },
    'solutions.$.scope.lowGuess': { type: Integer, min: 0, defaultValue: 0 },
    'solutions.$.scope.highGuess': { type: Integer, min: 0, defaultValue: 0 },
    'solutions.$.scope.lowSplitRate': { type: Number, min: 1, defaultValue: 1 },
    'solutions.$.scope.highSplitRate': { type: Number, min: 1, defaultValue: 1 },

    // possible risks that could increae scope
    'solutions.$.scope.risks': { type: Array, optional: true },
    'solutions.$.scope.risks.$': Object,
    'solutions.$.scope.risks.$.name': String,
    'solutions.$.scope.risks.$.description': { type: String, optional: true },
    'solutions.$.scope.risks.$.likelihood': { type: Number, min: 0, max: 1}, // percentage
    'solutions.$.scope.risks.$.lowImpact': { type: Integer, min: 0 },  // number of work items added if risk hits (low guess)
    'solutions.$.scope.risks.$.highImpact': { type: Integer, min: 0 }, // number of work items added if risk hits (high guess)

    // definition of team
    'solutions.$.team': Object,

    'solutions.$.team.members': { type: Array, optional: true },
    'solutions.$.team.members.$': Object,
    'solutions.$.team.members.$.role': String,
    'solutions.$.team.members.$.description': { type: String, optional: true },
    'solutions.$.team.members.$.quantity': { type: Number, min: 0, defaultValue: 1 },

    // throughput calculations
    'solutions.$.team.throughputPeriodLength': { type: Number, min: 1, defaultValue: 1 }, // weeks
    
    // team's historical throughput
    'solutions.$.team.throughputSamples': { type: Array, optional: true },
    'solutions.$.team.throughputSamples.$': Object,
    'solutions.$.team.throughputSamples.$.periodStartDate': Date, // e.g. start of week or sprint
    'solutions.$.team.throughputSamples.$.description': { type: String, optional: true },
    'solutions.$.team.throughputSamples.$.throughput': Integer, // number of work items during this period

    // guess of team's throughput (will be used if there are no historical samples)
    'solutions.$.team.throughputEstimate': { type: Object, optional: true },
    'solutions.$.team.throughputEstimate.lowGuess': { type: Integer, min: 0 }, // work items per period (low guess)
    'solutions.$.team.throughputEstimate.highGuess': { type: Integer, min: 0 }, // work items per period (high guess)

    // S-curve scaling
    'solutions.$.team.rampUp': { type: Object, optional: true },
    'solutions.$.team.rampUp.duration': { type: Number, min: 0 }, // number of periods of ramp up
    'solutions.$.team.rampUp.throughputScalingLowGuess': { type: Number, min: 0 }, // work items per period (low guess)
    'solutions.$.team.rampUp.throughputScalingHighGuess': { type: Number, min: 0 }, // work items per period (high guess)

    // team's work pattern (will be used if there are no samples or throughput guesses)
    'solutions.$.team.workPattern': { type: Array, optional: true },
    'solutions.$.team.workPattern.$': Object,
    'solutions.$.team.workPattern.$.startDate': Date,
    'solutions.$.team.workPattern.$.endDate': Date,

});

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
