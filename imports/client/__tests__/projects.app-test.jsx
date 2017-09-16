/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';

import _ from 'lodash';
import { expect } from 'chai';

import * as userHelpers from './userhelpers.app-test';

import { callMethod, subscribe } from '../../utils';

import Projects, { newProject } from '../../collections/projects';

describe('Project CRUD and security', () => {

    // Create test users and projects

    before(async function (done) {
        this.primaryUserId = await userHelpers.setUpTestUser();
        this.secondaryUserId = await userHelpers.setUpSecondaryTestUser();
        done();
    });

    after(async function (done) {
        await userHelpers.tearDownTestUser();
        await userHelpers.tearDownSecondaryTestUser();
        done();
    });

    // Log in and reset data for each test

    beforeEach(async function (done) {
        await userHelpers.loginToTestAccount();
        await callMethod('fixtures/cleanData', 'users');
        done();
    });

    afterEach(async function (done) {
        await userHelpers.logout();
        await callMethod('fixtures/cleanData', 'users');
        done();
    });

    // Tests

    it('should allow a user to create a project', async function (done) {
        let id = await Projects.insert(newProject({
            owner: Meteor.user()._id,
            name: "My project",
            description: "My description",
        }));

        expect(id).to.be.ok;
        done();
    });

    it('should not allow an unauthenticated user to create a project', async function (done) {
        await userHelpers.logout();

        try {
            await Projects.insert(newProject({
                owner: this.primaryUserId,
                name: "My project",
                description: "My description",
            }));
        } catch (err) {
            expect(err).to.be.ok;
            done();
        }
    });

    it('validates project ownership on creation', async function (done) {
        try {
            await Projects.insert(newProject({
                owner: this.secondaryUserId,
                name: "My project",
                description: "My description",
            }));
        } catch (err) {
            expect(err).to.be.ok;
            done();
        }
    });

    it('validates project ownership on update', async function (done) {
        let projectId = await Projects.insert(newProject({
            owner: Meteor.user()._id,
            name: "My project",
            description: "My description",
        }));

        try {
            await Projects.update(projectId, {
                $set: { owner: "foobar", name: "New name" }
            });
        } catch (err) {
            expect(err).to.be.ok;

            await subscribe("projects");
            expect(Projects.findOne(projectId).name).to.equal("My project");

            done();
        }
    });

    it('allows update if ownership unchanged', async function (done) {
        let projectId = await Projects.insert(newProject({
            owner: Meteor.user()._id,
            name: "My project",
            description: "My description"
        }));

        await Projects.update(projectId, {
            $set: { name: "New name" }
        });

        await subscribe("projects");

        expect(Projects.findOne(projectId).name).to.equal("New name");
        done();
    });

    it('allows deleting own project', async function (done) {
        let projectId = await Projects.insert(newProject({
            owner: Meteor.user()._id,
            name: "My project",
            description: "My description",
        }));

        await Projects.remove(projectId);
        await subscribe("projects");

        expect(Projects.findOne(projectId)).not.to.be.ok;
        done();
    });

    it('does not allow deleting other user project', async function (done) {
        let projectId = await Projects.insert(newProject({
            owner: Meteor.user()._id,
            name: "My project",
            readOnlyShares: [this.secondaryUserId],
            readWriteShares: [],
            description: "My description",
        }));

        await userHelpers.loginToSecondaryTestAccount();
        await subscribe("projects");

        expect(Projects.findOne(projectId)).to.be.ok;

        try {
            await Projects.remove(projectId);
        } catch (err) {
            expect(err).to.be.ok;
            expect(Projects.findOne(projectId)).to.be.ok;
            done();
        }
    });

    it('does not allow deleting other user project even if user in readWriteShares', async function (done) {
        let projectId = await Projects.insert(newProject({
            owner: Meteor.user()._id,
            readOnlyShares: [],
            readWriteShares: [this.secondaryUserId],
            name: "My project",
            description: "My description",
        }));


        await userHelpers.loginToSecondaryTestAccount();
        await subscribe('projects');

        expect(Projects.findOne(projectId)).to.be.ok;

        try {
            await Projects.remove(projectId);
        } catch (err) {
            expect(err).to.be.ok;
            expect(Projects.findOne(projectId)).to.be.ok;
            done();
        }
    });

    it('allows updating of other users project if user in readWriteShares', async function (done) {
        let projectId = await Projects.insert(newProject({
            owner: Meteor.user()._id,
            readOnlyShares: [],
            readWriteShares: [this.secondaryUserId],
            name: "My project",
            description: "My description",
        }));

        await userHelpers.loginToSecondaryTestAccount();
        await subscribe('projects');

        expect(Projects.findOne(projectId)).to.be.ok;

        await Projects.update(projectId, {
            $set: { name: "New name" }
        });

        expect(Projects.findOne(projectId).name).to.equal("New name");
        done();
    });

    it('does not allow updating of other users project if user not in readWriteShares', async function (done) {
        let projectId = await Projects.insert(newProject({
            owner: Meteor.user()._id,
            readOnlyShares: [this.secondaryUserId],
            readWriteShares: [],
            name: "My project",
            description: "My description",
        }));

        await userHelpers.loginToSecondaryTestAccount();
        await subscribe('projects');

        expect(Projects.findOne(projectId)).to.be.ok;
        try {
            await Projects.update(projectId, {
                $set: { name: "name" }
            });
        } catch (err) {
            expect(err).to.be.ok;
            expect(Projects.findOne(projectId).name).to.equal("My project");
            done();
        }

    });

    it('can duplicate project', async function (done) {

        const oldProjectId = await callMethod('fixtures/testData/full', this.primaryUserId, [], []);

        await subscribe("projects");

        const oldProject = Projects.findOne(oldProjectId);
        const newProjectId = await Projects.insert({
            ..._.cloneDeep(_.omit(oldProject, '_id', 'owner', 'name')),
            owner: Meteor.userId(),
            name: "Duplicated"
        });

        await subscribe("projects");

        const newProject = Projects.findOne(newProjectId);

        expect(_.omit(newProject, '_id')).to.eql({
            ..._.omit(oldProject, '_id', 'name'),
            name: "Duplicated"
        });

        done();
    });

});
