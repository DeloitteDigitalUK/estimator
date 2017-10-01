import _ from 'lodash';

import React from 'react';
import moment from 'moment';

import { PanelGroup, Panel, Table, HelpBlock } from 'react-bootstrap';

import { EstimateType, StartType, ThroughputType } from '../../../../collections/projects';
import { getPublicSetting } from '../../../../utils';

import SolutionForecast from './forecast';

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
            <PanelGroup>
                <Panel collapsible defaultExpanded header="Parameters" eventKey="simulationParameters">

                    {solution.estimateType === EstimateType.backlog && (
                    <div>
                        <p>
                            &raquo; This solution is expected to require delivering a backlog of work consisting of:
                        </p>
                        <ul>
                            <li>between <strong>{solution.backlog.lowGuess} and {solution.backlog.highGuess}</strong> work items</li>
                            {(solution.backlog.lowSplitRate && solution.backlog.highSplitRate && solution.backlog.highSplitRate > 1) && (
                            <li>of which we expect that <strong>every {solution.backlog.lowSplitRate} to {solution.backlog.highSplitRate}</strong> work items will be further split</li>
                            )}
                            <li>with throughput measured to a cadence of <strong>{weeks(solution.throughputPeriodLength)}</strong></li>
                            <li>starting <strong>{
                                solution.startType === StartType.immediately? "immediately" :
                                solution.startType === StartType.fixedDate? `on ${moment(solution.startDate).format(DATE_FORMAT)}` :
                                solution.startType === StartType.after? `after "${startDependency}"` :
                                solution.startType === StartType.with? `at the same time as "${startDependency}"` : "ERROR"
                            }</strong>.</li>
                        </ul>
                    </div>
                    )}

                    {(solution.estimateType === EstimateType.backlog && !_.isEmpty(solution.backlog.risks)) && (
                    <div>
                        <p>
                            &raquo; The identified <strong>risks</strong> that could further increase the size of the backlog are:
                        </p>
                        <Table condensed hover>
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
                        </Table>
                    </div>
                    )}

                    {!_.isEmpty(solution.team.members) && (
                    <div>
                        <p>
                            &raquo; The <strong>team</strong> working on this solution consists of the following roles:
                        </p>
                        <Table condensed hover>
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
                        </Table>
                    </div>
                    )}

                    {solution.estimateType === EstimateType.workPattern && (
                    <div>
                        <p>
                            &raquo; The team working on the solution will be required during these times:
                        </p>
                        <Table condensed hover>
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
                        </Table>
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
                        <Table condensed hover>
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
                        </Table>
                    </div>
                    )}

                    {(solution.estimateType === EstimateType.backlog && !_.isEmpty(solution.team.rampUp)) && (
                    <p>
                        &raquo; The team is expected to <strong>ramp up</strong> over <strong>{weeks(solution.team.rampUp.duration)}</strong>, when throughput is expected to
                        be <strong>{Math.round(solution.team.rampUp.throughputScalingLowGuess * 100)}-{Math.round(solution.team.rampUp.throughputScalingHighGuess * 100)}%</strong> of this.
                    </p>
                    )}

                </Panel>
                
                {solution.estimateType === EstimateType.backlog && (
                <Panel collapsible defaultExpanded header="Simulation results" eventKey="simulationResults">

                    <HelpBlock>
                        <p>
                            Based on the parameters above, we can forecast the number of weeks required to
                            deliver this solution. The various parameters all have a degree of uncertainty,
                            expressed as high and low guesses or based on a set of samples &mdash; we cannot
                            ever be completely sure about the future!
                        </p>
                        <p>
                            We use Monte Carlo simulations to create a forecast that takes this uncertainty
                            into account. In essence, we let the delivery play out many times over, each time
                            picking a random sample or value within the given range for each parameter. We can
                            then analyse the probability of a given outcome (e.g., "delivery completed in no
                            more than 10 weeks"), based on the proportion of simulations that resulted in that
                            outcome.
                        </p>
                        <p>
                            The results of the simulation are shown as a histogram and a table of the outcomes
                            at different confidence percentiles. For example, if the 85th percentile value is
                            shown as &le; 10 weeks, that means that in 85% of simulations, delivery was completed
                            in 10 weeks or fewer. The histogram shows how widely spread the simulated outcomes
                            are: the wider the distribution, the more uncertainty. When adopting a forecast, we
                            thus need to apply some judgement in choosing which simulated outcome to use. The
                            higher the percentile, the more conservative the estimate. A value between 85% and
                            95% is often a good place to start, but there is no universally correct answer.
                        </p>
                    </HelpBlock>

                    <SolutionForecast solution={solution} />
                </Panel>
                )}

            </PanelGroup>
            
        </div>
    );
}

export default ViewSolution;
