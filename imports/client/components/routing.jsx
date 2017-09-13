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
 * To link to a modal, use `<ModalLink />` or `<ModalLinkContainer />`
 * 
 * Note that if you have (indirectly) nested `<ModalSwitch />` blocks,
 * you may get into trouble with modals in the innemost switch not working,
 * because in effect the outermost modal "swallows" the request and starts
 * to render things differently.
 * 
 * To get around this, set `modalTarget` on `<ModalSwitch />` to a unique
 * string and use the same string in the `modalTarget` attribute of any
 * `<ModalLink />` or `<ModalLinkContainer />` that references modals
 * for this switch. The default `modalTarget` is `"default"`.
 */
export class ModalSwitch extends Component {

    static propTypes = {
        history: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        match: PropTypes.object.isRequired,

        modalTarget: PropTypes.string,

        className: PropTypes.string,
        children: PropTypes.array
    }

    static defaultProps = {
        modalTarget: "default"
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
            location.state.modalTarget === this.props.modalTarget &&
            this.previousLocation !== location // not initial render
        );

        let routes = [], modalRoutes = null;

        React.Children.forEach(children, child => {
            if (!React.isValidElement(child)) return;

            if(child.type === ModalRoutes) {
                modalRoutes = child;
            } else {
                routes.push(child);
            }
        });

        return (
            <div className={className}>
                <Switch location={isModal ? this.previousLocation : location}>
                    {routes}
                </Switch>
                {modalRoutes? React.cloneElement(modalRoutes, { location }) : null}
            </div>
        );
    }

}

export const ModalRoutes = ({ children, location }) => {
    return (
        <Switch location={location}>
            {children}
        </Switch>
    );
};

export const ModalLink = ({ to, modalTarget="default", ...rest }) => (
    <Link to={{pathname: to, state: { modal: true, modalTarget, returnTo: location.pathname }}} {...rest} />
)

export const ModalLinkContainer = ({ to, modalTarget="default", ...rest }) => (
    <LinkContainer to={{pathname: to, state: { modal: true, modalTarget, returnTo: location.pathname }}} {...rest} />
)