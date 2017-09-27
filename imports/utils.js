import { Meteor } from 'meteor/meteor';

import Promise from 'bluebird';
import _ from 'lodash';

export const ISO = 'YYYY-MM-DD';

const defaultSettings = {
    allowedEmailDomains: null, // set to a list of domains, e.g. ["example.org", "example.com"]
    public: {
        allowSignUp: true, // all users to sign up themselves
        locale: "en-GB",
        dateFormat: "DD/MM/YYYY",
        queryDebounce: 250,
        queryMinLength: 3
    }
};

export function getPrivateSetting(name) {
    if (!Meteor.settings || Meteor.settings[name] === undefined) {
        return defaultSettings[name];
    }
    return Meteor.settings[name];
}

export function getPublicSetting(name) {
    if (!Meteor.settings || !Meteor.settings['public'] || Meteor.settings['public'][name] === undefined) {
        return defaultSettings['public'][name];
    }
    return Meteor.settings['public'][name];
}

export function debounce(delay, fn) {
    let timer = null;
    return function () {
        let context = this,
            args = arguments;

        Meteor.clearTimeout(timer);
        timer = Meteor.setTimeout(() => {
            fn.apply(context, args);
        }, delay);
    };
}

export function canWrite(project) {
    let user = Meteor.user();
    if (!user) {
        return false;
    }

    return user._id == project.owner || _.includes(project.readWriteShares, user._id);
}

export function isOwner(project) {
    let user = Meteor.user();
    return user ? user._id == project.owner : false;
}

export function setDefault(obj, key, defaultValue) {
    if (!obj.hasOwnProperty(key)) {
        obj[key] = defaultValue;
    }
    return obj[key];
}

export function uint8ArrayToBinaryString(data) {
    let arr = new Array();
    for (let i = 0; i < data.length; ++i) {
        arr[i] = String.fromCharCode(data[i]);
    }
    return arr.join("");
}

export const callMethod = Promise.promisify(Meteor.call, { context: Meteor });
export function subscribe(name, ...args) {
    return new Promise((resolve, reject) => {
        Meteor.subscribe(name, ...args, {
            onStop: function (err) {
                reject(err);
            },
            onReady: function (...args) {
                resolve(...args);
            }
        });
    });
}

export function callIfFunction(d) {
    return (d && _.isFunction(d)) ? d() : d
}

export const promisifyCollection = C => ({
    insert: Promise.promisify(C.insert, { context: C }),
    update: Promise.promisify(C.update, { context: C }),
    upsert: Promise.promisify(C.upsert, { context: C }),
    remove: Promise.promisify(C.remove, { context: C }),
    find: C.find.bind(C),
    findOne: C.findOne.bind(C)
});

export const getSuffix = number => (
    number % 10 === 1? "st" :
    number % 10 === 2? "nd" :
    number % 10 === 3? "rd" :
    "th"
);