import React from 'react';

const ViewSolution = ({ solution }) => {

    return (
        <div className="view-solution">

            <h1>{solution.name}</h1>
            <p>
                {solution.description}
            </p>
            
        </div>
    );
}

export default ViewSolution;
