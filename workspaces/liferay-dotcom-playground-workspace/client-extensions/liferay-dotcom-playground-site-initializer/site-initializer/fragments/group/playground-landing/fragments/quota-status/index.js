(function () {
	const root = fragmentElement.querySelector('.playground-quota');
	if (!root) return;

	const siteId = root.dataset.siteId;
	const headers = {Accept: 'application/json'};

	function setGauge(resource, used, limit) {
		const gauge = root.querySelector(`[data-resource="${resource}"]`);
		if (!gauge) return;
		const value = gauge.querySelector('.playground-quota-gauge__value');
		const fill = gauge.querySelector('.playground-quota-gauge__bar-fill');
		const pct = Math.min(100, Math.round((used / limit) * 100));
		value.textContent = `${used} / ${limit}`;
		fill.style.width = `${pct}%`;
		if (pct >= 90) fill.classList.add('is-danger');
		else if (pct >= 70) fill.classList.add('is-warning');
	}

	fetch(`/o/headless-delivery/v1.0/sites/${siteId}/site-pages?pageSize=0`, {headers})
		.then((r) => r.json())
		.then((d) => setGauge('pages', d.totalCount || 0, 20))
		.catch(() => {});

	fetch(`/o/headless-delivery/v1.0/sites/${siteId}/structured-contents?pageSize=0`, {headers})
		.then((r) => r.json())
		.then((d) => setGauge('articles', d.totalCount || 0, 20))
		.catch(() => {});

	fetch(`/o/headless-delivery/v1.0/sites/${siteId}/documents?pageSize=100&fields=sizeInBytes`, {headers})
		.then((r) => r.json())
		.then((d) => {
			const totalBytes = (d.items || []).reduce((a, i) => a + (i.sizeInBytes || 0), 0);
			setGauge('storage', Math.round(totalBytes / (1024 * 1024)), 100);
		})
		.catch(() => {});
})();
