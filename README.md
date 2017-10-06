# Estimator

A Monte Carlo simulation-based software project estimation tool, based on the excellent
work of Troy Magennis and FocusedObjective.

See the [FocusedObjective.Resources repository](http://github.com/FocusedObjective/FocusedObjective.Resources),
in particular the "Throughput Forecaster", of which this is in essence a web based version.

Build using [Meteor](https://www.meteor.com/) and [ReactJS](https://reactjs.org/).

## Run locally

```
$ curl https://install.meteor.com/ | sh
$ meteor npm install
$ meteor
```

Now open a web browser to `http://localhost:3000`. The initial administrator
login is `admin@example.org` with password `secret`.

**Warning:** You must change the administrator password immediately.

## Run tests

To run unit tests:

```
$ npm test
```

Open a web browser to `http://localhost:3000` to see test results.

To run integration tests:

```
$ npm run app-test
```

Open a web browser to `http://localhost:3000` to see test results.

## Authors

* Martin Aspeli <optilude@gmail.com>

## Changelog

* `0.1.0` (2017-10-06) -- Initial release
