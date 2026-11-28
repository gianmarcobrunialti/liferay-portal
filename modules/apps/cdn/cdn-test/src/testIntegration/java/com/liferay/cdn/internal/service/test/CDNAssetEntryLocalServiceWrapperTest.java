/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.service.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.asset.kernel.model.AssetEntry;
import com.liferay.asset.kernel.service.AssetEntryLocalService;
import com.liferay.bulk.selection.BulkSelection;
import com.liferay.bulk.selection.BulkSelectionAction;
import com.liferay.bulk.selection.BulkSelectionFactory;
import com.liferay.bulk.selection.BulkSelectionFactoryRegistry;
import com.liferay.document.library.kernel.model.DLFileEntry;
import com.liferay.document.library.kernel.model.DLFolderConstants;
import com.liferay.document.library.kernel.service.DLAppLocalService;
import com.liferay.journal.constants.JournalArticleConstants;
import com.liferay.journal.constants.JournalFolderConstants;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.test.util.JournalTestUtil;
import com.liferay.petra.io.StreamUtil;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.configuration.test.util.CompanyConfigurationTemporarySwapper;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.repository.model.FileEntry;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.TestPropsValues;
import com.liferay.portal.kernel.transaction.Propagation;
import com.liferay.portal.kernel.transaction.TransactionConfig;
import com.liferay.portal.kernel.transaction.TransactionInvokerUtil;
import com.liferay.portal.kernel.util.ContentTypes;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.HashMapDictionaryBuilder;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.SetUtil;
import com.liferay.portal.test.rule.FeatureFlag;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;

import com.sun.net.httpserver.HttpServer;

import java.io.InputStream;
import java.io.Serializable;

import java.net.InetSocketAddress;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * @author Gianmarco Brunialti Masera
 */
