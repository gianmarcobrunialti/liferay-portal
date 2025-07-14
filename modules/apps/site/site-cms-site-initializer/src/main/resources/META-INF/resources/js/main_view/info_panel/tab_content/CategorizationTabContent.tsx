/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import Autocomplete from '@clayui/autocomplete';
import {Heading} from '@clayui/core';
import {useResource} from '@clayui/data-provider';
import Label from '@clayui/label';
import Panel from '@clayui/panel';
import {fetch, sub} from 'frontend-js-web';
import React, {useCallback, useContext, useEffect, useState} from 'react';

import {AssetTypeInfoPanelContext} from '../context';

interface IGroupedTaxonomyCategory {
	[id: number]: ITaxonomyCategoryFacade[];
}

interface ITaxonomyCategoryFacade {
	id: string;
	name?: string;
	parentTaxonomyVocabulary: ITaxonomyVocabulary;
	taxonomyVocabularyId: number;
}

interface ITaxonomyVocabulary {
	id: number;
	name: string;
}

const CategorizationTabContent = () => {
	const {objectEntries = []} = useContext(AssetTypeInfoPanelContext);

	const [formattedTaxonomyCategories, setFormattedTaxonomyCategories] =
		useState([] as ITaxonomyCategoryFacade[]);
	const [groupedTaxonomyCategories, setGroupedTaxonomyCategories] = useState(
		{} as IGroupedTaxonomyCategory
	);
	const [objectEntry, setObjectEntry] = useState(objectEntries[0].embedded);
	const [keywordValue, setKeywordValue] = useState('');
	const [keywords, setKeywords] = useState(objectEntry.keywords || []);
	const [taxonomyCategoryValue, setTaxonomyCategoryValue] = useState('');

	const [headlessTaxonomyCategoriesNetworkStatus, setHeadlessTaxonomyCategoriesNetworkStatus] = useState(4);
	const [headlessKeywordsNetworkStatus, setHeadlessKeywordsNetworkStatus] = useState(4);
	const HeadlessTaxonomyCategoriesResource = useResource(
		{
			fetch,
		// link: `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-admin-taxonomy/v1.0/sites/${Liferay.ThemeDisplay.getSiteGroupId()}/taxonomy-categories`,
		link: `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/36891/taxonomy-categories`,
		onNetworkStatusChange: setHeadlessTaxonomyCategoriesNetworkStatus,
	});
	const HeadlessKeywordsResource = useResource({
		fetch,
		//link: `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-admin-taxonomy/v1.0/sites/${Liferay.ThemeDisplay.getSiteGroupId()}/keywords`,
		link: `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-admin-taxonomy/v1.0/keywords`,
		onNetworkStatusChange: setHeadlessKeywordsNetworkStatus,
	});

	const formatTaxonomyCategory = (
		taxonomyCategory: any
	): ITaxonomyCategoryFacade => {
		return {
			id: taxonomyCategory.id,
			name: taxonomyCategory.name,
			parentTaxonomyVocabulary:
				taxonomyCategory.parentTaxonomyVocabulary || {},
			taxonomyVocabularyId: taxonomyCategory.taxonomyVocabularyId,
		};
	};

	const updateTaxonomyCategories = useCallback(
		(formattedTaxonomyCategories: ITaxonomyCategoryFacade[], keywords: string[]) => {
			const originalTaxonomyCategoryIds =
				objectEntry.taxonomyCategoryIds || [];
			const taxonomyCategoryIds = formattedTaxonomyCategories.map(
				({id}) => parseInt(id, 10)
			);

			if (
				originalTaxonomyCategoryIds.length ===
				taxonomyCategoryIds.length
			) {
				return;
			}

			fetch(
				`${objectEntries[0].actions.update.href}?nestedFields=embeddedTaxonomyCategory`,
				{
					body: JSON.stringify({
						...objectEntry,
						actions: undefined,
						keywords,
						taxonomyCategoryIds,
					} as any),
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'x-csrf-token': Liferay.authToken,
					},
					method: 'PATCH',
				}
			)
				.then((response: Response) => {
					if (response.ok) {
						return response.json();
					}

					return Promise.reject(response);
				})
				.then((objectEntry) => {
					setGroupedTaxonomyCategories(
						formattedTaxonomyCategories.reduce(
							(
								groupedTaxonomyCategories: any,
								taxonomyCategory: ITaxonomyCategoryFacade
							) => {
								const taxonomyCategories =
									groupedTaxonomyCategories[
										taxonomyCategory.taxonomyVocabularyId
									] || [];

								taxonomyCategories.push(taxonomyCategory);

								return {
									...groupedTaxonomyCategories,
									[taxonomyCategory.taxonomyVocabularyId]:
										taxonomyCategories,
								};
							},
							{} as IGroupedTaxonomyCategory
						)
					);

					setObjectEntry(objectEntry);
					setTaxonomyCategoryValue('')
				})
				.catch((error) => Promise.reject(error));
		},
		[
			objectEntries,
			objectEntry,
			setGroupedTaxonomyCategories,
			setObjectEntry,
		]
	);
	useEffect(() => {
		fetch(
			`${objectEntries[0].actions.get.href}?nestedFields=embeddedTaxonomyCategory`,
			{
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'x-csrf-token': Liferay.authToken,
				},
				method: 'GET',
			}
		)
			.then((response: Response) => {
				if (response.ok) {
					return response.json();
				}

				return Promise.reject(response);
			})
			.then((objectEntry) => {
				setObjectEntry(objectEntry);

				const formattedTaxonomyCategoryBriefs = (
					objectEntry.taxonomyCategoryBriefs || []
				).map(
					(taxonomyCategoryBrief: any) =>
						formatTaxonomyCategory(
							taxonomyCategoryBrief.embeddedTaxonomyCategory
						),
					[]
				);

				setFormattedTaxonomyCategories(formattedTaxonomyCategoryBriefs);
			})
			.catch((error) => Promise.reject(error));
	}, [objectEntries, setFormattedTaxonomyCategories, setObjectEntry]);
	useEffect(() => {
		updateTaxonomyCategories(formattedTaxonomyCategories, keywords);
	}, [formattedTaxonomyCategories, keywords]);

	return (
		<Panel
			collapsable
			displayTitle={Liferay.Language.get('categories')}
			displayType="secondary"
			expanded
			showCollapseIcon={true}
		>
			<Panel.Body>
				<>
					<Autocomplete
						filterKey="name"
						items={HeadlessTaxonomyCategoriesResource.resource?.items ?? []}
						loadingState={headlessTaxonomyCategoriesNetworkStatus}
						onChange={setTaxonomyCategoryValue}
						placeholder="Add a category"
						value={taxonomyCategoryValue}
					>
						{(item: any) => (
							<Autocomplete.Item
								key={item.id}
								onClick={() =>
									setFormattedTaxonomyCategories([
										...formattedTaxonomyCategories,
										formatTaxonomyCategory(item),
									])
								}
								textValue={item.name}
							/>
						)}
					</Autocomplete>

					{Object.entries(groupedTaxonomyCategories).map(
						([id, curGroupedTaxonomyCategories]) => {
							return (
								<div
									className="pt-3"
									key="taxonomy-categories-container"
								>
									<Heading key={id} level={6} weight="bold">
										{
											curGroupedTaxonomyCategories[0]
												.parentTaxonomyVocabulary.name
										}
									</Heading>

									{curGroupedTaxonomyCategories.map(
										(
											taxonomyCategory: ITaxonomyCategoryFacade
										) => {
											return (
												<Label
													closeButtonProps={{
														'aria-label':
															Liferay.Language.get(
																'close'
															),
														'onClick': () => {
															const curFormattedTaxonomyCategories =
																structuredClone(
																	formattedTaxonomyCategories
																);

															const index =
																curFormattedTaxonomyCategories.findIndex(
																	(
																		curFormattedTaxonomyCategory: ITaxonomyCategoryFacade
																	) =>
																		curFormattedTaxonomyCategory.id ===
																		taxonomyCategory.id
																);

															if (index !== -1) {
																curFormattedTaxonomyCategories.splice(
																	index,
																	1
																);

																setFormattedTaxonomyCategories(
																	curFormattedTaxonomyCategories
																);
															}
														},
														'title':
															Liferay.Language.get(
																'close'
															),
													}}
													displayType="secondary"
													key={`${taxonomyCategory.taxonomyVocabularyId}_${taxonomyCategory.id}`}
												>
													{taxonomyCategory.name}
												</Label>
											);
										}
									)}
								</div>
							);
						}
					)}

					<Autocomplete
						allowsCustomValue={true}
						filterKey="name"
						items={HeadlessKeywordsResource.resource?.items ?? []}
						loadingState={headlessKeywordsNetworkStatus}
						onChange={setKeywordValue}
						placeholder="Add a tag"
						value={keywordValue}
					>

						{(item: any) => (
							<Autocomplete.Item
								key={item.id}
								onClick={() => {
									if (!keywords.includes(keywordValue)) {
										setKeywords([
											...keywords, keywordValue,
										])
									}

									setKeywordValue('');
								}}
								textValue={item.name}
							/>
						)}
					</Autocomplete>

					{keywords.map(
						(tag: string, index: number) => {
							return (
								<Label
									closeButtonProps={{
										'aria-label':
											Liferay.Language.get(
												'close'
											),
										'onClick': () => {
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

												setKeywords(curKeywords);
											}
										},
										'title':
											Liferay.Language.get(
												'close'
											),
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

export default CategorizationTabContent;
