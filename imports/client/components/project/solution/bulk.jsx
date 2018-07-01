import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { FormGroup, FormControl, ButtonToolbar, Button, Alert } from 'react-bootstrap';

import Table, { validators, rowValidator as $v, KeyValueAutocompleteCell, getIdValue } from '../../ui/table';
import Projects, { StartType, ActualsStatus, newSolution, ThroughputType, Solution, EstimateType } from '../../../../collections/projects';
import { getPublicSetting } from '../../../../utils';

const DATE_FORMAT = getPublicSetting('dateFormat');

const START_TYPES = [
    {_id: StartType.teamNext, name: "Next (team)", description: "As soon as the team has capacity"},
    {_id: StartType.immediately, name: "Immediately", description: "As soon as the project starts"},
    {_id: StartType.fixedDate, name: "Fixed date", description: "On a fixed date, set two columns over"},
    {_id: StartType.after, name: "After", description: "After another solution is delivered, set in the next column"},
    {_id: StartType.with, name: "With", description: "When work begins on another solution, set in the next column"},
];

const ACTUALS_STATUSES = [
    {_id: ActualsStatus.notStarted, name: "Not started" },
    {_id: ActualsStatus.started, name: "Started" },
    {_id: ActualsStatus.completed, name: "Completed" },
];

