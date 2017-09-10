import React from 'react';

import { Nav, NavDropdown, MenuItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Home = ({ }) => (
    <div className="home-page">
        <div className="jumbotron">
            <h1>Welcome to Estimator</h1>
            <p>Probabilistic project estimation and forecasting</p>
        </div>

        <h2>Projects</h2>
        <p className="help-block">
            Projects created by or shared with you are shown below.
            Click <em>Create new project</em> to create a new one.
        </p>

        TODO
        
    </div>
);

export default Home;

export const HomeNav = () => (
    <Nav>
        <NavDropdown id="project-menu-dropdown" title="Project">
            <LinkContainer to="/project/new"><MenuItem>New&hellip;</MenuItem></LinkContainer>
        </NavDropdown>
    </Nav>
);