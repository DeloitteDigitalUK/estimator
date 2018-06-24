import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';
import _ from 'lodash';

import { FormGroup, ControlLabel, FormControl, HelpBlock, ButtonToolbar, Button, Row, Col, Alert } from 'react-bootstrap';
import DatePicker from 'react-bootstrap-date-picker';

import Table, { validators, rowValidator as $v, KeyValueAutocompleteCell } from '../ui/table';
import { getPublicSetting, debounce, callMethod, ISO } from '../../../utils';

const DATE_FORMAT = getPublicSetting('dateFormat');

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

function addId(row) {
    row = _.cloneDeep(row);
    if(!row._id) {
        row._id = Random.id();
    }
    return row;
}

export default class ProjectForm extends Component {

    static propTypes = {
        project: PropTypes.object,

        onCancel: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);
        this.state = {
            name: props.project? props.project.name : null,
            nameValid: true,

            description: props.project? props.project.description : null,

            startDate: props.project? props.project.startDate : null,
            startDateValid: true,

            teams: props.project && props.project.teams? _.cloneDeep(props.project.teams) : [],
            teamsValid: true,

            workstreams: props.project && props.project.workstreams? _.cloneDeep(props.project.workstreams) : [],
            workstreamsValid: true,

            shares: props.project? collapseShares(props.project) : [],
            sharesValid: true,

            invalid: false,
            error: false
        };
    }

    saveString(field, e) {
        this.setState({
            [field]: e.target.value,
            [field + "Valid"]: Boolean(e.target.value)
        });
    }

    saveDate(field, val) {
        let date = moment.utc(val, ISO);
        this.setState({
            [field]: date.toDate(),
            [field + "Valid"]: date.isValid()
        });
    }

    render() {

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
                                onChange={this.saveString.bind(this, 'name')}
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
                                onChange={this.saveString.bind(this, 'description')}
                                />
                            <HelpBlock>Enter a longer description for the project</HelpBlock>
                        </FormGroup>

                        <FormGroup className="date-input" controlId="startDate" validationState={this.state.startDateValid? null : "error"}>
                            <ControlLabel>Start date</ControlLabel>
                                <DatePicker
                                    weekStartsOn={1}
                                    showClearButton={false}
                                    value={this.state.startDate? moment(this.state.startDate).format(ISO) : null}
                                    onChange={this.saveDate.bind(this, 'startDate')}
                                    dateFormat={DATE_FORMAT}
                                    />
                            <FormControl.Feedback />
                            <HelpBlock>Enter the beginning of time for the plan</HelpBlock>
                        </FormGroup>

                        <FormGroup controlId="teams">
                            <ControlLabel>Teams</ControlLabel>
                            <HelpBlock>
                                Define a list of teams. Teams can be associated with simulated solutions,
                                and used to group and sequence the plan.
                            </HelpBlock>
                            <Table
                                data={this.state.teams}
                                onChange={data => { this.setState({teams: data.map(addId)}); }}
                                onValidate={valid => { this.setState({teamsValid: valid }); }}
                                dataSchema={{_id: null, name: null, description: null}}
                                columns={[
                                    {data: "name", title: "Name", width: 200, validator: $v(validators.required), allowInvalid: true},
                                    {data: "description", title: "Description", width: 400}
                                ]}
                                />

                            <FormControl.Feedback />

                        </FormGroup>

                        <FormGroup controlId="workstreams">
                            <ControlLabel>Workstreams</ControlLabel>
                            <HelpBlock>
                                Define a list of workstreams. Teams can be associated with simulated solutions,
                                and used to group the plan.
                            </HelpBlock>
                            <Table
                                data={this.state.workstreams}
                                onChange={data => { this.setState({workstreams: data.map(addId)}); }}
                                onValidate={valid => { this.setState({workstreamsValid: valid }); }}
                                dataSchema={{_id: null, name: null, description: null}}
                                columns={[
                                    {data: "name", title: "Name", width: 200, validator: $v(validators.required), allowInvalid: true},
                                    {data: "description", title: "Description", width: 400}
                                ]}
                                />

                            <FormControl.Feedback />

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
                                    {title: "User", width: 400, data: "user", validator: $v(validators.required), ...KeyValueAutocompleteCell,
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
                                    {title: "Permissions", width: 200, data: "permissions", type: "dropdown", source: [READ_ONLY, READ_WRITE], strict: true, validator: $v(validators.required), allowInvalid: false}
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
            teamsValid: true,
            workstreamsValid: true,
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

        if(!this.state.startDate || !moment(this.state.startDate).isValid()) {
            validationState.startDateValid = false;
            validationState.invalid = true;
        }

        if(!this.state.teamsValid) {
            validationState.invalid = true;
        }

        if(!this.state.workstreamsValid) {
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
                startDate: this.state.startDate,
                teams: this.state.teams,
                workstreams: this.state.workstreams,
                ...expandShares(this.state.shares)
            })
        }

    }

}