const SolutionsTable = ({project, data, ...props}) => (
    <Table
        
        {...props}

        data={data}
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
            actuals: {
                status: null,
                startDate: null,
            toDate: null,
                workItems: null
            }
        }}
        columns={[
            {data: "name", title: "Name", width: 150, validator: $v(validators.required), allowInvalid: true},
            {data: "description", title: "Description", width: 200},
            {data: "teamId", title: "Team", ...KeyValueAutocompleteCell,
                handsontable: {
                    columns: [
                        {title: "Name", width: 300, data: 'name'},
                        {title: "Description", width: 300, data: 'description'},
                    ],
                    getValue: getIdValue
                },
                extractTitle: row => row? row.name : null,
                source: _.concat({_id: null, name: "(No team)", description: "Default team that is used when no specific team is set."}, (project.teams || []))
            },
            {data: "workstreamId", title: "Workstream", ...KeyValueAutocompleteCell,
                handsontable: {
                    columns: [
                        {title: "Name", width: 300, data: 'name'},
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
                source: START_TYPES
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
                            data.map(s => _.pick(s, '_id', 'name', 'description'))
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
            {data: "actuals.status", title: "Progress", ...KeyValueAutocompleteCell,
                handsontable: {
                    columns: [
                        {title: "Name", width: 150, data: 'name'},
                    ],
                    getValue: getIdValue
                },
                extractTitle: row => row? row.name : null,
                source: ACTUALS_STATUSES
            },
            {data: "actuals.startDate", title: "Actual start", type: "date", datePickerConfig: {firstDay: 1}, dateFormat: DATE_FORMAT, correctFormat: true, validator: $v(validators.date), allowInvalid: true},
            {data: "actuals.toDate", title: "Actual to date", type: "date", datePickerConfig: {firstDay: 1}, dateFormat: DATE_FORMAT, correctFormat: true, validator: $v(validators.date), allowInvalid: true},
            {data: "actuals.workItems", title: "Work items completed", type: "numeric", validator: $v(validators.positiveInteger), allowInvalid: true},
        ]}
        />
);

const solutionToRow = (project, solution) => {
    let row = _.cloneDeep(solution);

    if(row.startDate) {
        row.startDate = moment.utc(row.startDate).format(DATE_FORMAT);
    }

    if(!row.team.rampUp) {
        row.team.rampUp = {
            duration: null,
            throughputScalingLowGuess: null,
            throughputScalingHighGuess: null,
        };
    }
    
    if(!row.actuals) {
        row.actuals = {
            status: ActualsStatus.notStarted,
            startDate: null,
            toDate: null,
            workItems: null
        };
    } else {
        if(row.actuals.startDate) {
            row.actuals.startDate = moment.utc(row.actuals.startDate).format(DATE_FORMAT);
        }
    
        if(row.actuals.toDate) {
            row.actuals.toDate = moment.utc(row.actuals.toDate).format(DATE_FORMAT);
        }
    }

    row.__autocomplete__ = {
        teamId: row.teamId? _.find(project.teams, v => v._id === row.teamId) : null,
        workstreamId: row.workstreamId? _.find(project.workstreams, v => v._id === row.workstreamId) : null,
        startType: row.startType? _.find(START_TYPES, v => v._id === row.startType) : null,
        startDependency: row.startDependency? _.find(project.solutions, v => v._id === row.startDependency) : null,
        'actuals.status': row.actuals.status? _.find(ACTUALS_STATUSES, v => v._id === row.actuals.status) : null,
    };

    return row;
};

const rowToSolution = (project, row) => {

    let solution = _.cloneDeep(row);

    if(!_.isUndefined(solution.__autocomplete__)) {
        delete solution.__autocomplete__;
    }
    
    if(solution.startDate && _.isString(solution.startDate)) {
        solution.startDate = moment.utc(solution.startDate, DATE_FORMAT).toDate();
    }

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
    
    if(!solution.actuals.status) {
        solution.actuals.status = ActualsStatus.notStarted;
    }

    if(solution.actuals.startDate && _.isString(solution.actuals.startDate)) {
        solution.actuals.startDate = moment.utc(solution.actuals.startDate, DATE_FORMAT).toDate();
    }

    if(solution.actuals.toDate && _.isString(solution.actuals.toDate)) {
        solution.actuals.toDate = moment.utc(solution.actuals.toDate, DATE_FORMAT).toDate();
    }

    if(solution.teamId) {
        if(!_.find(project.teams, v => v._id === solution.teamId)) {
            const teamByName = _.find(project.teams, v => v.name === solution.teamId);
            if(teamByName) {
                solution.teamId = teamByName._id;
            } else {
                solution.teamId = null;
            }
        }
    }

    if(solution.workstreamId) {
        if(!_.find(project.workstreams, v => v._id === solution.workstreamId)) {
            const workstreamByName = _.find(project.workstreams, v => v.name === solution.workstreamId);
            if(workstreamByName) {
                solution.workstreamId = workstreamByName._id;
            } else {
                solution.workstreamId = null;
            }
        }
    }

    return solution;
};

export class BulkAddSolutions extends Component {

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
                <p>
                    <em>Hint:</em> To paste in multiple rows, first create a
                    series of blank rows by using the <code>Enter</code> key 
                    in the bottom left cell.
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

                        <SolutionsTable
                            project={project}
                            data={this.state.solutions}
                            onChange={data => { this.setState({solutions: data}); }}
                            onValidate={valid => { this.setState({solutionsValid: valid }); }}
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
            let solution = newSolution(rowToSolution(this.props.project, row));

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

export class BulkEditSolutions extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        history: PropTypes.object
    }

    constructor(props) {
        super(props);

        this.state = {
            solutions: props.project.solutions.filter(s => s.estimateType === EstimateType.backlog && s.team.throughputType === ThroughputType.estimate).map(s => solutionToRow(props.project, s)),
            solutionsValid: true,
            invalid: false,
            saved: false,
            error: false,
            validationErrors: null
        };
    }

    render () {

        const { project } = this.props;

        return (
            <div>
                <h1 className="page-header">Bulk edit solutions</h1>
                <p>
                    Use this table to edit solutions in one go.
                    Note that not all solution options are supported! In
                    particular, only backlog/throughput based estimates are
                    supported, and it is not possible to change project risks or
                    team members, nor to re-order or delete solutions. You can
                    of course edit any solution individually for the full range
                    of options.
                </p>

                {this.state.saved? <Alert bsStyle="success">Changes saved.</Alert> : ""}
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

                        <SolutionsTable
                            project={project}
                            data={this.state.solutions}
                            onChange={data => { this.setState({solutions: data, saved: false}); }}
                            onValidate={valid => { this.setState({solutionsValid: valid }); }}
                            minSpareRows={0}
                            tableConfig={{
                                contextMenu: ['undo', 'redo'],
                                autoColumnSize: true,
                                autoWrapRow: true,
                                allowInvalid: false,
                                allowInsertColumn: false,
                                allowRemoveColumn: false,
                                allowInsertRow: false,
                                allowRemoveRow: false,
                                copyPaste: true,
                            }}
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
            saved: false,
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

        let solutions = {}, errors = [];
        for(let row of this.state.solutions) {
            let solution = rowToSolution(this.props.project, row);
            
            try {
                Solution.validate(solution);
                solutions[solution._id] = solution;
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

        // map to something we can $set in MongoDB
        let solutionsByIndex = {};
        for(let i = 0; i < this.props.project.solutions.length; ++i) {
            let editedSolution = solutions[this.props.project.solutions[i]._id];
            if(!_.isUndefined(editedSolution)) {
                solutionsByIndex[`solutions.${i}`] = editedSolution;
            }
        }
    
        try {

            await Projects.update(this.props.project._id, {
                $set: solutionsByIndex
            });

            this.setState({
                saved: true
            });

        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to create solution");
        }
    }

}
