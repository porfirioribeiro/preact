import React, { createElement, render } from 'preact/compat';
import {
	setupScratch,
	teardown,
	serializeHtml
} from '../../../test/_util/helpers';

describe('compat render', () => {
	/** @type {HTMLDivElement} */
	let scratch;

	const ce = type => document.createElement(type);
	const text = text => document.createTextNode(text);

	beforeEach(() => {
		scratch = setupScratch();
	});

	afterEach(() => {
		teardown(scratch);
	});

	it('should render react-style jsx', () => {
		let jsx = (
			<div className="foo bar" data-foo="bar">
				<span id="some_id">inner!</span>
				{['a', 'b']}
			</div>
		);

		expect(jsx.props).to.have.property('className', 'foo bar');

		React.render(jsx, scratch);
		expect(serializeHtml(scratch)).to.equal(
			'<div class="foo bar" data-foo="bar"><span id="some_id">inner!</span>ab</div>'
		);
	});

	it('should replace isomorphic content', () => {
		let root = ce('div');
		let initialChild = ce('div');
		initialChild.appendChild(text('initial content'));
		root.appendChild(initialChild);

		render(<div>dynamic content</div>, root);
		expect(root)
			.to.have.property('textContent')
			.that.is.a('string')
			.that.equals('dynamic content');
	});

	it('should remove extra elements', () => {
		let root = ce('div');
		let inner = ce('div');

		root.appendChild(inner);

		let c1 = ce('div');
		c1.appendChild(text('isomorphic content'));
		inner.appendChild(c1);

		let c2 = ce('div');
		c2.appendChild(text('extra content'));
		inner.appendChild(c2);

		render(<div>dynamic content</div>, root);
		expect(root)
			.to.have.property('textContent')
			.that.is.a('string')
			.that.equals('dynamic content');
	});

	// Note: Replacing text nodes inside the root itself is currently unsupported.
	// We do replace them everywhere else, though.
	it('should remove text nodes', () => {
		let root = ce('div');

		let div = ce('div');
		root.appendChild(div);
		div.appendChild(text('Text Content'));
		div.appendChild(text('More Text Content'));

		render(<div>dynamic content</div>, root);
		expect(root)
			.to.have.property('textContent')
			.that.is.a('string')
			.that.equals('dynamic content');
	});

	it('should support defaultValue', () => {
		render(<input defaultValue="foo" />, scratch);
		expect(scratch.firstElementChild).to.have.property('value', 'foo');
	});

	it('should ignore defaultValue when value is 0', () => {
		render(<input defaultValue={2} value={0} />, scratch);
		expect(scratch.firstElementChild.value).to.equal('0');
	});

	it('should call the callback', () => {
		let spy = sinon.spy();
		render(<div />, scratch, spy);
		expect(spy).to.be.calledOnce;
		expect(spy).to.be.calledWithExactly();
	});

	// Issue #1727
	it('should destroy the any existing DOM nodes inside the container', () => {
		scratch.appendChild(document.createElement('div'));
		scratch.appendChild(document.createElement('div'));

		render(<span>foo</span>, scratch);
		expect(scratch.innerHTML).to.equal('<span>foo</span>');
	});

	it('should only destroy existing DOM nodes on first render', () => {
		scratch.appendChild(document.createElement('div'));
		scratch.appendChild(document.createElement('div'));

		render(<input />, scratch);

		let child = scratch.firstChild;
		child.focus();
		render(<input />, scratch);
		expect(document.activeElement.nodeName).to.equal('INPUT');
	});

	it('should normalize class+className even on components', () => {
		function Foo(props) {
			return (
				<div class={props.class} className={props.className}>
					foo
				</div>
			);
		}
		render(<Foo class="foo" />, scratch);
		expect(scratch.firstChild.className).to.equal('foo');
		render(null, scratch);

		render(<Foo className="foo" />, scratch);
		expect(scratch.firstChild.className).to.equal('foo');
	});

	// Issue #2275
	it('should normalize class+className + DOM properties', () => {
		function Foo(props) {
			return <ul {...props} class="old" />;
		}

		render(<Foo fontSize="xlarge" className="new" />, scratch);
		expect(scratch.firstChild.className).to.equal('new');
	});
});
