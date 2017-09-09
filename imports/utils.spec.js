import { Meteor } from 'meteor/meteor';

import sinon from 'sinon';
import { expect } from 'chai';

import {
    isOwner,
    canWrite,

    setDefault,
    uint8ArrayToBinaryString,
    callIfFunction
} from './utils';

describe('Utilities', function() {

    describe("isOwner", function() {

        it("confirms same user id", function() {
            sinon.stub(Meteor, 'user').returns({_id: "abc123"});

            expect(isOwner({
                owner: "abc123"
            })).to.be.true;

            Meteor.user.restore();
        });

        it("fails if different user id", function() {
            sinon.stub(Meteor, 'user').returns({_id: "abc123"});

            expect(isOwner({
                owner: "def123"
            })).to.be.false;

            Meteor.user.restore();
        });

        it("fails if null", function() {
            sinon.stub(Meteor, 'user').returns(null);

            expect(isOwner({
                owner: "abc123"
            })).to.be.false;

            Meteor.user.restore();
        });

    });

    describe("canWrite", function() {

        it("returns true for owner", function() {
            sinon.stub(Meteor, 'user').returns({_id: "abc123"});

            expect(canWrite({
                owner: "abc123",
                readWriteShares: ["def123"],
                readOnlyShares: ["xyz123"],
            })).to.be.true;

            Meteor.user.restore();
        });

        it("returns true for shared read/write user", function() {
            sinon.stub(Meteor, 'user').returns({_id: "def123"});

            expect(canWrite({
                owner: "abc123",
                readWriteShares: ["def123"],
                readOnlyShares: ["xyz123"],
            })).to.be.true;

            Meteor.user.restore();
        });

        it("returns false for shared read-only user", function() {
            sinon.stub(Meteor, 'user').returns({_id: "xyz123"});

            expect(canWrite({
                owner: "abc123",
                readWriteShares: ["def123"],
                readOnlyShares: ["xyz123"],
            })).to.be.false;

            Meteor.user.restore();
        });

        it("returns false for other user", function() {
            sinon.stub(Meteor, 'user').returns({_id: "gef123"});

            expect(canWrite({
                owner: "abc123",
                readWriteShares: ["def123"],
                readOnlyShares: ["xyz123"],
            })).to.be.false;

            Meteor.user.restore();
        });

        it("returns false for null user", function() {
            sinon.stub(Meteor, 'user').returns(null);

            expect(canWrite({
                owner: "abc123",
                readWriteShares: ["def123"],
                readOnlyShares: ["xyz123"],
            })).to.be.false;

            Meteor.user.restore();
        });


    });

    describe("setDefault", function() {

        it("sets new properties on empty object", function() {
            let obj = {};
            expect(setDefault(obj, "two", 2)).to.eql(2);
            expect(obj).to.eql({two: 2});
        });

        it("sets and returns if not already set", function() {
            let obj = {one: 1};
            expect(setDefault(obj, "two", 2)).to.eql(2);
            expect(obj).to.eql({one: 1, two: 2});
        });

        it("doesn't override existing property", function() {
            let obj = {one: 1, two: 22};
            expect(setDefault(obj, "two", 2)).to.eql(22);
            expect(obj).to.eql({one: 1, two: 22});
        });

    });

    describe("callIfFunction", function() {

        it("returns null", function() {
            expect(callIfFunction(null)).to.eql(null);
        });

        it("returns undefined", function() {
            expect(callIfFunction(undefined)).to.eql(undefined);
        });

        it("returns scalars", function() {
            expect(callIfFunction(2)).to.eql(2);
            expect(callIfFunction("foo")).to.eql("foo");
        });

        it("calls functions and returns value", function() {
            expect(callIfFunction(() => 22)).to.eql(22);
            expect(callIfFunction(function() { return "foo"; })).to.eql("foo");
        });

    });

    describe("uint8ArrayToBinaryString", function() {

        it("returns empty string for empty array", function() {
            expect(uint8ArrayToBinaryString(new Uint8Array([]))).to.eql("");
        });

        it("returns binary string for binary array", function() {
            expect(uint8ArrayToBinaryString(new Uint8Array([65,66,67]))).to.eql("ABC");
        });

    });

});
