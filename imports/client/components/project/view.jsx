import React from 'react';
import { HelpBlock, Button, PanelGroup, Panel } from 'react-bootstrap';

import { ModalLinkContainer } from '../routing';

import SolutionList from './solution/list';
import Plan from './plan';

const ViewProject = ({ project, match }) => {

    return (
        <div className="view-project">

            <h1>{project.name}</h1>
            <p className="description">
                {project.description}
            </p>

            <PanelGroup>
                <Panel collapsible defaultExpanded header="Solutions" eventKey="solutions">
            
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

                </Panel>

                {project.solutions.length > 0 && (
                <Panel collapsible defaultExpanded header="Plan" eventKey="plan">

                    <HelpBlock>
                        <p>
                            By simulating each solution and understanding their dependencies, we can
                            build a project plan &mdash; or rather, a set of plausible project plans,
                            based on various confidence intervals (solutions delivered on a fixed
                            work pattern will follow that pattern directly).
                        </p>
                    </HelpBlock>

                    <Plan project={project} />

                </Panel>
                )}

            </PanelGroup>

        </div>
    );
}

export default ViewProject;
