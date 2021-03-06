import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

import _ from 'lodash';
import { getPrivateSetting, getPublicSetting } from '../utils';

// Trigger build of this so we can import in the meteor shell for testing
// import './testing';

// trigger import of collections and subscriptions
import '../collections/projects';
import '../collections/users';

// trigger import of methods
import './methods';

Meteor.startup(function () {

    if(!Meteor.roles.findOne({name: 'admin'})) {
        Roles.createRole('admin');
    }

    Accounts.emailTemplates.from = getPrivateSetting('emailFrom');
    Accounts.emailTemplates.resetPassword.subject = user => getPrivateSetting('resetPasswordEmailSubject');
    Accounts.emailTemplates.enrollAccount.subject = user => getPrivateSetting('enrollAccountEmailSubject');
    Accounts.emailTemplates.verifyEmail.subject = user => getPrivateSetting('verifyEmailSubject');

    Accounts.config({
        forbidClientAccountCreation: !getPublicSetting('allowSignUp'),
        sendVerificationEmail: false,
        restrictCreationByEmailDomain: email => {
            let domains = getPrivateSetting('allowedEmailDomains');
            if(!domains) {
                return true;
            }
            return domains.some(d => { return _.endsWith(email, '@' + d); });
        }
    });

    Accounts.urls.resetPassword = token => {
        return Meteor.absoluteUrl('reset-password/' + token);
    };

    // Accounts.urls.verifyEmail = token => {
    //     return Meteor.absoluteUrl('verify-email/' + token);
    // };

    Accounts.urls.enrollAccount = token => {
        return Meteor.absoluteUrl('enroll-account/' + token);
    };

    let adminUser = Meteor.users.findOne({username: 'admin'});

    if(!adminUser) {
        console.warn('WARNING: Creating default admin user. Log in as \'admin@example.org\' with password \'secret\' and change the password!');

        let userId = Accounts.createUser({
            'username': 'admin',
            'email': 'admin@example.org',
            'password': 'secret'
        });

        Roles.addUsersToRoles(userId, ['admin']);
    }
});
