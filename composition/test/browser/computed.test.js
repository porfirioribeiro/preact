import { createElement, render } from 'preact';
import { setupScratch, teardown } from '../../../test/_util/helpers';
import {
	createComponent,
	computed,
	unwrap,
	isReactive,
	value
} from '../../src';

/** @jsx createElement */

describe('computed', () => {
	/** @type {HTMLDivElement} */
	let scratch;

	beforeEach(() => {
		scratch = setupScratch();
	});

	afterEach(() => {
		teardown(scratch);
	});

	// it('computed new values', () => {
	// 	let results = [];

	// 	const Comp = createComponent(() => {
	// 		const obs = value(5);
	// 		const obs2 = computed(() => obs.value * 2);
	// 		const obs3 = computed(() => obs2.value * 2);
	// 		const obs4 = computed(() => obs2.value * obs3.value);
	// 		console.log(obs.value, obs2.value, obs3.value, obs4.value);
	// 		obs.value = 10;
	// 		console.log(obs.value, obs2.value, obs3.value, obs4.value);

	// 		return () => {
	// 			results = [obs.value, obs2.value, obs3.value, obs4.value];
	// 			return null;
	// 		};
	// 	});

	// 	render(<Comp a={1} b={1} />, scratch);
	// 	expect(results).to.deep.equal([10, 20, 40, 800]);

	// 	console.log(results);
	// });

	it('only recomputes the result when inputs change', () => {
		let memoFunction = sinon.spy((a, b) => a + b);
		const results = [];

		const Comp = createComponent(props => {
			const result = computed(() => memoFunction(props.a, props.b));

			return () => {
				results.push(result.value);
				return null;
			};
		});

		render(<Comp a={1} b={1} />, scratch);
		render(<Comp a={1} b={1} />, scratch);

		expect(results).to.deep.equal([2, 2]);
		expect(memoFunction).to.have.been.calledOnce;

		render(<Comp a={1} b={2} />, scratch);
		render(<Comp a={1} b={2} />, scratch);

		expect(results).to.deep.equal([2, 2, 3, 3]);
		expect(memoFunction).to.have.been.calledTwice;
	});

	// it('unwrap and check reactivity', () => {
	// 	const Comp = createComponent(() => {
	// 		const sum = computed(props => props.a + props.b);

	// 		expect(unwrap(sum)).to.equal(3);
	// 		expect(unwrap(sum)).to.equal(sum.value);
	// 		expect(isReactive(sum)).to.be.true;
	// 		expect(isReactive(sum.value)).to.be.false;
	// 		expect(isReactive(null)).to.be.false;
	// 		expect(isReactive(false)).to.be.false;

	// 		return () => null;
	// 	});

	// 	render(<Comp a={1} b={2} />, scratch);
	// });

	// it('computed with unhandled sources', () => {
	// 	const Comp = createComponent(() => {
	// 		expect(computed(1).value).to.equal(1);
	// 		expect(computed('str').value).to.equal('str');
	// 		expect(computed(null).value).to.equal(null);
	// 		expect(computed(false).value).to.equal(false);
	// 		expect(computed({ a: 1 }).value).to.deep.equal({ a: 1 });
	// 		expect(computed([1, 2]).value).to.deep.equal([1, 2]);

	// 		return () => null;
	// 	});

	// 	render(<Comp />, scratch);
	// });

	// it('computed async', async () => {
	// 	function fetchData(n) {
	// 		return new Promise(resolve => setTimeout(() => resolve([1, n]), 1));
	// 	}

	// 	let data;
	// 	const Comp = createComponent(() => {
	// 		data = computed(props => props.a, fetchData);

	// 		return () => null;
	// 	});

	// 	render(<Comp a={1} />, scratch);

	// 	expect(data.value).to.deep.equal();

	// 	await new Promise(resolve => setTimeout(resolve, 1));

	// 	expect(data.value).to.deep.equal([1, 1]);
	// });

	// it('computed async with defaultValue', async () => {
	// 	function fetchData(n) {
	// 		return new Promise(resolve => setTimeout(() => resolve([1, n]), 1));
	// 	}

	// 	let data;
	// 	const Comp = createComponent(() => {
	// 		data = computed(props => props.a, fetchData, []);

	// 		return () => null;
	// 	});

	// 	render(<Comp a={1} />, scratch);

	// 	expect(data.value).to.deep.equal([]);

	// 	await new Promise(resolve => setTimeout(resolve, 1));

	// 	expect(data.value).to.deep.equal([1, 1]);
	// });

	// it('computed with multi sources', () => {
	// 	const Comp = createComponent(() => {
	// 		const array = value([0, 5, 10]);
	// 		const index = value(1);

	// 		expect(computed(array).value).to.equal(array.value);
	// 		expect(computed([array, index], (a, i) => a[i]).value).to.equal(
	// 			array.value[index.value]
	// 		);

	// 		return () => null;
	// 	});

	// 	render(<Comp />, scratch);
	// });
});
