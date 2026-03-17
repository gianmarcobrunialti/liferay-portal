/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useState} from "react";
import ClayIcon from '@clayui/icon';
import DropDown from "@clayui/drop-down";
import ClayButton from '@clayui/button';
import '../../../../../../../../../../site-cms-site-initializer/src/main/resources/META-INF/resources/css/RoomTrend.scss';
import {getImage} from "../../../../../../../../../../site-cms-site-initializer/src/main/resources/META-INF/resources/js/common/utils/getImage";

const ROOM_TREND_OPTIONS: Record<string, {
    color: string,
    icon: string,
    label: string,
    percentage: number,
    spritemap?: boolean,
}> = {
    ["cold"]: {
        color: '#4B9FFF',
        icon: 'snow',
        label: Liferay.Language.get('cold'),
        percentage: 10,
        spritemap: true,
    },
    ["closed-lost"]: {
        color: '#DA1414',
        icon: 'times-circle-full',
        label: Liferay.Language.get('closed-lost'),
        percentage: 20,
    },
    ["closed-won"]: {
        color: '#AA33FF',
        icon: 'champion-cup',
        label: Liferay.Language.get('closed-won'),
        percentage: 80,
        spritemap: true,
    },
    ["engaged"]: {
        color: '#6CE0CC',
        icon: 'comments',
        label: Liferay.Language.get('engaged'),
        percentage: 60,
    },
    ["heating-up"]: {
        color: '#FF8133',
        icon: 'heating',
        label: Liferay.Language.get('heating-up'),
        percentage: 50,
        spritemap: true,
    },
    ["hot"]: {
        color: '#FF4F45',
        icon: 'hot',
        label: Liferay.Language.get('hot'),
        percentage: 100,
        spritemap: true,
    },
    ["ready-to-close"]: {
        color: '#5ACA75',
        icon: 'shield-check',
        label: Liferay.Language.get('ready-to-close'),
        percentage: 70,
    },
    ["re-ignited"]: {
        color: '#FF80C8',
        icon: 'reload',
        label: Liferay.Language.get('re-ignited'),
        percentage: 30,
    },
    ["warming-up"]: {
        color: '#FFBB00',
        icon: 'sun',
        label: Liferay.Language.get('warming-up'),
        percentage: 40,
    },
}

const RoomTrend = () => {
    const [trendStatusKey, setTrendStatusKey] = useState('warming-up');

    const {color, icon, label, percentage, spritemap} = ROOM_TREND_OPTIONS[trendStatusKey];

    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const degrees = -90 + (clampedPercentage / 100) * 180;

    return (
        <div className="inline-item inline-item-before room-trend">
            <div>
                <div className="mb-1">
                    <p
                        className="font-weight-semi-bold inline-item
                        inline-item-before mr-1">
                        {Liferay.Language.get('room-trend')}
                    </p>
                    <ClayIcon
                        className="text-secondary"
                        symbol="question-circle-full"
                    />
                </div>
                <DropDown
                    closeOnClick
                    trigger={
                        <ClayButton
                            className="align-items-center d-flex font-weight-normal justify-content-between room-trend-button px-2"
                            displayType="secondary"
                        >
                            <span
                                className="align-items-center d-flex flex-grow-1 overflow-hidden">
                                <ClayIcon
                                    spritemap={spritemap ? "http://localhost:8080/o/site-cms-site-initializer/images/room_trend_icons.svg" : undefined}
                                    className="flex-shrink-0 mr-2"
                                    color={color}
                                    fontSize={16}
                                    symbol={icon}
                                />
                                <span
                                    className="room-trend-button-text text-left text-truncate">
                                    {Liferay.Language.get(label)}
                                </span>
                            </span>
                            <ClayIcon
                                spritemap=""
                                className="flex-shrink-0 ml-2"
                                symbol="caret-double"
                            />
                        </ClayButton>
                    }
                >
                    <DropDown.ItemList>
                        {Object.entries(ROOM_TREND_OPTIONS).map(([key, option]) => (
                            <DropDown.Item
                                key={key}
                                onClick={() => setTrendStatusKey(key)}
                            >
                                <span className="mr-4">
                                    <ClayIcon
                                        spritemap={spritemap ?
                                            "http://localhost:8080/o/site-cms-site-initializer/images/room_trend_icons.svg" :
                                            undefined}
                                        color={option.color}
                                        fontSize={16}
                                        symbol={option.icon ? option.icon : ''}
                                    />
                                </span>
                                {Liferay.Language.get(option.label)}
                            </DropDown.Item>
                        ))}
                    </DropDown.ItemList>
                </DropDown>
            </div>
            <div className="gauge-container inline-item-after ml-4">
                <img
                    alt=""
                    className="room-trend-semicircle"
                    src={getImage('room_trend_semicircle.svg')}
                ></img>

                <img
                    alt=""
                    className="room-trend-pointer"
                    src={getImage('room_trend_pointer.svg')}
                    style={{transform: `rotate(${degrees}deg) translateZ(0)`}}
                ></img>
            </div>
        </div>
    );
}

export default RoomTrend;
