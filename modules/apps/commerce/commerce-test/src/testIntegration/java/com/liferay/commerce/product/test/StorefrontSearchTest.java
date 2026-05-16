/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.product.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.commerce.currency.model.CommerceCurrency;
import com.liferay.commerce.currency.test.util.CommerceCurrencyTestUtil;
import com.liferay.commerce.product.model.CPDefinition;
import com.liferay.commerce.product.model.CPInstance;
import com.liferay.commerce.product.model.CommerceCatalog;
import com.liferay.commerce.product.service.CPDefinitionLocalService;
import com.liferay.commerce.product.service.CPInstanceLocalService;
import com.liferay.commerce.product.service.CommerceCatalogLocalService;
import com.liferay.commerce.product.test.util.CPTestUtil;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.search.BaseModelSearchResult;
import com.liferay.portal.kernel.search.Indexer;
import com.liferay.portal.kernel.search.IndexerRegistry;
import com.liferay.portal.kernel.search.Sort;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.rule.SynchronousDestinationTestRule;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;

import java.util.List;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(Arquillian.class)
public class StorefrontSearchTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			PermissionCheckerMethodTestRule.INSTANCE,
			SynchronousDestinationTestRule.INSTANCE);

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		_user = UserTestUtil.addUser();

		_serviceContext = ServiceContextTestUtil.getServiceContext(
			_group.getCompanyId(), _group.getGroupId(), _user.getUserId());

		_commerceCurrency = CommerceCurrencyTestUtil.addCommerceCurrency(
			_group.getCompanyId());

		_commerceCatalog = _commerceCatalogLocalService.addCommerceCatalog(
			null, RandomTestUtil.randomString(), _commerceCurrency.getCode(),
			LocaleUtil.US.getDisplayLanguage(), _serviceContext);

		_absSensorSku = "ABS-001";

		_absSensor = _addCPInstanceWithName("ABS Sensor", _absSensorSku);

		_wearSensors = _addCPInstanceWithName("Wear Sensors", "WEAR-002");
		_brakePad = _addCPInstanceWithName("Brake Pad", "BRAKE-003");
	}

	@Test
	public void testSearchByPartialNameReturnsAllTokenMatches()
		throws Exception {

		List<CPDefinition> results = _search("Sensor");

		Assert.assertTrue(
			"Expected ABS Sensor to match the 'Sensor' token, got " + results,
			_containsCPDefinition(results, _absSensor));
		Assert.assertTrue(
			"Expected Wear Sensors to match the 'Sensor' token, got " + results,
			_containsCPDefinition(results, _wearSensors));
		Assert.assertFalse(
			"Brake Pad must not match the 'Sensor' token, got " + results,
			_containsCPDefinition(results, _brakePad));
	}

	@Test
	public void testSearchByPhraseInDoubleQuotesReturnsExactMatch()
		throws Exception {

		List<CPDefinition> results = _search("\"ABS Sensor\"");

		Assert.assertTrue(
			"Expected ABS Sensor for phrase query, got " + results,
			_containsCPDefinition(results, _absSensor));
		Assert.assertFalse(
			"Wear Sensors must not match phrase \"ABS Sensor\", got " + results,
			_containsCPDefinition(results, _wearSensors));
	}

	@Test
	public void testSearchBySKUReturnsExactSKUMatch() throws Exception {

		List<CPDefinition> results = _search(_absSensorSku);

		Assert.assertTrue(
			"Expected ABS Sensor CPDefinition for SKU query, got " + results,
			_containsCPDefinition(results, _absSensor));
	}

	private CPDefinition _addCPInstanceWithName(String name, String sku)
		throws Exception {

		CPInstance cpInstance = CPTestUtil.addCPInstanceFromCatalog(
			_commerceCatalog.getGroupId());

		cpInstance.setSku(sku);

		cpInstance = _cpInstanceLocalService.updateCPInstance(cpInstance);

		CPDefinition cpDefinition = cpInstance.getCPDefinition();

		_cpDefinitionLocalService.updateCPDefinitionLocalization(
			cpDefinition, LocaleUtil.toLanguageId(LocaleUtil.US), null, null,
			null, null, name, null);

		// updateCPDefinitionLocalization does not trigger a reindex; the
		// indexer must be invoked explicitly so the keyword + SKU + name
		// fields are visible to searchCPDefinitions.

		Indexer<CPDefinition> indexer = _indexerRegistry.nullSafeGetIndexer(
			CPDefinition.class);

		indexer.reindex(cpDefinition);

		return cpDefinition;
	}

	private boolean _containsCPDefinition(
		List<CPDefinition> cpDefinitions, CPDefinition cpDefinition) {

		for (CPDefinition candidate : cpDefinitions) {
			if (candidate.getCPDefinitionId() ==
					cpDefinition.getCPDefinitionId()) {

				return true;
			}
		}

		return false;
	}

	private List<CPDefinition> _search(String keywords) throws Exception {
		BaseModelSearchResult<CPDefinition> result =
			_cpDefinitionLocalService.searchCPDefinitions(
				_group.getCompanyId(),
				new long[] {_commerceCatalog.getGroupId()}, keywords,
				WorkflowConstants.STATUS_APPROVED, true, 0, 100, (Sort)null);

		return result.getBaseModels();
	}

	private CPDefinition _absSensor;
	private String _absSensorSku;
	private CPDefinition _brakePad;
	private CommerceCatalog _commerceCatalog;

	@Inject
	private CommerceCatalogLocalService _commerceCatalogLocalService;

	private CommerceCurrency _commerceCurrency;

	@Inject
	private CPDefinitionLocalService _cpDefinitionLocalService;

	@Inject
	private CPInstanceLocalService _cpInstanceLocalService;

	private Group _group;

	@Inject
	private IndexerRegistry _indexerRegistry;

	private ServiceContext _serviceContext;
	private User _user;
	private CPDefinition _wearSensors;

}