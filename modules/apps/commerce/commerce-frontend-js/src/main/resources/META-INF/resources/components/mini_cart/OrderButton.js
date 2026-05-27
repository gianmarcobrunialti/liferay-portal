/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import React, {useContext, useEffect, useState} from 'react';

import {PERFORM_SIGN_IN} from '../../utilities/eventsDefinitions';
import {liferayNavigate} from '../../utilities/index';
import GuestModal from './GuestModal';
import MiniCartContext from './MiniCartContext';
import {
	PROCEED_AS_GUEST,
	REVIEW_ORDER,
	SIGN_IN_TO_CHECKOUT,
	SUBMIT_ORDER,
} from './util/constants';
import {canSubmit} from './util/index';

function _immediateCheckoutRedirect(signInURL) {
	const redirectURL = new URL(window.location.href);

	redirectURL.searchParams.set('commerceImmediateCheckout', 'true');

	const url = new URL(signInURL, window.location.origin);

	const redirectKey =
		[...url.searchParams.keys()].find((key) => key.endsWith('redirect')) ??
		'redirect';

	url.searchParams.set(
		redirectKey,
		redirectURL.pathname + redirectURL.search
	);

	return url.pathname + url.search;
}

function OrderButton({disabled = false}) {
	const {
		actionURLs: {checkoutURL, orderDetailURL, signInURL},
		cartState,
		closeCart,
		guestOrderEnabled,
		labels,
	} = useContext(MiniCartContext);

	const [guestSignInVisible, setGuestSignInVisible] = useState(false);

	useEffect(() => {
		const toggleModal = () => {
			if (!guestSignInVisible) {
				setGuestSignInVisible(true);
			}
		};

		if (guestOrderEnabled) {
			Liferay.on(PERFORM_SIGN_IN, toggleModal);
		}

		return () => {
			if (guestOrderEnabled) {
				Liferay.detach(PERFORM_SIGN_IN, toggleModal);
			}
		};
	}, [guestOrderEnabled, guestSignInVisible, setGuestSignInVisible]);

	return (
		<div className="mini-cart-submit">
			{guestOrderEnabled && signInURL ? (
				<>
					<ClayButton
						block
						disabled={disabled}
						displayType="primary"
						onClick={() => {
							closeCart();

							setGuestSignInVisible(true);
						}}
					>
						{labels[SIGN_IN_TO_CHECKOUT]}
					</ClayButton>

					<ClayButton
						block
						disabled={disabled}
						displayType="secondary"
						onClick={() => {
							liferayNavigate(checkoutURL);
						}}
					>
						{labels[PROCEED_AS_GUEST]}
					</ClayButton>

					{guestSignInVisible ? (
						<GuestModal
							isVisible={guestSignInVisible}
							setIsVisible={setGuestSignInVisible}
							signInURL={_immediateCheckoutRedirect(signInURL)}
						/>
					) : null}
				</>
			) : (
				<ClayButton
					block
					disabled={disabled}
					onClick={() => {
						if (!disabled) {
							liferayNavigate(
								canSubmit(cartState)
									? checkoutURL
									: orderDetailURL
							);
						}
					}}
				>
					{canSubmit(cartState) || disabled
						? labels[SUBMIT_ORDER]
						: labels[REVIEW_ORDER]}
				</ClayButton>
			)}
		</div>
	);
}

export default OrderButton;
