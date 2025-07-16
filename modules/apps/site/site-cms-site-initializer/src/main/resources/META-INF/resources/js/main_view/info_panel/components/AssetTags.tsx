/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import Autocomplete from '@clayui/autocomplete';
import {useResource} from '@clayui/data-provider';
import Label from '@clayui/label';
import Panel from '@clayui/panel';
import {fetch, sub} from 'frontend-js-web';
import React, {useCallback, useEffect, useState} from 'react';
import {IAssetObjectEntry} from "../../../structure_builder/types/AssetType";

const AssetTags = ({
    objectEntry,
    updateObjectEntry
}: {
    objectEntry: IAssetObjectEntry,
    updateObjectEntry: (obj: Pick<IAssetObjectEntry, 'keywords' | 'taxonomyCategoryIds'>) => Promise<any>
}) => {

    const [keywords, setKeywords] = useState([] as string[]);
    const [keywordInputValue, setKeywordInputValue] = useState('');
    const [isCreateNewTag, setIsCreateNewTag] = useState(false);

    const [networkStatus, setNetworkStatus] = useState(4);

    const {resource: {items: originalItems = []}} = useResource({
        fetch,
        //link: `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-admin-taxonomy/v1.0/sites/${Liferay.ThemeDisplay.getSiteGroupId()}/keywords`,
        link: `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-admin-taxonomy/v1.0/keywords`,
        onNetworkStatusChange: setNetworkStatus,
    });

    const [items, setItems] = useState([] as {[key: string]: any}[]);

    const updateKeywords = useCallback((keywords: string[] = []) => {
        setKeywordInputValue('');

        setKeywords(keywords);
    }, [setKeywordInputValue, setKeywords]);

    useEffect(() => {
        setItems(() => {
            if (keywordInputValue.length) {
                return [
                    ...items.filter(
                    ({name}) => name.includes(keywordInputValue))
                ];
            }

            return [...originalItems];
        });
    }, [items, keywordInputValue]);

    useEffect(() => {
        setItems(originalItems);
    }, [originalItems, setItems]);

    useEffect(() => {
        updateKeywords(objectEntry.keywords);
    }, [objectEntry]);

    return (
        <Panel
            displayTitle={Liferay.Language.get('tags')}
            displayType="secondary"
            expanded
            showCollapseIcon={true}
        >
            <Panel.Body>
                <>
                    <Autocomplete
                        items={items}
                        onChange={setKeywordInputValue}
                        loadingState={networkStatus}
                        placeholder="Add a tag"
                        value={keywordInputValue}
                    >
                        {!items.length ? (
                            <Autocomplete.Item textValue="qualcosa" />
                        ) : (items.map((item) => {
                            return (
                                <Autocomplete.Item
                                    key={item.id}
                                    onClick={async (event) => {
                                        event.preventDefault();

                                        if (!keywords.includes(keywordInputValue)) {
                                            await updateObjectEntry({
                                                keywords: [
                                                    ...keywords, keywordInputValue,
                                                ],
                                            });
                                        }
                                    }}
                                    textValue={item.name}
                                />
                            );
                        }))}
                    </Autocomplete>

                    {keywords.map(
                        (tag: string, index: number) => {
                            return (
                                <Label
                                    closeButtonProps={{
                                        'aria-label': Liferay.Language.get('close'),
                                        onClick: async (event) => {
                                            event.preventDefault();

                                            const curKeywords = [...keywords];

                                            const index =
                                                curKeywords.findIndex(
                                                    (value: string) =>
                                                        value === tag
                                                );

                                            if (index !== -1) {
                                                curKeywords.splice(
                                                    index,
                                                    1
                                                );

                                                await updateObjectEntry({keywords: curKeywords});
                                            }
                                        },
                                        title: Liferay.Language.get('close'),
                                    }}
                                    displayType="secondary"
                                    key={`${tag}_${index}`}
                                >
                                    {tag}
                                </Label>
                            );
                        }
                    )}
                </>
            </Panel.Body>
        </Panel>
    );
};

export default AssetTags;
