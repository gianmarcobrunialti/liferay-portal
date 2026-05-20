(function () {
	const td = window.Liferay && Liferay.ThemeDisplay;
	if (!td) return;

	const groupURL =
		(td.getPathContext ? td.getPathContext() : '') +
		(td.getPathFriendlyURLPublic ? td.getPathFriendlyURLPublic() : '/web') +
		(td.getScopeGroup && td.getScopeGroup().getFriendlyURL
			? td.getScopeGroup().getFriendlyURL()
			: '');

	const portlets = {
		pages:
			'com_liferay_site_admin_web_portlet_SiteAdminPortlet&_com_liferay_site_admin_web_portlet_SiteAdminPortlet_mvcRenderCommandName=%2Fsite_admin%2Fview_layouts',
		fragments: 'com_liferay_fragment_web_portlet_FragmentPortlet',
		'page-templates':
			'com_liferay_layout_admin_web_portlet_LayoutPageTemplateCollectionsPortlet',
		'master-pages':
			'com_liferay_layout_admin_web_portlet_LayoutPageTemplatesPortlet',
		'style-books':
			'com_liferay_style_book_web_internal_portlet_StyleBookPortlet',
		'web-content': 'com_liferay_journal_web_portlet_JournalPortlet',
		documents: 'com_liferay_document_library_web_portlet_DLAdminPortlet',
	};

	fragmentElement
		.querySelectorAll('[data-target]')
		.forEach(function (a) {
			const key = a.dataset.target;
			const portletId = portlets[key];
			if (!portletId) return;
			a.href = groupURL + '/~/control_panel/manage?p_p_id=' + portletId;
		});
})();
