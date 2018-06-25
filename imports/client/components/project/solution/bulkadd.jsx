import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { FormGroup, FormControl, ButtonToolbar, Button, Alert } from 'react-bootstrap';

import Table, { validators, rowValidator as $v, KeyValueAutocompleteCell, getIdValue } from '../../ui/table';
import Projects, { StartType, newSolution, ThroughputType, Solution } from '../../../../collections/projects';
import { getPublicSetting } from '../../../../utils';

const DATE_FORMAT = getPublicSetting('dateFormat');

export default class BulkAddSolution extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        history: PropTypes.object
    }

    constructor(props) {
        super(props);

        this.state = {
            solutions: [],
            solutionsValid: true,
            invalid: false,
            error: false,
            validationErrors: null
        };
    }

    render () {

        const { project } = this.props;

        return (
            <div>
                <h1 className="page-header">Bulk add solutions</h1>
                <p>
                    Use this table to create multiple solutions in one go.
                    Note that not all solution options are supported! In
                    particular, only backlog/throughput based estimates are
                    supported, and it is not possible to set project risks or
                    team members. You can of course edit any solution after it
                    has been created to make further changes.
                </p>

                {this.state.invalid? <Alert bsStyle="danger">
                    Please correct the indicated errors.
                    {this.state.validationErrors &&
                        <ul>
                            {this.state.validationErrors.map(m => <li key={m._id}>{m.name}: {m.message}</li>)}
                        </ul>
                    }
                </Alert> : ""}
                {this.state.error? <Alert bsStyle="danger">An unexpected error occurred. Please try again.</Alert> : ""}

                <form onSubmit={this.onSubmit.bind(this)}>

                    <FormGroup controlId="solutions">
                        <Table
                            data={this.state.solutions}
                            onChange={data => { this.setState({solutions: data}); }}
                            onValidate={valid => { this.setState({solutionsValid: valid }); }}
                            dataSchema={{
                                name: null,
                                description: null,
                                teamId: null,
                                workstreamId: null,
                                throughputPeriodLength: null,
                                startType: null,
                                startDate: null,
                                startDependency: null,
                                backlog: {
                                    lowGuess: null,
                                    highGuess: null,
                                    lowSplitRate: null,
                                    highSplitRate: null,
                                },
                                team: {
                                    members: [],
                                    throughputType: ThroughputType.estimate,
                                    throughputSamples: [],
                                    throughputEstimate: {
                                        lowGuess: null,
                                        highGuess: null,
                                    },
                                    rampUp: {
                                        duration: null,
                                        throughputScalingLowGuess: null,
                                        throughputScalingHighGuess: null,
                                    },
                                    workPattern: []
                                },
                            }}
                            columns={[
                                {data: "name", title: "Name", width: 150, validator: $v(validators.required), allowInvalid: true},
                                {data: "description", title: "Description", width: 200},
                                {data: "teamId", title: "Team", ...KeyValueAutocompleteCell,
                                    handsontable: {
                                        columns: [
                                            {title: "Name", width: 150, data: 'name'},
                                            {title: "Description", width: 400, data: 'description'},
                                        ],
                                        getValue: getIdValue
                                    },
                                    extractTitle: row => row? row.name : null,
                                    source: _.concat({_id: null, name: "(No team)", description: "Default team that is used when no specific team is set."}, (project.teams || []))
                                },
                                {data: "workstreamId", title: "Workstream", ...KeyValueAutocompleteCell,
                                    handsontable: {
                                        columns: [
                                            {title: "Name", width: 150, data: 'name'},
                                            {title: "Description", width: 400, data: 'description'},
                                        ],
                                        getValue: getIdValue
                                    },
                                    extractTitle: row => row? row.name : null,
                                    source: _.concat({_id: null, name: "(No workstream)", description: "Default team that is used when no specific workstream is set."}, (project.workstreams || []))
                                },
                                {data: "throughputPeriodLength", title: "Period length (weeks)", type: "numeric", validator: $v(validators.requiredPositiveInteger), allowInvalid: true},
                                {data: "startType", title: "Start type", validator: $v(validators.required), ...KeyValueAutocompleteCell,
                                    handsontable: {
                                        columns: [
                                            {title: "Start type", width: 100, data: 'name'},
                                            {title: "Description", width: 400, data: 'description'},
                                        ],
                                        getValue: getIdValue
                                    },
                                    extractTitle: row => row? row.name : null,
                                    source: [
                                        {_id: StartType.teamNext, name: "Next (team)", description: "As soon as the team has capacity"},
                                        {_id: StartType.immediately, name: "Immediately", description: "As soon as the project starts"},
                                        {_id: StartType.fixedDate, name: "Fixed date", description: "On a fixed date, set two columns over"},
                                        {_id: StartType.after, name: "After", description: "After another solution is delivered, set in the next column"},
                                        {_id: StartType.with, name: "With", description: "When work begins on another solution, set in the next column"},
                                    ]
                                },
                                {data: "startDependency", title: "Start with/after", ...KeyValueAutocompleteCell,
                                    handsontable: {
                                        columns: [
                                            {title: "Name", width: 100, data: 'name'},
                                            {title: "Description", width: 400, data: 'description'},
                                        ],
                                        getValue: getIdValue
                                    },
                                    extractTitle: row => row? row.name : null,
                                    source: (query, process) => {
                                        process(
                                            _.concat(
                                                project.solutions.map(s => _.pick(s, '_id', 'name', 'description')),
                                                this.state.solutions.map(s => _.pick(s, '_id', 'name', 'description'))
                                            )
                                        )
                                    }
                                },
                                {data: "startDate", title: "Start date", type: "date", datePickerConfig: {firstDay: 1}, dateFormat: DATE_FORMAT, correctFormat: true, validator: $v(validators.date), allowInvalid: true},
                                {data: "backlog.lowGuess", title: "Backlog (low)", type: "numeric", validator: $v(validators.requiredPositiveInteger), allowInvalid: true},
                                {data: "backlog.highGuess", title: "Backlog (high)", type: "numeric", validator: $v(validators.requiredPositiveInteger), allowInvalid: true},
                                {data: "backlog.lowSplitRate", title: "Split rate (low)", type: "numeric",  format: '0,0.00', validator: $v(validators.positiveNumber), allowInvalid: true},
                                {data: "backlog.highSplitRate", title: "Split rate (high)", type: "numeric",  format: '0,0.00', validator: $v(validators.positiveNumber), allowInvalid: true},
                                {data: "team.throughputEstimate.lowGuess", title: "Throughput (low)", type: "numeric", validator: $v(validators.requiredPositiveInteger), allowInvalid: true},
                                {data: "team.throughputEstimate.highGuess", title: "Throughput (high)", type: "numeric", validator: $v(validators.requiredPositiveInteger), allowInvalid: true},
                                {data: "team.rampUp.duration", title: "Ramp up (weeks)", type: "numeric", validator: $v(validators.positiveInteger), allowInvalid: true},
                                {data: "team.rampUp.throughputScalingLowGuess", title: "Scaling (low)", type: "numeric", format: '0,0.00', validator: $v(validators.positiveNumber), allowInvalid: true},
                                {data: "team.rampUp.throughputScalingHighGuess", title: "Scaling (high)", type: "numeric", format: '0,0.00', validator: $v(validators.positiveNumber), allowInvalid: true},
                            ]}
                            />

                        <FormControl.Feedback />

                    </FormGroup>

                    <hr />

                    <ButtonToolbar>
                        <Button type="submit" bsStyle="primary" onClick={this.onSubmit.bind(this)}>Save</Button>
                        <Button bsStyle="default" onClick={this.onCancel.bind(this)}>Cancel</Button>
                    </ButtonToolbar>

                </form>

            </div>
        );
    }

    onCancel(e) {
        e.preventDefault();
        this.props.history.push('/project/' + this.props.project._id);
    }

    async onSubmit(e) {
        e.preventDefault();

        let validationState = {
            invalid: false,
            error: false,
            validationErrors: null
        };

        if(!this.state.solutionsValid) {
            validationState.invalid = true;
        }

        this.setState(validationState);
        if(validationState.invalid) {
            return;
        }

        let solutions = [], errors = [];
        for(let row of this.state.solutions) {
            let solution = _.cloneDeep(row);

            if(!solution.backlog.lowSplitRate && !solution.backlog.highSplitRate) {
                solution.backlog.lowSplitRate = 1;
                solution.backlog.highSplitRate = 1;
            }

            if(
                !solution.team.rampUp.duration &&
                !solution.team.rampUp.throughputScalingLowGuess &&
                !solution.team.rampUp.throughputScalingHighGuess
            ) {
                solution.team.rampUp = null;
            }
            
            solution = newSolution(solution);

            try {
                Solution.validate(solution);
                solutions.push(solution);
            } catch(e) {
                errors.push({
                    _id: row._id,
                    name: row.name,
                    message: e.message
                });
            }
        }

        if(errors.length > 0) {
            validationState.invalid = true;
            validationState.validationErrors = errors
            this.setState(validationState);
            return;
        }

        try {

            await Projects.update(this.props.project._id, {
                $push: {
                    solutions: {
                        $each: solutions
                    }
                }
            });

            this.props.history.push(`/project/${this.props.project._id}`);
        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to create solution");
        }
    }

}
