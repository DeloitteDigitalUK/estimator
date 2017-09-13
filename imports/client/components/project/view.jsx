import React from 'react';
import { HelpBlock, Button } from 'react-bootstrap';

import { ModalLinkContainer } from '../routing';

import SolutionList from './solution/list';

const ViewProject = ({ project, match }) => {

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

            <SolutionList project={project} prefix={match.url} />

            <ModalLinkContainer to={`${match.url}/solution/add`}>
                <Button bsStyle="primary">Add solution</Button>
            </ModalLinkContainer>

        </div>
    );
}

export default ViewProject;
