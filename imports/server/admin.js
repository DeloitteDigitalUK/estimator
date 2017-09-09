import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

/**
 * Create a new user with the given role
 */
export function createNewUser(email, role) {

    let userId = Accounts.createUser({
        username: email,
        email: email
    });

    if (role) {
        Roles.addUsersToRoles(userId, [role]);
    }
    
    Accounts.sendEnrollmentEmail(userId);

}
