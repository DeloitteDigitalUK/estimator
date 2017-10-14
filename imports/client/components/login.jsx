import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SimpleSchema from 'simpl-schema';

import { Alert, FormGroup, FormControl, Button, ControlLabel } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { getPublicSetting } from '../../utils';

const ALLOW_SIGNUP = getPublicSetting('allowSignUp');

export class SignUp extends Component {

    static propTypes = {
        history: PropTypes.object
    }

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            confirmPassword: '',
            invalid: false,
            error: null
        };
    }

    handleChange(field, event) {
        this.setState({ [field]: event.target.value });
    }

    render() {
        const { email, password, confirmPassword } = this.state;
        return (
            <div className="container">
                <form className="form-signin" onSubmit={this.onSubmit.bind(this)}>

                    <h2 className="form-signin-heading">Sign up</h2>

                    {this.state.invalid ? <Alert bsStyle="danger">Please enter email and password (twice)</Alert> : ''}
                    {this.state.error ? <Alert bsStyle="danger">{this.state.error}</Alert> : ''}

                    <FormGroup controlId="username">
                        <ControlLabel srOnly>Email</ControlLabel>
                        <FormControl type="email" required autoFocus placeholder="Email" value={email} onChange={this.handleChange.bind(this, 'email')} />
                    </FormGroup>
                    <FormGroup controlId="password">
                        <ControlLabel srOnly>Password</ControlLabel>
                        <FormControl type="password" required placeholder="Password" value={password} onChange={this.handleChange.bind(this, 'password')} />
                    </FormGroup>
                    <FormGroup controlId="confirmPassword">
                        <ControlLabel srOnly>Confirm password</ControlLabel>
                        <FormControl type="password" required placeholder="Confirm password" value={confirmPassword} onChange={this.handleChange.bind(this, 'confirmPassword')} />
                    </FormGroup>
                    <FormGroup>
                        <Button bsStyle="primary" block type="submit">Sign up</Button>
                    </FormGroup>
                    <FormGroup>
                        <Link to="/login">Log in</Link>
                    </FormGroup>
                </form>
            </div>
        );
    }

    onSubmit(e) {
        e && e.preventDefault();

        const history = this.props.history;

        if (!this.state.email || !this.state.password || this.state.password !== this.state.confirmPassword) {
            this.setState({ invalid: true, error: null });
            return;
        } else if(!SimpleSchema.RegEx.Email.test(this.state.email)) {
            this.setState({ invalid: true, error: null });
            return;
        } else {
            this.setState({ invalid: false, error: null });
        }

        Accounts.createUser({
            username: this.state.email,
            email: this.state.email,
            password: this.state.password
        }, err => {
            if (err) {
                this.setState({ error: err.reason });
            } else {
                Meteor.loginWithPassword(this.state.email, this.state.password, err => {
                    if (err) {
                        this.setState({ error: err.reason });
                    } else {
                        history.push('/');
                    }
                });
            }
        });
    }

}

export class Login extends Component {

    static propTypes = {
        history: PropTypes.object
    }

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            invalid: false,
            error: false,
        };
    }

    handleChange(field, event) {
        this.setState({ [field]: event.target.value });
    }

    render() {
        const { email, password } = this.state;
        return (
            <div className="container">
                <form className="form-signin" onSubmit={this.onSubmit.bind(this)}>

                    <h2 className="form-signin-heading">Log in</h2>

                    {this.state.invalid ? <Alert bsStyle="danger">Please enter email and password</Alert> : ''}
                    {this.state.error ? <Alert bsStyle="danger">Login unsuccessful. Please try again.</Alert> : ''}

                    <FormGroup controlId="username">
                        <ControlLabel srOnly>Email</ControlLabel>
                        <FormControl type="email" required autoFocus placeholder="Email" value={email} onChange={this.handleChange.bind(this, 'email')} />
                    </FormGroup>
                    <FormGroup controlId="password">
                        <ControlLabel srOnly>Password</ControlLabel>
                        <FormControl type="password" required placeholder="Password" value={password} onChange={this.handleChange.bind(this, 'password')} />
                    </FormGroup>
                    <FormGroup>
                        <Button bsStyle="primary" block type="submit">Log in</Button>
                    </FormGroup>
                
                    {!ALLOW_SIGNUP? null :
                        <FormGroup>
                            <Link to="/signup">Sign up</Link>
                            &nbsp;&bull;&nbsp;
                            <Link to="/reset-password">Reset password</Link>
                        </FormGroup>
                    }
                    
                </form>
            </div>
        );
    }

    onSubmit(e) {
        e && e.preventDefault();

        const history = this.props.history;

        if (!this.state.email || !this.state.password) {
            this.setState({ invalid: true, error: false });
            return;
        } else {
            this.setState({ invalid: false, error: false });
        }

        Meteor.loginWithPassword(this.state.email, this.state.password, err => {
            if (err) {
                this.setState({ invalid: false, error: true });
            } else {
                history.push('/');
            }
        });
    }

}

