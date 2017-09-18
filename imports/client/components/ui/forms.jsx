import _ from 'lodash';
import React from 'react';
import { FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap';

import Table from './table';

export const FormField = ({object, field, value, title, placeholder, onChange, validationContext, control, componentClass, type, children, className }) => (
    <FormGroup className={className} controlId={field} validationState={validationContext.keyIsInvalid(field)? 'error' : null}>
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
        {validationContext.keyIsInvalid(field)? <HelpBlock>{validationContext.keyErrorMessage(field)}</HelpBlock> : null}
    </FormGroup>
);

export const TableField = ({object, field, value, title, onChange, validationContext, className, showCellErrors, ...tableProps }) => {

    const cellErrors = showCellErrors? validationContext.validationErrors().filter(e => e.name.startsWith(field + '.')): [],
          isInvalid = cellErrors.length > 0 || validationContext.keyIsInvalid(field);

    return (
            <FormGroup className={className} controlId={field} validationState={isInvalid? 'error' : null}>
            <ControlLabel>{title}</ControlLabel>
            <Table
                onChange={onChange}
                {...tableProps}
                />
            <FormControl.Feedback />
            {validationContext.keyIsInvalid(field)? <HelpBlock>{validationContext.keyErrorMessage(field)}</HelpBlock> : null}
            {cellErrors.map(e => (
                <HelpBlock key={e.name} className="table-cell-error">{validationContext.keyErrorMessage(e.name)}</HelpBlock>
            ))}
        </FormGroup>
    );
}
