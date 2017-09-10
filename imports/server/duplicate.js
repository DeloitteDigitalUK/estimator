import _ from 'lodash';

import Projects from '../collections/projects';

export function duplicate(originalProject, owner, name) {

    return Projects.insert({
        ..._.omit(originalProject, '_id'),
        owner,
        name
    });
    
}
