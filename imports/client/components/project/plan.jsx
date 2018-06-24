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

const GroupBy = {
    solution: "solution",
    team: "team",
    workstream: "workstream"
};


export default class Plan extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            groupBy: GroupBy.solution,
            percentiles: [0.95, 0.85, 0.75],
            runs: 1000
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    render() {
        
        const { project } = this.props,
              { groupBy, percentiles, runs } = this.state,
              defaultGroup = {_id: null, name: "(Default)", description: ""};

        let simulationResults;

        try {
            simulationResults = simulateProject(project, percentiles, runs || 0)
        } catch(e) {
            return <Alert bsStyle="danger">{e.message}</Alert>;
        }

        const showNameInTitle = groupBy !== GroupBy.solution;

        const items = _.flatMap(simulationResults, r => r.dates.map((d, i) => ({
            id: `${r.solution._id}:${i}`,
            group: groupBy === GroupBy.solution? r.solution._id : 
                   groupBy === GroupBy.team? (r.solution.teamId || null) : 
                   groupBy === GroupBy.workstream? (r.solution.workstreamId || null) : null,
            title: `${showNameInTitle? r.solution.name + " – " : ""}${d.description}`,
            description: `${r.solution.name} – ${d.description}: ${moment(d.startDate).format(DATE_FORMAT)} to ${moment(d.endDate).format(DATE_FORMAT)}`,
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
                            value={runs || ""}
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
                            value={percentiles}
                            multi
                            onChange={values => { this.setState({ percentiles: values.map(v => v.value) }); }}
                            options={[1, 0.99, 0.95, 0.9, 0.85, 0.75, 0.5, 0.25].map(v => (
                                { value: v, label: `${Math.round(v * 100)}%` }
                            ))}
                            />
                    </span>
                    <span title="How to group the plan">
                        <ControlLabel>
                            Group by:
                        </ControlLabel>
                        <Select
                            value={groupBy}
                            onChange={value => { this.setState({ groupBy: value.value }); }}
                            options={[
                                { value: GroupBy.solution, label: "Solition" },
                                { value: GroupBy.team, label: "Team" },
                                { value: GroupBy.workstream, label: "Work stream" }
                            ]}
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
                        groups={
                            groupBy === GroupBy.solution? project.solutions : 
                            groupBy === GroupBy.team? _.concat((project.teams || []), defaultGroup) : 
                            groupBy === GroupBy.workstream? _.concat((project.workstreams || []), defaultGroup) : []
                        }
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
                        defaultTimeStart={moment(project.startDate)}
                        defaultTimeEnd={moment(project.startDate).add(6, 'month')}
                        groupRenderer={({group}) => (
                            <span title={group.description}>{group.name}</span>
                        )}
                        />

                </div>
                
            </div>
        );

    }


}