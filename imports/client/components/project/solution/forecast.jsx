import _ from 'lodash';
import { histogram, quantile } from 'd3-array';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Alert, Row, Col, Form, FormGroup, ControlLabel, FormControl, Table } from 'react-bootstrap';

import * as d3 from 'd3';
import * as nv from 'nvd3';

import simulateSolution from '../../../../simulation/solution';
import { getSuffix } from '../../../../utils';

class Chart extends Component {

    static propTypes = {
        data: PropTypes.array.isRequired,        // [[values...]{x0, x1}]
        xAxisLabel: PropTypes.string.isRequired,
        yAxisLabel: PropTypes.string.isRequired,
        height: PropTypes.string.isRequired,
        width: PropTypes.string.isRequired
    }

    constructor(props) {
        super(props);

        this.chart = nv.models.discreteBarChart()
            .x(d => d)
            .y(d => d.length)
            .staggerLabels(false)
            .showLegend(false)
            .showYAxis(true)
            .showXAxis(true)
            .showValues(false)
            .valueFormat(d3.format('i'))
            .margin({top: 30, right: 60, bottom: 80, left: 70})
            .color(() => "#1f67b4")
            ;

        this.chart.tooltip
            .enabled(true)
            .classes('xy-tooltip solution-forecast-tooltip')
            .keyFormatter(k => `${this.getLabel(k)} weeks`)
            .valueFormatter(v => "")
            ;

        this.chart.xAxis
            .axisLabel(props.xAxisLabel)
            .tickFormat(this.getLabel)
            .rotateLabels(-45)
            ;

        this.chart.yAxis
            .axisLabel(props.yAxisLabel)
            .tickFormat(d3.format('r'))
            ;
    }

    componentDidMount() {
        d3.select(this.chartElement)
            .datum(this.getData())
            .call(this.chart)
            ;

        nv.utils.windowResize(() => { this.chart.update() });
    }

    componentDidUpdate() {
        d3.select(this.chartElement)
            .datum(this.getData())
            .transition()
            .duration(350)
            .call(this.chart)
            ;
    }

    getLabel(d) {
        return `${d.x0}-${d.x1}`;
    } 
    
    getData() {
        return [{
            key: "Distribution",
            values: this.props.data
        }];
    }

    render() {
        return (
            <svg ref={c => {this.chartElement = c;}} className="solution-forecast-chart" style={{height: this.props.height, width: this.props.width}} />
        );
    }

}

export default class SolutionForecast extends Component {

    static propTypes = {
        solution: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.percentiles = [1, 0.99, 0.95, 0.9, 0.85, 0.75, 0.5, 0.25]; // TODO: Make editable?

        this.state = {
            runs: 2000,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    render() {
        
        let simulationResults;

        try {
            simulationResults = simulateSolution(this.props.solution, this.state.runs, false);
        } catch(e) {
            return <Alert bsStyle="danger">{e.message}</Alert>;
        }

        const distribution = _.sortBy(simulationResults, 'periods').map(s => s.periods);
        
        const histogramGenerator = histogram()
        const data = histogramGenerator(distribution);
        
        const percentiles = this.percentiles.map(p => ({
            percentile: Math.round(p * 100),
            value: Math.round(quantile(distribution, p))
        }));

        return (                
            <Row>
                <Col md={8}>
                    <Chart
                        xAxisLabel="Weeks elapsed in simulation"
                        yAxisLabel="Number of simulations completing in this time"
                        data={data}
                        width="100%"
                        height="400px"
                        />
                </Col>
                <Col md={4}>
                    
                    <Form horizontal className="simulation-controls" onSubmit={e => e.preventDefault()}>
                        <Table condensed striped>
                            <tbody>
                                {percentiles.map((p, idx) => (
                                <tr key={idx}>
                                    <td>{p.percentile}{getSuffix(p.percentile)} percentile</td>
                                    <td>&le; {p.value} weeks</td>
                                </tr>
                                ))}
                            </tbody>
                        </Table>

                        <FormGroup className="runs" title="The number of runs of the simulator. More runs means a more nuanced result, but this will also take more time.">
                            <Col sm={4}>
                                <ControlLabel>
                                    Simulations:
                                </ControlLabel>
                            </Col>
                            <Col sm={4}>
                                <FormControl
                                    type="number"
                                    min={100}
                                    max={10000}
                                    value={this.state.runs}
                                    onChange={e => {
                                        const value = e.target.value? parseInt(e.target.value, 10) : 0;
                                        if(_.isNaN(value) || value < 0 || value > 10000) {
                                            return;
                                        }
                                        this.setState({runs: value})
                                    }}
                                    />
                            </Col>
                        </FormGroup>

                    </Form>
                </Col>

            </Row>
        );

    }


}