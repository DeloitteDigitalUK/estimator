import _ from 'lodash';
import React from 'react';

import { Route } from 'react-router'

import { Nav, NavDropdown, MenuItem, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import { Projects } from '../../../collections/promisified';
import { isOwner, canWrite } from '../../../utils';

import FourOhFour from '../fourohfour'
import { ModalLinkContainer, ModalSwitch, ModalRoutes } from '../routing'

import ViewProject from './view';
import EditProject from './edit';
import DeleteProject from './delete';
import DuplicateProject from './duplicate';

import AddSolution from './solution/add';
import ViewSolution from './solution/view';
import EditSolution from './solution/edit';
import DeleteSolution from './solution/delete';
import DuplicateSolution from './solution/duplicate';

const ProjectMain = ({ history, location, match }) => {

    const pathPrefix = match.path,
          projectId  = match.params._id,
          project    = Projects.findOne(projectId);
    
    if (!project) {
        return <FourOhFour />;
    }
          
    const solutionPathPrefix = `${pathPrefix}/solution/:solution_id`,
          solutionId = match.params.solution_id,
          solution   = solutionId? _.find(project.solutions, {_id: solutionId}) : null;

    if(solutionId && !solution) {
        return <FourOhFour />;
    }
    
    const w = canWrite(project);

    return (
        <ModalSwitch className="container" {...{history, location, match}}>

            <Route exact path={pathPrefix} render={props => <ViewProject {...{project, ...props}} />} />
            {w? <Route exact path={`${pathPrefix}/edit`} render={props => <EditProject {...{project, ...props}} />} /> : null}
            
            <Route exact path={pathPrefix} render={props => <ViewSolution {...{project, solution, ...props}} />} />
            {w? <Route exact path={`${solutionPathPrefix}/edit`} render={props => <EditSolution {...{project, solution, ...props}} />} /> : null}

            <Route component={FourOhFour} />

            <ModalRoutes>
                {w? <Route exact path={`${pathPrefix}/solution/add`} render={props => <AddSolution {...{project, ...props}} />} /> : null}
                {w? <Route exact path={`${pathPrefix}/delete`} render={props => <DeleteProject {...{project, ...props}} />} /> : null}
                {w? <Route exact path={`${pathPrefix}/duplicate`} render={props => <DuplicateProject {...{project, ...props}} />} /> : null}

                {w? <Route exact path={`${solutionPathPrefix}/duplicate`} render={props => <DuplicateSolution {...{project, solution, ...props}} />} /> : null}
                {w? <Route exact path={`${solutionPathPrefix}/delete`} render={props => <DeleteSolution {...{project, solution, ...props}} />} /> : null}    
            </ModalRoutes>

        </ModalSwitch>
    );
};

export default ProjectMain;

export const ProjectNav = ({ match }) => {

    const prefix = match.url,
          projectId = match.params._id,
          project = Projects.findOne(projectId);

    if(!project) {
        return <span />;
    }

    const solutionId = match.params.solution_id,
          solution = solutionId? _.find(project.solutions, {_id: solutionId}) : null,
          solutionPrefix = solutionId? `${prefix}/solution/${solutionId}` : null;;
    
    const o = isOwner(project),
          w = canWrite(project);

    return (
        <Nav>
            <LinkContainer to={prefix}><NavItem>{project.name}</NavItem></LinkContainer>
            <NavDropdown id="project-menu-dropdown" title="Project">
                    <LinkContainer to="/project/add"><MenuItem>New project&hellip;</MenuItem></LinkContainer>
                {w? <LinkContainer to={`${prefix}/edit`}><MenuItem>Edit</MenuItem></LinkContainer> : null}
                    <ModalLinkContainer to={`${prefix}/duplicate`}><MenuItem>Duplicate&hellip;</MenuItem></ModalLinkContainer>
                {o? <ModalLinkContainer to={`${prefix}/delete`}><MenuItem>Delete&hellip;</MenuItem></ModalLinkContainer> : null}
                    <LinkContainer to="/" isActive={() => false}><MenuItem>Close</MenuItem></LinkContainer>
            </NavDropdown>
            {!solution? null: 
                <NavDropdown id="solution-menu-dropdown" title="Solution">
                    {w? <LinkContainer to={`${solutionPrefix}/edit`}><MenuItem>Edit</MenuItem></LinkContainer> : null}
                    {w? <ModalLinkContainer to={`${solutionPrefix}/duplicate`}><MenuItem>Duplicate&hellip;</MenuItem></ModalLinkContainer> : null}
                    {w? <ModalLinkContainer to={`${solutionPrefix}/delete`}><MenuItem>Delete&hellip;</MenuItem></ModalLinkContainer> : null}
                    <LinkContainer to={prefix} isActive={() => false}><MenuItem>Close</MenuItem></LinkContainer>
                </NavDropdown>
            }
        </Nav>
    );
}
