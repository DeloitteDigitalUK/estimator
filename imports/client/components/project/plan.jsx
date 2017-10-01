import _ from 'lodash';
import moment from 'moment';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import Timeline from 'react-calendar-timeline'

import simulateProject from '../../../simulation/project';
import { getPublicSetting } from '../../../utils';

const DATE_FORMAT = getPublicSetting('dateFormat');


export default class Plan extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.percentiles = [0.95, 0.85, 0.75]; // TODO: Make editable?
        this.runs = 2000; // TODO: Make editable?
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    render() {
        
        let simulationResults

        try {
            simulationResults = simulateProject(this.props.project, this.percentiles, this.runs)
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
        );

    }


}