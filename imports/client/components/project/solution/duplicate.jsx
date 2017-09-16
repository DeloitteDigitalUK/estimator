import _ from 'lodash';

import { Random } from 'meteor/random';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import { Modal, Button, FormGroup, FormControl } from 'react-bootstrap';

import Projects from '../../../../collections/projects';

export default class DuplicateSolution extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        solution: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            name: `${props.solution.name} copy`
        };
    }

    render () {

        return (
            <Modal show>
                <Modal.Header>
                    <Modal.Title>Duplicate solution</Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    <p>
                        To duplicate <strong>{this.props.solution.name}</strong>,
                        enter a new name below and click <em>Duplicate</em>.
                    </p>

                    <form onSubmit={this.onDuplicate.bind(this)}>
                        <FormGroup controlId="name" validationState={this.state.name? null : 'error'}>
                            <FormControl
                                type="text"
                                placeholder="Solution name"
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
            const solution = _.assignIn(_.cloneDeep(this.props.solution), {
                _id: Random.id(),
                name: this.state.name
            });
            
            await Projects.update(this.props.project._id, {
                $push: {
                    solutions: solution
                }
            });
            
            this.props.history.push(`/project/${this.props.project._id}/solution/${solution._id}`);
        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to duplicate solutions");
        }
    }

}
