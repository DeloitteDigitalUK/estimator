import _ from 'lodash';

import React from 'react';
import moment from 'moment';

import { PanelGroup, Panel, Table, HelpBlock, Label, OverlayTrigger, Tooltip } from 'react-bootstrap';

import { EstimateType, StartType, ThroughputType, ActualsStatus } from '../../../../collections/projects';
import { checkSampleCount, checkSampleAge, checkSampleStability, checkBacklogGuess } from '../../../../simulation/check';
import { getPublicSetting } from '../../../../utils';

import SolutionForecast from './forecast';
import SolutionBurnup from './burnup';

const DATE_FORMAT = getPublicSetting('dateFormat'),
      MIN_SAMPLES = getPublicSetting('minSamples'),
      MAX_SAMPLES = getPublicSetting('maxSamples'),
      SAMPLE_AGE_THRESHOLD = getPublicSetting('sampleAgeThreshold'),
      SAMPLE_STABILITY_THRESHOLD = getPublicSetting('sampleStabilityThreshold'),
      BACKLOG_GUESS_SPREAD_THRESHOLD = getPublicSetting('backlogGuessSpreadThreshold'),
      SPLIT_RATE_GUESS_SPREAD_THRESHOLD = getPublicSetting('splitRateGuessSpreadThreshold'),
      THROUGHPUT_SCALING_RATE_SPREAD_THRESHOLD = getPublicSetting('throughputScalingRateSpreadThreshold');

