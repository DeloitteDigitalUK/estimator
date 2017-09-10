import React from 'react';
import { Route, Redirect } from 'react-router';

export const PrivateRoute = ({ component: Component, render, isAuthenticated, ...rest }) => (
    <Route {...rest} render={props => (
        isAuthenticated ? (
            Component? <Component {...props} /> : render(props)
        ) : (
                <Redirect to={{
                    pathname: '/login',
                    state: { from: props.location }
                }} />
            )
    )} />
);