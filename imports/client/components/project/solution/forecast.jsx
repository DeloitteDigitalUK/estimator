import _ from 'lodash';
import { histogram, quantile } from 'd3-array';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Alert, Row, Col, HelpBlock, Form, FormGroup, ControlLabel, FormControl, Table } from 'react-bootstrap';

import * as d3 from 'd3';
import * as nv from 'nvd3';

import simulateSolution from '../../../../simulation/solution';
import { getSuffix } from '../../../../utils';

class Chart extends Component {

    static propTypes = {
        data: PropTypes.array.isRequired,        // [[values...]{x0, x1}]
        percentiles: PropTypes.array.isRequired, // [{percentile, value}]
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
            runs: 1000,
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
        
        const histogramGenerator = histogram()
        const data = histogramGenerator(distribution);
        
        const percentiles = this.percentiles.map(p => ({
            percentile: Math.round(p * 100),
            value: Math.round(quantile(distribution, p))
        }));

        return (
            <div>
                <HelpBlock>
                    <p>
                        Based on the parameters above, we can forecast the number of weeks required to
                        deliver this solution. The various parameters all have a degree of uncertainty,
                        expressed as high and low guesses or based on a set of samples &mdash; we cannot
                        ever be completely sure about the future!
                    </p>
                    <p>
                        We use Monte Carlo simulations to create a forecast that takes this uncertainty
                        into account. In essence, we let the delivery play out many times over, each time
                        picking a random sample or value within the given range for each parameter. We can
                        then analyse the probability of a given outcome (e.g., "delivery completed in no
                        more than 10 weeks"), based on the proportion of simulations that resulted in that
                        outcome.
                    </p>
                    <p>
                        The results of the simulation are shown as a histogram and a table of the outcomes
                        at different confidence percentiles. For example, if the 85th percentile value is
                        shown as &le; 10 weeks, that means that in 85% of simulations, delivery was completed
                        in 10 weeks or fewer. The histogram shows how widely spread the simulated outcomes
                        are: the wider the distribution, the more uncertainty. When adopting a forecast, we
                        thus need to apply some judgement in choosing which simulated outcome to use. The
                        higher the percentile, the more conservative the estimate. A value between 85% and
                        95% is often a good place to start, but there is no universally correct answer.
                    </p>
                </HelpBlock>
                <Row>
                    <Col md={8}>
                        <Chart
                            xAxisLabel="Weeks elapsed in simulation"
                            yAxisLabel="Number of simulations completing in this time"
                            data={data}
                            percentiles={percentiles}
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
                                    <ControlLabel >
                                        Simulations
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
            </div>
        );

    }


}