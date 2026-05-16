/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '../../tests_utilities/polyfills';

import '@testing-library/jest-dom';
import {RenderResult, cleanup, fireEvent, render} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// @ts-ignore

import fetchMock from 'fetch-mock';
import React from 'react';
import {act} from 'react-dom/test-utils';

// @ts-ignore

import AddToCart from '../../../src/main/resources/META-INF/resources/components/add_to_cart/AddToCart';
import {
	CART_PRODUCT_QUANTITY_CHANGED,
	CURRENT_ACCOUNT_UPDATED,

	// eslint-disable-next-line lines-around-comment
	// @ts-ignore
} from '../../../src/main/resources/META-INF/resources/utilities/eventsDefinitions';

interface ILocators {
	button: HTMLButtonElement;
	input: HTMLInputElement;
}

const getLocators = (renderedComponent: RenderResult): ILocators => {
	return {
		button: renderedComponent.container.querySelector(
			'button'
		) as HTMLButtonElement,
		input: renderedComponent.container.querySelector(
			'input'
		) as HTMLInputElement,
	};
};

const props = {
	accountId: 43879,
	cartId: '43882',
	cartUUID: 'a711bf49-a2d3-2c8d-23c9-abaff7d288a5',
	channel: {
		currencyCode: 'USD',
		groupId: '42398',
		id: '42397',
	},
	cpInstance: {
		inCart: false,
		options: [],
		quantity: 3,
		skuId: 42633,
	},
	settings: {
		iconOnly: false,
		productConfiguration: {
			allowedOrderQuantities: [],
			maxOrderQuantity: 50,
			minOrderQuantity: 1,
			multipleOrderQuantity: 1,
		},
	},
	size: 'sm',
};

jest.mock('frontend-js-components-web', () => {
	return {
		...(jest.requireActual('frontend-js-components-web') as any),
		openToast: jest.fn(),
	};
});

