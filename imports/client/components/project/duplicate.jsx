import _ from 'lodash';

import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import { Modal, Button, FormGroup, FormControl } from 'react-bootstrap';

import Projects from '../../../collections/projects';

export default class DuplicateProject extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            name: `${props.project.name} copy`
        };
    }

    render () {

        return (
            <Modal show>
                <Modal.Header>
                    <Modal.Title>Duplicate project</Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    <p>
                        To duplicate <strong>{this.props.project.name}</strong>,
                        enter a new name below and click <em>Duplicate</em>.
                    </p>

                    <form onSubmit={this.onDuplicate.bind(this)}>
                        <FormGroup controlId="name" validationState={this.state.name? null : 'error'}>
                            <FormControl
                                type="text"
                                placeholder="Project name"
                                value={this.state.name || ""}
                                onChange={e => { this.setState({name: e.target.value}); }}
                                />
                        </FormGroup>
                    </form>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsStyle="primary" onClick={this.onDuplicate.bind(this)} disabled={!this.state.name}>Duplicate</Button>
                    <Link className="btn btn-default" to={this.props.location.state.returnTo}>Cancel</Link>
                </Modal.Footer>
            </Modal>
        );
    }

    async onDuplicate(e) {
        e.preventDefault();

        try {
            const projectId = await Projects.insert({
                ..._.cloneDeep(_.omit(this.props.project, '_id', 'owner', 'name')),
                owner: Meteor.userId(),
                name: this.state.name
            });

            this.props.history.push('/project/' + projectId);
        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to duplicate projects");
        }
    }

}
