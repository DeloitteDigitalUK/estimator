import { Project } from '../collections/projects';

import fixture from './fixture.minimal';

describe('Minimal fixture', function() {

    it("provides a valid project", function() {
        Project.validate(fixture);
    });

});
