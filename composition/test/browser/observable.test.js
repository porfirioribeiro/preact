/* eslint-disable react/display-name */
import { setupRerender } from 'preact/test-utils';
import { createElement, render } from 'preact';
import { setupScratch, teardown } from '../../../test/_util/helpers';
import { observable, track } from '../../src/observable';

/** @jsx createElement */

describe('observable', () => {
	it('get and set the value', () => {
		const obs = observable(1);

		expect(obs()).to.eq(1);

		obs(2);

		expect(obs()).to.eq(2);
	});

	it('can track updates', () => {
		const obs = observable(1);
		const spyUpdate = sinon.spy();

		track(() => obs(), spyUpdate);
		expect(spyUpdate).to.be.calledOnce.calledWith(1);

		obs(2);
		expect(spyUpdate).to.be.calledTwice.calledWith(2);
	});
});
