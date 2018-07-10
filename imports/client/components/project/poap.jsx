import _ from 'lodash';
import moment_ from 'moment';
import { extendMoment } from 'moment-range';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert, ControlLabel, FormControl, ButtonToolbar, Button, FormGroup, HelpBlock } from 'react-bootstrap';
import DatePicker from 'react-bootstrap-date-picker';
import Select from 'react-select';

import PptxGenJS from 'pptxgenjs';
import sanitize from 'sanitize-filename';

import simulateProject from '../../../simulation/project';
import { getPublicSetting, ISO, getSuffix } from '../../../utils';

const moment = extendMoment(moment_);
const DATE_FORMAT = getPublicSetting('dateFormat');

const GroupBy = {
    solution: "solution",
    team: "team",
    workstream: "workstream"
};

class GridPlanner {

    constructor(project, simulationResults, groupBy, startDate, endDate=null) {

        // parameters
        this.project = project;
        this.simulationResults = simulationResults;
        this.groupBy = groupBy;
        this.startDate = startDate;
        this.endDate = endDate;

        // state variables
        this.currentRow = [];

        // outputs
        this.columns = 0;
        this.rows = 0;

        this.headers = []; // {name, startCol, endCol, startDay, endDay}
        this.lanes = []; // {name, startRow, endRow, group}
        this.bars = [];  // {name, row, startCol, endCol, solution}
    }

    build() {

        const showNameInTitle = this.groupBy !== GroupBy.solution;
        
        let groups, lookup;
        
        switch(this.groupBy) {

            case GroupBy.solution:
                
                groups = this.simulationResults.map(r => ({
                    group: r.solution,
                    items: [r]
                }));

                break;
            
            case GroupBy.team:

                groups = this.project.teams.map(t => ({
                    group: t,
                    items: []
                }));
                lookup = groups.reduce((m, g) => ({...m, [g.group._id]: g}), {});
                
                this.simulationResults.forEach(r => {
                    const g = lookup[r.solution.teamId];
                    if(!_.isUndefined(g)) {
                        g.items.push(r);
                    }
                });

                break;
            
            case GroupBy.workstream:

                groups = this.project.workstreams.map(w => ({
                    group: w,
                    items: []
                }));
                lookup = groups.reduce((m, g) => ({...m, [g.group._id]: g}), {});

                this.simulationResults.forEach(r => {
                    const g = lookup[r.solution.workstreamId];
                    if(!_.isUndefined(g)) {
                        g.items.push(r);
                    }
                });

        }

        groups.forEach(group => {

            this.addGroup(group.group);

            group.items.forEach(item => {

                const solution = item.solution;

                item.dates.forEach(dates => {

                    const startDate = moment.utc(dates.startDate),
                          endDate = moment.utc(dates.endDate),
                          name = `${showNameInTitle? solution.name + " – " : ""}${dates.description}`;
                    
                    this.addItem(name, startDate, endDate, solution);

                })

            });
            
        });

        this.addHeaders();

    }

    addGroup(group) {
        this.lanes.push({
            name: group.name,
            startRow: this.rows, // will start on next row added
            endRow: this.rows,  // will be updated as required by `addItem()`
            group
        });

        // ready for first/next item
        this.rows += 1;
        this.currentRow = [];
    }

    addItem(name, startDate, endDate, solution) {

        if(!this.shouldShow(startDate, endDate)) {
            return;
        }

        const startCol = this.dateToColumn(startDate),
              endCol = this.dateToColumn(endDate);
        
        // do we need to add a new row?
        for(let existingItem of this.currentRow) {
            if(startCol <= existingItem.endCol && endCol >= existingItem.startCol) {
                this.rows += 1;
                this.currentRow = [];
                this.lanes[this.lanes.length - 1].endRow += 1;
                break;
            }
        }

        // have we extended to a new column?
        this.columns = Math.max(this.columns, endCol + 1);

        // create and add new item
        const item = {name, startCol, endCol, solution, row: this.rows - 1};

        this.bars.push(item);
        this.currentRow.push(item);

        return item;
    }

