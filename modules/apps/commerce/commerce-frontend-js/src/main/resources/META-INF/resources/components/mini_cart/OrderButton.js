/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import React, {useContext} from 'react';

import {PERFORM_SIGN_IN} from '../../utilities/eventsDefinitions';
import {liferayNavigate} from '../../utilities/index';
import MiniCartContext from './MiniCartContext';
import {
	PROCEED_AS_GUEST,
	REVIEW_ORDER,
	SIGN_IN_TO_CHECKOUT,
	SUBMIT_ORDER,
	WORKFLOW_STATUS_APPROVED,
} from './util/constants';
import {hasErrors} from './util/index';

function OrderButton({disabled = false}) {
	const {
		actionURLs,
		cartState,
		guestOrderEnabled,
		labels
	} = useContext(MiniCartContext);

	const {checkoutURL, orderDetailURL} = actionURLs;
	const {cartItems = [], workflowStatusInfo = {}} = cartState;

	const {code: workflowStatus = WORKFLOW_STATUS_APPROVED} =
		workflowStatusInfo;

	const canSubmit =
		!hasErrors(cartItems) && workflowStatus === WORKFLOW_STATUS_APPROVED;

	return (
		<div className="mini-cart-submit">
			{guestOrderEnabled ? (
				<>
					<ClayButton
						block
						displayType="primary"
						onClick={() => {
							Liferay.fire(PERFORM_SIGN_IN)
						}}
					>
						{labels[SIGN_IN_TO_CHECKOUT]}
					</ClayButton>

					{canSubmit && (
						<ClayButton
							block
							displayType="secondary"
							onClick={() => {
								liferayNavigate(checkoutURL);
							}}
						>
							{labels[PROCEED_AS_GUEST]}
						</ClayButton>
					)}
				</>
			) : (
				<ClayButton
					block
					disabled={disabled}
					onClick={() => {
						liferayNavigate(canSubmit ? checkoutURL : orderDetailURL);
					}}
				>
					{canSubmit ? labels[SUBMIT_ORDER] : labels[REVIEW_ORDER]}
				</ClayButton>
			)}
		</div>
	);
}

export default OrderButton;
