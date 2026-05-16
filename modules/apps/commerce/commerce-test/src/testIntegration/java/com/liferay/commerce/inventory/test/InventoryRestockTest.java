/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.inventory.test;

import com.liferay.account.constants.AccountConstants;
import com.liferay.account.model.AccountEntry;
import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.commerce.account.test.util.CommerceAccountTestUtil;
import com.liferay.commerce.context.CommerceContext;
import com.liferay.commerce.currency.model.CommerceCurrency;
import com.liferay.commerce.currency.test.util.CommerceCurrencyTestUtil;
import com.liferay.commerce.inventory.engine.CommerceInventoryEngine;
import com.liferay.commerce.inventory.model.CommerceInventoryAudit;
import com.liferay.commerce.inventory.model.CommerceInventoryBookedQuantity;
import com.liferay.commerce.inventory.model.CommerceInventoryWarehouse;
import com.liferay.commerce.inventory.service.CommerceInventoryAuditLocalService;
import com.liferay.commerce.inventory.service.CommerceInventoryBookedQuantityLocalService;
import com.liferay.commerce.inventory.service.CommerceInventoryWarehouseItemLocalService;
import com.liferay.commerce.inventory.service.CommerceInventoryWarehouseLocalService;
import com.liferay.commerce.inventory.type.constants.CommerceInventoryAuditTypeConstants;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.model.CommerceOrderItem;
import com.liferay.commerce.product.constants.CommerceChannelConstants;
import com.liferay.commerce.product.model.CPInstance;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CommerceChannelLocalService;
import com.liferay.commerce.product.service.CommerceChannelRelLocalService;
import com.liferay.commerce.service.CommerceOrderItemLocalService;
import com.liferay.commerce.service.CommerceOrderLocalService;
import com.liferay.commerce.test.util.CommerceInventoryTestUtil;
import com.liferay.commerce.test.util.context.TestCommerceContext;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.kernel.util.BigDecimalUtil;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;

