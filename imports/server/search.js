import { Meteor } from 'meteor/meteor';

export function queryUser(query) {

    return Meteor.users.find({
        $text: { $search: query }
    }, {
        fields: {
            '_id': 1,
            'username': 1,
            'emails': 1,
            'profile.name': 1
        },
        sort: {
            'emails.address': 1
        }
    }).fetch();
}
