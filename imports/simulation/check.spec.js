import { expect } from 'chai';
import {
    checkSampleCount,
    checkSampleAge,
    checkSampleStability,
    checkBacklogGuess
} from './check';

describe('Simulator checks', function() {

    const samples = [{
        periodStartDate: new Date(2017, 0, 1),
        description: "First period",
        throughput: 10
    }, {
        periodStartDate: new Date(2017, 0, 22),
        throughput: 15
    }, {
        periodStartDate: new Date(2017, 0, 15),
        throughput: 8
    }];

    describe('checkSampleCount', function() {
    
        it("can check lower bound", function() {
            expect(checkSampleCount(samples)).to.eql(false);
            expect(checkSampleCount(samples, 3)).to.eql(true);
            expect(checkSampleCount(samples, 2)).to.eql(true);
        });

        it("can check upper bound", function() {
            expect(checkSampleCount(samples)).to.eql(false);
            expect(checkSampleCount(samples, 1, 3)).to.eql(true);
            expect(checkSampleCount(samples, 1, 2)).to.eql(false);
        });

    });

    describe('checkSampleAge', function() {
        
        it("can check boundary with number of days and target day", function() {
            expect(checkSampleAge(samples, 5, new Date(2017, 0, 27))).to.eql(true);
            expect(checkSampleAge(samples, 5, new Date(2017, 0, 28))).to.eql(false);
            expect(checkSampleAge(samples, 5, new Date(2017, 0, 2))).to.eql(true);
        });

    });

    describe('checkSampleErrorRange', function() {
        
        it("works on a small sample set", function() {
            expect(checkSampleStability(samples, 0.25)).not.to.throw;
        });

    });

    describe('checkBacklogGuess', function() {
        
        it("requires the difference between the high and low guess to be at least a given percentage", function() {
            expect(checkBacklogGuess(10, 12, .2)).to.eql(true);
            expect(checkBacklogGuess(10, 12, .1)).to.eql(true);
            expect(checkBacklogGuess(10, 12, .3)).to.eql(false);
        });

        it("returns true for 0", function() {
            expect(checkBacklogGuess(0, 0, .2)).to.eql(true);
            expect(checkBacklogGuess(0, 10, .2)).to.eql(true);
        });

        it("returns false for low > high", function() {
            expect(checkBacklogGuess(1, 0, .2)).to.eql(false);
            expect(checkBacklogGuess(10, 1, .2)).to.eql(false);
        });

    });

});