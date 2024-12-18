/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useState, useRef, useCallback, useEffect} from 'react';
import ClayModal from "@clayui/modal";
import {
	SIGN_IN,
	SIGN_UP,
	getAccountTypes,
	getIframeDOMHooks,
	resizeIframeHeight,
	storeAccountInformation,
} from "../util/guestModal";
import ClayButton from "@clayui/button";
import ClayForm, {ClayInput, ClaySelect} from "@clayui/form";
import ClayIcon from "@clayui/icon";
import {Col, Row} from "@clayui/layout";
import classnames from "classnames";

function SignUpModalView({
	setActiveView,
	setAlert,
	setIsLoading,
	setIsVisible,
	viewsMap
}) {
	const [accountName, setAccountName] = useState('');
	const [accountType, setAccountType] = useState('');
	const [availableAccountTypes] = useState(getAccountTypes());
	const [errors, setErrors] = useState({accountName: false, accountType: false});

	const iframeFormRef = useRef(null);
	const iframeLoadedOnceRef = useRef(false);
	const iframeRef = useRef(null);
	const iframeSubmitRef = useRef(null);

	const attachFormListener = useCallback(() => {
		const handler = (event) => {
			const hasFormErrors = event.target.querySelector('.has-error');

			if (errors.accountName || errors.accountType || hasFormErrors) {
				event.preventDefault();

				resizeIframeHeight(iframeRef.current, iframeFormRef.current);

				return false;
			}

			setIsLoading(true);

			return event;
		};

		if (iframeSubmitRef.current) {
			iframeSubmitRef.current.addEventListener('click', handler);
		}
	}, [errors, setIsLoading]);

	const onLoad = useCallback((event) => {
		const iframeBody =
			iframeRef.current?.contentDocument.body;

		if (iframeBody) {
			if (iframeLoadedOnceRef.current) {
				const signUpSuccessMessage = iframeBody
					.querySelector('.login-container .alert-success')?.innerText;

				if (accountName && accountType && signUpSuccessMessage) {
					storeAccountInformation({accountName, accountType});


					setAlert({message: signUpSuccessMessage, type: 'success'});
					setActiveView(SIGN_IN);
				}

				return;
			}

			iframeLoadedOnceRef.current = true;

			const {form, submitButton} =
				getIframeDOMHooks(iframeRef.current, SIGN_UP);

			iframeFormRef.current = form;
			iframeSubmitRef.current = submitButton;

			attachFormListener();

			setIsLoading(false);
		}

		return event;
	}, [
		accountName,
		accountType,
		attachFormListener,
	]);

	const doSubmit = useCallback((event) => {
		event.preventDefault();

		setErrors({
			accountName: !accountName,
			accountType: !accountType,
		});
	}, [
		accountName,
		accountType,
		setIsLoading,
	]);

	useEffect(() => {
		if (iframeSubmitRef.current) {
			iframeSubmitRef.current.click();
		}
	}, [errors]);

	useEffect(() => {
		if (availableAccountTypes.length === 1) {
			setAccountType(availableAccountTypes[0]);
		}
	}, [availableAccountTypes, setAccountType]);

	return(
		<>
			<ClayModal.Body style={{height: '60vh'}}>
				<ClayForm.Group className="mb-3 px-1">
					<h3 className="mb-3 sheet-subtitle">
						{Liferay.Language.get('account-detail')}
					</h3>

					<Row>
						<Col>
							<ClayForm.Group className={
								classnames('mb-3', {
									'has-error': errors.accountName
								})
							}>
								<label htmlFor="accountName">
									{Liferay.Language.get('account-name')}

									<span className="ml-1 reference-mark">
										<ClayIcon symbol="asterisk"/>

										<span className="hide-accessible sr-only">
											{Liferay.Language.get('required')}
										</span>
									</span>
								</label>

								<ClayInput
									maxLength={100}
									name="accountName"
									onChange={(event) => setAccountName(event.target.value)}
									required
									type="text"
									value={accountName}
								/>

								{errors.accountName && (
									<ClayForm.FeedbackGroup>
										<ClayForm.FeedbackItem>
											<ClayForm.FeedbackIndicator symbol="info-circle" />

											{Liferay.Language.get('this-field-is-required')}
										</ClayForm.FeedbackItem>
									</ClayForm.FeedbackGroup>
								)}
							</ClayForm.Group>

							<ClayForm.Group className={
								classnames('mb-3', {
									'has-error': errors.accountType
								})
							}>
								<label htmlFor="available-accounts-list">
									{Liferay.Language.get('account-type')}

									<span className="ml-1 reference-mark">
										<ClayIcon symbol="asterisk"/>

										<span className="hide-accessible sr-only">
											{Liferay.Language.get('required')}
										</span>
									</span>
								</label>

								<ClaySelect
									aria-label={Liferay.Language.get('account-type')}
									disabled={availableAccountTypes.length === 1}
									id="available-account-types"
									onChange={(event) => setAccountType(event.target.value)}
									name="available-account-types"
								>
									{availableAccountTypes.map(
										(accountType, index) => (
											<ClaySelect.Option
												key={`${accountType}_${index}`}
												label={Liferay.Language.get(accountType)}
												value={accountType}
											/>
										))}
								</ClaySelect>

								{errors.accountType && (
									<ClayForm.FeedbackGroup>
										<ClayForm.FeedbackItem>
											<ClayForm.FeedbackIndicator symbol="info-circle" />

											{Liferay.Language.get('this-field-is-required')}
										</ClayForm.FeedbackItem>
									</ClayForm.FeedbackGroup>
								)}
							</ClayForm.Group>
						</Col>
					</Row>
				</ClayForm.Group>

				<iframe
					className="border-0 w-100"
					id="modalIframe"
					onLoad={onLoad}
					ref={(ref) => {
						iframeRef.current = ref;
					}}
					src={viewsMap[SIGN_UP].url}
				/>
			</ClayModal.Body>

			<ClayModal.Footer
				last={
					<ClayButton.Group spaced>
						<ClayButton
							displayType="secondary"
							onClick={(event) => {
								event.preventDefault();

								setIsVisible(false);
							}}
						>
							{Liferay.Language.get('cancel')}
						</ClayButton>

						<ClayButton
							displayType="primary"
							onClick={doSubmit}
							type="button"
						>
							{Liferay.Language.get('create-account')}
						</ClayButton>
					</ClayButton.Group>
				}
			/>
		</>
	);
}

export default SignUpModalView;