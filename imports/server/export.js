import moment_ from 'moment';
import { extendMoment } from 'moment-range';

import simulateProject from '../simulation/project';
import { getPublicSetting, ISO } from '../utils';

const moment = extendMoment(moment_);
const DATE_FORMAT = getPublicSetting('dateFormat');

/**
 * Populate the xlsx-template with a project resource forecast
 */
export function exportProject(template, project, percentile, runs) {

    let simulationResults = simulateProject(project, [percentile], runs);

    let dates = [],
        forecast = [],
        firstDate = moment.utc(project.startDate).startOf('isoWeek'),
        lastDate = moment.utc(project.startDate).endOf('isoWeek');

    simulationResults.forEach(r => {

        forecast.push({
            role: r.solution.name,
            description: "",
            dates: {} // will be converted to a list later
        });

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
                    dates[key] = m.quantity || "";
                }

                forecast.push({
                    role: m.role,
                    description: m.description,
                    dates
                });

            });

        });

        // blank row
        forecast.push({
            role: "",
            description: "",
            dates: {}
        });

    });

    const dateRange = Array.from(moment.range(firstDate, lastDate).by('weeks'));
    dates = dateRange.map(d => d.format(DATE_FORMAT));
    
    forecast.forEach(f => {
        f.dates = dateRange.map(d => {
            const key = d.format(ISO);
            return f.dates[key]? f.dates[key] : "";
        });
    });

    template.substitute('Forecast', {
        projectName: project.name,
        projectDescription: project.description,
        percentile,
        dates,
        forecast
    });

}
