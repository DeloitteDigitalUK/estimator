/* globals Assets */

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { resetDatabase } from 'meteor/xolvio:cleaner';

import Projects from '../../collections/projects';

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

        'fixtures/testData/full': (userId, readOnlyShares, readWriteShares) => {

            let projectId = Projects.insert({
                owner: userId,
                name: "Full project",
                description: "A test project",
                startDate: new Date(2017, 0, 1), // SUN
                endDate: new Date(2017, 0, 31), // TUE
                readOnlyShares: readOnlyShares || [],
                readWriteShares: readWriteShares || []
            });

            return projectId;
        },

        'fixtures/testData/empty': (userId, readOnlyShares, readWriteShares) => {

            let projectId = Projects.insert({
                owner: userId,
                name: "Empty project",
                description: "Empty project for testing",
                startDate: new Date(2017, 0, 1), // SUN
                endDate: new Date(2017, 0, 31), // TUE
                readOnlyShares: readOnlyShares || [],
                readWriteShares: readWriteShares || []
            });

            return projectId;
        }

    });
}
