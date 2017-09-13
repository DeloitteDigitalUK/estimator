import _ from 'lodash';
import React from 'react';

import { Route } from 'react-router'

import { Nav, NavDropdown, MenuItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import { canWrite } from '../../../../utils';

import FourOhFour from '../../fourohfour'
import { ModalLinkContainer, ModalSwitch, ModalRoutes } from '../../routing'

import ViewSolution from './view';
import EditSolution from './edit';
import DeleteSolution from './delete';
import DuplicateSolution from './duplicate';

const SolutionMain = ({ history, location, match, project }) => {

    const prefix = match.path,
          solutionId = match.params.solution_id,
          solution   = solutionId? _.find(project.solutions, {_id: solutionId}) : null;

    if(solutionId && !solution) {
        return <FourOhFour />;
    }
    
    const w = canWrite(project);

    return (
        <ModalSwitch className="solution-container" {...{history, location, match}} modalTarget="solution">

            <Route exact path={prefix} render={props => <ViewSolution {...{project, solution, ...props}} />} />
            {w? <Route exact path={`${prefix}/edit`} render={props => <EditSolution {...{project, solution, ...props}} />} /> : null}

            <Route component={FourOhFour} />

            <ModalRoutes>
                {w? <Route exact path={`${prefix}/duplicate`} render={props => <DuplicateSolution {...{project, solution, ...props}} />} /> : null}
                {w? <Route exact path={`${prefix}/delete`} render={props => <DeleteSolution {...{project, solution, ...props}} />} /> : null}    
            </ModalRoutes>

        </ModalSwitch>
    );
};

export default SolutionMain;

export const SolutionNav = ({ match, project }) => {

    const prefix = match.url,
          solutionId = match.params.solution_id,
          solution = _.find(project.solutions, {_id: solutionId});
    
    if(!solution) {
        return null;
    }

    const w = canWrite(project);

    return (
        <Nav>
            <NavDropdown id="solution-menu-dropdown" title="Solution">
                {w? <LinkContainer to={`${prefix}/edit`}><MenuItem>Edit</MenuItem></LinkContainer> : null}
                {w? <ModalLinkContainer to={`${prefix}/duplicate`} modalTarget="solution"><MenuItem>Duplicate&hellip;</MenuItem></ModalLinkContainer> : null}
                {w? <ModalLinkContainer to={`${prefix}/delete`} modalTarget="solution"><MenuItem>Delete&hellip;</MenuItem></ModalLinkContainer> : null}
                <LinkContainer to={`/project/${project._id}`} isActive={() => false}><MenuItem>Close</MenuItem></LinkContainer>
            </NavDropdown>
        </Nav>
    );
}
