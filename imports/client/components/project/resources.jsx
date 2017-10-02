import _ from 'lodash';
import moment_ from 'moment';
import { extendMoment } from 'moment-range';
 
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert, ControlLabel, FormControl } from 'react-bootstrap';
import Select from 'react-select';

import Table from '../ui/table';
import simulateProject from '../../../simulation/project';
import { getPublicSetting, getSuffix, ISO } from '../../../utils';

const moment = extendMoment(moment_);
const DATE_FORMAT = getPublicSetting('dateFormat');

function annotateHeaders(col, th) {
    const colSettings = this.getSettings().columns[col] || {};

    (colSettings.headerClasses || []).forEach(cls => {
        th.classList.add(cls);
    });
}

export default class ResourceForecast extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            percentile: 0.85,
            runs: 1000
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    render() {
        
        let simulationResults

        try {
            simulationResults = simulateProject(this.props.project, [this.state.percentile], this.state.runs)
        } catch(e) {
            return <Alert bsStyle="danger">{e.message}</Alert>;
        }

        const dataSchema = { role: null, description: null, header: null },
              columns = [
                {title: "Role", width: 150, data: "role", renderer: (instance, td, row, col, prop, value, cellProperties) => {
                    const data = instance.getSourceDataAtRow(row);
                    if(data.header) {
                        td.className = 'resource-table-header';
                    }

                    td.innerHTML = value;
                    return td;
                } },
                {title: "Description", width: 150, data: "description" },
              ];

        const tableData = [],
              mergeCells = [];

        let firstDate = moment.utc(this.props.project.startDate).startOf('isoWeek'),
            lastDate = moment.utc(this.props.project.startDate).endOf('isoWeek'),
            rows = 0;

        simulationResults.forEach(r => {

            tableData.push({
                role: r.solution.name,
                header: true
            });
            mergeCells.push({
                row: rows,
                col: 0,
                rowspan: 1,
                colspan: 2
            });
            ++rows;

            r.dates.forEach(d => {

                const startDate = moment.utc(d.startDate).startOf('isoWeek'),
                      endDate = moment.utc(d.endDate).endOf('isoWeek'),
                      dateRange = moment.range(startDate, endDate);

                if(endDate.isAfter(lastDate)) {
                    lastDate = endDate;
                }

                (r.solution.team.members || []).forEach(m => {

                    const dates = {};
                    for(let day of dateRange.by('weeks')) {
                        const key = day.format(ISO);
                        dates[key] = m.quantity;
                    }

                    tableData.push({
                        role: m.role,
                        description: m.description,
                        header: false,
                        ...dates
                    });
                    ++rows;

                });

            });

            // blank row
            tableData.push({
                role: "",
            });
            mergeCells.push({
                row: rows,
                col: 0,
                rowspan: 1,
                colspan: 2
            });
            ++rows;

        });

        const dateRange = moment.range(firstDate, lastDate);
        for(let day of dateRange.by('weeks')) {
            const key = day.format(ISO);
            dataSchema[key] = null;
            columns.push({ title: day.format(DATE_FORMAT), data: key, width: 30, type: 'numeric', headerClasses: ['date-cell'] });
        }

        return (                
            <div className="project-resources">

                <div className="project-plan-controls">
                    <span title="The confidence percentile to use to simulate the required resources">
                        <ControlLabel>
                            Percentile:
                        </ControlLabel>
                        <Select
                            value={this.state.percentile}
                            clearable={false}
                            required
                            onChange={option => { this.setState({ percentile: option? option.value : 0.85 }); }}
                            options={[1, 0.99, 0.95, 0.9, 0.85, 0.75, 0.5, 0.25].map(v => (
                                { value: v, label: `${Math.round(v * 100)}${getSuffix(Math.round(v * 100))}` }
                            ))}
                            />
                    </span>
                    <span title="The number of runs of the simulator. More runs means a more nuanced result, but this will also take more time.">
                        <ControlLabel>
                            Simulations:
                        </ControlLabel>
                        <FormControl
                            type="number"
                            min={100}
                            max={10000}
                            value={this.state.runs}
                            onChange={e => {
                                const value = e.target.value? parseInt(e.target.value, 10) : 0;
                                if(_.isNaN(value) || value < 0 || value > 10000) {
                                    return;
                                }
                                this.setState({runs: value})
                            }}
                            />
                    </span>
                </div>

                <div className="project-resources-table">
                    <Table
                        updateData
                        readOnly
                        data={tableData}
                        dataSchema={dataSchema}
                        columns={columns}
                        afterGetColHeader={annotateHeaders}
                        mergeCells={mergeCells}
                        />
                </div>
                
            </div>
        );

    }

}