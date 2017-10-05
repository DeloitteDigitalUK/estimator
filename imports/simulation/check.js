import { shuffle, min, max, mean } from 'd3-array';
import moment from 'moment';

/**
 * Check if sample count is reasonable.
 * 
 * @param {Array<{periodStartDate, throughput}>} samples List of throughput samples
 * @param {Integer} min Minimum number of samples expected
 * @param {Integer} max Maximum number of samples expected
 * @returns {Boolean} true if sample count are within range
 */
export function checkSampleCount(samples, min=7, max=25) {
    return (min <= samples.length) && (samples.length <= max);
}

/**
 * Check if samples are too old.
 * 
 * @param {Array<{periodStartDate, throughput}>} samples List of throughput samples
 * @param {Integer} threshold Warn if newest sample is more than this number of days old
 * @param {Date} date Date to calculate from, defaults to today's date
 * @returns {Boolean} true if samples are not too old, false otherwise
 */
export function checkSampleAge(samples, threshold=90, date=null) {
    let newest = null,
        boundary = (date? moment.utc(date) : moment.utc()).subtract(threshold, 'days');

    samples.forEach(s => {
        if(newest === null || moment.utc(s.periodStartDate).isAfter(newest)) {
            newest = s.periodStartDate;
        }
    });

    return newest === null || !boundary.isAfter(newest);
}

/**
 * Check sample distribution is stable
 * 
 * @param {Array<{periodStartDate, throughput}>} samples List of throughput samples
 * @param {Integer} threshold Max percentage error expected
 * @returns {Boolean} true if sample count are within range
 */
export function checkSampleStability(samples, threshold=.25) {
    const right = shuffle(samples.map(s => s.throughput)),
          omax = max(right),
          omin = min(right),
          left = right.splice(0, Math.ceil(right.length / 2)), // mutates `right`
          lmean = mean(left),
          rmean = mean(right),
          error = (Math.abs(lmean - rmean) * 1.0) / (omax - omin);

    return error <= threshold;
}

/**
 * Check that backlog guess has a reasonable spread
 * 
 * @param {Integer} lowGuess Low size guess
 * @param {Integer} highGuess High size guess
 * @param {Float} threshold Min percentage difference between the two
 * @returns {Boolean} true if the range is reasonable
 */
export function checkBacklogGuess(lowGuess, highGuess, threshold=0.1) {
    return lowGuess === 0? true : ((highGuess - lowGuess) / (1.0 * lowGuess)) >= threshold;
}
