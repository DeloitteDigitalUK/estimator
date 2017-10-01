import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { withTracker } from 'meteor/react-meteor-data';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Route, Switch } from 'react-router';
import { BrowserRouter, Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { PrivateRoute } from './routing';

import { Navbar, Nav, NavDropdown, MenuItem } from 'react-bootstrap';

import Projects from '../../collections/projects';

import { SignUp, Login, RequestPasswordReset, ResetPassword, EnrollAccount, ChangePassword } from './login';
import { AdminUsers, CreateUser } from './users';

import Loading from './loading';

import Home from './home';

import ProjectMain, { ProjectNav } from './project/main';
import AddProject from './project/add';

import FourOhFour from './fourohfour'

import { getPublicSetting } from '../../utils';

const ALLOW_SIGNUP = getPublicSetting('allowSignUp');

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'handsontable/dist/handsontable.full.css';
import 'nvd3/build/nv.d3.css';
import 'react-calendar-timeline/lib/lib/Timeline.css';
import '../css/app.import.css';

const App = ({ loadingUsers, loadingProjects, loggingIn, user, projects }) => {

    if (loadingUsers) {
        return <Loading />;
    }

    const isAuthenticated = user !== null || loggingIn;

    return (
        <BrowserRouter>
            <div>
                
                {isAuthenticated? <TopNav /> : null}

                <div className="container">
                    <Switch>
                        {ALLOW_SIGNUP? <Route exact path="/signup" component={SignUp} /> : null}
                        <Route exact path="/login" component={Login} />
                        <Route exact path="/reset-password" component={RequestPasswordReset} />
                        <Route exact path="/reset-password/:token" component={ResetPassword} />
                        <Route exact path="/enroll-account/:token" component={EnrollAccount} />
                        <Route exact path="/change-password" component={ChangePassword} />

                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/" render={props => <Home projects={projects} {...props} />} />
                        
                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/project/add" component={AddProject} />
                        <PrivateRoute isAuthenticated={isAuthenticated}       path="/project/:_id" component={ProjectMain} />

                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/admin/users" component={AdminUsers} />
                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/admin/create-user" component={CreateUser} />

                        <Route component={FourOhFour} />
                    </Switch>
                </div>
            </div>

        </BrowserRouter>
    );

}

export class TopNav extends Component {

    static propTypes = {
        history: PropTypes.object
    }

    render() {

        const user = Meteor.user(),
              isAuthenticated = user !== null,
              isAdmin = isAuthenticated? Roles.userIsInRole(user, ['admin']) : false;

        if(!isAuthenticated) {
            return null;
        }

        return (
            <Navbar inverse fixedTop>
                <Navbar.Brand>
                    <Link to="/">Estimator</Link>
                </Navbar.Brand>
                <Navbar.Toggle />
                <Navbar.Collapse>

                    <Switch>
                        <Route path="/project/:_id" component={ProjectNav} />
                    </Switch>

                    <Nav navbar pullRight>
                        <NavDropdown id="user-menu-dropdown" ref="userMenu" title={user ? user.username : 'Not logged in'}>
                            {isAdmin ? <LinkContainer to="/admin/users"><MenuItem>Manage users</MenuItem></LinkContainer> : null}
                            <LinkContainer to="/change-password"><MenuItem>Change password</MenuItem></LinkContainer>
                            <MenuItem onClick={this.logout.bind(this)}>Log out</MenuItem>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Navbar >
        );
    }

    logout(e) {
        e.preventDefault();
        Meteor.logout();
    }

}

export default withTracker(() => {
    const userDataHandle = Meteor.subscribe('userData'),
          projectsHandle = Meteor.subscribe('projects'),
          loadingUsers = !userDataHandle.ready(),
          loadingProjects = !projectsHandle.ready(),
          loggingIn = Meteor.loggingIn(),
          user = Meteor.user(),
          projects = Projects.find({}, { sort: ['name'] }).fetch();

    return {
        loadingUsers,
        loadingProjects,
        loggingIn,
        user,
        projects
    };

})(App);