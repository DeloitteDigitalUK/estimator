import _ from 'lodash';
import moment from 'moment';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { ButtonToolbar, Button, Row, Col, Alert, PanelGroup, Panel, HelpBlock } from 'react-bootstrap';
import DatePicker from 'react-bootstrap-date-picker';

import { FormField, TableField } from '../../ui/forms';
import { validators, rowValidator as $v } from '../../ui/table';

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
                    All estimation is based on the solution parameters set up here.
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
                                    
                                    <HelpBlock>
                                        We can either estimate how long it will take to deliver a particular
                                        solution by estimating the size of a backlog of work and the pace
                                        (throughput) with which a team works through that backlog, or we can
                                        provide a fixed working pattern based on specific dates. When estimating
                                        based on throughput, we also need to decide the denominator of any throughput
                                        value, usually work items per 1 or 2 weeks.
                                    </HelpBlock>
                                    
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

                                    {solution.estimateType !== EstimateType.backlog? null :
                                        <FormField
                                            object={solution}
                                            validationContext={validationContext}
                                            field='throughputPeriodLength'
                                            title="Throughput period length (weeks)"
                                            placeholder="1"
                                            onChange={saveValue('throughputPeriodLength', e => parseInt(e.target.value, 10))}
                                            />
                                    }

                                    <HelpBlock>
                                        The estimated time to deliver each solution will be shown as lines on a
                                        plan. To be able to do this, we need to decide how and when work starts:
                                        right at the beginning of the project; on a particular date; after another
                                        solution has been delivered; or when work on another solution begins.
                                    </HelpBlock>

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
                                        <option value={StartType.with}>When work begins on another solution</option>
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
                                            {project.solutions.map(s => (
                                                s._id === solution._id? null : <option key={s._id} value={s._id} title={s.description}>{s.name}</option>
                                            ))}
                                        </FormField>
                                    }

                                </Panel>

                                {solution.estimateType !== EstimateType.backlog? null :
                                    <Panel collapsible header="Backlog parameters" eventKey="backlogParameters">

                                        <HelpBlock>
                                            When estimating based on a backlog, we simulate a team delivering
                                            the work items in that backlog over a period of a time. It is difficult
                                            to be 100% confident of the scope of any non-trivial solution up front,
                                            so we provide a range, from a low guess to a high guess, of the size of the
                                            backlog. The wider the range, the less certain we are.
                                        </HelpBlock>

                                        <Row>
                                            <Col md={6}>
                                                <FormField
                                                    object={solution}
                                                    validationContext={validationContext}
                                                    field='backlog.lowGuess'
                                                    title="Low backlog size guess"
                                                    placeholder="50"
                                                    onChange={saveValue('backlog.lowGuess', e => parseInt(e.target.value, 10))}
                                                    />
                                            </Col>
                                            <Col md={6}>
                                                <FormField
                                                    object={solution}
                                                    validationContext={validationContext}
                                                    field='backlog.highGuess'
                                                    title="High backlog size guess"
                                                    placeholder="100"
                                                    onChange={saveValue('backlog.highGuess', e => parseInt(e.target.value, 10))}
                                                    />
                                            </Col>
                                        </Row>

                                        <HelpBlock>
                                            It is not uncommon that we will discover new scope when we begin to
                                            work through the backlog. We can think of this work items being split,
                                            with larger-than-expected work items being split into multiple smaller ones.
                                            We can simulate this by estimating a "split factor": how many new work items
                                            are created for each work item in the original backlog.
                                        </HelpBlock>
                                        
                                        <Row>
                                            <Col md={6}>
                                                <FormField
                                                    object={solution}
                                                    validationContext={validationContext}
                                                    field='backlog.lowSplitRate'
                                                    title="Low split rate guess"
                                                    placeholder="1.1"
                                                    onChange={saveValue('backlog.lowSplitRate', e => parseInt(e.target.value, 10))}
                                                    />
                                            </Col>
                                            <Col md={6}>
                                                <FormField
                                                    object={solution}
                                                    validationContext={validationContext}
                                                    field='backlog.highSplitRate'
                                                    title="High split rate guess"
                                                    placeholder="1.3"
                                                    onChange={saveValue('backlog.highSplitRate', e => parseInt(e.target.value, 10))}
                                                    />
                                            </Col>
                                        </Row>

                                        <TableField
                                            object={solution}
                                            validationContext={validationContext}
                                            field='backlog.risks'
                                            title="Risks that could lead to more scope"
                                            idProp={null}
                                            data={solution.backlog.risks || []}
                                            onChange={saveValue('backlog.risks', e => e)}
                                            showCellErrors={this.state.invalid}
                                            dataSchema={{
                                                name: null,
                                                description: null,
                                                likelihood: null,
                                                lowImpact: null,
                                                highImpact: null
                                            }}
                                            columns={[
                                                {data: "name", title: "Name", width: 150, validator: $v(validators.required), allowInvalid: true},
                                                {data: "description", title: "Description", width: 300},
                                                {data: "likelihood", title: "Likelihood", width: 85, type: "numeric", format: '0.0%', validator: $v(validators.requiredPercentage), allowInvalid: true},
                                                {data: "lowImpact", title: "Low impact", width: 85, type: "numeric", validator: $v(validators.requiredNumber), allowInvalid: true},
                                                {data: "highImpact", title: "High impact", width: 85, type: "numeric", validator: $v(validators.requiredNumber), allowInvalid: true},
                                            ]}
                                            />

                                    </Panel>
                                }

                                <Panel collapsible header="Team structure" eventKey="teamStructure">
 
                                    TODO: members table (role, description, quantity)
                                </Panel>

                                {solution.estimateType !== EstimateType.backlog? null :
                                    <Panel collapsible header="Throughput parameters" eventKey="throughputParameters">

                                        <HelpBlock>
                                            To estimate the team's throughput, we can we either use historical samples,
                                            or simply estimate a range. Both deal in the number of items completed
                                            per {solution.throughputPeriodLength} week(s). Estimates based on samples
                                            are usually better, so long as we have a reasonable number of samples
                                            (11-15 is a good rule of thumb) and we have reason to believe they are
                                            representative of the work we are estimating.
                                        </HelpBlock>


                                        <FormField
                                            object={solution}
                                            validationContext={validationContext}
                                            componentClass="select"
                                            field='team.throughputType'
                                            title="Throughput estimate type"
                                            placeholder="Choose how team throughput will be estimated"
                                            onChange={saveValue('team.throughputType')}>
                                            <option value={ThroughputType.none}>(not selected)</option>
                                            <option value={ThroughputType.samples}>Based on historical data</option>
                                            <option value={ThroughputType.estimate}>Based on an estimated range</option>
                                        </FormField>

                                        {solution.team.throughputType !== ThroughputType.samples? null :
                                            "TODO: sample table (period start date, description, throughput)"
                                        }
                                        {solution.team.throughputType !== ThroughputType.estimate? null :
                                            <Row>
                                                <Col md={6}>
                                                    <FormField
                                                        object={solution}
                                                        validationContext={validationContext}
                                                        field='team.throughputEstimate.lowGuess'
                                                        title={`Low throughput guess (items/${solution.throughputPeriodLength} weeks)`}
                                                        placeholder="5"
                                                        onChange={saveValue('team.throughputEstimate.lowGuess', e => parseFloat(e.target.value, 10))}
                                                        />
                                                </Col>
                                                <Col md={6}>
                                                    <FormField
                                                        object={solution}
                                                        validationContext={validationContext}
                                                        field='team.throughputEstimate.highGuess'
                                                        title={`High guess (items/${solution.throughputPeriodLength} weeks)`}
                                                        placeholder="8"
                                                        onChange={saveValue('team.throughputEstimate.highGuess', e => parseFloat(e.target.value, 10))}
                                                        />
                                                </Col>
                                            </Row>
                                        }
                                    </Panel>
                                }
                                {solution.estimateType !== EstimateType.backlog? null :
                                    <Panel collapsible header="Ramp-up" eventKey="rampUp">
                                        
                                        <HelpBlock>
                                            The team will typically not hit full productivity from day one. A
                                            long period of ramping up is common - often as much as 20% of the total
                                            delivery time! We can simulate this by indicating a ramp up length in weeks,
                                            and using low and high guesses of the scaling factor that should be applied
                                            to the team's throughput. This should be a number between 0 and 1.
                                        </HelpBlock>

                                        <FormField
                                            object={solution}
                                            validationContext={validationContext}
                                            field='team.rampUp.duration'
                                            title="Ramp up period (weeks)"
                                            placeholder="8"
                                            onChange={saveValue('team.rampUp.duration', e => parseInt(e.target.value, 10))}
                                            />
                                        
                                        <Row>
                                            <Col md={6}>
                                                <FormField
                                                    object={solution}
                                                    validationContext={validationContext}
                                                    field='team.rampUp.throughputScalingLowGuess'
                                                    title="Low scaling factor guess"
                                                    placeholder="0.2"
                                                    onChange={saveValue('team.rampUp.throughputScalingLowGuess', e => parseInt(e.target.value, 10))}
                                                    />
                                            </Col>
                                            <Col md={6}>
                                                <FormField
                                                    object={solution}
                                                    validationContext={validationContext}
                                                    field='team.rampUp.throughputScalingHighGuess'
                                                    title="High scaling factor guess"
                                                    placeholder="0.4"
                                                    onChange={saveValue('team.rampUp.throughputScalingHighGuess', e => parseInt(e.target.value, 10))}
                                                    />
                                            </Col>
                                        </Row>
                                    </Panel>
                                }
                                
                                {solution.estimateType !== EstimateType.workPattern? null :
                                    <Panel collapsible header="Work pattern" eventKey="workPattern">
                                        TODO: work pattern table (start date, end date)
                                    </Panel>
                                }

                                <Panel collapsible header="Notes" eventKey="notes">

                                    <HelpBlock>
                                        Use this field to capture assumptions, questions and any
                                        other notes that will be helpful in interpreting the results
                                        of the estimate in future.
                                    </HelpBlock>
            
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

                                </Panel>


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