export class RequestPasswordReset extends Component {

    static propTypes = {
        history: PropTypes.object
    }

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            invalid: false,
            error: false,
            sent: false
        };
    }

    handleChange(field, event) {
        this.setState({ [field]: event.target.value });
    }

    render() {
        const { email } = this.state;
        return (
            <div className="container">
                <form className="form-signin" onSubmit={this.onSubmit.bind(this)}>

                    <h2 className="form-signin-heading">Reset password</h2>

                    {this.state.sent ? <Alert bsStyle="info">Please check your email</Alert> : ''}
                    {this.state.invalid ? <Alert bsStyle="danger">Please enter your email address</Alert> : ''}
                    {this.state.error ? <Alert bsStyle="danger">Request to reset password unsuccessful. Please try again.</Alert> : ''}

                    <FormGroup controlId="username">
                        <ControlLabel srOnly>Email address</ControlLabel>
                        <FormControl type="text" required autoFocus placeholder="Email address" value={email} onChange={this.handleChange.bind(this, 'email')} />
                    </FormGroup>
                    <FormGroup>
                        <Button bsStyle="primary" block type="submit">Reset password</Button>
                    </FormGroup>
                    <FormGroup>
                        <Link to="/login">Log in</Link>
                    </FormGroup>
                </form>
            </div>
        );
    }

    onSubmit(e) {
        e.preventDefault();

        if (!this.state.email) {
            this.setState({ invalid: true, error: false, sent: false });
            return;
        } else {
            this.setState({ invalid: false, error: false, sent: false });
        }

        Accounts.forgotPassword({ email: this.state.email }, err => {
            if (err) {
                this.setState({ invalid: false, error: true, sent: false });
            }

            this.setState({ invalid: false, error: false, sent: true });
        });

    }

}

export class ResetPassword extends Component {

    static propTypes = {
        match: PropTypes.object,
        history: PropTypes.object
    }

    constructor(props) {
        super(props);
        this.state = {
            password: '',
            confirmPassword: '',
            invalid: false,
            error: false
        };
    }

    handleChange(field, event) {
        this.setState({ [field]: event.target.value });
    }

    render() {
        const { password, confirmPassword } = this.state;
        return (
            <div className="container">
                <form className="form-signin" onSubmit={this.onSubmit.bind(this)}>
                    <h2 className="form-signin-heading">Reset password</h2>

                    {this.state.invalid ? <Alert bsStyle="danger">Please enter and confirm your new password</Alert> : ''}
                    {this.state.error ? <Alert bsStyle="danger">An error ocurred. Please try again.</Alert> : ''}

                    <FormGroup controlId="password">
                        <ControlLabel srOnly>Password</ControlLabel>
                        <FormControl type="password" required placeholder="Password" value={password} onChange={this.handleChange.bind(this, 'password')} />
                    </FormGroup>
                    <FormGroup controlId="confirmPassword">
                        <ControlLabel srOnly>Confirm password</ControlLabel>
                        <FormControl type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={this.handleChange.bind(this, 'confirmPassword')} />
                    </FormGroup>

                    <Button bsStyle="primary" block type="submit">Reset</Button>
                </form>
            </div>
        );
    }

    onSubmit(e) {
        e.preventDefault();

        if (!this.state.password || !this.state.password || this.state.password !== this.state.confirmPassword) {
            this.setState({ invalid: true, error: false });
            return;
        } else {
            this.setState({ invalid: false, error: false });
        }

        const history = this.props.history;

        Accounts.resetPassword(this.props.match.params.token, this.state.password, err => {
            if (err) {
                this.setState({ invalid: false, error: true });
            } else {
                history.push('/');
            }
        });
    }

}

