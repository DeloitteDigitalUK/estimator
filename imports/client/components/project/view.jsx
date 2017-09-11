import React from 'react';
import { HelpBlock, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import SolutionList from './solution/list';

const ViewProject = ({ project, prefix }) => {

    return (
        <div className="view-project">

            <h1>{project.name}</h1>
            <p>
                {project.description}
            </p>
            
            <HelpBlock>
                A project consists of one or more <em>solutions</em>. You can think of these
                as swim lanes on the plan. Each solution is delivered by a team, and forecast
                based on either a scope estimate or a particular work pattern. You can add, edit
                and reorder solutions below.
            </HelpBlock>

            <SolutionList project={project} prefix={prefix} />

            <LinkContainer to={{pathname: prefix + "/solution/add", state: { modal: true, returnTo: location.pathname }}}>
                <Button bsStyle="primary">Add solution</Button>
            </LinkContainer>

        </div>
    );
}

export default ViewProject;
