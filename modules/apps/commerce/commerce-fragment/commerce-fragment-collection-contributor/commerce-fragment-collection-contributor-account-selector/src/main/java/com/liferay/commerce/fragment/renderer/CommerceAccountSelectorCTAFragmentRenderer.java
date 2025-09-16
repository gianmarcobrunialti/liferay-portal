package com.liferay.commerce.fragment.renderer;

import com.liferay.commerce.configuration.CommerceOrderCheckoutConfiguration;
import com.liferay.fragment.model.FragmentEntryLink;
import com.liferay.fragment.renderer.FragmentRenderer;
import com.liferay.fragment.renderer.FragmentRendererContext;
import com.liferay.fragment.util.configuration.FragmentEntryConfigurationParser;
import com.liferay.portal.configuration.module.configuration.ConfigurationProvider;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.language.Language;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.util.GetterUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.util.Locale;

@Component(
	service = FragmentRenderer.class
)
public class CommerceAccountSelectorCTAFragmentRenderer implements FragmentRenderer {
	@Override
	public String getIcon() {
		return "button";
	}

	@Override
	public String getLabel(Locale locale) {
		return _language.get(locale, "account-selector-cta");
	}

	private String _getConfigurationValue(
		FragmentRendererContext fragmentRendererContext,
		FragmentEntryLink fragmentEntryLink, String fieldName) {

		return GetterUtil.getString(
			_fragmentEntryConfigurationParser.getFieldValue(
				getConfigurationJSONObject(fragmentRendererContext),
				fragmentEntryLink.getEditableValuesJSONObject(),
				fragmentRendererContext.getLocale(), fieldName));
	}

	@Override
	public void render(
		FragmentRendererContext fragmentRendererContext,
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse)
		throws IOException {

		CommerceContext commerceContext =
			(CommerceContext) httpServletRequest.getAttribute(
				CommerceWebKeys.COMMERCE_CONTEXT);

		if (commerceContext == null) {
			return;
		}
	}

	private boolean _hasAddCommerceOrderPermission() {
		if ((_accountEntry == null) || (_themeDisplay == null)) {
			return false;
		}

		try {
			CommerceOrderFieldsConfiguration commerceOrderFieldsConfiguration =
				_configurationProvider.getConfiguration(
					CommerceOrderFieldsConfiguration.class,
					new GroupServiceSettingsLocator(
						_commerceChannelGroupId,
						CommerceConstants.SERVICE_NAME_COMMERCE_ORDER_FIELDS));

			int commerceOrdersCount =
				(int)_commerceOrderLocalService.getCommerceOrdersCount(
					_accountEntry.getCompanyId(), _commerceChannelGroupId,
					new long[] {_accountEntry.getAccountEntryId()},
					StringPool.BLANK,
					new int[] {CommerceOrderConstants.ORDER_STATUS_OPEN},
					false);

			if ((commerceOrderFieldsConfiguration.accountCartMaxAllowed() >
				 0) &&
				(commerceOrdersCount >=
				 commerceOrderFieldsConfiguration.accountCartMaxAllowed())) {

				return false;
			}

			CommerceOrderCheckoutConfiguration
				commerceOrderCheckoutConfiguration =
				_configurationProvider.getConfiguration(
					CommerceOrderCheckoutConfiguration.class,
					new GroupServiceSettingsLocator(
						_commerceChannelGroupId,
						CommerceConstants.SERVICE_NAME_COMMERCE_ORDER));

			if (_accountEntry.isGuestAccount() &&
				commerceOrderCheckoutConfiguration.guestCheckoutEnabled()) {

				return true;
			}
		}
		catch (PortalException portalException) {
			_log.error(portalException);
		}

		return _commerceOrderPortletResourcePermission.contains(
			_themeDisplay.getPermissionChecker(),
			_accountEntry.getAccountEntryGroupId(),
			CommerceOrderActionKeys.ADD_COMMERCE_ORDER);
	}

	private static final Log _log = LogFactoryUtil.getLog(
		CommerceAccountSelectorCTAFragmentRenderer.class);

	@Reference
	private ConfigurationProvider _configurationProvider;

	@Reference
	private FragmentEntryConfigurationParser _fragmentEntryConfigurationParser;

	@Reference
	private Language _language;
}
