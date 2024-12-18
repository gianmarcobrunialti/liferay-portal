/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import React, {useContext, useState} from 'react';

import {liferayNavigate} from '../../utilities/index';
import MiniCartContext from './MiniCartContext';
import {
	PROCEED_AS_GUEST,
	REVIEW_ORDER,
	SIGN_IN_TO_CHECKOUT,
	SUBMIT_ORDER,
} from './util/constants';
import {canSubmit} from './util/index';
import {storeImmediateCheckout} from "./util/guestModal";
import GuestModal from "./GuestModal";

function OrderButton({disabled = false}) {
	const {
		actionURLs: {checkoutURL, orderDetailURL, signInURL},
		cartState,
		closeCart,
		guestOrderEnabled,
		labels,
	} = useContext(MiniCartContext);

	const [guestSignInVisible, setGuestSignInVisible] = useState(false);

	return (
		<div className="mini-cart-submit">
			{guestOrderEnabled ? (
				<>
					<ClayButton
						block
						disabled={disabled}
						displayType="primary"
						onClick={() => {
							closeCart();

							storeImmediateCheckout();
							// Liferay.fire(PERFORM_SIGN_IN);
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
							signInURL={signInURL}
						/>
					) : null}
				</>
			) : (
				<ClayButton
					block
					disabled={disabled}
					onClick={() => {
						liferayNavigate(canSubmit(cartState) ? checkoutURL : orderDetailURL);
					}}
				>
					{canSubmit(cartState) ? labels[SUBMIT_ORDER] : labels[REVIEW_ORDER]}
				</ClayButton>
			)}
		</div>
	);
}

export default OrderButton;
