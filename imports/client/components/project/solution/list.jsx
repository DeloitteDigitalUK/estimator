import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { ListGroup, ListGroupItem, } from 'react-bootstrap';

import { canWrite } from '../../../../utils';
import { Projects } from '../../../../collections/promisified';

const SolutionItem = SortableElement(({ solution, prefix }) =>
    <ListGroupItem header={<Link to={`${prefix}/solution/${solution._id}`}>{solution.name}</Link>}>
        {solution.description}
    </ListGroupItem>
);

const SolutionListContainer = SortableContainer(({ items, disabled, prefix }) => {
    return (
        <ListGroup className="solutions-list">
            {items.map((value, index) => (
                <SolutionItem disabled={disabled} prefix={prefix} key={`item-${index}`} index={index} solution={value} />
            ))}
        </ListGroup>
    );
});

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