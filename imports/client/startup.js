import { Meteor } from 'meteor/meteor';

import React from 'react';
import { render } from 'react-dom';

import numbro from 'numbro';
import en_GB from 'numbro/languages/en-GB';

import AppContainer from './components/app';
import { getPublicSetting } from '../utils';

Meteor.startup(() => {

    numbro.culture('en-GB', en_GB);
    numbro.culture(getPublicSetting('locale'));

    render(<AppContainer />, document.getElementById('app'));

});
