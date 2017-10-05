import React from 'react';
import ProjectList from './project/list';
import { HelpBlock, Jumbotron } from 'react-bootstrap';

const Home = ({ projects }) => (
    <div className="home-page">
        <Jumbotron>
            <h1>Welcome to Estimator</h1>
            <p>Probabilistic project estimation and forecasting</p>
        </Jumbotron>
        
        <ProjectList projects={projects} />

        <div className="footer">
            <HelpBlock>
                Inspired by the pioneering work of Troy Magennis at Focused Objective. See 
                their <a href="http://github.com/FocusedObjective/FocusedObjective.Resources">open source repository</a> for
                for more great forecasting tools.
            </HelpBlock>
        </div>

    </div>
);

export default Home;