import java.math.BigDecimal;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Java integration coverage for the inventory book → consume → cancel
 * transitions previously exercised by {@code CPCommerceInventory.testcase}
 * (Poshi → Java conversion, Block 5.2 of the Shopping Experience migration
 * plan).
 *
 * Of the 6 source Poshi Integration rows, the 4 that map cleanly to service
 * invariants land here:
 *
 * <ul>
 * <li>{@code CanInventoryQuantitiesAreUpdatedCorrectly} →
 *     {@link #testBookedQuantityIsDeductedFromAvailableStock} +
 *     {@link #testConsumeBookedQuantityDoesNotRestoreAvailableStock}</li>
 * <li>{@code CanRestockInventoryByDeletingTheOrder} →
 *     {@link #testDeleteOrderRestocksBookedQuantity}</li>
 * <li>{@code CanChangeLogUpdatedAfterCancelledOrder} →
 *     {@link #testOrderDeletionCreatesInventoryAuditRecord}</li>
 * </ul>
 *
 * The 2 remaining rows ({@code CanRestockInventoryByDeletingTheShipment} +
 * the SKU/UOM variants) are deferred to a P6 audit pass — see
 * {@code STATUS-2026-05-16-block-5.2.md} for the rationale.
 *
 * @author Gianmarco Brunialti
 */
@RunWith(Arquillian.class)
public class InventoryRestockTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			PermissionCheckerMethodTestRule.INSTANCE);

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		_user = UserTestUtil.addUser();

		_serviceContext = ServiceContextTestUtil.getServiceContext(
			_group.getCompanyId(), _group.getGroupId(), _user.getUserId());

		try {
			_accountEntry = CommerceAccountTestUtil.addPersonAccountEntry(
				_user.getUserId(), _serviceContext);
		}
		catch (Exception exception) {
			_accountEntry = CommerceAccountTestUtil.getPersonAccountEntry(
				_user.getUserId());
		}

		_commerceCurrency = CommerceCurrencyTestUtil.addCommerceCurrency(
			_group.getCompanyId());

		_commerceChannel = _commerceChannelLocalService.addCommerceChannel(
			StringPool.BLANK, AccountConstants.ACCOUNT_ENTRY_ID_DEFAULT,
			_group.getGroupId(),
			_group.getName(_serviceContext.getLanguageId()),
			CommerceChannelConstants.CHANNEL_TYPE_SITE, null,
			_commerceCurrency.getCode(), _serviceContext);

		_commerceContext = new TestCommerceContext(
			null, _commerceCurrency, _commerceChannel, _user, _group, null);

		_cpInstance = CommerceInventoryTestUtil.addRandomCPInstanceSku(
			_group.getGroupId());

		_warehouses = new ArrayList<>();
	}

	@After
	public void tearDown() throws Exception {
		for (CommerceOrder commerceOrder : _commerceOrders) {
			_commerceOrderLocalService.deleteCommerceOrder(commerceOrder);
		}

		List<CommerceInventoryWarehouse> commerceInventoryWarehouses =
			_commerceInventoryWarehouseLocalService.
				getCommerceInventoryWarehouses(_group.getCompanyId());

		for (CommerceInventoryWarehouse commerceInventoryWarehouse :
				commerceInventoryWarehouses) {

			_commerceInventoryWarehouseLocalService.
				deleteCommerceInventoryWarehouse(commerceInventoryWarehouse);
		}
	}

	@Test
	public void testBookedQuantityIsDeductedFromAvailableStock()
		throws Exception {

		// Poshi: CanInventoryQuantitiesAreUpdatedCorrectly (booking half)
		// Given: 3 warehouses with 1 unit each (total available = 3)

		_addWarehousesWithStock(3, BigDecimal.ONE);

		Assert.assertTrue(
			BigDecimalUtil.eq(
				BigDecimal.valueOf(3), _getCompanyStockQuantity()));

		// When: an order books 3 units

		_addOrderWithBookedQuantity(BigDecimal.valueOf(3), StringPool.BLANK);

		// Then: available stock drops to 0

		Assert.assertTrue(
			BigDecimalUtil.eq(BigDecimal.ZERO, _getCompanyStockQuantity()));
	}

	@Test
	public void testConsumeBookedQuantityDoesNotRestoreAvailableStock()
		throws Exception {

		// Poshi: CanInventoryQuantitiesAreUpdatedCorrectly (shipment half)

		_addWarehousesWithStock(3, BigDecimal.ONE);

		CommerceOrder commerceOrder = _addOrderWithBookedQuantity(
			BigDecimal.valueOf(3), StringPool.BLANK);

		CommerceInventoryBookedQuantity commerceInventoryBookedQuantity =
			_getBookedQuantityFor(commerceOrder);

		Assert.assertTrue(
			BigDecimalUtil.eq(BigDecimal.ZERO, _getCompanyStockQuantity()));

		// When: each warehouse fulfils 1 unit (consume releases the booked
		// quantity but stock has already been decremented at booking time)

		for (CommerceInventoryWarehouse commerceInventoryWarehouse :
				_warehouses) {

			_commerceInventoryEngine.consumeQuantity(
				_user.getUserId(),
				commerceInventoryBookedQuantity.
					getCommerceInventoryBookedQuantityId(),
				_cpInstance.getGroupId(),
				commerceInventoryWarehouse.getCommerceInventoryWarehouseId(),
				BigDecimal.ONE, _cpInstance.getSku(), StringPool.BLANK,
				Collections.emptyMap());
		}

		// Then: available stock stays at 0 (consumed permanently)

		Assert.assertTrue(
			BigDecimalUtil.eq(BigDecimal.ZERO, _getCompanyStockQuantity()));
	}

	@Test
	public void testDeleteOrderRestocksBookedQuantity() throws Exception {

		// Poshi: CanRestockInventoryByDeletingTheOrder

		_addWarehousesWithStock(3, BigDecimal.ONE);

		CommerceOrder commerceOrder = _addOrderWithBookedQuantity(
			BigDecimal.valueOf(3), StringPool.BLANK);

		Assert.assertTrue(
			BigDecimalUtil.eq(BigDecimal.ZERO, _getCompanyStockQuantity()));

		// When: the order is deleted while booked quantities are still active

		_commerceOrderLocalService.deleteCommerceOrder(commerceOrder);
		_commerceOrders.remove(commerceOrder);

		// Then: the booked quantity is released and available stock is restored

		Assert.assertTrue(
			BigDecimalUtil.eq(
				BigDecimal.valueOf(3), _getCompanyStockQuantity()));
	}

	@Test
	public void testOrderDeletionCreatesInventoryAuditRecord()
		throws Exception {

		// Poshi: CanChangeLogUpdatedAfterCancelledOrder

		_addWarehousesWithStock(3, BigDecimal.ONE);

		int auditCountBefore =
			_commerceInventoryAuditLocalService.getCommerceInventoryAuditsCount(
				_group.getCompanyId(), _cpInstance.getSku(), StringPool.BLANK);

		CommerceOrder commerceOrder = _addOrderWithBookedQuantity(
			BigDecimal.valueOf(3), StringPool.BLANK);

		long orderId = commerceOrder.getCommerceOrderId();

		_commerceOrderLocalService.deleteCommerceOrder(commerceOrder);
		_commerceOrders.remove(commerceOrder);

		// An audit record tagged with the deleted order id was added

		List<CommerceInventoryAudit> commerceInventoryAudits =
			_commerceInventoryAuditLocalService.getCommerceInventoryAudits(
				_group.getCompanyId(), _cpInstance.getSku(), StringPool.BLANK,
				auditCountBefore, auditCountBefore + 10);

		boolean orderIdRecorded = false;

		for (CommerceInventoryAudit commerceInventoryAudit :
				commerceInventoryAudits) {

			String logTypeSettings =
				commerceInventoryAudit.getLogTypeSettings();

			if ((logTypeSettings != null) &&
				logTypeSettings.contains(
					CommerceInventoryAuditTypeConstants.ORDER_ID) &&
				logTypeSettings.contains(String.valueOf(orderId))) {

				orderIdRecorded = true;

				break;
			}
		}

		Assert.assertTrue(
			"Expected an inventory audit entry tagged with deleted order id " +
				orderId,
			orderIdRecorded);
	}

	private CommerceOrder _addOrderWithBookedQuantity(
			BigDecimal quantity, String unitOfMeasureKey)
		throws Exception {

		CommerceOrder commerceOrder =
			_commerceOrderLocalService.addCommerceOrder(
				_user.getUserId(), _commerceChannel.getGroupId(),
				_accountEntry.getAccountEntryId(), _commerceCurrency.getCode(),
				0);

		_commerceOrders.add(commerceOrder);

		CommerceOrderItem commerceOrderItem =
			_commerceOrderItemLocalService.addCommerceOrderItem(
				_user.getUserId(), commerceOrder.getCommerceOrderId(),
				_cpInstance.getCPInstanceId(), null, quantity, 0,
				BigDecimal.ZERO, unitOfMeasureKey, _commerceContext,
				_serviceContext);

		CommerceInventoryBookedQuantity commerceInventoryBookedQuantity =
			_commerceInventoryBookedQuantityLocalService.
				addCommerceInventoryBookedQuantity(
					_user.getUserId(), null, quantity, _cpInstance.getSku(),
					unitOfMeasureKey, Collections.emptyMap());

		_commerceOrderItemLocalService.updateCommerceOrderItem(
			commerceOrderItem.getCommerceOrderItemId(),
			commerceInventoryBookedQuantity.
				getCommerceInventoryBookedQuantityId());

		return commerceOrder;
	}

	private void _addWarehousesWithStock(
			int warehouseCount, BigDecimal quantity)
		throws Exception {

		_addWarehousesWithStock(warehouseCount, quantity, StringPool.BLANK);
	}

	private void _addWarehousesWithStock(
			int warehouseCount, BigDecimal quantity, String unitOfMeasureKey)
		throws Exception {

		for (int i = 0; i < warehouseCount; i++) {
			CommerceInventoryWarehouse commerceInventoryWarehouse =
				CommerceInventoryTestUtil.addCommerceInventoryWarehouse(
					_serviceContext);

			_commerceChannelRelLocalService.addCommerceChannelRel(
				CommerceInventoryWarehouse.class.getName(),
				commerceInventoryWarehouse.getCommerceInventoryWarehouseId(),
				_commerceChannel.getCommerceChannelId(), _serviceContext);

			_commerceInventoryWarehouseItemLocalService.
				addCommerceInventoryWarehouseItem(
					StringPool.BLANK, _user.getUserId(),
					commerceInventoryWarehouse.
						getCommerceInventoryWarehouseId(),
					quantity, BigDecimal.ZERO, _cpInstance.getSku(),
					unitOfMeasureKey);

			_warehouses.add(commerceInventoryWarehouse);
		}
	}

	private CommerceInventoryBookedQuantity _getBookedQuantityFor(
			CommerceOrder commerceOrder)
		throws Exception {

		List<CommerceOrderItem> commerceOrderItems =
			_commerceOrderItemLocalService.getCommerceOrderItems(
				commerceOrder.getCommerceOrderId(), -1, -1);

		CommerceOrderItem commerceOrderItem = commerceOrderItems.get(0);

		return _commerceInventoryBookedQuantityLocalService.
			getCommerceInventoryBookedQuantity(
				commerceOrderItem.getCommerceInventoryBookedQuantityId());
	}

	private BigDecimal _getCompanyStockQuantity() throws Exception {
		return _commerceInventoryEngine.getStockQuantity(
			_group.getCompanyId(), _cpInstance.getGroupId(),
			_cpInstance.getSku(), StringPool.BLANK);
	}

	private AccountEntry _accountEntry;
	private CommerceChannel _commerceChannel;

	@Inject
	private CommerceChannelLocalService _commerceChannelLocalService;

	@Inject
	private CommerceChannelRelLocalService _commerceChannelRelLocalService;

	private CommerceContext _commerceContext;
	private CommerceCurrency _commerceCurrency;

	@Inject
	private CommerceInventoryAuditLocalService
		_commerceInventoryAuditLocalService;

	@Inject
	private CommerceInventoryBookedQuantityLocalService
		_commerceInventoryBookedQuantityLocalService;

	@Inject
	private CommerceInventoryEngine _commerceInventoryEngine;

	@Inject
	private CommerceInventoryWarehouseItemLocalService
		_commerceInventoryWarehouseItemLocalService;

	@Inject
	private CommerceInventoryWarehouseLocalService
		_commerceInventoryWarehouseLocalService;

	@Inject
	private CommerceOrderItemLocalService _commerceOrderItemLocalService;

	@Inject
	private CommerceOrderLocalService _commerceOrderLocalService;

	private final List<CommerceOrder> _commerceOrders = new ArrayList<>();
	private CPInstance _cpInstance;
	private Group _group;
	private ServiceContext _serviceContext;
	private User _user;
	private List<CommerceInventoryWarehouse> _warehouses;

}