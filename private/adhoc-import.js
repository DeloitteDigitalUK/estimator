const fs = require('fs');
const parse = require('csv-parse/lib/sync');

function randomId() {

    const chars = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";

    function choice() {
        let index = Math.floor(Math.random() * chars.length);
        return chars.substr(index, 1);
    }

    let digits = [];
    for (let i = 0; i < 17; i++) {
        digits[i] = choice();
    }
                                                                                                                 
    return digits.join("");
}

function newSolution(options) {
    return {
        _id: options['id'],
        name: options['name'],
        description: options['description'] || null,
        notes: options['notes'] || null,

        estimateType: 'backlog',
        throughputPeriodLength: options['throughputPeriodLength'] || 1,
        
        startType: options['startType'] || "immediately",
        startDate: null,
        startDependency: options['startDependency'] || null,
        
        backlog: {
            lowGuess: options['backlog.lowGuess'],
            highGuess: options['backlog.highGuess'],
            lowSplitRate: options['backlog.lowSplitRate'] || 1,
            highSplitRate: options['backlog.highSplitRate'] || 1
        },

        risks: [],
        
        team: {
            members: [],
            throughputType: "estimate",
            throughputSamples: [],
            throughputEstimate: {
                lowGuess: options['team.throughputEstimate.lowGuess'],
                highGuess: options['team.throughputEstimate.highGuess']
            },
            rampUp: null,
            workPattern: []
        }
    };
}

const file = "/Users/maraspeli/Downloads/estimator-import.csv"
const data = fs.readFileSync(file);

const records = parse(data, {
    columns: true,
    cast: true
})

// Turn IDs into Meteor IDs
let idMap = {};

records.forEach(record => {
    const newId = randomId();
    idMap[record['id']] = newId;

    record['id'] = newId;
});

records.forEach(record => {
    if(record['startDependency']) {
        if(!idMap[record['startDependency']]) {
            throw "Start dependency " + record['startDependency'] + " not found!";
        }
        record['startDependency'] = idMap[record['startDependency']]
    }
})

// Build JSON
const solutions = records.map(newSolution);

console.log(JSON.stringify(solutions, null, 2));
