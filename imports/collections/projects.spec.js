import { expect } from 'chai';
import { Project, newProject, Solution, newSolution } from './projects';

describe('Project factory', function() {
    
    it("Can create a valid project based on just name and owner", function() {
        Project.validate(newProject({name: "Test project", owner: "user123"}));
    });

    it("Can override fields", function() {
        const solution = newProject({name: "Test project", owner: "user123", _id: "abc1"});

        Project.validate(solution);
        expect(solution._id).to.equal("abc1");
    });

});
    

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