describe('Add to Cart', () => {
	const addProductToCartFn = jest.fn();

	const {Liferay: originalLiferayObject} = global.window;

	beforeEach(() => {
		fetchMock.get(
			/headless-commerce-delivery-cart\/v1.0\/channels\/[0-9]+\/account\/[0-9]+\/carts/,
			() => {
				return {items: []};
			}
		);

		fetchMock.post(
			/headless-commerce-delivery-cart\/v1.0\/carts\/[0-9]+\/items/,
			(_: any, options: any) => {
				addProductToCartFn(JSON.parse(options.body || '{}'));

				return {};
			}
		);

		global.window.Liferay = {
			...originalLiferayObject,
			CommerceContext: {
				...global.window.Liferay.CommerceContext,
				orderTypes: [],
			},
		};
	});

	afterEach(() => {
		cleanup();

		fetchMock.restore();

		addProductToCartFn.mockReset();
	});

	afterAll(() => {
		global.window.Liferay = originalLiferayObject;
	});

	it('Must render the component', () => {
		const addToCart = render(<AddToCart {...props} />);

		const {button, input} = getLocators(addToCart);

		expect(addToCart.container).toBeInTheDocument();
		expect(button).toBeInTheDocument();
		expect(input).toBeInTheDocument();
	});

	it('Must be disabled consistently with its prop', () => {
		const addToCart = render(<AddToCart {...props} disabled={true} />);

		const {button} = getLocators(addToCart);

		expect(button).toBeDisabled();
	});

	it('Must be disabled if accountId is not provided', () => {
		const addToCart = render(<AddToCart {...props} accountId={0} />);

		const {button} = getLocators(addToCart);

		expect(addToCart.container).toBeInTheDocument();
		expect(button).toBeDisabled();
	});

	it('Must hide indicator if sku not in the cart', () => {
		const addToCart = render(<AddToCart {...props} />);

		const {button} = getLocators(addToCart);

		expect(addToCart.container).toBeInTheDocument();
		expect(Array.from(button.classList)).not.toContain('is-added');
	});

	it('Must show indicator if sku already in the cart', () => {
		const addToCart = render(
			<AddToCart
				{...props}
				cpInstance={{
					inCart: true,
					options: [],
					quantity: 10,
					skuId: 42633,
				}}
			/>
		);

		const {button} = getLocators(addToCart);

		expect(addToCart.container).toBeInTheDocument();
		expect(Array.from(button.classList)).toContain('is-added');
	});

	it('Must focus the quantity selector when a user tries to add to the cart an invalid quantity', async () => {
		const addToCart = render(
			<AddToCart
				{...props}
				settings={{
					...props.settings,
					productConfiguration: {
						allowedOrderQuantities: [],
						maxOrderQuantity: 50,
						minOrderQuantity: 5,
						multipleOrderQuantity: 7,
					},
				}}
			/>
		);

		const {button, input} = getLocators(addToCart);

		act(() => {
			fireEvent.change(input, {target: {value: 6}});
		});

		const focusHandler = jest.fn();

		input.addEventListener('focus', focusHandler);

		act(() => {
			fireEvent.focus(input);
			fireEvent.click(button);
		});

		expect(addProductToCartFn).not.toHaveBeenCalled();
		expect(focusHandler).toHaveBeenCalled();
	});

	describe('Must handle Liferay events', () => {
		it('Must be disabled when accountId is not provided', () => {
			const addToCart = render(<AddToCart {...props} />);

			const {button} = getLocators(addToCart);

			act(() => {
				(Liferay as any).fire(CURRENT_ACCOUNT_UPDATED, {
					id: 0,
				});
			});

			expect(button).toBeDisabled();

			act(() => {
				(Liferay as any).fire(CURRENT_ACCOUNT_UPDATED, {
					id: 1,
				});
			});

			expect(button).toBeEnabled();
		});

		it('Must give a UI feedback about the state of sku in the cart', () => {
			const addToCart = render(<AddToCart {...props} />);

			const {button} = getLocators(addToCart);

			expect(Array.from(button.classList)).not.toContain('is-added');

			act(() => {
				(Liferay as any).fire(CART_PRODUCT_QUANTITY_CHANGED, {
					quantity: 5,
					skuId: props.cpInstance.skuId,
				});
			});

			expect(Array.from(button.classList)).toContain('is-added');

			act(() => {
				(Liferay as any).fire(CART_PRODUCT_QUANTITY_CHANGED, {
					quantity: 0,
					skuId: props.cpInstance.skuId,
				});
			});

			expect(Array.from(button.classList)).not.toContain('is-added');
		});
	});

	it('Must use the updated quantity to add a new item', async () => {
		const addToCart = render(<AddToCart {...props} />);

		const {button, input} = getLocators(addToCart);

		await act(async () => {
			await userEvent.type(input, String(10));
			input.value = String(10);

			fireEvent.change(input);

			fireEvent.click(button);
		});

		expect(addProductToCartFn).toHaveBeenCalledWith({
			options: '[]',
			quantity: 10,
			replacedSkuId: 0,
			skuId: 42633,
		});
	});

	describe('bundled-product variants and purchasable contract', () => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const {
			mockBundledProductMultiSku,
			mockBundledProductSingleSku,

			// @ts-ignore
		} = require('../fixtures/productFixtures');

		it('a single-SKU bundled product (purchasable=true) renders an enabled add-to-cart button alongside the quantity selector', () => {
			const addToCart = render(
				<AddToCart {...mockBundledProductSingleSku()} />
			);

			const {button, input} = getLocators(addToCart);

			expect(input).toBeInTheDocument();
			expect(button).toBeInTheDocument();
			expect(button).not.toBeDisabled();
		});

		it('a static-price single-SKU bundled product also renders an enabled add-to-cart button (the price-type does not affect the AddToCart contract)', () => {
			const addToCart = render(
				<AddToCart
					{...mockBundledProductSingleSku({
						settings: {priceType: 'static'},
					})}
				/>
			);

			const {button, input} = getLocators(addToCart);

			expect(input).toBeInTheDocument();
			expect(button).toBeInTheDocument();
			expect(button).not.toBeDisabled();
		});

		it('a multi-SKU bundled product (purchasable=false) renders the add-to-cart button in the disabled state', () => {
			const addToCart = render(
				<AddToCart {...mockBundledProductMultiSku()} />
			);

			const {button} = getLocators(addToCart);

			expect(button).toBeInTheDocument();
			expect(button).toBeDisabled();
		});

		it('a static-price multi-SKU bundled product also renders the add-to-cart button disabled', () => {
			const addToCart = render(
				<AddToCart
					{...mockBundledProductMultiSku({
						settings: {priceType: 'static'},
					})}
				/>
			);

			const {button} = getLocators(addToCart);

			expect(button).toBeInTheDocument();
			expect(button).toBeDisabled();
		});

		it('when a product cannot be purchased directly (purchasable=false), AddToCart is disabled — the surrounding product card is expected to surface a "view all variants" link instead', () => {
			const addToCart = render(
				<AddToCart {...mockBundledProductMultiSku()} />
			);

			const {button} = getLocators(addToCart);

			expect(button).toBeDisabled();
		});
	});

	describe('product-details stock, quantity, and multi-SKU validation', () => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const {
			mockProduct,

			// @ts-ignore
		} = require('../fixtures/productFixtures');

		describe('Stock and purchasability', () => {
			it('stockQuantity=0 + backOrderAllowed=true → button is enabled (back-order overrides empty stock)', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							cpInstance: {
								availability: {stockQuantity: 0},
								backOrderAllowed: true,
							},
						})}
					/>
				);

				const {button} = getLocators(addToCart);

				expect(button).not.toBeDisabled();
			});

			it('purchasable=false disables the button regardless of stock', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							cpInstance: {purchasable: false},
						})}
					/>
				);

				const {button} = getLocators(addToCart);

				expect(button).toBeDisabled();
			});

			it('stockQuantity=0 + backOrderAllowed=false → button is disabled', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							cpInstance: {
								availability: {stockQuantity: 0},
								backOrderAllowed: false,
							},
						})}
					/>
				);

				const {button} = getLocators(addToCart);

				expect(button).toBeDisabled();
			});
		});

		describe('Quantity validation', () => {
			it('when allowedOrderQuantities is set, the QuantitySelector renders the corresponding <option> values', () => {
				const allowedOrderQuantities = [1, 4, 5, 7, 11];

				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities,
								},
							},
						})}
					/>
				);

				const options =
					addToCart.container.querySelectorAll('option');

				expect(options).toHaveLength(allowedOrderQuantities.length);

				Array.from(options).forEach((option, index) => {
					expect(option.getAttribute('value')).toBe(
						String(allowedOrderQuantities[index])
					);
				});
			});

			it('the quantity input reflects minOrderQuantity as input.min', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities: [],
									maxOrderQuantity: 50,
									minOrderQuantity: 4,
									multipleOrderQuantity: 1,
								},
							},
						})}
					/>
				);

				const {input} = getLocators(addToCart);

				expect(input.min).toBe('4');
			});

			it('the quantity input reflects multipleOrderQuantity as input.step', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities: [],
									maxOrderQuantity: 30,
									minOrderQuantity: 3,
									multipleOrderQuantity: 3,
								},
							},
						})}
					/>
				);

				const {input} = getLocators(addToCart);

				expect(input.step).toBe('3');
			});
		});

		describe('Multi-SKU product variants — after a SKU is resolved, AddToCart sees the same contract as a single-SKU product', () => {
			it('typing a value outside allowedOrderQuantities is rejected by the QuantitySelector and addToCart never fires', async () => {
				const allowedOrderQuantities = [1, 5, 10];

				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities,
								},
							},
						})}
					/>
				);

				const select =
					addToCart.container.querySelector('select') as
						| HTMLSelectElement
						| null;
				const {button} = getLocators(addToCart);

				expect(select).toBeInTheDocument();
				expect(
					Array.from(select!.options).map((option) =>
						Number(option.value)
					)
				).toEqual(allowedOrderQuantities);

				fireEvent.click(button);

				expect(addProductToCartFn).not.toHaveBeenCalled();
			});

			it('typing a value above maxOrderQuantity blocks the add-to-cart call', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities: [],
									maxOrderQuantity: 5,
									minOrderQuantity: 1,
									multipleOrderQuantity: 1,
								},
							},
						})}
					/>
				);

				const {button, input} = getLocators(addToCart);

				act(() => {
					fireEvent.change(input, {target: {value: '10'}});
				});

				fireEvent.click(button);

				expect(addProductToCartFn).not.toHaveBeenCalled();
			});

			it('typing a value below minOrderQuantity blocks the add-to-cart call', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities: [],
									maxOrderQuantity: 50,
									minOrderQuantity: 5,
									multipleOrderQuantity: 1,
								},
							},
						})}
					/>
				);

				const {button, input} = getLocators(addToCart);

				act(() => {
					fireEvent.change(input, {target: {value: '2'}});
				});

				fireEvent.click(button);

				expect(addProductToCartFn).not.toHaveBeenCalled();
			});

			it('typing a non-step-multiple value blocks the add-to-cart call', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities: [],
									maxOrderQuantity: 30,
									minOrderQuantity: 3,
									multipleOrderQuantity: 3,
								},
							},
						})}
					/>
				);

				const {button, input} = getLocators(addToCart);

				act(() => {
					fireEvent.change(input, {target: {value: '7'}});
				});

				fireEvent.click(button);

				expect(addProductToCartFn).not.toHaveBeenCalled();
			});

			it('a value that exceeds the max AND is not a step-multiple is rejected', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities: [],
									maxOrderQuantity: 10,
									minOrderQuantity: 2,
									multipleOrderQuantity: 2,
								},
							},
						})}
					/>
				);

				const {button, input} = getLocators(addToCart);

				act(() => {
					fireEvent.change(input, {target: {value: '13'}});
				});

				fireEvent.click(button);

				expect(addProductToCartFn).not.toHaveBeenCalled();
			});

			it('a value below the min AND not a step-multiple is rejected', () => {
				const addToCart = render(
					<AddToCart
						{...mockProduct({
							settings: {
								productConfiguration: {
									allowedOrderQuantities: [],
									maxOrderQuantity: 30,
									minOrderQuantity: 4,
									multipleOrderQuantity: 2,
								},
							},
						})}
					/>
				);

				const {button, input} = getLocators(addToCart);

				act(() => {
					fireEvent.change(input, {target: {value: '3'}});
				});

				fireEvent.click(button);

				expect(addProductToCartFn).not.toHaveBeenCalled();
			});
		});
	});
});
