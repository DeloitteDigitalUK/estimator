import React from 'react';

import { Route, Switch } from 'react-router'

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
import SolutionMain, { SolutionNav } from './solution/main';

const ProjectMain = ({ history, location, match }) => {

    const path = match.path,
          projectId = match.params._id,
          project = Projects.findOne(projectId);
    
    if (!project) {
        return <FourOhFour />;
    }
    
    const w = canWrite(project);

    return (
        <ModalSwitch className="container" {...{history, location, match}}>

            <Route path={`${path}/solution/:solution_id`} render={props => <SolutionMain {...{project, ...props}} />} />

            <Route exact path={path} render={props => <ViewProject {...{project, ...props}} />} />
            {w? <Route exact path={`${path}/edit`} render={props => <EditProject {...{project, ...props}} />} /> : null}
            
            <Route component={FourOhFour} />

            <ModalRoutes>
                {w? <Route exact path={`${path}/solution/add`} render={props => <AddSolution {...{project, ...props}} />} /> : null}
                {w? <Route exact path={`${path}/delete`} render={props => <DeleteProject {...{project, ...props}} />} /> : null}
                {w? <Route exact path={`${path}/duplicate`} render={props => <DuplicateProject {...{project, ...props}} />} /> : null}
            </ModalRoutes>

        </ModalSwitch>
    );
};

export default ProjectMain;

export const ProjectNav = ({ match }) => {

    const prefix = match.url,
          path = match.path,
          projectId = match.params._id,
          project = Projects.findOne(projectId);

    if(!project) {
        return null;
    }
    
    const o = isOwner(project),
          w = canWrite(project);

    return (
        <Nav>
            <LinkContainer to={prefix}><NavItem>{project.name}</NavItem></LinkContainer>
            <NavDropdown id="project-menu-dropdown" title="Project">
                {w? <LinkContainer to={`${prefix}/edit`}><MenuItem>Edit</MenuItem></LinkContainer> : null}
                    <ModalLinkContainer to={`${prefix}/duplicate`}><MenuItem>Duplicate&hellip;</MenuItem></ModalLinkContainer>
                {o? <ModalLinkContainer to={`${prefix}/delete`}><MenuItem>Delete&hellip;</MenuItem></ModalLinkContainer> : null}
                    <LinkContainer to="/" isActive={() => false}><MenuItem>Close</MenuItem></LinkContainer>
            </NavDropdown>
            <Switch>
                <Route path={`${path}/solution/:solution_id`} render={props => <SolutionNav {...{project, ...props}}/>} />
            </Switch>
        </Nav>
    );
}
