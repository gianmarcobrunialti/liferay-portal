/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayButton from '@clayui/button';
import ClayModal from '@clayui/modal';
import {sub} from 'frontend-js-web';
import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {
    IBulkActionFDSData,
    IBulkActionTaskStarterDTO,
} from '../../../common/types/BulkActionTask';
import {displayErrorToast} from '../../../common/utils/toastUtil';
import AssetCategories from '../../info_panel/components/AssetCategories';
import {EntryCategorizationDTO} from '../../info_panel/services/ObjectEntryService';
import {triggerAssetBulkAction} from '../../props_transformer/actions/triggerAssetBulkAction';
import {ClayRadio, ClayRadioGroup} from "@clayui/form";
import VocabularyService from "../../../common/services/VocabularyService";
import {IAssetTaxonomyVocabulary} from "../../../common/types/AssetType";
import {
    getModalDescription,
    getScopeAttributes,
    toTaxonomyCategoryDTO
} from "../utils/BulkCategorizationModalUtil";
import {OBJECT_ENTRY_FOLDER_CLASS_NAME} from "../../../common/utils/constants";

export default function EditAssetCategoriesModalContent({
    apiURL,
    assetLibraries,
    closeModal,
    cmsGroupId,
    selectedData: selected,
}: {
    apiURL?: string;
    assetLibraries: any;
    closeModal: () => void;
    cmsGroupId: number;
    selectedData: IBulkActionFDSData;
}) {
    const selectedData = useMemo(() => ({
        ...selected,
        items: selected?.items?.filter(
            ({entryClassName}) => entryClassName !==
                                  OBJECT_ENTRY_FOLDER_CLASS_NAME
        ) || [],
    }),
    [selected]
    );

    const [categorizationDTO, setCategorizationDTO] =
        useState<EntryCategorizationDTO>({
            ...getScopeAttributes(selectedData),
            taxonomyCategoryBriefs: [],
            taxonomyCategoryIds: [],
        } as unknown as EntryCategorizationDTO);
    const [commonRequested, setCommonRequested] = useState<boolean>(false);
    const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);
    const [selectedOperation, setSelectedOperation] = useState<string>('add');

    const hasUpdatePermission = useMemo(() =>
        selectedData.items?.every(({actions}) =>
            !!actions?.update?.href || false) || false,
        [selectedData]);

    const doBulkSubmit = useCallback(async () => {
        setSubmitDisabled(true);

        triggerAssetBulkAction({
            apiURL,
            keyValues: {
                append: selectedOperation === 'add',
                taxonomyCategoryIdsToAdd: categorizationDTO.taxonomyCategoryIdsToAdd,
                taxonomyCategoryIdsToRemove: categorizationDTO.taxonomyCategoryIdsToRemove,
            },
            onCreateError: ({error}) => {
                setSubmitDisabled(false);

                displayErrorToast(error as string);
            },
            onCreateSuccess: (response) => {
                if (response.error) {
                    setSubmitDisabled(false);

                    displayErrorToast(response.error as string);

                    return;
                }

                closeModal();
            },
            overrideDefaultErrorToast: true,
            selectedData,
            type: 'TaxonomyCategoryBulkAction',
        } as IBulkActionTaskStarterDTO<'TaxonomyCategoryBulkAction'>);
    }, [
        apiURL,
        categorizationDTO,
        closeModal,
        selectedData,
        setSubmitDisabled,
    ]);

    const getCommonCategories = useCallback(async () => {
        const {
            scopeId,
            systemProperties: {
                objectDefinitionBrief: {
                    classNameId = -1
                } = {},
            },
        } = categorizationDTO;

        if ((classNameId < 0 && scopeId < 0) || commonRequested) {
            return;
        }

        try {
            const {data: {items}, error} =
                await VocabularyService.getCommonCategories(
                    cmsGroupId, selectedData);

            if (error) {
                throw new Error('Unable to set common categories.');
            }

            setCommonRequested(true);

            setCategorizationDTO({
                ...categorizationDTO,
                ...toTaxonomyCategoryDTO(items as IAssetTaxonomyVocabulary[])
            });
        } catch(error) {
            console.error(error);

            displayErrorToast(error as any);
        }
    }, [categorizationDTO, commonRequested]);

    useEffect(() => {
        getCommonCategories();
    }, [getCommonCategories]);

    const updateLocalObjectEntry = useCallback(
        ({lastAddedBrief, lastRemovedBrief, taxonomyCategoryIds, taxonomyCategoryIdsToRemove = []}: EntryCategorizationDTO): void => {
            setCategorizationDTO(({
                taxonomyCategoryBriefs,
                taxonomyCategoryIds: currentIds,
                taxonomyCategoryIdsToAdd,
                taxonomyCategoryIdsToRemove: toRemove = [],
                ...dto
            }) => {
                const updatedToAdd = [
                    ...currentIds,
                    ...taxonomyCategoryIds,
                ];

                if (lastAddedBrief?.embeddedTaxonomyCategory) {
                    taxonomyCategoryBriefs.push(lastAddedBrief);
                }

                if (lastRemovedBrief) {
                    taxonomyCategoryBriefs = taxonomyCategoryBriefs.filter(
                        ({embeddedTaxonomyCategory}) =>
                            lastRemovedBrief.embeddedTaxonomyCategory.id === embeddedTaxonomyCategory.id)
                }

                return {
                    ...dto,
                    taxonomyCategoryBriefs,
                    taxonomyCategoryIds: updatedToAdd,
                    taxonomyCategoryIdsToAdd: updatedToAdd,
                    taxonomyCategoryIdsToRemove: [
                        ...toRemove,
                        ...taxonomyCategoryIdsToRemove,
                    ],
                } as EntryCategorizationDTO
            })
        },
        [setCategorizationDTO]
    );

    return (
        <>
            <ClayModal.Header
                closeButtonAriaLabel={Liferay.Language.get('close')}
            >
                {Liferay.Language.get('edit-categories')}
            </ClayModal.Header>

            <ClayModal.Body>
                {selectedData.selectAll && (
                    <ClayAlert title="">
                        {Liferay.Language.get(
                            'this-operation-will-not-be-applied-to-any-of-the-selected-folders'
                        )}
                    </ClayAlert>
                )}

                <p>{getModalDescription(selectedData, 'TaxonomyCategoryBulkAction')}</p>

                <ClayRadioGroup
                    className="mb-4"
                    name="add-replace"
                    onChange={(value) => setSelectedOperation(value as string)}
                    value={selectedOperation}
                >
                    <ClayRadio
                        checked={true}
                        label={Liferay.Language.get('edit')}
                        value="add"
                    >
                        <div className="form-text">
                            {Liferay.Language.get(
                                'add-new-categories-or-remove-common-categories'
                            )}
                        </div>
                    </ClayRadio>

                    <ClayRadio
                        label={Liferay.Language.get('replace')}
                        value="replace"
                    >
                        <div className="form-text">
                            {Liferay.Language.get(
                                'these-categories-replace-all-existing-categories'
                            )}
                        </div>
                    </ClayRadio>
                </ClayRadioGroup>

                <AssetCategories
                    collapsable={false}
                    cmsGroupId={cmsGroupId}
                    hasUpdatePermission={hasUpdatePermission}
                    objectEntry={categorizationDTO}
                    updateObjectEntry={updateLocalObjectEntry}
                />
            </ClayModal.Body>

            <ClayModal.Footer
                last={
                    <ClayButton.Group spaced>
                        <ClayButton
                            displayType="secondary"
                            onClick={closeModal}
                        >
                            {Liferay.Language.get('cancel')}
                        </ClayButton>

                        <ClayButton
                            disabled={
                                !(
                                    categorizationDTO?.taxonomyCategoryIdsToAdd?.length ||
                                    categorizationDTO?.taxonomyCategoryIdsToAdd?.length
                                ) || submitDisabled
                            }
                            displayType="primary"
                            onClick={doBulkSubmit}
                            type="button"
                        >
                            {Liferay.Language.get('save')}
                        </ClayButton>
                    </ClayButton.Group>
                }
            />
        </>
    );
}
