import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { PrivateRoute } from './routing';

import { Projects } from '../../collections/promisified';

import { Login, ResetPassword, EnrollAccount, ChangePassword } from './login';
import { AdminUsers, CreateUser } from './users';

import Loading from './loading';

import TopNav from './navigation';

import Home, { HomeNav } from './home';

import ProjectMain, { ProjectNav } from './project/main';
import NewProject from './project/new';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'handsontable/dist/handsontable.full.css';
import '../css/app.import.css';

const App = ({ loadingUsers, loadingProjects, loggingIn, user, projects }) => {

    if (loadingUsers) {
        return <Loading />;
    }

    const isAuthenticated = user !== null || loggingIn;

    return (
        <BrowserRouter>
            <div>
                
                {!isAuthenticated? null : (
                    <TopNav>
                        <Switch>
                            <Route exact path="/" component={HomeNav} />

                            <Route exact path="/project/new" component={HomeNav} />
                            <Route path="/project/:_id" component={ProjectNav} />
                        </Switch>
                    </TopNav>
                )}

                <div className="container">
                    <Switch>
                        
                        <Route exact path="/login" component={Login} />
                        <Route exact path="/reset-password/:token" component={ResetPassword} />
                        <Route exact path="/enroll-account/:token" component={EnrollAccount} />
                        <Route exact path="/change-password" component={ChangePassword} />

                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/" render={props => <Home projects={projects} {...props} />} />
                        
                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/project/new" component={NewProject} />
                        <PrivateRoute isAuthenticated={isAuthenticated} path="/project/:_id" component={ProjectMain} />

                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/admin/users" component={AdminUsers} />
                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/admin/create-user" component={CreateUser} />

                        <Route render={() => <div className="page-not-found"><h1>Page not found</h1></div>} />
                    </Switch>
                </div>
            </div>

        </BrowserRouter>
    );

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