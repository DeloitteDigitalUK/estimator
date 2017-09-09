import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Match, check } from 'meteor/check';

import { Projects } from '../collections/promisified';

import { checkProjectOwnership } from '../collections/projects';

import { getPublicSetting } from '../utils';

import * as search from './search';
import * as admin from './admin';
import * as dup from './duplicate';

const QUERY_MIN_LENGTH = getPublicSetting('queryMinLength');

Meteor.methods({

    /**
     * Search for user(s) by name or email address
     */
    'users/query': function (query) {
        check(query, String);
        if (query.length < QUERY_MIN_LENGTH) {
            return [];
        }

        return search.queryUser(query);
    },

    /**
     * Create a new user with the given email address and role
     */
    'users/create': function (email, role) {
        check(email, String);
        check(role, String);
        check(role, Match.OneOf('admin', null));

        if (!Roles.userIsInRole(Meteor.user(), ['admin'])) {
            throw new Meteor.Error(403, 'Permission denied');
        }

        admin.createNewUser(email, role);
    },


    /**
     * Clone the given project, including dependents, as the current user.
     * Does not clone `readOnlyShares` and `readWriteShares`.
     */
    'project/duplicate': function (projectId, name) {
        check(name, String);

        if (!checkProjectOwnership(this.userId, projectId)) {
            throw new Meteor.Error(403, 'Permission denied');
        }

        const project = Projects.findOne(projectId);
        return dup.duplicate(project, this.userId, name);
    },

});
