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

import Home from './home';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import '../css/app.import.css';

const App = ({ loadingUsers, loadingProjects, loggingIn, user, projects }) => {

    if (loadingUsers) {
        return <Loading />;
    }

    const isAuthenticated = user !== null || loggingIn;

    return (
        <BrowserRouter>
            <div>
                {isAuthenticated ? <Route path="/" component={TopNav} /> : null}
                <div className="container">
                    <Switch>
                        
                        <Route exact path="/login" component={Login} />
                        <Route exact path="/reset-password/:token" component={ResetPassword} />
                        <Route exact path="/enroll-account/:token" component={EnrollAccount} />
                        <Route exact path="/change-password" component={ChangePassword} />

                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/admin/users" component={AdminUsers} />
                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/admin/create-user" component={CreateUser} />

                        <PrivateRoute isAuthenticated={isAuthenticated} exact path="/" component={Home} />

                        <Route render={() => <p>Page not found</p>} />

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