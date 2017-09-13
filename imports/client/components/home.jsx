import React from 'react';
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
