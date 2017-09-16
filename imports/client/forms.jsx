import _ from 'lodash';
import React from 'react';
import { FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap';

export const FormField = ({object, field, value, title, placeholder, onChange, validationContext, control, componentClass, type, children, className }) => (
    <FormGroup className={className} controlId={field} validationState={validationContext && validationContext.keyIsInvalid(field)? 'error' : null}>
        <ControlLabel>{title}</ControlLabel>
        {control? control:
            <FormControl
                componentClass={componentClass}
                type={type || "text"}
                placeholder={placeholder}
                value={_.get(object, field) || ""}
                onChange={onChange}>{children}</FormControl>
        }
        <FormControl.Feedback />
        {validationContext.keyIsInvalid(field)? <HelpBlock>{validationContext && validationContext.keyErrorMessage(field)}</HelpBlock> : null}
    </FormGroup>
);
