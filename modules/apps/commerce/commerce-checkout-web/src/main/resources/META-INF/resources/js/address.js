/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

function setUIOnlyInputRegionName(regions) {
	for (let i = 0; i < regions.length; i++) {
		if (
			regions[i].regionId ===
			selectedOption.dataset.region
		) {
			commerceRegionIdName.value = regions[i].name;

			break;
		}
	}
}

export default ({
	hasManageAddressesPermission,
	isShippingUsedAsBilling,
	namespace,
	paramName,
}) => {
	Liferay.provide(
		window,
		`${namespace}addStreetAddress`,
		() => {
			const addStreetFields = document.querySelector(
				'.add-street-fields');
			const addStreetLink = document.querySelector('.add-street-link');

			if (addStreetFields) {
				addStreetFields.classList.remove('hide');
			}
			if (addStreetLink) {
				addStreetLink.classList.add('hide');
			}
		},
		['aui-base']
	);

	Liferay.provide(
		window,
		`${namespace}clearAddressFields`,
		() => {
			const addressFieldsInputs = document.querySelectorAll(
				'.address-fields input'
			);
			const addressFieldsSelect = document.querySelectorAll(
				'.address-fields select'
			);

			addressFieldsInputs.forEach((input) => {
				input.value = '';
			});

			addressFieldsSelect.forEach((select) => {
				select.selectedIndex = 0;
			});

			const useAsBillingField = document.getElementById(
				`${namespace}use-as-billing`
			);

			if (useAsBillingField) {
				useAsBillingField.checked = isShippingUsedAsBilling;
			}
		},
		['aui-base']
	);

	Liferay.provide(
		window,
		`${namespace}selectAddress`,
		() => {
			const commerceAddress = document.getElementById(
				`${namespace}commerceAddress`
			);
			const commerceAddressParamName = document.getElementById(
				`${namespace}${paramName}`
			);
			const newAddress = document.getElementById(
				`${namespace}newAddress`
			);

			if (newAddress && commerceAddress && commerceAddressParamName) {
				const commerceAddressVal = commerceAddress.value;

				if (commerceAddressVal === '0') {
					window[`${namespace}clearAddressFields`]();

					if (hasManageAddressesPermission) {
						window[`${namespace}toggleAddressFields`](false);
					}
				}
				else {
					window[`${namespace}updateAddressFields`](
						commerceAddress.selectedIndex
					);
					Liferay.Form.get(
						`${namespace}fm`
					).formValidator.validate();
				}

				commerceAddressParamName.value = commerceAddressVal;
				newAddress.value = Number(commerceAddressVal === '0');
			}
		},
		['aui-base']
	);

	Liferay.provide(
		window,
		`${namespace}toggleAddressFields`,
		(state) => {
			Liferay.Util.toggleDisabled(
				document.querySelectorAll('.address-fields input'),
				state
			);
			Liferay.Util.toggleDisabled(
				document.querySelectorAll('.address-fields select'),
				state
			);

			const commerceRegionIdInput = document.getElementById(
				`${namespace}commerceRegionIdInput`
			);
			const commerceRegionIdName = document.getElementById(
				`${namespace}commerceRegionIdName`
			);
			const commerceRegionIdSelect = document.getElementById(
				`${namespace}regionId`
			);

			commerceRegionIdInput.name = 'commerceRegionIdInputDisabled';
			commerceRegionIdName.name = 'commerceRegionIdInputDisabled';
			commerceRegionIdSelect.name = `${namespace}regionId`;

			commerceRegionIdInput.parentElement.classList.add('d-none');
			commerceRegionIdName.parentElement.classList.add('d-none');
			commerceRegionIdSelect.parentElement.classList.remove('d-none');
		},
		['aui-base']
	);

	Liferay.provide(
		window,
		`${namespace}updateAddressFields`,
		(selectedVal) => {
			if (!selectedVal || selectedVal === '0') {
				return;
			}

			const commerceAddress = document.getElementById(
				`${namespace}commerceAddress`
			);

			if (commerceAddress) {
				window[`${namespace}addStreetAddress`]();
				window[`${namespace}toggleAddressFields`](true);

				const city = document.getElementById(`${namespace}city`);
				const countryId = document.getElementById(
					`${namespace}countryId`
				);
				const commerceRegionIdInput = document.getElementById(
					`${namespace}commerceRegionIdInput`
				);
				const commerceRegionIdName = document.getElementById(
					`${namespace}commerceRegionIdName`
				);
				const commerceRegionIdSelect = document.getElementById(
					`${namespace}regionId`
				);
				const name = document.getElementById(`${namespace}name`);
				const phoneNumber = document.getElementById(
					`${namespace}phoneNumber`
				);
				const street1 = document.getElementById(
					`${namespace}street1`
				);
				const street2 = document.getElementById(
					`${namespace}street2`
				);
				const street3 = document.getElementById(
					`${namespace}street3`
				);
				const zip = document.getElementById(`${namespace}zip`);

				if (
					city &&
					countryId &&
					commerceRegionIdInput &&
					commerceRegionIdSelect &&
					commerceRegionIdName &&
					name &&
					phoneNumber &&
					street1 &&
					street2 &&
					street3 &&
					zip
				) {
					const selectedOption =
						commerceAddress.options[commerceAddress.selectedIndex];

					city.value = selectedOption.dataset.city;
					commerceRegionIdInput.value = selectedOption.dataset.region;
					countryId.value = selectedOption.dataset.country;
					name.value = selectedOption.dataset.name;
					phoneNumber.value = selectedOption.dataset.phoneNumber;
					street1.value = selectedOption.dataset['street-1'];
					street2.value = selectedOption.dataset['street-2'];
					street3.value = selectedOption.dataset['street-3'];
					zip.value = selectedOption.dataset.zip;

					commerceRegionIdInput.name = `${namespace}regionId`;
					commerceRegionIdName.name = 'commerceRegionIdNameIgnore';
					commerceRegionIdSelect.name =
						'commerceRegionIdSelectIgnore';

					commerceRegionIdInput.parentElement.classList.add('d-none');
					commerceRegionIdName.parentElement.classList.remove(
						'd-none');
					commerceRegionIdSelect.parentElement.classList.add(
						'd-none');

					Liferay.Service(
						'/region/get-regions',
						{
							active: true,
							countryId: parseInt(
								selectedOption.dataset.country, 10),
						},
						setUIOnlyInputRegionName
					);
				}
			}
		},
		['aui-base']
	);
}