import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Navbar, Nav, NavDropdown, MenuItem } from 'react-bootstrap';

import { Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { PrivateRoute } from './routing';

import { HomeNav } from './home';

export default class Navigation extends Component {

    static propTypes = {
        history: PropTypes.object
    }

    render() {

        const user = Meteor.user(),
              isAuthenticated = user !== null,
              isAdmin = isAuthenticated? Roles.userIsInRole(user, ['admin']) : false;

        return (
            <Navbar inverse fixedTop>
                <Navbar.Brand>
                    <Link to="/">Estimator</Link>
                </Navbar.Brand>
                <Navbar.Toggle />
                <Navbar.Collapse>

                    <Switch>
                        <PrivateRoute isAuthenticated={isAuthenticated}  exact path="/" component={HomeNav} />
                    </Switch>

                    <Nav navbar pullRight>
                        <NavDropdown id="user-menu-dropdown" ref="userMenu" title={user ? user.username : 'Not logged in'}>
                            {isAdmin ? <LinkContainer to="/admin/users"><MenuItem>Manage users</MenuItem></LinkContainer> : null}
                            {isAuthenticated ? <LinkContainer to="/change-password"><MenuItem>Change password</MenuItem></LinkContainer> : null}
                            {isAuthenticated ? <MenuItem onClick={this.logout.bind(this)}>Log out</MenuItem> : null}
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Navbar >
        );
    }

    logout(e) {
        e.preventDefault();
        Meteor.logout();

        this.props.history.push('/login');
    }

}