const ViewSolution = ({ project, solution }) => {

    const solutionLookup = project.solutions.reduce((m, s) => ({...m, [s._id]: s}), {}),
          startDependency = solution.startDependency && solutionLookup[solution.startDependency]? solutionLookup[solution.startDependency].name : "(deleted)",
          team = _.find(project.teams || [], t => t._id === solution.teamId),
          workstream = _.find(project.workstreams || [], t => t._id === solution.workstreamId);

    const weeks = n => `${n} week${n > 1? "s" : ""}`;

    return (
        <div className="view-solution">
            
            <h1>{solution.name}</h1>
            
            <p className="description">
                {solution.description}
            </p>
            <PanelGroup>
                <Panel collapsible defaultExpanded header="Parameters" eventKey="simulationParameters">

                    {team && (
                    <p>
                        &raquo; The solution is delivered by the team <strong>{team.name}</strong>
                    </p>
                    )}
                    {workstream && (
                    <p>
                        &raquo; The solution is part of the workstream <strong>{workstream.name}</strong>
                    </p>
                    )}

                    {solution.estimateType === EstimateType.backlog && (
                    <div>
                        <p>
                            &raquo; This solution is expected to require delivering a backlog of work consisting of:
                        </p>
                        <ul>
                            <li>
                                between <strong>{solution.backlog.lowGuess} and {solution.backlog.highGuess}</strong> work
                                items {!_.isEmpty(solution.backlog) && !checkBacklogGuess(solution.backlog.lowGuess, solution.backlog.highGuess, BACKLOG_GUESS_SPREAD_THRESHOLD) && (
                                    <OverlayTrigger overlay={<Tooltip id="warning-backlog-guess">The high guess is less than {Math.round(BACKLOG_GUESS_SPREAD_THRESHOLD * 100)}% above the low guess. Consider using a wider range.</Tooltip>}>
                                        <Label bsStyle="warning">
                                        !
                                        </Label>
                                    </OverlayTrigger>
                                )}
                            </li>
                            {(solution.backlog.lowSplitRate && solution.backlog.highSplitRate && solution.backlog.highSplitRate > 1) && (
                            <li>
                                of which we expect that <strong>every {solution.backlog.lowSplitRate} to {solution.backlog.highSplitRate}</strong> work items will be further
                                split {!_.isEmpty(solution.backlog) && !checkBacklogGuess(solution.backlog.lowSplitRate, solution.backlog.highSplitRate, SPLIT_RATE_GUESS_SPREAD_THRESHOLD) && (
                                    <OverlayTrigger overlay={<Tooltip id="warning-split-rate">The high guess is less than {Math.round(SPLIT_RATE_GUESS_SPREAD_THRESHOLD * 100)}% above the low guess. Consider using a wider range.</Tooltip>}>
                                        <Label bsStyle="warning">
                                            !
                                        </Label>
                                    </OverlayTrigger>
                                )}
                            </li>
                            )}
                            <li>with throughput measured to a cadence of <strong>{weeks(solution.throughputPeriodLength)}</strong></li>
                            <li>starting <strong>{
                                solution.startType === StartType.teamNext? "as soon as the team has capacity" :
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

                    {!_.isEmpty(solution.actuals) && solution.actuals.status !== ActualsStatus.notStarted && (
                    <div>
                        <p>
                            &raquo; Work <strong>started</strong> on {moment(solution.actuals.startDate).format(DATE_FORMAT)}.
                            {solution.actuals.status === ActualsStatus.started && (
                                <span> As of <strong>{moment(solution.actuals.toDate).format(DATE_FORMAT)}</strong>, <strong>{solution.actuals.workItems}</strong> were completed.</span>
                            )}
                            {solution.actuals.status === ActualsStatus.completed && (
                                <span> Work <strong>completed</strong> on {moment(solution.actuals.toDate).format(DATE_FORMAT)}.</span>
                            )}
                        </p>
                        
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
                        between <strong>{solution.team.throughputEstimate.lowGuess} and {solution.team.throughputEstimate.highGuess}</strong> work
                        items completed per {weeks(solution.throughputPeriodLength)}. {!_.isEmpty(solution.team.throughputEstimate) && !checkBacklogGuess(solution.team.throughputEstimate.lowGuess, solution.team.throughputEstimate.highGuess, BACKLOG_GUESS_SPREAD_THRESHOLD) && (
                            <OverlayTrigger overlay={<Tooltip id="warning-throughput-guess">The high guess is less than {Math.round(BACKLOG_GUESS_SPREAD_THRESHOLD * 100)}% above the low guess. Consider using a wider range.</Tooltip>}>
                                <Label bsStyle="warning" >
                                    !
                                </Label>
                            </OverlayTrigger>
                        )}
                    </p>
                    )}

                    {(solution.estimateType === EstimateType.backlog && solution.team.throughputType === ThroughputType.samples) && (
                    <div>
                        <p>
                            The team's throughput is based on <strong>previous samples</strong>:  {!checkSampleCount(solution.team.throughputSamples || [], MIN_SAMPLES, MAX_SAMPLES) &&
                            <OverlayTrigger overlay={<Tooltip id="warning-sample-size">Using too few or too many (old) samples can skew the result. Consider aiming for ca {MIN_SAMPLES}-{MAX_SAMPLES} samples.</Tooltip>}>
                                <Label bsStyle="warning">
                                    !
                                </Label>
                            </OverlayTrigger>
                        }
                        {!checkSampleAge(solution.team.throughputSamples || [], SAMPLE_AGE_THRESHOLD) &&
                            <OverlayTrigger overlay={<Tooltip id="warning-sample-age">The newest sample used for forecasting is over {SAMPLE_AGE_THRESHOLD} days old. If the underlying conditions have changed, it is possible that this will provide a misleading baseline.</Tooltip>}>
                                <Label bsStyle="warning">
                                    !
                                </Label>
                            </OverlayTrigger>
                        }
                        {!checkSampleStability(solution.team.throughputSamples || [], SAMPLE_STABILITY_THRESHOLD) &&
                            <OverlayTrigger overlay={<Tooltip id="warning-sample-stability">An analysis of the samples provided suggests they might not provide a stable baseline. This can happen if they cover a period of ramp-up or significant change, or if the number of samples is quite low. Consider choosing a different sample period, or adding more samples.</Tooltip>}>
                                <Label bsStyle="warning">
                                    !
                                </Label>
                            </OverlayTrigger>
                        }
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
                        be <strong>{Math.round(solution.team.rampUp.throughputScalingLowGuess * 100)}-{Math.round(solution.team.rampUp.throughputScalingHighGuess * 100)}%</strong> of
                        this. {!checkBacklogGuess(solution.team.rampUp.throughputScalingLowGuess, solution.team.rampUp.throughputScalingHighGuess, THROUGHPUT_SCALING_RATE_SPREAD_THRESHOLD) && (
                            <OverlayTrigger overlay={<Tooltip id="warning-ramp-up-guess">The high guess is less than {Math.round(THROUGHPUT_SCALING_RATE_SPREAD_THRESHOLD * 100)}% above the low guess. Consider using a wider range.</Tooltip>}>
                                <Label bsStyle="warning">
                                    !
                                </Label>
                            </OverlayTrigger>
                        )}
                    </p>
                    )}

                </Panel>
                
                {solution.estimateType === EstimateType.backlog && (
                <Panel collapsible defaultExpanded header="Simulation results" eventKey="simulationResults">

                    <HelpBlock>
                        <p>
                            Based on the parameters above, we can forecast the number of weeks required to
                            complete this solution. The various parameters all have a degree of uncertainty,
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

                {solution.estimateType === EstimateType.backlog && (
                <Panel collapsible defaultExpanded header="Simulation results" eventKey="simulationResults">

                    <HelpBlock>
                        <p>
                            We can also drill into a smaller set of forecasts to understand how our
                            simulations would see the delivery play out. The chart below shows a series
                            of "burn-up" lines for different simulated scenarios. Hover over a data point
                            to understand more about the scenario that led to it.
                        </p>
                    </HelpBlock>

                    <SolutionBurnup solution={solution} />
                </Panel>
                )}

            </PanelGroup>
            
        </div>
    );
}

export default ViewSolution;
