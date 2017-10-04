/* globals Assets */

import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Match, check } from 'meteor/check';

import XlsxTemplate from 'xlsx-template';

import Projects, { checkProjectOwnership } from '../collections/projects';
import { getPublicSetting } from '../utils';

import * as search from './search';
import * as admin from './admin';
import * as exp from './export';

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
     * Export a project to an Excel workbook (Uint8Array of xlsx file)
     */
    'project/export': function(projectId, percentile, runs) {

        if(!checkProjectOwnership(this.userId, projectId)) {
            throw new Meteor.Error(403, 'Permission denied');
        }

        const templateFile = Assets.getBinary('resource-forecast.xlsx'),
              template = new XlsxTemplate(templateFile),
              project = Projects.findOne(projectId);

        exp.exportProject(template, project, percentile, runs);

        return template.generate({type: 'uint8array'})
    },

});
