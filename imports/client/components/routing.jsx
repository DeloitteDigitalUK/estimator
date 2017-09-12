import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Route, Switch, Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';

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


/**
 * Alternative to Switch that takes care of modal semantics.
 * 
 * Wrap a subset of the child `<Route />` objects in a `<ModalRoutes />`
 * tag to make them behave like modals.
 * 
 * To link to a modal, use <ModalLink /> or <ModalLinkContainer />
 */
export class ModalSwitch extends Component {

    static propTypes = {
        history: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        match: PropTypes.object.isRequired,

        className: PropTypes.string,
        children: PropTypes.array
    }

    previousLocation = this.props.location

    componentWillUpdate(nextProps) {
        const { location } = this.props;
        if(nextProps.history.action !== 'POP' && (!location.state || !location.state.modal)) {
            this.previousLocation = this.props.location;
        }
    }

    render() {

        const { location, className, children } = this.props;

        const isModal = !!(
            location.state &&
            location.state.modal &&
            this.previousLocation !== location // not initial render
        );

        const routes = [], modalRoutes = [];

        React.Children.forEach(children, child => {
            if(child.type === ModalRoutes) {
                modalRoutes.push(child);
            } else {
                routes.push(child);
            }
        });

        return (
            <div className={className}>
                <Switch location={isModal ? this.previousLocation : location}>
                    {routes}
                </Switch>
                {modalRoutes}
            </div>
        );
    }

}

export const ModalRoutes = ({ children }) => {
    return (
        <Switch>
            {children}
        </Switch>
    );
};

export const ModalLink = ({ to, ...rest }) => (
    <Link to={{pathname: to, state: { modal: true, returnTo: location.pathname }}} {...rest} />
)

export const ModalLinkContainer = ({ to, ...rest }) => (
    <LinkContainer to={{pathname: to, state: { modal: true, returnTo: location.pathname }}} {...rest} />
)