export class EnrollAccount extends Component {

    static propTypes = {
        match: PropTypes.object,
        history: PropTypes.object
    }

    constructor(props) {
        super(props);
        this.state = {
            password: '',
            confirmPassword: '',
            invalid: false,
            error: false
        };
    }

    handleChange(field, event) {
        this.setState({ [field]: event.target.value });
    }

    render() {
        const { password, confirmPassword } = this.state;
        return (
            <div className="container">
                <form className="form-signin" onSubmit={this.onSubmit.bind(this)}>
                    <h2 className="form-signin-heading">Activate account</h2>

                    {this.state.invalid ? <Alert bsStyle="danger">Please enter and confirm your password</Alert> : ''}
                    {this.state.error ? <Alert bsStyle="danger">An error ocurred. Please try again.</Alert> : ''}

                    <FormGroup controlId="password">
                        <ControlLabel srOnly>Password</ControlLabel>
                        <FormControl type="password" required placeholder="Password" value={password} onChange={this.handleChange.bind(this, 'password')} />
                    </FormGroup>
                    <FormGroup controlId="confirmPassword">
                        <ControlLabel srOnly>Confirm password</ControlLabel>
                        <FormControl type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={this.handleChange.bind(this, 'confirmPassword')} />
                    </FormGroup>

                    <Button bsStyle="primary" block type="submit">Confirm</Button>
                </form>
            </div>
        );
    }

    onSubmit(e) {
        e.preventDefault();

        if (!this.state.password || !this.state.password || this.state.password !== this.state.confirmPassword) {
            this.setState({ invalid: true, error: false });
            return;
        } else {
            this.setState({ invalid: false, error: false });
        }

        const history = this.props.history;

        Accounts.resetPassword(this.props.match.params.token, this.state.password, err => {
            if (err) {
                this.setState({ invalid: false, error: true });
            } else {
                history.push('/');
            }
        });
    }

}

export class ChangePassword extends Component {

    static propTypes = {
        history: PropTypes.object
    }

    constructor(props) {
        super(props);
        this.state = {
            password: '',
            newPassword: '',
            confirmPassword: '',
            invalid: false,
            error: false
        };
    }

    handleChange(field, event) {
        this.setState({ [field]: event.target.value });
    }

    render() {
        const { password, newPassword, confirmPassword } = this.state;
        return (
            <form className="form-signin" onSubmit={this.onSubmit.bind(this)}>
                <h2 className="form-signin-heading">Change password</h2>

                { this.state.invalid ? <Alert bsStyle="danger">Please enter both email and password</Alert> : '' }
                { this.state.error ? <Alert bsStyle="danger">Invalid old password. Please try again.</Alert> : '' }

                <FormGroup controlId="currentPassword">
                    <ControlLabel srOnly>Current password</ControlLabel>
                    <FormControl type="password" required placeholder="Current password" value={password} onChange={this.handleChange.bind(this, 'password')} />
                </FormGroup>
                <FormGroup controlId="password">
                    <ControlLabel srOnly>Password</ControlLabel>
                    <FormControl type="password" required placeholder="New password" value={newPassword} onChange={this.handleChange.bind(this, 'newPassword')} />
                </FormGroup>
                <FormGroup controlId="confirmPassword">
                    <ControlLabel srOnly>Confirm password</ControlLabel>
                    <FormControl type="password" required placeholder="Confirm password" value={confirmPassword} onChange={this.handleChange.bind(this, 'confirmPassword')} />
                </FormGroup>

                <Button bsStyle="primary" block type="submit">Change password</Button>
                <div className="form-group">
                    <Link to="/">Cancel</Link>
                </div>
            </form>
        );
    }

    onSubmit(e) {
        e.preventDefault();

        if (!this.state.password || !this.state.newPassword || !this.state.confirmPassword || this.state.newPassword !== this.state.confirmPassword) {
            this.setState({ invalid: true, error: false });
            return;
        } else {
            this.setState({ invalid: false, error: false });
        }

        const history = this.props.history;

        Accounts.changePassword(this.state.password, this.state.newPassword, err => {
            if (err) {
                this.setState({ invalid: false, error: true });
            } else {
                history.push('/');
            }
        });
    }
}
