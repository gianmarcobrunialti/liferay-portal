import {VerticalNav as ClayVerticalNav} from '@clayui/core';
import React from 'react';

function toItems(entries) {
	return entries.length
		? entries.map((entry) => {
			return {
				active: entry?.active ?? false,
				href: entry?.href,
				id: entry?.id,
				items: entry?.items ?? [],
				label: entry?.label,
			};
		})
		: {};
}
export default function MiniumPrimaryNavigation({
	entries,
	spritemap,
}) {
	return (
		<ClayVerticalNav
			className="minium-primary-navigation"
			items={toItems(entries)}
			spritemap={spritemap}
		>
			{item => (
				<ClayVerticalNav.Item
					active={item.active}
					href={item.href}
					items={item.items}
					key={item.id}
				>
					{item.label}
				</ClayVerticalNav.Item>
			)}
		</ClayVerticalNav>
	);
}