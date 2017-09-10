import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { FormGroup, ControlLabel, FormControl, HelpBlock, ButtonToolbar, Button, Row, Col, Alert } from 'react-bootstrap';

import Table, { validators, rowValidator as $v, KeyValueAutocompleteCell } from '../table/table';
import { getPublicSetting, debounce, callMethod } from '../../../utils';

const QUERY_DEBOUNCE = getPublicSetting('queryDebounce');
const QUERY_MIN_LENGTH = getPublicSetting('queryMinLength');

const READ_ONLY = "Read-only";
const READ_WRITE = "Read-write";

const extractUserData = (user) => {
    return {
        _id: user._id,
        name: (user.profile && user.profile.name) || user.username || "",
        email: user.emails? user.emails[0].address : ""
    }
};

const fetchUserData = (id) => {
    let user = Meteor.users.findOne(id);
    if(!user) {
        return undefined;
    };

    return extractUserData(user);
};

function collapseShares(project) {
    let shares = [];

    if(project.readOnlyShares) {
        project.readOnlyShares.forEach(s => {
            shares.push({
                user: s,
                permissions: READ_ONLY,
                __autocomplete__: {
                    user: fetchUserData(s)
                }
            });
        });
    }

    if(project.readWriteShares) {
        project.readWriteShares.forEach(s => {
            shares.push({
                user: s,
                permissions: READ_WRITE,
                __autocomplete__: {
                    user: fetchUserData(s)
                }
            });
        });
    }

    return shares;
};

function expandShares(shares) {
    return {
        readOnlyShares: shares.filter(s => s.permissions === READ_ONLY).map(s => s.user),
        readWriteShares: shares.filter(s => s.permissions === READ_WRITE).map(s => s.user)
    };
};

export default class ProjectForm extends Component {

    static propTypes = {
        project: PropTypes.object,

        onCancel: PropTypes.func,
        onSubmit: PropTypes.func
    }

    constructor(props) {
        super(props);
        this.state = {
            name: props.project? props.project.name : null,
            nameValid: true,

            description: props.project? props.project.description : null,

            startDate: props.project? props.project.startDate : null,
            startDateValid: true,

            endDate: props.project? props.project.endDate : null,
            endDateValid: true,

            shares: props.project? collapseShares(props.project) : [],
            sharesValid: true,

            invalid: false,
            error: false
        };
    }

    render() {

        const saveString = field => {
            return e => {
                let newState = {};

                newState[field] = e.target.value;
                newState[field + "Valid"] = Boolean(e.target.value);

                this.setState(newState);
            }
        };

        return (
            <Row>
                <Col xs={12} sm={10} md={8}>

                    {this.state.invalid? <Alert bsStyle="danger">Please correct the indicated errors</Alert> : ""}
                    {this.state.error? <Alert bsStyle="danger">An unexpected error occurred. Please try again.</Alert> : ""}

                    <form onSubmit={this.onSubmit.bind(this)}>

                        <FormGroup controlId="name" validationState={this.state.nameValid? null : 'error'}>
                            <ControlLabel>Name</ControlLabel>
                            <FormControl
                                type="text"
                                placeholder="Project name"
                                value={this.state.name || ""}
                                onChange={saveString('name')}
                                />
                            <FormControl.Feedback />
                            <HelpBlock>Enter a descriptive name for the project</HelpBlock>
                        </FormGroup>

                        <FormGroup controlId="description">
                            <ControlLabel>Description</ControlLabel>
                            <FormControl
                                componentClass="textarea"
                                placeholder="Long project description"
                                value={this.state.description || ""}
                                onChange={saveString('description')}
                                />
                            <HelpBlock>Enter a longer description for the project</HelpBlock>
                        </FormGroup>

                        <FormGroup controlId="shares">
                            <ControlLabel>Sharing</ControlLabel>
                            <HelpBlock>Search for other users to share this project with, either read-only or read-write.</HelpBlock>
                            <Table
                                data={this.state.shares}
                                onChange={data => { this.setState({shares: data}); }}
                                onValidate={valid => { this.setState({sharesValid: valid }); }}
                                dataSchema={{user: null, permissions: null}}
                                columns={[
                                    {title: "User", width: 300, data: "user", validator: $v(validators.required), ...KeyValueAutocompleteCell,
                                        handsontable: {
                                            dataSchema: {name: null, email: null},
                                            columns: [
                                                {title: "Name", width: 150, data: 'name'},
                                                {title: "Email", width: 200, data: 'email'}
                                            ],
                                            getValue() {
                                                const selection = this.getSelected();
                                                return this.getSourceDataAtRow(selection[0])._id;
                                            },
                                        },
                                        filteringCaseSensitive: false,
                                        extractTitle: row => row? row.email : "",
                                        source: debounce(QUERY_DEBOUNCE, (query, process) => {

                                            if(query.length < QUERY_MIN_LENGTH) {
                                                process([]);
                                                return;
                                            }

                                            (async function() {
                                                try {
                                                    let results = await callMethod('users/query', query);
                                                    process(results.map(extractUserData));
                                                } catch(err) {
                                                    console.error(err);
                                                    alert("Unable to query for users!");
                                                }
                                            })();
                                        })
                                    },
                                    {title: "Permissions", width: 150, data: "permissions", type: "dropdown", source: [READ_ONLY, READ_WRITE], strict: true, validator: $v(validators.required), allowInvalid: false}
                                ]}
                                />

                            <FormControl.Feedback />

                        </FormGroup>

                        <hr />

                        <ButtonToolbar>
                            <Button type="submit" bsStyle="primary" onClick={this.onSubmit.bind(this)}>Save</Button>
                            <Button bsStyle="default" onClick={this.props.onCancel}>Cancel</Button>
                        </ButtonToolbar>

                    </form>
                </Col>
            </Row>
        );
    }

    onSubmit(e) {
        e.preventDefault();

        let validationState = {
            nameValid: true,
            startDateValid: true,
            endDateValid: true,
            invalid: false,
            error: false
        };

        if(!this.state.name) {
            validationState.nameValid = false;
            validationState.invalid = true;
        }

        if(!this.state.sharesValid) {
            validationState.invalid = true;
        }

        this.setState(validationState);
        if(validationState.invalid) {
            return;
        }

        if(this.props.onSubmit) {
            this.props.onSubmit({
                name: this.state.name,
                description: this.state.description,
                ...expandShares(this.state.shares)
            })
        }

    }

}
