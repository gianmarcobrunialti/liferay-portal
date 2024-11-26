import ClayButton from '@clayui/button';
import React, {useContext} from 'react';

import {MiniCartContext, liferayNavigate} from 'commerce-frontend-js';

function OverriddenOrderButton() {
  const {actionURLs, cartState, labels} = useContext(MiniCartContext);

  const {orderDetailURL} = actionURLs;
  const {cartItems = [] } = cartState;

  return (
    <div className="mini-cart-submit">
      <ClayButton
        block
        disabled={!cartItems.length}
        onClick={() => {
          liferayNavigate(orderDetailURL);
        }}
      >
        {labels["Review order"]}
      </ClayButton>
    </div>
  );
}

export default OverriddenOrderButton;
