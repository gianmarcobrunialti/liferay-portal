package com.liferay.commerce.order.content.web.internal.portlet.action;

import com.liferay.commerce.constants.CommercePortletKeys;
import com.liferay.commerce.order.CommerceOrderHttpHelper;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCActionCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCActionCommand;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.WebKeys;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.portlet.ActionRequest;
import javax.portlet.ActionResponse;
import javax.portlet.PortletURL;
import javax.servlet.http.HttpServletRequest;

@Component(
	property = {
		"javax.portlet.name=" + CommercePortletKeys.COMMERCE_OPEN_ORDER_CONTENT,
		"mvc.command.name=/commerce_open_order_content/checkout_open_order"
	},
	service = MVCActionCommand.class
)
public class CheckoutCommerceOrderMVCAction extends BaseMVCActionCommand {
	@Override
	protected void doProcessAction(
		ActionRequest actionRequest, ActionResponse actionResponse)
		throws Exception {

		HttpServletRequest httpServletRequest =
			_portal.getHttpServletRequest(actionRequest);

		HttpServletRequest originalServletRequest =
			_portal.getOriginalServletRequest(httpServletRequest);

		PortletURL checkoutURL =
			_commerceOrderHttpHelper.getCommerceCheckoutPortletURL(originalServletRequest);

		actionRequest.setAttribute(
			WebKeys.REDIRECT,
			checkoutURL.toString());
	}

	@Reference
	private CommerceOrderHttpHelper _commerceOrderHttpHelper;

	@Reference
	private Portal _portal;
}
