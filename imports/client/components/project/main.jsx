import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Switch, Route } from 'react-router-dom'

import { Nav, NavDropdown, MenuItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import { Projects } from '../../../collections/promisified';
import { isOwner, canWrite } from '../../../utils';

import ViewProject from './view';
import EditProject from './edit';
import DeleteProject from './delete';
import DuplicateProject from './duplicate';

export default class ProjectMain extends Component {

    static propTypes = {
        history: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        match: PropTypes.object.isRequired
    }

    previousLocation = this.props.location

    componentWillUpdate(nextProps) {
        const { location } = this.props;
        if(nextProps.history.action !== 'POP' && (!location.state || !location.state.modal)) {
            this.previousLocation = this.props.location;
        }
    }

    render() {

        const { history, location, match } = this.props;

        const isModal = !!(
            location.state &&
            location.state.modal &&
            this.previousLocation !== location // not initial render
        );

        const prefix = match.url,
              projectId = match.params._id,
              project = Projects.findOne(projectId);

        if(!project) {
            return <span />;
        }
        
        const owner = isOwner(project),
              writer = canWrite(project);

        return (
            <div className="container">
                {/* Child pages */}
                <Switch location={isModal ? this.previousLocation : location}>
                    <Route exact path={prefix} render={() => <ViewProject project={project} />} />
                    {writer? <Route exact path={prefix + '/edit'} render={() => <EditProject project={project} history={history} />} /> : null}
                </Switch>

                {/* Modals, which will overlay child pages */}
                <Switch>
                    {owner? <Route exact path={prefix + '/delete'} render={() => <DeleteProject project={project} history={history} location={location} />} /> : null}
                    <Route exact path={prefix + '/duplicate'} render={() => <DuplicateProject project={project} history={history} location={location} />} />
                </Switch>
            </div>
        )
    }

}

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
                <LinkContainer to={"/project/new"}><MenuItem>New&hellip;</MenuItem></LinkContainer>
                {writer? <LinkContainer to={prefix + "/edit"}><MenuItem>Edit</MenuItem></LinkContainer> : ""}
                <LinkContainer to={{pathname: prefix + "/duplicate", state: { modal: true, returnTo: location.pathname }}}><MenuItem>Duplicate&hellip;</MenuItem></LinkContainer>
                {owner? <LinkContainer to={{pathname: prefix + "/delete", state: { modal: true, returnTo: location.pathname }}}><MenuItem>Delete&hellip;</MenuItem></LinkContainer> : ""}
                <MenuItem divider />
                <LinkContainer isActive={() => false} to="/"><MenuItem>Choose another&hellip;</MenuItem></LinkContainer>
            </NavDropdown>
        </Nav>
    );
}
