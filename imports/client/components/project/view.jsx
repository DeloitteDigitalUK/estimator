import React from 'react';

const ViewProject = ({ project }) => (
    <div>
        <h1>{project.name}</h1>
        <p>
            {project.description}
        </p>
    </div>
);

export default ViewProject;
