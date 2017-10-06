import _ from 'lodash';
import moment from 'moment';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Alert, ControlLabel, FormControl } from 'react-bootstrap';
import Timeline from 'react-calendar-timeline'
import Select from 'react-select';

import simulateProject from '../../../simulation/project';
import { getPublicSetting } from '../../../utils';

const DATE_FORMAT = getPublicSetting('dateFormat');

export default class Plan extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            percentiles: [0.95, 0.85, 0.75],
            runs: 1000
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    render() {
        
        let simulationResults

        try {
            simulationResults = simulateProject(this.props.project, this.state.percentiles, this.state.runs || 0)
        } catch(e) {
            return <Alert bsStyle="danger">{e.message}</Alert>;
        }

        const items = _.flatMap(simulationResults, r => r.dates.map((d, i) => ({
            id: `${r.solution._id}:${i}`,
            group: r.solution._id,
            title: d.description,
            description: `${d.description}: ${moment(d.startDate).format(DATE_FORMAT)} to ${moment(d.endDate).format(DATE_FORMAT)}`,
            className: d.percentile? `percentile-${Math.floor(d.percentile * 10)}` : null,
            start: moment(d.startDate),
            end: moment(d.endDate)
        })));

        return (                
            <div className="project-plan">

                <div className="project-plan-controls">
                    <span title="The number of runs of the simulator. More runs means a more nuanced result, but this will also take more time.">
                        <ControlLabel>
                            Simulations:
                        </ControlLabel>
                        <FormControl
                            type="number"
                            min={100}
                            max={10000}
                            value={this.state.runs || ""}
                            onChange={e => {
                                if(_.isEmpty(e.target.value)) {
                                    this.setState({runs: null});
                                    return;
                                }

                                const value = parseInt(e.target.value, 10)
                                if(_.isNaN(value) || value < 0 || value > 10000) {
                                    return;
                                }
                                this.setState({runs: value})
                            }}
                            />
                    </span>
                    <span title="The confidence percentiles to show for each simulated solution">
                        <ControlLabel>
                            Confidence levels:
                        </ControlLabel>
                        <Select
                            value={this.state.percentiles}
                            multi
                            onChange={values => { this.setState({ percentiles: values.map(v => v.value) }); }}
                            options={[1, 0.99, 0.95, 0.9, 0.85, 0.75, 0.5, 0.25].map(v => (
                                { value: v, label: `${Math.round(v * 100)}%` }
                            ))}
                            />
                    </span>
                </div>

                <div className="project-plan-timeline">

                    <Timeline
                        minZoom={24 * 60 * 60 * 1000}
                        canMove={false}
                        canChangeGroup={false}
                        canResize={false}
                        stackItems
                        stickyOffset={50}
                        groups={this.props.project.solutions}
                        items={items}
                        keys={{
                            groupIdKey: '_id',
                            groupTitleKey: 'name',
                            itemIdKey: 'id',
                            itemTitleKey: 'title',
                            itemDivTitleKey: 'description',
                            itemGroupKey: 'group',
                            itemTimeStartKey: 'start',
                            itemTimeEndKey: 'end'
                        }}
                        sidebarWidth={200}
                        fullUpdate
                        defaultTimeStart={moment(this.props.project.startDate)}
                        defaultTimeEnd={moment(this.props.project.startDate).add(6, 'month')}
                        groupRenderer={({group}) => (
                            <Link to={`/project/${this.props.project._id}/solution/${group._id}`} title={group.description}>{group.name}</Link>
                        )}
                        />

                </div>
                
            </div>
        );

    }


}