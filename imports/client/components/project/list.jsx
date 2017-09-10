import React from 'react';
import { Link } from 'react-router-dom';

const ProjectList = ({ projects }) => (
    <ul className="project-list">

        {projects.map(p =>
            <li key={p._id}>
                <Link className="btn btn-lg btn-primary" to={"/project/" + p._id} title={p.description}>
                    <span> <i className="glyphicon glyphicon-link pull-left" /> {p.name}</span>
                    <small>{p.description}</small>
                </Link>
            </li>
        )}

        <li>
            <Link className="btn btn-lg btn-success" to="/project/new">
                <span> <i className="glyphicon glyphicon-plus pull-left" /> Create new project</span>
            </Link>
        </li>

    </ul>
);

export default ProjectList;