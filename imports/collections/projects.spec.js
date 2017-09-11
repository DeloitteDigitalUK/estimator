import { expect } from 'chai';
import { Solution, newSolution } from './projects';

describe('Solution factory', function() {

    it("Can create a valid solution based on just name", function() {
        Solution.validate(newSolution({name: "Test solution"}));
    });

    it("Can override fields", function() {
        const solution = newSolution({name: "Test solution", _id: "abc1"});

        Solution.validate(solution);
        expect(solution._id).to.equal("abc1");
    });

});
