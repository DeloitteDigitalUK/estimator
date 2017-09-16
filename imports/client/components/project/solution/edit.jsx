import _ from 'lodash';
import moment from 'moment';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { ButtonToolbar, Button, Row, Col, Alert, PanelGroup, Panel } from 'react-bootstrap';
import DatePicker from 'react-bootstrap-date-picker';
import { FormField } from '../../../forms';

import Projects, { Solution, EstimateType, StartType, ThroughputType } from '../../../../collections/projects';

import { getPublicSetting, ISO } from '../../../../utils';
const DATE_FORMAT = getPublicSetting('dateFormat');

export default class EditSolution extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired,
        solution: PropTypes.object.isRequired,

        history: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        const validationContext = Solution.newContext();
        validationContext.validate(props.solution);

        this.state = {
            solution: _.cloneDeep(props.solution),
            validationContext: validationContext,
            invalid: false,
            error: false
        };
    }

    render() {

        const saveValue = (key, modifier) => {
            return e => {
                const value = modifier? modifier(e) : e.target.value;
                this.setState((prevState, props) => {
                    const solution = _.set(_.cloneDeep(prevState.solution), key, value),
                          validationContext = Solution.newContext();
                    validationContext.validate(solution);
                    return { solution, validationContext };
                });
            }
        };

        const { project } = this.props,
              { solution, validationContext } = this.state;

        return (
            <div className="edit-solution">

                <h1 className="page-header">Edit solution</h1>
                <p>
                    A solution is a thing that has to be built or done to deliver the project.
                    All estimation is based on the solution parameters set up here. You can choose
                    to estimate a solution based on a team working through a backlog, or a fixed
                    working pattern. You can also describe the team that will deliver the solution
                    to enable resource forecasting.
                </p>

                <form onSubmit={this.onSubmit.bind(this)}>
                    <Row>
                        <Col xs={12} sm={10} md={8}>
                            {this.state.invalid? <Alert bsStyle="danger">Please correct the indicated errors</Alert> : ""}
                            {this.state.error? <Alert bsStyle="danger">An unexpected error occurred. Please try again.</Alert> : ""}

                            <PanelGroup defaultActiveKey="basicDetails">
                                <Panel collapsible defaultExpanded header="Solution details" eventKey="basicDetails">
            
                                    <FormField
                                        object={solution}
                                        validationContext={validationContext}
                                        field='name'
                                        title="Name"
                                        placeholder="Short solution name"
                                        onChange={saveValue('name')}
                                        />
                                    
                                    <FormField
                                        object={solution}
                                        validationContext={validationContext}
                                        componentClass="textarea"
                                        field='description'
                                        title="Description"
                                        placeholder="A long description for this solution"
                                        onChange={saveValue('description')}
                                        />
                                    
                                    <FormField
                                        object={solution}
                                        validationContext={validationContext}
                                        control={
                                            <textarea
                                                className="form-control"
                                                rows={10}
                                                placeholder="Any additional notes you want to capture with this solution"
                                                value={_.get(solution, 'notes') || ""}
                                                onChange={saveValue('notes')}
                                                />
                                        }
                                        field='notes'
                                        title="Notes"
                                        />
                                    
                                    <FormField
                                        object={solution}
                                        validationContext={validationContext}
                                        componentClass="select"
                                        field='estimateType'
                                        title="Estimate type"
                                        placeholder="The type of estimate to provide"
                                        onChange={saveValue('estimateType')}>
                                        <option value={EstimateType.backlog}>Working through a backlog</option>
                                        <option value={EstimateType.workPattern}>Fixed working pattern</option>
                                    </FormField>

                                    <FormField
                                        object={solution}
                                        validationContext={validationContext}
                                        componentClass="select"
                                        field='startType'
                                        title="Work starts"
                                        placeholder="Choose how work on this solution will be scheduled"
                                        onChange={saveValue('startType')}>
                                        <option value={StartType.immediately}>As soon as the project starts</option>
                                        <option value={StartType.fixedDate}>On a fixed date</option>
                                        <option value={StartType.after}>After another solution is delivered</option>
                                        <option value={StartType.with}>When work starts on another solution</option>
                                    </FormField>

                                    {solution.startType !== StartType.fixedDate? null :
                                        <FormField
                                            object={solution}
                                            validationContext={validationContext}
                                            className="date-input"
                                            control={
                                                <DatePicker
                                                    weekStartsOn={1}
                                                    showClearButton={false}
                                                    value={solution.startDate? moment(solution.startDate).format(ISO) : null}
                                                    onChange={saveValue('startDate', v => moment.utc(v, ISO).toDate())}
                                                    dateFormat={DATE_FORMAT}
                                                    />
                                            }
                                            field='startDate'
                                            title="Start date"
                                            />
                                    }

                                    {solution.startType !== StartType.after && solution.startType !== StartType.with? null :
                                        <FormField
                                            object={solution}
                                            validationContext={validationContext}
                                            componentClass="select"
                                            field='startDependency'
                                            title="Dependent solution"
                                            placeholder="Choose another solution that determines when work starts on this one"
                                            onChange={saveValue('startDependency')}>
                                            <option value="">(none selected)</option>
                                            {project.solutions.map(s => (
                                                s._id === solution._id? null : <option key={s._id} value={s._id} title={s.description}>{s.name}</option>
                                            ))}
                                        </FormField>
                                    }
                                </Panel>

                                {solution.estimateType !== EstimateType.backlog? null :
                                    <Panel collapsible header="Backlog parameters" eventKey="backlogParameters">
                                        TODO: low guess
                                        TODO: high guess

                                        TODO: low split rate
                                        TODO: high split rate

                                        TODO: risks table (name, description, likelihood, low impact, high impact) 
                                    </Panel>
                                }

                                <Panel collapsible header="Team structure" eventKey="teamStructure">
                                    TODO: team
                                    TODO: members table (role, description, quantity)
                                    TODO: throughput period length
                                    TODO: throughput type (sample, estimate)
                                </Panel>

                                <Panel collapsible header="Throughput parameters" eventKey="throughputParameters">
                                    {solution.team.throughputType !== ThroughputType.samples? null :
                                        "TODO: sample table (period start date, description, throughput)"
                                    }
                                    {solution.team.throughputType !== ThroughputType.estimate? null :
                                        "TODO: throughput estimate (low guess, high guess)"
                                    }
                                </Panel>

                                <Panel collapsible header="Ramp-up" eventKey="rampUp">
                                    TODO: ramp up duration
                                    TODO: ramp up scaling low guess
                                    TODO: ramp up scaling high guess
                                </Panel>
                                
                                {solution.estimateType !== EstimateType.workPattern? null :
                                    <Panel collapsible header="Work pattern" eventKey="workPattern">
                                        TODO: work pattern table (start date, end date)
                                    </Panel>
                                }
                            </PanelGroup>

                            <ButtonToolbar>
                                <Button type="submit" bsStyle="primary" onClick={this.onSubmit.bind(this)}>Save</Button>
                                <Button bsStyle="default" onClick={this.onCancel.bind(this)}>Cancel</Button>
                            </ButtonToolbar>
                        </Col>
                    </Row>
                </form>
            </div>
        );

    }

    async onSubmit(e) {
        e.preventDefault();

        this.setState((prevState, props) => ({
            invalid: !prevState.validationContext.isValid()
        }));

        if(!this.state.validationContext.isValid()) {
            return;
        }

        const idx = _.findIndex(this.props.project.solutions, {_id: this.props.solution._id});
        if(idx < 0) {
            alert("Solution has disappeared from parent project");
            return;
        }

        try {
            await Projects.update(this.props.project._id, {
                $set: {
                    [`solutions.${idx}`]: this.state.solution
                }
            });
            
            this.props.history.push(`/project/${this.props.project._id}/solution/${this.props.solution._id}`);
        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to save solution ");
        }

    }

    onCancel(e) {
        e.preventDefault();
        this.props.history.push(`/project/${this.props.project._id}/solution/${this.props.solution._id}`);
    }

}