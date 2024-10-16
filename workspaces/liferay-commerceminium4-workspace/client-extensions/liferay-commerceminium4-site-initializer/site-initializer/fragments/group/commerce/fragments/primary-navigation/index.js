import React from 'react';
import ReactDOM from 'react-dom';
import MiniumPrimaryNavigation from 'minium-primary-navigation';

const navigationConfigurationContent = fragmentElement.querySelector('#minium-primary-navigation-data').innerHTML;

ReactDOM.render(
    React.createElement(
        MiniumPrimaryNavigation, {
            entries: JSON.parse(navigationConfigurationContent),
            spritemap: Liferay.Icons.spritemap,
        }
    ),
    fragmentElement
);