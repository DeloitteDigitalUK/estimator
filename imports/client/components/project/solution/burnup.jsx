import _ from 'lodash';
import { quantile } from 'd3-array';

import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import PropTypes from 'prop-types';

import { Alert, ControlLabel, FormControl } from 'react-bootstrap';
import Select from 'react-select';

import * as d3 from 'd3';
import * as nv from 'nvd3';

import simulateSolution from '../../../../simulation/solution';
import { getSuffix } from '../../../../utils';

class Chart extends Component {

    static propTypes = {
        simulationResults: PropTypes.array.isRequired,
        percentiles: PropTypes.array.isRequired,
        xAxisLabel: PropTypes.string.isRequired,
        yAxisLabel: PropTypes.string.isRequired,
        height: PropTypes.string.isRequired,
        width: PropTypes.string.isRequired
    }

    constructor(props) {
        super(props);

        this.chart = nv.models.lineChart()
            .useInteractiveGuideline(false)
            .showLegend(false)
            .showYAxis(true)
            .showXAxis(true)
            .margin({top: 30, right: 60, bottom: 80, left: 70})
            .pointSize(0.5)
            ;

        this.chart.tooltip
            .enabled(true)
            .contentGenerator(d => {
                if(d.series[0].percentileLine) {
                    return ReactDOMServer.renderToString(
                        <div className="chart-tooltip">
                            <div className="tooltip-series">{d.series[0].key}</div>
                            <div className="tooltip-value">{d.value} weeks</div>
                        </div>
                    );
                }

                const metadata = d.series[0].metadata;

                return ReactDOMServer.renderToString(
                    <div className="chart-tooltip">
                        <div className="tooltip-series">Simulation {d.seriesIndex + 1}</div>
                        <div className="tooltip-value">
                            {d.point.y} work items completed after {d.point.x} weeks
                        </div>
                        {!_.isEmpty(metadata) && (
                        <div className="tooltip-details">
                            <span>Simulation details:</span>
                            <ul>
                                <li>An initial backlog of {metadata.initialBacklog} work items</li>
                                <li>Splitting of work items added an additional {metadata.splits} work items</li>
                                {metadata.risks.length > 0 && (
                                <li>Risks incurred:
                                    <ul>
                                    {metadata.risks.map((r, i) => (
                                        <li key={i}>{r.name} ({Math.round(r.likelihood * 100)}% likelihood), adding an additional {r.impact} work items</li>
                                    ))}
                                    </ul>
                                </li>
                                )}
                                <li>Total backlog: <strong>{metadata.totalBacklog} work items</strong></li>
                            </ul>
                        </div>
                        )}
                    </div>
                );
            });

            ;

        this.chart.xAxis
            .axisLabel(props.xAxisLabel)
            .rotateLabels(-45)
            .tickValues(data => { // make sure all ticks are shown
                const max = _.maxBy(data, d => d.values[d.values.length-1].x);
                if(!max) return [];
                return _.range(1, max.values[max.values.length-1].x + 1);
            })
            .tickFormat(d => { // annotate with percentile where relevant
                const p = _.find(this.props.percentiles, {value: d});
                if(p) {
                    return `(${p.percentile}${getSuffix(p.percentile)}) ${d}`
                } else {
                    return d;
                }
            })
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

    getData() {

        let max = 0;

        return this.props.simulationResults.map(s => {

            let cumulativeValue = 0,
                periods = 0;

            max = Math.max(s.metadata.totalBacklog, max);

            return {
                metadata: s.metadata,
                values: s.metadata.periods.map(v => {
                    cumulativeValue += v;
                    return {
                        x: ++periods,
                        y: Math.min(s.metadata.totalBacklog, cumulativeValue),
                    };
                }),
                key: `${s.runNumber + 1}`,
                color: "#1f67b4",
                percentileLine: false,
                strokeWidth: 0.2
            }

        }).concat(this.props.percentiles.map(p => ({
            key: `${p.percentile}${getSuffix(p.percentile)} percentile`,
            percentileLine: true,
            percentileValue: p.value,
            color: "#ff7f0e",
            strokeWidth: 1,
            values: [{
                x: p.value,
                y: 0
            },{
                x: p.value,
                y: max
            }]
        })));
    }

    render() {
        return (
            <svg ref={c => {this.chartElement = c;}} className="solution-burnup-chart" style={{height: this.props.height, width: this.props.width}} />
        );
    }

}

export default class SolutionBurnup extends Component {

    static propTypes = {
        solution: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            percentiles: [0.95, 0.85, 0.75, 0.5],
            runs: 50,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    render() {
        
        let simulationResults;

        try {
            simulationResults = simulateSolution(this.props.solution, this.state.runs || 0, true);
        } catch(e) {
            return <Alert bsStyle="danger">{e.message}</Alert>;
        }

        const distribution = _.sortBy(simulationResults, 'periods').map(s => s.periods);
        const percentiles = this.state.percentiles.map(p => ({
            percentile: Math.round(p * 100),
            value: Math.round(quantile(distribution, p))
        }));
        
        return ( 
            
            <div className="simulation-burnup">

                <div className="project-plan-controls">
                    <span title="The number of runs of the simulator. More runs means a more nuanced result, but this will also take more time.">
                        <ControlLabel>
                            Simulations:
                        </ControlLabel>
                        <FormControl
                            type="number"
                            min={10}
                            max={100}
                            value={this.state.runs || ""}
                            onChange={e => {
                                if(_.isEmpty(e.target.value)) {
                                    this.setState({runs: null});
                                    return;
                                }

                                const value = parseInt(e.target.value, 10)
                                if(_.isNaN(value) || value < 0 || value > 100) {
                                    return;
                                }
                                this.setState({runs: value})
                            }}
                            />
                    </span>
                    <span title="The confidence percentiles to mark on the chart.">
                        <ControlLabel>
                            Percentiles
                        </ControlLabel>
                        <Select
                            value={this.state.percentiles}
                            multi
                            onChange={values => { this.setState({ percentiles: values.map(v => v.value) }); }}
                            options={[1, 0.99, 0.95, 0.9, 0.85, 0.75, 0.5, 0.25].map(v => (
                                { value: v, label: `${Math.round(v * 100)}${getSuffix(Math.round(v * 100))}` }
                            ))}
                            />
                    </span>
                </div>

                <div className="simulation-burnup-chart">
                    <Chart
                        xAxisLabel="Week"
                        yAxisLabel="Number of work items completed"
                        simulationResults={simulationResults}
                        percentiles={percentiles}
                        width="100%"
                        height="600px"
                        />
                </div>

            </div>
        );

    }


}