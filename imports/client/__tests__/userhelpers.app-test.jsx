import { Meteor } from 'meteor/meteor';

import P from 'bluebird';

import { callMethod } from '../../utils';

export const loginWithPassword = P.promisify(Meteor.loginWithPassword, { context: Meteor });
export const logout = P.promisify(Meteor.logout, { context: Meteor });

const ACCOUNT_USERNAME = 'test-user';
const ACCOUNT_PASSWORD = 'test-password'

const SECONDARY_ACCOUNT_USERNAME = 'test-user-2';
const SECONDARY_ACCOUNT_PASSWORD = 'test-password-2'

export function setUpTestUser() {
    return callMethod('fixtures/setUpUser', ACCOUNT_USERNAME, ACCOUNT_PASSWORD);
}

export function tearDownTestUser() {
    return callMethod('fixtures/tearDownUser', ACCOUNT_USERNAME);
}

export function loginToTestAccount() {
    return loginWithPassword(ACCOUNT_USERNAME, ACCOUNT_PASSWORD);
}

export function setUpSecondaryTestUser() {
    return callMethod('fixtures/setUpUser', SECONDARY_ACCOUNT_USERNAME, SECONDARY_ACCOUNT_PASSWORD);
}

export function tearDownSecondaryTestUser() {
    return callMethod('fixtures/tearDownUser', SECONDARY_ACCOUNT_USERNAME);
}

export function loginToSecondaryTestAccount() {
    return loginWithPassword(SECONDARY_ACCOUNT_USERNAME, SECONDARY_ACCOUNT_PASSWORD);
}
