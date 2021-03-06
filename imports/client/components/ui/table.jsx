import { Random } from 'meteor/random';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import _ from 'lodash';

import Handsontable from 'handsontable';

import KeyValueAutocompleteCell from './keyvalueautocomplete';
import validators, { rowValidator } from './validators';

export { KeyValueAutocompleteCell, validators, rowValidator };

export function mutatingRenderer(fn) {
    return (instance, td, row, col, prop, value, cellProperties) => {
        value = fn(value);
        Handsontable.renderers.AutocompleteRenderer(instance, td, row, col, prop, value, cellProperties)
    };
}

// Extract the data value from a handsontable cell with an `_id` field in the
// source data (used for autocomplete cells)
export function getIdValue() {
     const selection = this.getSelected();
     return this.getSourceDataAtRow(selection[0])._id;
};

export default class Table extends Component {

    static propTypes = {
        // set a unique id; we'll only fully update the component if this changes
        id: PropTypes.string,

        // always update data
        updateData: PropTypes.bool,

        // list of objects; items should have a unique `_id` property
        data: PropTypes.array.isRequired,

        // name of id prop in data items (defaults to `_id`)
        idProp: PropTypes.string,

        // schema for new items
        dataSchema: PropTypes.object.isRequired,

        // list of column definitions
        columns: PropTypes.array.isRequired,

        // for small tables, where we care about order... `onChange()` is
        // passed the new data array
        onChange: PropTypes.func,

        // passed `true` or `false` to indicate validation state of entire table
        // after cell change
        onValidate: PropTypes.func,

        // if data contains more than this number of rows, table will be
        // height-restricted with scroll (helps performance)
        maxVisibleRows: PropTypes.number,

        // common table setup
        tableConfig: PropTypes.object,

        // shortcut properties passed to handsontable
        minSpareRows: PropTypes.number,
        readOnly: PropTypes.bool,
        width: PropTypes.number,
        height: PropTypes.number,
        autoColumnSize: PropTypes.bool,
        columnSorting: PropTypes.bool,
        sortIndicator: PropTypes.bool,
        fixedRowsTop: PropTypes.number,
        fixedColumnsLeft: PropTypes.number,
        stretchH: PropTypes.string,
        rowHeaders: PropTypes.bool,
        manualRowMove: PropTypes.bool,
        afterGetColHeader: PropTypes.func,
        mergeCells: PropTypes.array,
    }

    static defaultProps = {
        updateData: false,
        idProp: '_id',
        minSpareRows: null, // defaults to 0 or 1 depending on `readOnly`
        tableConfig: {
            contextMenu: ['row_above', 'row_below', 'remove_row', 'undo', 'redo'],
            autoColumnSize: true,
            autoWrapRow: true,
            allowInvalid: false,
            allowInsertColumn: false,
            allowRemoveColumn: false,
            allowInsertRow: true,
            allowRemoveRow: true,
            copyPaste: true,
        },
        readOnly: false,
        persistentState: true,
        fixedRowsTop: 0,
        fixedColumnsLeft: 0,
        stretchH: 'none',
        rowHeaders: false,
        manualRowMove: false,
        columnSorting: false,
        sortIndicator: true,
        mergeCells: null
    }

    constructor(props) {
        super(props);

        this.hot = null;
        this.state = {
            data: _.cloneDeep(this.props.data),
            invalid: {}
        };
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.updateData) {
            this.state = {
                data: _.cloneDeep(nextProps.data),
            };
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.updateData;
    }

    componentDidMount() {
        let container = ReactDOM.findDOMNode(this);
        this.hot = new Handsontable(container, this.buildHandsontableOptions());
    }

    componentWillUpdate() {
        this.hot.destroy();
    }

    componentDidUpdate() {
        let container = ReactDOM.findDOMNode(this);
        this.hot = new Handsontable(container, this.buildHandsontableOptions());
    }

    componentWillUnmount() {
        this.hot.destroy();
    }

    render() {
        let className = "data-table";
        if(this.props.maxVisibleRows && this.state.data.length > this.props.maxVisibleRows) {
            className += " large-table";
        }
        return <div className={className} />;
    }

    getData() {
        if(this.hot === null) {
            return this.state.data;
        }

        let minSpareRows = this.hot.getSettings().minSpareRows;
        if(minSpareRows > 0) {
            return this.state.data.slice(0, -minSpareRows);
        } else {
            return this.state.data.slice();
        }
    }

    buildHandsontableOptions() {

        const component = this,
              idProp = this.props.idProp;

        const onChange = () => {
            if(this.props.onChange) {
                this.props.onChange(this.getData())
            }
        };

        const afterValidate = this.props.onValidate? function(isValid, value, row, prop, source) {
            let key = this.getSourceDataAtRow(row)[idProp];

            if(!key) {
                return;
            }

            if(isValid) {
                component.setState({
                    invalid: _.omit(component.state.invalid, key)
                });
            } else {
                component.setState({
                    invalid: {...component.state.invalid, [key]: true}
                });
            }

            component.props.onValidate(_.isEmpty(component.state.invalid));
        } : null;

        return _.extend({}, this.props.tableConfig, {
            data: this.state.data,
            autoColumnSize: this.props.autoColumnSize,
            columnSorting: this.props.columnSorting,
            sortIndicator: this.props.sortIndicator,
            width: this.props.width,
            height: this.props.height,
            minSpareRows: !_.isNull(this.props.minSpareRows)? this.props.minSpareRows : this.props.readOnly? 0 : 1,
            readOnly: this.props.readOnly,
            dataSchema: this.props.dataSchema,
            columns: this.props.columns,
            fixedRowsTop: this.props.fixedRowsTop,
            fixedColumnsLeft: this.props.fixedColumnsLeft,
            stretchH: this.props.stretchH,
            manualRowMove: this.props.manualRowMove,
            rowHeaders: this.props.manualRowMove? true : this.props.rowHeaders,
            afterGetColHeader: this.props.afterGetColHeader,
            mergeCells: this.props.mergeCells,

            afterValidate: afterValidate,

            // create or update
            afterChange: function(changes, source) {
                if(source === 'loadData') {
                    return;
                }

                for(let i = 0; i < changes.length; ++i) {
                    let row = changes[i][0],
                        item = this.getSourceDataAtRow(row);

                    // if a new row, set id and validate
                    if(idProp && !item[idProp]) {
                        item[idProp] = Random.id();

                        for(let j = 0; j < this.countCols(); ++j) {
                            this.validateCell(this.getDataAtCell(row, j), this.getCellMeta(row, j), () => {}, 'edit');
                        }

                    }

                    // we can't detect new rows easily without the `_id` property, so just revalidate
                    // the whole row on all changes
                    if(!idProp) {
                        for(let j = 0; j < this.countCols(); ++j) {
                            this.validateCell(this.getDataAtCell(row, j), this.getCellMeta(row, j), () => {}, 'edit');
                        }
                    }

                }

                onChange();
            },

            // remove
            afterRemoveRow: function(index, amount) {
                onChange();
            },

            // re-order
            afterRowMove: function(rows, target) {
                onChange();
            }

        });
    }

}
