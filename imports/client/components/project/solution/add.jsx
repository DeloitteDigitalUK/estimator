import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import { Modal, Button, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';

import Projects, { EstimateType, newSolution } from '../../../../collections/projects';

export default class AddSolution extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            name: "",
            description: "",
            estimateType: EstimateType.backlog
        };
    }

    render () {

        return (
            <Modal show>
                <Modal.Header>
                    <Modal.Title>Add solution</Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    <p>
                        To add a new solution to <strong>{this.props.project.name}</strong>,
                        enter a name and description below, and click <em>Add</em>.
                    </p>

                    <form onSubmit={this.onAdd.bind(this)}>

                        <FormGroup controlId="name" validationState={this.state.name? null : 'error'}>
                            <FormControl
                                type="text"
                                placeholder="Solution name"
                                value={this.state.name}
                                onChange={e => { this.setState({name: e.target.value}); }}
                                />
                        </FormGroup>

                        <FormGroup controlId="description">
                            <FormControl
                                componentClass='textarea'
                                placeholder="A short description of the solution"
                                value={this.state.description}
                                onChange={e => { this.setState({description: e.target.value}); }}
                                />
                        </FormGroup>

                        <FormGroup controlId="estimateType">
                            <ControlLabel>Estimate type</ControlLabel>
                            <FormControl
                                componentClass="select"
                                placeholder="select"
                                value={this.state.estimateType}
                                onChange={e => { this.setState({estimateType: e.target.value}); }}
                            >
                                <option value={EstimateType.backlog}>Working through a backlog</option>
                                <option value={EstimateType.workPattern}>Fixed working pattern</option>
                            </FormControl>
                        </FormGroup>

                    </form>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsStyle="primary" onClick={this.onAdd.bind(this)} disabled={!this.state.name}>Add</Button>
                    <Link className="btn btn-default" to={this.props.location.state.returnTo}>Cancel</Link>
                </Modal.Footer>
            </Modal>
        );
    }

    async onAdd(e) {
        e.preventDefault();

        try {
            const solution = newSolution({
                name: this.state.name,
                description: this.state.description,
                estimateType: this.state.estimateType
            });

            await Projects.update(this.props.project._id, {
                $push: {
                    solutions: solution
                }
            });

            this.props.history.push(this.props.location.state.returnTo);
        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to create solution");
        }
    }

}
