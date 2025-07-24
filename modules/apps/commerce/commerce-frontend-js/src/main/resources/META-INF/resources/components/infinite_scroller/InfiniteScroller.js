/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayLoadingIndicator from '@clayui/loading-indicator';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {debounce} from "frontend-js-web";

function InfiniteScroller({
	children,
	customLoader: CustomLoader,
	maxHeight,
	onBottomTouched,
	scrollCompleted,
	scrollingElementRef = useRef(null),
}) {
	const [scrollingAreaRendered, setScrollingAreaRendered] = useState(false);
	const infiniteLoaderRef = useRef(null);
	const [infiniteLoaderRendered, setInfiniteLoaderRendered] = useState(false);
	const scrollingAreaRef = scrollingElementRef;

	const debounceOnBottomTouched = useMemo(
		() => debounce(async () => onBottomTouched(), 500),
		[onBottomTouched]
	);

	const setScrollingArea = useCallback((node) => {
		scrollingAreaRef.current = node;
		setScrollingAreaRendered(true);
	}, []);

	const setInfiniteLoader = useCallback((node) => {
		infiniteLoaderRef.current = node;
		setInfiniteLoaderRendered(true);
	}, []);

	const setObserver = useCallback(() => {
		if (
			!scrollingAreaRef.current ||
			!infiniteLoaderRef.current ||
			!IntersectionObserver
		) {
			return;
		}

		const options = {
			root: scrollingAreaRef.current,
			rootMargin: '0px',
			threshold: 1.0,
		};

		const observer = new IntersectionObserver((entries) => {
			if (entries[0].intersectionRatio === 1) {
				debounceOnBottomTouched();
			}
		}, options);

		observer.observe(infiniteLoaderRef.current);
	}, [debounceOnBottomTouched]);

	useEffect(() => {
		if (
			scrollingAreaRendered &&
			infiniteLoaderRendered &&
			!scrollCompleted
		) {
			setObserver();
		}
	}, [
		scrollingAreaRendered,
		infiniteLoaderRendered,
		scrollCompleted,
		setObserver,
	]);

	return (
		<div
			className="inline-scroller"
			ref={setScrollingArea}
			style={maxHeight ? {maxHeight} : null}
		>
			{children}

			{!scrollCompleted &&
				(CustomLoader ? (
					<CustomLoader ref={setInfiniteLoader} />
				) : (
					<ClayLoadingIndicator ref={setInfiniteLoader} small />
				))}
		</div>
	);
}

InfiniteScroller.propTypes = {
	customLoader: PropTypes.element,
	maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	onBottomTouched: PropTypes.func.isRequired,
	scrollCompleted: PropTypes.bool.isRequired,
};

export default InfiniteScroller;
