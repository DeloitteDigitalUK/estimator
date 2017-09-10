/* globals Assets */

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { resetDatabase } from 'meteor/xolvio:cleaner';

import _ from 'lodash';

import Projects from '../../collections/projects';

import fullFixture from '../../__tests__/fixture.full';
import minimalFixture from '../../__tests__/fixture.minimal';

if (Meteor.isAppTest) {

    // Tests can hit the rate limiter
    Accounts.removeDefaultRateLimit();

    Meteor.methods({

        'fixtures/getTestFile': (name) => {
            return Assets.getBinary('test/' + name);
        },

        'fixtures/setUpUser': (username, password) => {
            let user = Accounts.findUserByUsername(username);
            if (user) {
                console.log("User exists");
                return;
            }

            let userId = Accounts.createUser({
                username: username,
                email: username + '@example.org',
                password: password
            });

            return userId;
        },

        'fixtures/tearDownUser': (username) => {
            let user = Accounts.findUserByUsername(username);
            if (!user) {
                console.log("User does not exist");
                return;
            }

            Meteor.users.remove(user._id);
        },

        'fixtures/cleanData': (excluded) => {
            resetDatabase({ excludedCollections: excluded });
        },

        'fixtures/testData/full': (owner, readOnlyShares=[], readWriteShares=[]) => {
            return Projects.insert({
                ..._.omit(fullFixture, '_id'),
                owner,
                readOnlyShares,
                readWriteShares
            });
        },

        'fixtures/testData/empty': (owner, readOnlyShares, readWriteShares) => {
            return Projects.insert({
                ..._.omit(minimalFixture, '_id'),
                owner,
                readOnlyShares,
                readWriteShares
            });
        }

    });
}
