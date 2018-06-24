import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { ListGroup, ListGroupItem, Glyphicon } from 'react-bootstrap';

import { canWrite } from '../../../../utils';
import Projects, { EstimateType } from '../../../../collections/projects';

const SolutionItem = SortableElement(({ project, solution, prefix }) => {

    const team = _.find(project.teams || [], t => t._id === solution.teamId),
          workstream = _.find(project.workstreams || [], t => t._id === solution.workstreamId);

    return (
        <ListGroupItem header={
                <span>
                    <Glyphicon className="solution-type" glyph={solution.estimateType === EstimateType.workPattern? 'calendar' : 'list-alt'} />
                    <Link to={`${prefix}/solution/${solution._id}`}>
                        {workstream && <em>{workstream.name}: </em>}{solution.name} {team && <small>[{team.name}]</small>}
                    </Link>
                </span>
            }>
                {solution.description}
        </ListGroupItem>
    );
});

const SolutionListContainer = SortableContainer(({ project, items, disabled, prefix }) => (
    <ListGroup className="solutions-list">
        {items.map((value, index) => (
            <SolutionItem disabled={disabled} prefix={prefix} key={`item-${index}`} index={index} project={project} solution={value} />
        ))}
    </ListGroup>
));

export default class SolutionList extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        prefix: PropTypes.string.isRequired
    }

    render() {

        return (
            <SolutionListContainer
                disabled={!canWrite(this.props.project)}
                prefix={this.props.prefix}
                lockAxis="y"
                distance={5}
                project={this.props.project}
                items={this.props.project.solutions}
                onSortEnd={this.updateOrder.bind(this)}
            />
        );
        
    }

    async updateOrder({ oldIndex, newIndex }) {
        await Projects.update(this.props.project._id, {
            $set: {
                solutions: arrayMove(this.props.project.solutions, oldIndex, newIndex)
            }
        });
    }

}