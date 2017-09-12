import React from 'react';
import { Link } from 'react-router-dom';
import { Glyphicon } from 'react-bootstrap'

const ProjectList = ({ projects }) => (
    <ul className="project-list">

        {projects.map(p =>
            <li key={p._id}>
                <Link className="btn btn-lg btn-primary" to={"/project/" + p._id} title={p.description}>
                    <span>{p.name}</span>
                    <small>{p.description}</small>
                </Link>
            </li>
        )}

        <li className="project-list">
            <Link className="btn btn-lg btn-success" to="/project/new">
                <span> <Glyphicon className="pull-left" glyph="plus" /> Create new project</span>
            </Link>
        </li>

    </ul>
);

export default ProjectList;