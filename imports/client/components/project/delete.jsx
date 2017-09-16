import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

import Projects from '../../../collections/projects';

export default class DeleteProject extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired,
    }

    render () {

        return (
            <Modal show>
                <Modal.Header>
                    <Modal.Title>Delete project</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    Are you sure you want to delete&nbsp;
                    <strong>{this.props.project.name}</strong>?
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
            await Projects.remove(this.props.project._id);
            this.props.history.push('/');
        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to delete projects");
        }
    }

}