    addHeaders() {
        const firstDate = moment.utc(this.startDate),
              lastDate =  (_.isNull(this.endDate)? moment.utc(this.startDate).add(this.columns, 'days') : moment.utc(this.endDate)).endOf('month'),
              dateRange = moment.range(firstDate, lastDate);
        
        let currentMonth = null, currentColumn = 0;

        for(let day of dateRange.by('days')) {
            let startOfMonth = moment.utc(day).startOf('month');

            // new month => new header
            if(currentMonth === null || !currentMonth.isSame(startOfMonth)) {
                currentMonth = startOfMonth;
                this.headers.push({
                    name: startOfMonth.format("MMM 'YY"),
                    startCol: currentColumn,
                    endCol: currentColumn,
                    startDay: day.toDate(),
                    endDay: day.toDate()
                })
            }
            
            // new day => update end column of header
            this.headers[this.headers.length - 1].endCol = currentColumn;
            this.headers[this.headers.length - 1].endDay = day.toDate();
            
            ++currentColumn;
        }

        this.columns = Math.max(this.columns, currentColumn);
    }

    shouldShow(startDate, endDate) {
        const start = moment.utc(startDate),
              end = moment.utc(endDate);

        // if there is some overlap, we will truncate the rest
        return end.isSameOrAfter(this.startDate) && (!this.endDate || start.isSameOrBefore(this.endDate));
    }

    dateToColumn(date) {
        let d = moment.utc(date);

        // bound to the configured start/end dates
        if(d.isBefore(this.startDate)) {
            d = moment.utc(this.startDate);
        } else if(this.endDate !== null && d.isAfter(this.endDate)) {
            d = moment.utc(this.endDate);
        }

        return moment.utc(d).diff(this.startDate, 'days');
    }

} 

class GridWriter {

    constructor({project, grid, pptx, groupBy, headerBox, lanesBox, barsBox, rowHeight, barPadding, maxColWidth, onNewSlide}) {
        this.project = project;
        this.grid = grid;
        this.pptx = pptx;
        this.groupBy = groupBy;

        this.slides = [];

        this.headerBox = headerBox;  // {x, y, w, h}
        this.lanesBox = lanesBox; // {x, y, w, h}
        this.barsBox = barsBox;  // {x, y, w, h}
        this.rowHeight = rowHeight;
        this.barPadding = barPadding;
        this.maxColWidth = maxColWidth;
        this.onNewSlide = onNewSlide; // (slide) => {}

        this.colWidth = grid.columns === 0? this.maxColWidth : Math.min(_.floor(this.barsBox.w / this.grid.columns, 5), this.maxColWidth);
        this.rowsPerSlide = _.floor(this.barsBox.h / this.rowHeight, 0);
        this.totalSlides = _.ceil(this.grid.rows / this.rowsPerSlide);
    }

    write() {

        for(let i = 0; i < this.totalSlides; ++i) {
            this.createSlide();
        }

        const padding = this.barPadding || 0;

        for(let bar of this.grid.bars) {

            let slideIndex = this.rowToSlide(bar.row),
                slide = this.slides[slideIndex],
                name = this.barToName(bar),
                x = this.colToX(this.barsBox, bar.startCol),
                y = this.rowToY(this.barsBox, bar.row) + padding,
                w = this.colsToWidth((bar.endCol - bar.startCol) + 1),
                h = this.rowHeight - (padding * 2);
            
            slide.addText(name, { 
                shape: this.pptx.shapes.CHEVRON,
                align: 'l',
                x, y, w, h,
                shrinkText: true,
                fontSize: 10,
                color: this.pptx.colors.TEXT1,
                fill: this.pptx.colors.ACCENT1,
                line: this.pptx.colors.TEXT1,
                lineSize: 0
            });
        
        }

    }

    createSlide() {
        let slide = this.pptx.addNewSlide();

        this.writeHeader(slide, this.slides.length);
        this.writeLanes(slide, this.slides.length);

        if(this.onNewSlide) {
            this.onNewSlide(slide)
        }

        this.slides.push(slide);
    }

