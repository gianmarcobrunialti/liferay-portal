/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {fireEvent, render} from '@testing-library/react';
import React from 'react';

import QuantitySelector from '../../../src/main/resources/META-INF/resources/components/quantity_selector/QuantitySelector';

const defaultProps = {
	alignment: 'top',
	allowedQuantities: null,
	disabled: false,
	max: 9999,
	min: 1,
	name: 'test-name',
	onUpdate: () => {},
	quantity: 1,
	size: 'md',
	step: 1,
};

describe('Quantity Selector', () => {
	it('must render an input when there are no allowed quantities', async () => {
		const quantitySelector = render(<QuantitySelector {...defaultProps} />);

		expect(
			quantitySelector.container.querySelector('input')
		).toBeInTheDocument();
	});

	it('must render a select box when there are allowed quantities', async () => {
		const quantitySelector = render(
			<QuantitySelector
				{...defaultProps}
				allowedQuantities={[1, 5, 10]}
			/>
		);

		expect(
			quantitySelector.container.querySelector('select')
		).toBeInTheDocument();
	});

	it("must render an input when allowed quantities is an array that doesn't contain elements", () => {
		const quantitySelector = render(
			<QuantitySelector {...defaultProps} allowedQuantities={[]} />
		);

		expect(
			quantitySelector.container.querySelector('select')
		).not.toBeInTheDocument();
	});

	describe('product-configuration quantity rules', () => {
		it('renders exactly the allowed quantities as <option> values', () => {
			const allowedQuantities = [1, 4, 5, 7, 11];

			const {container} = render(
				<QuantitySelector
					{...defaultProps}
					allowedQuantities={allowedQuantities}
				/>
			);

			const options = container.querySelectorAll('option');

			expect(options).toHaveLength(allowedQuantities.length);

			Array.from(options).forEach((option, index) => {
				expect(option.value).toBe(String(allowedQuantities[index]));
			});
		});

		it('input.min reflects the minimum order quantity', () => {
			const {container} = render(
				<QuantitySelector {...defaultProps} min={4} step={1} />
			);

			const input = container.querySelector('input');

			expect(input.min).toBe('4');
		});

		it('input.max reflects the maximum order quantity and the callback reports the max error past it', () => {
			const onUpdate = jest.fn();

			const {container} = render(
				<QuantitySelector
					{...defaultProps}
					max={4}
					onUpdate={onUpdate}
				/>
			);

			const input = container.querySelector('input');

			expect(input.max).toBe('4');

			fireEvent.change(input, {target: {value: '6'}});

			expect(onUpdate).toHaveBeenLastCalledWith({
				errors: ['max'],
				value: 6,
			});
		});

		it('the callback reports the multiple error for non-step values', () => {
			const onUpdate = jest.fn();

			const {container} = render(
				<QuantitySelector
					{...defaultProps}
					min={3}
					onUpdate={onUpdate}
					step={3}
				/>
			);

			const input = container.querySelector('input');

			fireEvent.change(input, {target: {value: '7'}});

			expect(onUpdate.mock.calls.at(-1)[0].errors).toContain('multiple');

			fireEvent.change(input, {target: {value: '9'}});

			expect(onUpdate).toHaveBeenLastCalledWith({
				errors: [],
				value: 9,
			});
		});

		it('input.min is rounded up to the next step boundary when min < step', () => {
			const {container} = render(
				<QuantitySelector
					{...defaultProps}
					max={50}
					min={6}
					step={5}
				/>
			);

			const input = container.querySelector('input');

			expect(input.min).toBe('10');
		});
	});
});
