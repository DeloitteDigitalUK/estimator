import React from 'react';

import { Nav, NavDropdown, MenuItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import ProjectList from './project/list';

const Home = ({ projects }) => (
    <div className="home-page">
        <div className="jumbotron">
            <h1>Welcome to Estimator</h1>
            <p>Probabilistic project estimation and forecasting</p>
        </div>
        
        <ProjectList projects={projects} />
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