    writeHeader(slide, slideNumber) {
        for(let header of this.grid.headers) {

            let name = header.name,
                x = this.colToX(this.headerBox, header.startCol),
                y = this.headerBox.y,
                w = this.colsToWidth((header.endCol - header.startCol) + 1),
                h = this.rowHeight;
            
            slide.addText(name, { 
                shape: this.pptx.shapes.RECTANGLE,
                align: 'c',
                x, y, w, h,
                bold: true,
                shrinkText: true,
                fontSize: 10,
                color: this.pptx.colors.TEXT1,
                fill: this.pptx.colors.BACKGROUND1,
                line: this.pptx.colors.TEXT1,
                lineSize: 1
            });
        }
    }

    writeLanes(slide, slideNumber) {

        if(!this.groupBy || this.grid.lanes.length <= 1 || this.groupBy === GroupBy.solution) {
            return;
        }

        const firstRowOnSlide = slideNumber * this.rowsPerSlide,
              lastRowOnSlide = firstRowOnSlide + this.rowsPerSlide - 1;

        for(let lane of this.grid.lanes) {

            let startRow = lane.startRow,
                endRow = lane.endRow;
            
            if(endRow < firstRowOnSlide || startRow > lastRowOnSlide) {
                continue;
            }

            startRow = Math.max(firstRowOnSlide, startRow);
            endRow = Math.min(lastRowOnSlide, endRow);

            let name = lane.name,
                x = this.lanesBox.x,
                y = this.rowToY(this.lanesBox, startRow),
                w = this.lanesBox.w,
                h = this.rowsToHeight((endRow - startRow) + 1);
            
            slide.addText(name, { 
                shape: this.pptx.shapes.RECTANGLE,
                align: 'c',
                valign: 'middle',
                x, y, w, h,
                bold: true,
                shrinkText: true,
                fontSize: 10,
                color: this.pptx.colors.TEXT1,
                fill: this.pptx.colors.BACKGROUND1,
                line: this.pptx.colors.TEXT1,
                lineSize: 1
            });
        }

    }

    barToName(bar) {
        const project = this.project,
              solution = bar.solution,
              team = _.find(project.teams || [], t => t._id === solution.teamId),
              workstream = _.find(project.workstreams || [], t => t._id === solution.workstreamId);
        
        return this.groupBy === GroupBy.team? `${workstream && (workstream.name + ': ') || ""}${solution.name}` :
               this.groupBy === GroupBy.workstream? `${solution.name}${team && (' [' + team.name + ']') || ""}` :
               `${workstream && (workstream.name + ': ') || ""}${solution.name}${team && (' [' + team.name + ']') || ""}`
    }

    // row -> slide index
    rowToSlide(row) {
        return _.floor(row / this.rowsPerSlide);
    }

    // col -> x coordinate in inches for top left of box
    colToX(box, col) {
        return box.x + (col * this.colWidth);
    }

    // row (on current page) -> y coordinate in inches for top left of box
    rowToY(box, row) {
        return box.y + ((row % this.rowsPerSlide) * this.rowHeight);
    }

    // cols -> width in inches
    colsToWidth(cols) {
        return cols * this.colWidth;
    }

    // rows -> height in inches
    rowsToHeight(rows) {
        return rows * this.rowHeight;
    }

}

export default class POAPExport extends Component {

    static propTypes = {
        project: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {
            invalid: false,
            groupBy: GroupBy.solution,
            startDate: props.project.startDate,
            endDate: null,
            percentile: 0.85,
            runs: 1000
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState) || !_.isEqual(this.props, nextProps);
    }

