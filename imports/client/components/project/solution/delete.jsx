import _ from 'lodash';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

import { Projects } from '../../../../collections/promisified';

export default class DeleteSolution extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        solution: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired,
    }

    render () {

        return (
            <Modal show>
                <Modal.Header>
                    <Modal.Title>Delete solution</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    Are you sure you want to delete&nbsp;
                    <strong>{this.props.solution.name}</strong>?
                    This operation cannot be undone.
                </Modal.Body>

                <Modal.Footer>
                    <Button bsStyle="danger" onClick={this.onDelete.bind(this)}>Delete</Button>
                    <Link className="btn btn-default" to={this.props.location.state.returnTo}>Cancel</Link>
                </Modal.Footer>
            </Modal>
        );
    }

    async onDelete(e) {
        e.preventDefault();

        try {
            
            const solutions = _.reject(this.props.project.solutions, {_id: this.props.solution._id});

            await Projects.update(this.props.project._id, {
                $set: {
                    solutions: solutions
                }
            });

            this.props.history.push(`/project/${this.props.project._id}`);
        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to delete solution");
        }
    }

}
