import { createElement, render, Component } from 'preact';
import { setupScratch, teardown } from '../_util/helpers';

/** @jsx createElement */

describe('customised built-in elements', () => {
	let scratch;

	beforeEach(() => {
		scratch = setupScratch();
	});

	afterEach(() => {
		teardown(scratch);
	});

	it('should create built in elements correctly', () => {
		class Foo extends Component {
			constructor(props) {
				super(props);
				return true;
			}
			render() {
				return <div is="built-in" />;
			}
		}

		const spy = sinon.spy();

		class BuiltIn extends HTMLDivElement {
			connectedCallback() {
				spy();
			}
		}

		customElements.define('built-in', BuiltIn, { extends: 'div' });

		render(<Foo />, scratch);

		expect(spy).to.have.been.calledOnce;
	});
});