@RunWith(Arquillian.class)
public class CDNAssetEntryLocalServiceWrapperTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			PermissionCheckerMethodTestRule.INSTANCE);

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		_httpServer = HttpServer.create(
			new InetSocketAddress("127.0.0.1", 0), 0);

		_httpServer.createContext(
			"/purge",
			httpExchange -> {
				try (InputStream inputStream = httpExchange.getRequestBody()) {
					_bodies.add(
						new String(StreamUtil.toByteArray(inputStream)));
				}

				httpExchange.sendResponseHeaders(200, -1);

				httpExchange.close();
			});

		_httpServer.start();

		_serviceContext = ServiceContextTestUtil.getServiceContext(
			_group.getGroupId(), TestPropsValues.getUserId());
	}

	@After
	public void tearDown() {
		_httpServer.stop(0);
	}

	@FeatureFlag("LPD-107638")
	@Test
	public void testUpdateEntry() throws Throwable {
		FileEntry fileEntry1 = _addFileEntry();
		FileEntry fileEntry2 = _addFileEntry();

		JournalArticle draftJournalArticle = JournalTestUtil.addArticle(
			_group.getGroupId(),
			JournalFolderConstants.DEFAULT_PARENT_FOLDER_ID,
			JournalArticleConstants.CLASS_NAME_ID_DEFAULT,
			RandomTestUtil.randomString(), RandomTestUtil.randomString(),
			RandomTestUtil.randomString(), LocaleUtil.getSiteDefault(), true,
			false, _serviceContext);
		JournalArticle journalArticle1 = JournalTestUtil.addArticle(
			_group.getGroupId(),
			JournalFolderConstants.DEFAULT_PARENT_FOLDER_ID);
		JournalArticle journalArticle2 = JournalTestUtil.addArticle(
			_group.getGroupId(),
			JournalFolderConstants.DEFAULT_PARENT_FOLDER_ID);

		try (CompanyConfigurationTemporarySwapper
				cdnCompanyConfigurationTemporarySwapper =
					_getCDNCompanyConfigurationTemporarySwapper(0)) {

			// Bulk tagging documents purges them

			BulkSelectionFactory<FileEntry> bulkSelectionFactory =
				_bulkSelectionFactoryRegistry.getBulkSelectionFactory(
					DLFileEntry.class.getName());

			BulkSelection<FileEntry> bulkSelection =
				bulkSelectionFactory.create(
					HashMapBuilder.put(
						"rowIdsFileEntry",
						new String[] {
							fileEntry1.getFileEntryId() + "," +
								fileEntry2.getFileEntryId()
						}
					).build());

			TransactionInvokerUtil.invoke(
				_transactionConfig,
				() -> {
					_editTagsBulkSelectionAction.execute(
						TestPropsValues.getUser(),
						bulkSelection.toAssetEntryBulkSelection(),
						HashMapBuilder.<String, Serializable>put(
							"append", true
						).put(
							"toAddTagNames",
							new String[] {RandomTestUtil.randomString()}
						).build());

					return null;
				});

			_assertPurge(
				"lfr-d" + fileEntry1.getFileEntryId(),
				"lfr-d" + fileEntry2.getFileEntryId(),
				_getCollectionTag(DLFileEntry.class),
				_getCollectionTag(FileEntry.class),
				"lfr-x" + _group.getGroupId());

			// Tagging a draft does not purge

			_updateEntry(draftJournalArticle);

			_assertNoPurge();

			// A failed bulk operation purges nothing

			Assert.assertThrows(
				Exception.class,
				() -> TransactionInvokerUtil.invoke(
					_transactionConfig,
					() -> {
						_updateEntry(journalArticle1);

						throw new Exception();
					}));

			_assertNoPurge();
		}

		try (CompanyConfigurationTemporarySwapper
				cdnCompanyConfigurationTemporarySwapper =
					_getCDNCompanyConfigurationTemporarySwapper(3)) {

			// Bulk tagging two web content articles purges four cache tags,
			// which do not fit in one request, so their site is purged instead

			TransactionInvokerUtil.invoke(
				_transactionConfig,
				() -> {
					_updateEntry(journalArticle1);
					_updateEntry(journalArticle2);

					return null;
				});

			_assertPurge("lfr-s" + _group.getGroupId());
		}
	}

	private FileEntry _addFileEntry() throws Exception {
		return _dlAppLocalService.addFileEntry(
			null, TestPropsValues.getUserId(), _group.getGroupId(),
			DLFolderConstants.DEFAULT_PARENT_FOLDER_ID,
			RandomTestUtil.randomString() + ".txt", ContentTypes.TEXT_PLAIN,
			RandomTestUtil.randomBytes(), null, null, null, _serviceContext);
	}

	private void _assertNoPurge() throws Exception {
		Assert.assertNull(_bodies.poll(2, TimeUnit.SECONDS));
	}

	private void _assertPurge(String... tags) throws Exception {
		String body = _bodies.poll(30, TimeUnit.SECONDS);

		Assert.assertNotNull(body);

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject(body);

		Assert.assertEquals(
			SetUtil.fromArray(tags),
			SetUtil.fromList(
				JSONUtil.toStringList(jsonObject.getJSONArray("tags"))));

		_assertNoPurge();
	}

	private CompanyConfigurationTemporarySwapper
			_getCDNCompanyConfigurationTemporarySwapper(int maxTagsPerRequest)
		throws Exception {

		InetSocketAddress inetSocketAddress = _httpServer.getAddress();

		return new CompanyConfigurationTemporarySwapper(
			TestPropsValues.getCompanyId(),
			"com.liferay.cdn.configuration.CDNConfiguration",
			HashMapDictionaryBuilder.<String, Object>put(
				"coalesceWindowMs", 100L
			).put(
				"enabled", true
			).put(
				"endpoint",
				StringBundler.concat(
					"http://127.0.0.1:", inetSocketAddress.getPort(), "/purge")
			).put(
				"maxTagsPerRequest", maxTagsPerRequest
			).put(
				"templateKey", "custom"
			).build());
	}

	private String _getCollectionTag(Class<?> clazz) {
		return StringBundler.concat(
			"lfr-l", _group.getGroupId(), "-", _portal.getClassNameId(clazz));
	}

	/**
	 * Updates the tags of the web content article's asset entry the way the
	 * bulk tagging action does.
	 */
	private void _updateEntry(JournalArticle journalArticle) throws Exception {
		AssetEntry assetEntry = _assetEntryLocalService.getEntry(
			JournalArticle.class.getName(),
			journalArticle.getResourcePrimKey());

		_assetEntryLocalService.updateEntry(
			assetEntry.getUserId(), assetEntry.getGroupId(),
			assetEntry.getClassName(), assetEntry.getClassPK(),
			assetEntry.getCategoryIds(),
			new String[] {RandomTestUtil.randomString()});
	}

	private static final TransactionConfig _transactionConfig =
		TransactionConfig.Factory.create(
			Propagation.REQUIRED, new Class<?>[] {Exception.class});

	@Inject
	private AssetEntryLocalService _assetEntryLocalService;

	private final BlockingQueue<String> _bodies = new LinkedBlockingQueue<>();

	@Inject
	private BulkSelectionFactoryRegistry _bulkSelectionFactoryRegistry;

	@Inject
	private DLAppLocalService _dlAppLocalService;

	@Inject(filter = "bulk.selection.action.key=edit.tags")
	private BulkSelectionAction<AssetEntry> _editTagsBulkSelectionAction;

	@DeleteAfterTestRun
	private Group _group;

	private HttpServer _httpServer;

	@Inject
	private Portal _portal;

	private ServiceContext _serviceContext;

}