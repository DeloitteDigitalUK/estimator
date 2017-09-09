import React, { Component } from 'react';
import Blaze from 'meteor/gadicc:blaze-react-component';

import { Alert, Button, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { callMethod } from '../../utils';

export const AdminUsers = ({ }) => (
    <div>
        <h1 className="page-header">Manage users</h1>
        <p>
            Use the table below to find, create, edit or delete users.
        </p>
        <Link className="btn btn-default pull-right" to="/admin/create-user" role="button">Create User</Link>
        
        <Blaze template="accountsAdmin" />
    </div>
);

export class CreateUser extends Component {

    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            confirmPassword: '',
            role: '',
            email: '',
            invalid: false,
            error: false,
            errorMessage: '',
        };
    }

    handleChange(field, event) {
        this.setState({ [field]: event.target.value });
    }

    render() {
        const { email, role } = this.state;
        return (
            <form className="form-signin" onSubmit={this.handleSubmit.bind(this)}>
                <h2 className="form-signin-heading">Create user</h2>

                { this.state.invalid ? <Alert bsStyle="danger">Email address is required.</Alert> : '' }
                { this.state.error ? <Alert bsStyle="danger">{this.state.errorMessage}</Alert> : '' }

                <FormGroup controlId="email">
                    <ControlLabel htmlFor="email" srOnly>Email address</ControlLabel>
                    <FormControl type="email" id="email" required autoFocus placeholder="Email address" value={email} onChange={this.handleChange.bind(this, 'email')} />
                </FormGroup>

                <FormGroup controlId="role">
                    <ControlLabel htmlFor="role" srOnly>Role</ControlLabel>
                    <select id="role" required className="form-control" placeholder="Role" value={role} onChange={this.handleChange.bind(this, 'role')}>
                        <option value="user">User</option>
                        <option value="admin">Administrator</option>
                    </select>
                </FormGroup>

                <Button bsStyle="primary" block type="submit">Create user</Button>
        
                <div className="form-group">
                    <Link to="/admin/users">Cancel</Link>
                </div>
            </form >
        );
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.state.email) {
            this.setState({ invalid: true, error: false, errorMessage: '' });
            return;
        } else {
            this.setState({ invalid: false, error: false, errorMessage: '' });
        }

        const role = this.state.role ? this.state.role : null;

        try {
            await callMethod('users/create', this.state.email, role);
            this.props.history.push('/admin/users');
        } catch (err) {
            this.setState({ invalid: false, error: true, errorMessage: err.reason || 'An unexpected error occurred' });
        }
    }

}
