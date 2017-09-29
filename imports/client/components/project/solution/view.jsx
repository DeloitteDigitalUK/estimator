import _ from 'lodash';

import React from 'react';
import moment from 'moment';

import { Panel } from 'react-bootstrap';

import { EstimateType, StartType, ThroughputType } from '../../../../collections/projects';
import { getPublicSetting } from '../../../../utils';

// import { VictoryChart, VictoryAxis, VictoryBar, VictoryTheme } from 'victory';

const DATE_FORMAT = getPublicSetting('dateFormat');

const ViewSolution = ({ project, solution }) => {

    const solutionLookup = project.solutions.reduce((m, s) => ({...m, [s._id]: s}), {}),
          startDependency = solution.startDependency && solutionLookup[solution.startDependency]? solutionLookup[solution.startDependency].name : "(deleted)";

    const weeks = n => `${n} week${n > 1? "s" : ""}`;

    return (
        <div className="view-solution">

            <h1>{solution.name}</h1>
            <p className="description">
                {solution.description}
            </p>


            <Panel>

                {solution.estimateType === EstimateType.backlog && (
                <p>
                    &raquo; This solution is expected to require delivering a backlog of work consisting of:
                    <ul>
                        <li>between <strong>{solution.backlog.lowGuess} and {solution.backlog.highGuess}</strong> work items</li>
                        {(solution.backlog.lowSplitRate && solution.backlog.highSplitRate && solution.backlog.highSplitRate > 1) && (
                        <li>of which we expect that <strong>every {solution.backlog.lowSplitRate} to {solution.backlog.highSplitRate}</strong> work items will be further split</li>
                        )}
                        <li>with throughput measured to a cadence of <strong>{weeks(solution.throughputPeriodLength)}</strong></li>
                        <li>starting <strong>{
                            solution.startType === StartType.immediately? "immedulatey" :
                            solution.startType === StartType.fixedDate? `on ${moment(solution.startDate).format(DATE_FORMAT)}` :
                            solution.startType === StartType.after? `after "${startDependency}"` :
                            solution.startType === StartType.with? `with "${startDependency}"` : "ERROR"
                        }</strong>.</li>
                    </ul>
                </p>
                )}

                {(solution.estimateType === EstimateType.backlog && !_.isEmpty(solution.backlog.risks)) && (
                <div>
                    <p>
                        &raquo; The <strong>risks</strong> that could further increase the size of the backlog are:
                    </p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th><th>Description</th><th>Likelihood</th><th>Impact - low guess</th><th>Impact - high guess</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solution.backlog.risks.map((risk, idx) => (
                            <tr key={idx}>
                                <td>{risk.name}</td><td>{risk.description}</td><td>{Math.round(risk.likelihood * 100)}%</td><td>{risk.lowImpact}</td><td>{risk.highImpact}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}

                {!_.isEmpty(solution.team.members) && (
                <div>
                    <p>
                        &raquo; The <strong>team</strong> working on this consists of the following roles:
                    </p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Role</th><th>Description</th><th>Full-time equivalents</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solution.team.members.map((member, idx) => (
                            <tr key={idx}>
                                <td>{member.role}</td><td>{member.description}</td><td>{member.quantity}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}

                {solution.estimateType === EstimateType.workPattern && (
                <div>
                    <p>
                        &raquo; The team working on the solutio will be required during these times:
                    </p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>From</th><th>To</th><th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solution.team.workPattern.map((period, idx) => (
                            <tr key={idx}>
                                <td>{moment(period.startDate).format(DATE_FORMAT)}</td><td>{moment(period.endDate).format(DATE_FORMAT)}</td><td>{period.description}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}

                {(solution.estimateType === EstimateType.backlog && solution.team.throughputType === ThroughputType.estimate) && (
                <p>
                    &raquo; The team's throughput is based on a <strong>guess</strong> (for lack of reliable historical data) of
                    between <strong>{solution.team.throughputEstimate.lowGuess} and {solution.team.throughputEstimate.highGuess}</strong> work items completed per {weeks(solution.throughputPeriodLength)}.
                </p>
                )}

                {(solution.estimateType === EstimateType.backlog && solution.team.throughputType === ThroughputType.samples) && (
                <div>
                    <p>
                        The team's throughput is based on <strong>previous samples</strong>:
                    </p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Period starting</th><th>Description</th><th>Work items completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solution.team.throughputSamples.map((sample, idx) => (
                            <tr key={idx}>
                                <td>{moment(sample.periodStartDate).format(DATE_FORMAT)}</td><td>{sample.description}</td><td>{sample.throughput}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}

                {(solution.estimateType === EstimateType.backlog && !_.isEmpty(solution.team.rampUp)) && (
                <p>
                    &raquo; The team is expected to <strong>ramp up</strong> over <strong>{weeks(solution.team.rampUp.duration)}</strong>, when throughput is expected to
                    be <strong>{Math.round(solution.team.rampUp.throughputScalingLowGuess * 100)}-{Math.round(solution.team.rampUp.throughputScalingHighGuess * 100)}%</strong> of this.
                </p>
                )}

            </Panel>
            
        </div>
    );
}

export default ViewSolution;
