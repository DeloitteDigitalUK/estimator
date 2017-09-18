import _ from 'lodash';
import moment from 'moment';

// Wrap a validator in this function to not attempt to validate a spare row.
export function rowValidator(validator) {
    return function(value, callback) {
        let table = this.instance,
            maxRow = table.countRows() - table.getSettings().minSpareRows - 1;

        if(this.row > maxRow) {
            callback(true);
            return;
        }

        validator.call(this, value, callback);
    };
}

const validators = {

    required(value, callback) {
        if(value === null || value === undefined || value === "") {
            callback(false);
        } else if(_.isDate(value)) {
            callback(true);
        } else if(_.isArray(value) && _.isEmpty(value)) {
            callback(false);
        } else if(_.isObject(value) && _.isEmpty(value)) {
            callback(false);
        } else {
            callback(true);
        }
    },

    number(value, callback) {
        if(value === null || value === undefined || value === "") {
            callback(true);
        } else if(!_.isFinite(value)) {
            callback(false);
        } else {
            callback(true);
        }
    },

    requiredNumber(value, callback) {
        if(!_.isFinite(value)) {
            callback(false);
        } else {
            callback(true);
        }
    },

    percentage(value, callback) {
        if(value === null || value === undefined || value === "") {
            callback(true);
        } else if(!_.isFinite(value) || value < 0 || value > 1) {
            callback(false);
        } else {
            callback(true);
        }
    },

    requiredPercentage(value, callback) {
        if(!_.isFinite(value) || value < 0 || value > 1) {
            callback(false);
        } else {
            callback(true);
        }
    },

    date(value, callback) {
        if(value === null || value === undefined) {
            callback(true);
        } else {
            callback(moment(value, this.dateFormat, true).isValid());
        }
    },

    requiredDate(value, callback) {
        callback(moment(value, this.dateFormat, true).isValid());
    },

    unique(value, callback) {
        let table   = this.instance,
            numRows = table.countRows() - table.getSettings().minSpareRows,
            row     = this.row,
            col     = this.col;

        if(value === null || value === undefined || value === "") {
            callback(false);
            return;
        } else if(_.isArray(value) && _.isEmpty(value)) {
            callback(false);
            return;
        } else if(_.isObject(value) && _.isEmpty(value)) {
            callback(false);
            return;
        }

        for(let i = 0; i < numRows; ++i) {
            if(i === row) {
                continue;
            }

            let otherValue = table.getDataAtCell(i, col);
            if(_.isEqual(value, otherValue)) {
                callback(false);
                return;
            }
        }

        callback(true);
    }
};

export default validators;
