import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Match, check } from 'meteor/check';

import { getPublicSetting } from '../utils';

import * as search from './search';
import * as admin from './admin';

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
    }

});
