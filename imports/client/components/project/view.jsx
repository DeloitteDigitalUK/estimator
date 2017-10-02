import React from 'react';
import { HelpBlock, Button, PanelGroup, Panel } from 'react-bootstrap';

import { ModalLinkContainer } from '../routing';

import SolutionList from './solution/list';
import Plan from './plan';
import ResourceForecast from './resources';

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

                {project.solutions.length > 0 && (
                <Panel collapsible defaultExpanded header="Resource forecast" eventKey="resourceForecast">

                    <HelpBlock>
                        <p>
                            We can also consider the number of people that will be required to deliver the
                            project at a given confidence interval. We do this by simulating the project
                            and overlaying the team profile defined for each solution. In the table
                            below, we can see the number of people required week-by-week by role.
                            (Note that we only consider full weeks: going down to days would imply a level
                            of precision that isn't warranted by a project-level estimate such as this.)
                        </p>
                    </HelpBlock>

                    <ResourceForecast project={project} />

                </Panel>
                )}

            </PanelGroup>

        </div>
    );
}

export default ViewProject;
