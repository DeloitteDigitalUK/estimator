import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Projects } from '../../../collections/promisified';
import ProjectForm from './form';

export default class EditProject extends Component {

    static propTypes = {
        history: PropTypes.object.isRequired,
        project: PropTypes.object.isRequired
    }

    render() {
        return (
            <div>
                <h1 className="page-header">Edit project details</h1>
                <p>
                    Edit basic project details.
                </p>

                <ProjectForm project={this.props.project} onCancel={this.onCancel.bind(this)} onSubmit={this.onSubmit.bind(this)} />

            </div>
        );
    }

    onCancel(e) {
        e.preventDefault();
        this.props.history.push('/project/' + this.props.project._id);
    }

    async onSubmit(data) {
        try {
            await Projects.update(this.props.project._id, {$set: data});
            this.props.history.push('/project/' + this.props.project._id);
        } catch(err) {
            console.log(err);
            alert("Unable to update project in database");
        };
    }

}
