import { createElement, Component, render, createRef } from 'preact';
import { setupRerender } from 'preact/test-utils';
import { setupScratch, teardown } from '../_util/helpers';
import { logCall, clearLog, getLog } from '../_util/logCall';
import { div } from '../_util/dom';

/** @jsx createElement */

describe('null placeholders', () => {
	/** @type {HTMLDivElement} */
	let scratch;

	/** @type {() => void} */
	let rerender;

	/** @type {string[]} */
	let ops;

	function createNullable(name) {
		return function Nullable(props) {
			return props.show ? name : null;
		};
	}

	/**
	 * @param {string} name
	 * @returns {[import('preact').ComponentClass, import('preact').RefObject<{ toggle(): void }>]}
	 */
	function createStatefulNullable(name, initialShow = true) {
		let ref = createRef();
		class Nullable extends Component {
			constructor(props) {
				super(props);
				this.state = { show: initialShow };
				ref.current = this;
			}
			toggle() {
				this.setState({ show: !this.state.show });
			}
			componentDidUpdate() {
				ops.push(`Update ${name}`);
			}
			componentDidMount() {
				ops.push(`Mount ${name}`);
			}
			componentWillUnmount() {
				ops.push(`Unmount ${name}`);
			}
			render() {
				return this.state.show ? <div>{name}</div> : null;
			}
		}

		return [Nullable, ref];
	}

	before(() => {
		logCall(Element.prototype, 'appendChild');
		logCall(Element.prototype, 'insertBefore');
		logCall(Element.prototype, 'removeChild');
		logCall(Element.prototype, 'remove');
	});

	beforeEach(() => {
		scratch = setupScratch();
		rerender = setupRerender();
		ops = [];
	});

	afterEach(() => {
		teardown(scratch);
		clearLog();
	});

	it('should treat undefined as a hole', () => {
		let Bar = () => <div>bar</div>;

		function Foo(props) {
			let sibling;
			if (props.condition) {
				sibling = <Bar />;
			}

			return (
				<div>
					<div>Hello</div>
					{sibling}
				</div>
			);
		}

		render(<Foo condition />, scratch);
		expect(scratch.innerHTML).to.equal(
			'<div><div>Hello</div><div>bar</div></div>'
		);
		clearLog();

		render(<Foo />, scratch);
		expect(scratch.innerHTML).to.equal('<div><div>Hello</div></div>');
		expect(getLog()).to.deep.equal(['<div>bar.remove()']);
	});

	it('should preserve state of Components when using null or booleans as placeholders', () => {
		/**
		 * @param {string} name
		 * @returns {[import('preact').ComponentClass, import('preact').RefObject<{ increment(): void }]}
		 */
		function createCounter(name) {
			const ref = createRef();
			class Stateful extends Component {
				constructor(props) {
					super(props);
					this.state = { count: 0 };
					ref.current = this;
				}
				increment() {
					this.setState({ count: this.state.count + 1 });
				}
				componentDidUpdate() {
					ops.push(`Update ${name}`);
				}
				componentDidMount() {
					ops.push(`Mount ${name}`);
				}
				componentWillUnmount() {
					ops.push(`Unmount ${name}`);
				}
				render() {
					return (
						<div>
							{name}: {this.state.count}
						</div>
					);
				}
			}

			return [Stateful, ref];
		}

		const [Stateful1, s1ref] = createCounter('first');
		const [Stateful2, s2ref] = createCounter('second');
		const [Stateful3, s3ref] = createCounter('third');

		/**
		 * @param {{first: any; second: any}} props
		 */
		function App({ first = null, second = false }) {
			return [first, second, <Stateful3 />];
		}

		// Mount third stateful - Initial render
		render(<App />, scratch);
		expect(scratch.innerHTML).to.equal('<div>third: 0</div>');
		expect(ops).to.deep.equal(['Mount third'], 'mount third');

		// Update third stateful
		ops = [];
		s3ref.current.increment();
		rerender();
		expect(scratch.innerHTML).to.equal('<div>third: 1</div>');
		expect(ops).to.deep.equal(['Update third'], 'update third');

		// Mount first stateful
		ops = [];
		render(<App first={<Stateful1 />} />, scratch);
		expect(scratch.innerHTML).to.equal(
			'<div>first: 0</div><div>third: 1</div>'
		);
		expect(ops).to.deep.equal(['Mount first', 'Update third'], 'mount first');

		// Update first stateful
		ops = [];
		s1ref.current.increment();
		s3ref.current.increment();
		rerender();
		expect(scratch.innerHTML).to.equal(
			'<div>first: 1</div><div>third: 2</div>'
		);
		expect(ops).to.deep.equal(['Update third', 'Update first'], 'update first');

		// Mount second stateful
		ops = [];
		render(<App first={<Stateful1 />} second={<Stateful2 />} />, scratch);
		expect(scratch.innerHTML).to.equal(
			'<div>first: 1</div><div>second: 0</div><div>third: 2</div>'
		);
		expect(ops).to.deep.equal(
			['Update first', 'Mount second', 'Update third'],
			'mount second'
		);

		// Update second stateful
		ops = [];
		s1ref.current.increment();
		s2ref.current.increment();
		s3ref.current.increment();
		rerender();
		expect(scratch.innerHTML).to.equal(
			'<div>first: 2</div><div>second: 1</div><div>third: 3</div>'
		);
		expect(ops).to.deep.equal(
			['Update third', 'Update second', 'Update first'],
			'update second'
		);
	});

	it('should efficiently replace self-updating null placeholders', () => {
		// These Nullable components replace themselves with null without the parent re-rendering
		const [Nullable, ref] = createStatefulNullable('Nullable');
		const [Nullable2, ref2] = createStatefulNullable('Nullable2');
		function App() {
			return (
				<div>
					<div>1</div>
					<Nullable />
					<div>3</div>
					<Nullable2 />
				</div>
			);
		}

		render(<App />, scratch);
		expect(scratch.innerHTML).to.equal(
			div([div(1), div('Nullable'), div(3), div('Nullable2')])
		);

		clearLog();
		ref2.current.toggle();
		ref.current.toggle();
		rerender();
		expect(scratch.innerHTML).to.equal(div([div(1), div(3)]));
		expect(getLog()).to.deep.equal([
			'<div>Nullable.remove()',
			'<div>Nullable2.remove()'
		]);

		clearLog();
		ref2.current.toggle();
		ref.current.toggle();
		rerender();
		expect(scratch.innerHTML).to.equal(
			div([div(1), div('Nullable'), div(3), div('Nullable2')])
		);
		expect(getLog()).to.deep.equal([
			'<div>.appendChild(#text)',
			'<div>13.insertBefore(<div>Nullable, <div>3)',
			'<div>.appendChild(#text)',
			'<div>1Nullable3.appendChild(<div>Nullable2)'
		]);
	});

	// See preactjs/preact#2350
	xit('should efficiently replace null placeholders in parent rerenders (#2350)', () => {
		// This Nullable only changes when it's parent rerenders
		const Nullable1 = createNullable('Nullable 1');
		const Nullable2 = createNullable('Nullable 2');

		/** @type {() => void} */
		let toggle;
		class App extends Component {
			constructor(props) {
				super(props);
				this.state = { show: false };
				toggle = () => this.setState({ show: !this.state.show });
			}
			render() {
				return (
					<div>
						<div>{this.state.show.toString()}</div>
						<Nullable1 show={this.state.show} />
						<div>the middle</div>
						<Nullable2 show={this.state.show} />
					</div>
				);
			}
		}

		render(<App />, scratch);
		expect(scratch.innerHTML).to.equal(div([div('false'), div('the middle')]));

		clearLog();
		toggle();
		rerender();
		expect(scratch.innerHTML).to.equal(
			div([div('true'), 'Nullable 1', div('the middle'), 'Nullable 2'])
		);
		expect(getLog()).to.deep.equal([
			'<div>truethe middle.insertBefore(#text, <div>the middle)',
			'<div>trueNullable 1the middle.appendChild(#text)'
		]);

		clearLog();
		toggle();
		rerender();
		expect(scratch.innerHTML).to.equal(div([div('false'), div('the middle')]));
		expect(getLog()).to.deep.equal([
			'#text.remove()',
			// '<div>falsethe middleNullable 2.appendChild(<div>the middle)',
			'#text.remove()'
		]);
	});
});
