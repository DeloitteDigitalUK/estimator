import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Switch, Route } from 'react-router-dom'

import { Nav, NavDropdown, MenuItem } from 'react-bootstrap';
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

const ProjectMain = ({ history, location, match }) => {

    const prefix = match.url,
          pathPrefix = match.path,
          projectId = match.params._id,
          project = Projects.findOne(projectId);

    if(!project) {
        return <span />;
    }
    
    const writer = canWrite(project);

    return (
        <ModalSwitch className="container" {...{history, location, match}}>

                     <Route exact path={pathPrefix} render={() => <ViewProject project={project} prefix={prefix} />} />
            {writer? <Route exact path={pathPrefix + '/edit'} render={() => <EditProject project={project} history={history} />} /> : null}
            
                     <Route component={FourOhFour} />

            <ModalRoutes>
                {writer? <Route exact path={pathPrefix + '/delete'} render={() => <DeleteProject project={project} history={history} location={location} />} /> : null}
                {writer? <Route exact path={pathPrefix + '/solution/add'} render={() => <AddSolution project={project} history={history} location={location} />} /> : null}
                {writer? <Route exact path={pathPrefix + '/duplicate'} render={() => <DuplicateProject project={project} history={history} location={location} />} /> : null}
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
    
    const owner = isOwner(project),
          writer = canWrite(project);

    return (
        <Nav>
            <NavDropdown id="project-menu-dropdown" title="Project">
                         <LinkContainer to={"/project/add"}><MenuItem>New&hellip;</MenuItem></LinkContainer>
                {writer? <LinkContainer to={prefix + "/edit"}><MenuItem>Edit</MenuItem></LinkContainer> : null}
                         <ModalLinkContainer to={prefix + "/duplicate"}><MenuItem>Duplicate&hellip;</MenuItem></ModalLinkContainer>
                {owner?  <ModalLinkContainer to={prefix + "/delete"}><MenuItem>Delete&hellip;</MenuItem></ModalLinkContainer> : null}
                         <MenuItem divider />
                         <LinkContainer isActive={() => false} to="/"><MenuItem>Choose another&hellip;</MenuItem></LinkContainer>
            </NavDropdown>
        </Nav>
    );
}