    render() {
        return (                
            <div className="project-poap">

                <form onSubmit={this.downloadPlan.bind(this)}>

                    {this.state.invalid? <Alert bsStyle="danger">Please correct the indicated errors</Alert> : ""}

                    <FormGroup className="number-input">
                        <ControlLabel>Simulations</ControlLabel>
                        <FormControl
                            type="number"
                            min={100}
                            max={10000}
                            value={this.state.runs || ""}
                            onChange={e => {
                                if(_.isEmpty(e.target.value)) {
                                    this.setState({runs: null});
                                    return;
                                }

                                const value = parseInt(e.target.value, 10)
                                if(_.isNaN(value) || value < 0 || value > 10000) {
                                    return;
                                }
                                this.setState({runs: value})
                            }}
                            />
                        <FormControl.Feedback />
                        <HelpBlock>The number of runs of the simulator. More runs means a more nuanced result, but this will also take more time.</HelpBlock>
                    </FormGroup>
                            
                    <FormGroup className="dropdown-input">
                        <ControlLabel>Confidence level</ControlLabel>
                        <Select
                            value={this.state.percentile}
                            clearable={false}
                            required
                            onChange={option => { this.setState({ percentile: option? option.value : 0.85 }); }}
                            options={[1, 0.99, 0.95, 0.9, 0.85, 0.75, 0.5, 0.25].map(v => (
                                { value: v, label: `${Math.round(v * 100)}%` }
                            ))}
                            />
                        <FormControl.Feedback />
                        <HelpBlock>The confidence percentile to use to simulate the plan.</HelpBlock>
                    </FormGroup>

                    <FormGroup className="dropdown-input">
                        <ControlLabel>Group by</ControlLabel>
                        <Select
                            value={this.state.groupBy}
                            clearable={false}
                            onChange={value => { this.setState({ groupBy: value.value }); }}
                            options={[
                                { value: GroupBy.solution, label: "Solution" },
                                { value: GroupBy.team, label: "Team" },
                                { value: GroupBy.workstream, label: "Work stream" }
                            ]}
                            />
                        <FormControl.Feedback />
                        <HelpBlock>How to group the plan.</HelpBlock>
                    </FormGroup>

                    <FormGroup className="date-input">
                        <ControlLabel>Start date</ControlLabel>
                        <DatePicker
                            weekStartsOn={1}
                            showClearButton={false}
                            value={this.state.startDate? moment(this.state.startDate).format(ISO) : null}
                            onChange={value => { this.setState({ startDate: value? moment.utc(value, ISO).toDate() : null }); }}
                            dateFormat={DATE_FORMAT}
                            />
                        <FormControl.Feedback />
                        <HelpBlock>The first date to show in the plan. Defaults to the project start date.</HelpBlock>
                    </FormGroup>
                    
                    <FormGroup className="date-input">
                        <ControlLabel>End date</ControlLabel>
                        <DatePicker
                            weekStartsOn={1}
                            showClearButton
                            value={this.state.endDate? moment(this.state.endDate).format(ISO) : null}
                            onChange={value => { this.setState({ endDate: value? moment.utc(value, ISO).toDate() : null }); }}
                            dateFormat={DATE_FORMAT}
                            />
                        <FormControl.Feedback />
                        <HelpBlock>The last date to show in the plan. Defaults to the last day in the simulation.</HelpBlock>
                    </FormGroup>
                    
                    <ButtonToolbar>
                        <Button type="submit" bsStyle="primary" onClick={this.downloadPlan.bind(this)}>Download plan</Button>
                    </ButtonToolbar>

                </form>
                
            </div>
        );

    }

    downloadPlan(e) {

        e.preventDefault();

        const project = this.props.project,
              percentile = this.state.percentile,
              groupBy = this.state.groupBy,
              slideName = `${project.name} @ ${_.round(percentile * 100.0)}${getSuffix(_.round(percentile * 100.0))} percentile`,
              simulationResults = simulateProject(project, [percentile], this.state.runs),
              grid = new GridPlanner(project, simulationResults, groupBy, this.state.startDate, this.state.endDate || null);

        grid.build();

        let pptx = new PptxGenJS();
        pptx.setBrowser(true);
        pptx.setLayout({ name: 'A3', width: 16.5, height: 11.7 });
        
        const writer = new GridWriter({
            project, grid, pptx, groupBy,
            headerBox: {x: 1.57, y: 1.18, w: 14.7, h: 0.31},
            lanesBox: {x: 0.31, y: 1.57, w: 1.09, h: 9.90},
            barsBox: {x: 1.57, y: 1.57, w: 14.7, h: 9.90},
            rowHeight: 0.31,
            barPadding: 0.02,
            maxColWidth: 0.16,
            onNewSlide: (slide) => {
                slide.addText(slideName, {
                    align: 'l',
                    x: 0.31,
                    y: 0.39,
                    bold: true,
                    fontSize: 28,
                    color: pptx.colors.TEXT1
                })
            }
        });

        writer.write();

        pptx.save(sanitize(slideName));
    }

}