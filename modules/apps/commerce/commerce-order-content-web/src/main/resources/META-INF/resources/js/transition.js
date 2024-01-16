/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export default ({namespace}) => {
	Liferay.provide(
		window,
		`${namespace}transition`,
		(event) => {
			const link = event.currentTarget;

			const workflowTaskId = parseInt(link.getData('workflowTaskId'), 10);

			const form = document.getElementById(
				`${namespace}transitionFm`
			);

			document.getElementById(
				`${namespace}transitionCommerceOrderId`
			).value = link.getData('commerceOrderId');
			document.getElementById(
				`${namespace}workflowTaskId`
			).value = workflowTaskId;
			document.getElementById(
				`${namespace}transitionName`
			).value = link.getData('transitionName');

			if (workflowTaskId <= 0) {
				submitForm(form);

				return;
			}

			const transitionComments = document.getElementById(
				`${namespace}transitionComments`
			);

			transitionComments.classList.remove('hide');

			const dialog = Liferay.Util.Window.getWindow({
				dialog: {
					bodyContent: form,
					destroyOnHide: true,
					height: 400,
					resizable: false,
					toolbars: {
						footer: [
							{
								cssClass: 'btn-primary mr-2',
								label: '<liferay-ui:message key="done" />',
								on: {
									click: function () {
										submitForm(form);
									},
								},
							},
							{
								cssClass: 'btn-cancel',
								label: '<liferay-ui:message key="cancel" />',
								on: {
									click: function () {
										dialog.hide();
									},
								},
							},
						],
						header: [
							{
								cssClass: 'close',
								discardDefaultButtonCssClasses: true,
								labelHTML:
									'<span aria-hidden="true">&times;</span>',
								on: {
									click: function (event) {
										dialog.hide();
									},
								},
							},
						],
					},
					width: 720,
				},
				title: link.text(),
			});
		},
		['aui-base', 'liferay-util-window']
	);
}