(function () {
	const greeting = fragmentElement.querySelector('[data-playground-greeting]');
	if (!greeting) return;
	const firstName =
		(window.Liferay && Liferay.ThemeDisplay && Liferay.ThemeDisplay.getUserName &&
			Liferay.ThemeDisplay.getUserName().split(' ')[0]) || '';
	greeting.textContent = firstName ? 'Hi ' + firstName + '!' : 'Welcome';
})();
