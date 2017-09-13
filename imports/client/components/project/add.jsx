import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Projects } from '../../../collections/promisified';
import ProjectForm from './form';

export default class AddProject extends Component {

    static propTypes = {
        history: PropTypes.object.isRequired
    }

    render() {
        return (
            <div>
                <h1 className="page-header">New project</h1>
                <p>
                    A project consists of multiple solutions, each of
                    which will be forecast separately.
                </p>

                <ProjectForm onCancel={this.onCancel.bind(this)} onSubmit={this.onSubmit.bind(this)} />
            </div>
        );
    }

    onCancel(e) {
        e.preventDefault();
        this.props.history.push('/');
    }

    async onSubmit(data) {

        try {
            const projectId = await Projects.insert({
                ...data,
                owner: Meteor.userId(),
                solutions: []
            });

            this.props.history.push('/project/' + projectId);
        } catch(err) {
            console.log(err);
            alert("UNEXPECTED ERROR: Unable to insert new project in database.")
        }
    }
}
