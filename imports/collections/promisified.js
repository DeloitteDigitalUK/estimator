import P from 'bluebird';

import _Projects from './projects';

export const promisfyCollection = C => ({
    insert: P.promisify(C.insert, { context: C }),
    update: P.promisify(C.update, { context: C }),
    upsert: P.promisify(C.upsert, { context: C }),
    remove: P.promisify(C.remove, { context: C }),
    find: C.find.bind(C),
    findOne: C.findOne.bind(C)
});

export const Projects = promisfyCollection(_Projects);