import { Meteor } from 'meteor/meteor';

Meteor.users.allow({
    update(userId, user, fields, modifier) {
        return userId && userId === user._id;
    }
});

if (Meteor.isServer) {
    Meteor.users._ensureIndex({ 'emails.address': 'text' });

    Meteor.publish('userData', function () {
        if (this.userId) {
            return Meteor.users.find({ _id: this.userId }, {
                fields: { 'profile': 1 }
            });
        } else {
            this.ready();
        }
    });
}
