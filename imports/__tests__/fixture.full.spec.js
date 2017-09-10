import { Project } from '../collections/projects';

import fixture from './fixture.full';

describe('Full fixture', function() {

    it("provides a valid project", function() {
        Project.validate(fixture);
    });

});
