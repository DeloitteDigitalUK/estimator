import _ from 'lodash';
import { histogram, quantile } from 'd3-array';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Alert } from 'react-bootstrap';
import { VictoryChart, VictoryBar, VictoryLine, VictoryLabel } from 'victory';

import simulateSolution from '../../../../simulation/solution';

export default class SolutionForecast extends Component {

    static propTypes = {
        solution: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            runs: 1000,
            bins: 20,
            percentiles: [0.5, 0.85, 0.95, 0.99]
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    saveValue(key, modifier=null, e) {
        if(e === undefined) { // shift arguments if only `key` and event defined.
            e = modifier;
            modifier = undefined;
        }

        const value = modifier? modifier(e) : e.target.value;

        this.setState((prevState, props) => {
            return { [key]: value };
        });
    }

    render() {
        
        let simulationResults;

        try {
            simulationResults = simulateSolution(this.props.solution, this.state.runs, false);
        } catch(e) {
            return <Alert bsStyle="danger">{e.message}</Alert>;
        }

        const distribution = simulationResults.map(r => r.periods);
        distribution.sort();
        
        const histogramGenerator = histogram().thresholds(this.state.bins);
        const quantiles = this.state.percentiles.map(p => quantile(distribution, p));

        const data = histogramGenerator(distribution);

        return (
            <div>

                Forecast

                <VictoryChart
                    width={300}
                    height={200}
                    fontSize={10}
                    domainPadding={{x: 1, y: 1}}>

                    <VictoryBar
                        data={data}
                        x={d => `${d.x0}-${d.x1}`}
                        y={d => d.length}
                        />

                    {quantiles.map((q, idx) => (
                    <VictoryLine 
                        key={idx}
                        x={() => q} 
                        style={{ data: { stroke: "red" } }}
                        labels={[`${Math.round(this.state.percentiles[idx] * 100)}%`]}
                        labelComponent={<VictoryLabel y={150} angle={90}/>}
                        />
                    ))}

                </VictoryChart>

            </div>
        );

    }


}