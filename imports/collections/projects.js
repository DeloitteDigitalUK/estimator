import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import _ from 'lodash';
import SimpleSchema from 'simpl-schema';

export const Project = new SimpleSchema({
    _id: String,
    owner: String,
    name: String,
    startDate: Date,
    endDate: Date,

    description: {
        type: String,
        optional: true
    },

    readOnlyShares: [String],
    readWriteShares: [String],
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
