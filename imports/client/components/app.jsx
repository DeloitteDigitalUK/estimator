import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Route, Switch, Redirect } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

import { Projects } from '../../collections/promisified';

import { Login, ResetPassword, EnrollAccount, ChangePassword } from './login';
import { AdminUsers, CreateUser } from './users';

import Loading from './loading';

import TopNav from './navigation';

import Home from './home';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import '../css/app.import.css';

const App = ({ loadingUsers, loadingProjects, loggingIn, user, projects }) => {

    if (loadingUsers) {
        return <Loading />;
    }

    const isLoggedIn = user !== null;

    return (
        <BrowserRouter>
            <div>
                <Route path="/" component={TopNav} />
                <div className="container">
                    <Switch>
                        
                        <Route exact path="/login" component={Login} />
                        <Route exact path="/reset-password/:token" component={ResetPassword} />
                        <Route exact path="/enroll-account/:token" component={EnrollAccount} />
                        <Route exact path="/change-password" component={ChangePassword} />

                        {isLoggedIn || loggingIn? null : <Redirect path="*" to="/login" />}

                        <Route exact path="/admin/users" component={AdminUsers} />
                        <Route exact path="/admin/create-user" component={CreateUser} />

                        <Route exact path="/" component={Home} />

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