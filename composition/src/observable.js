/** @type {import('./observable').ObservableTracker} */
let currentTracker;

export const $Observable = Symbol('obs');

export function observable(value) {
	/** @type {Set<import("./observable").ObservableTracker>} */
	const _observers = new Set();

	function data(nextValue) {
		if (arguments.length) {
			if (value != nextValue) {
				value = nextValue;
				_observers.forEach(f => f(nextValue));
			}
		} else {
			if (currentTracker && !_observers.has(currentTracker)) {
				_observers.add(currentTracker);
				currentTracker._observables.push(data);
			}
			return value;
		}
	}

	data[$Observable] = {
		sub(fn) {
			_observers.add(fn);
		}
	};

	return data;
}

export function track(run, onUpdate) {
	function update() {
		onUpdate(trackWith(run, update));
	}

	/** @type {import("./observable").Observable[]} */
	update._observables = [];

	update();
}

export function sample(observable) {
	return trackWith(observable, undefined);
}

function trackWith(fn, tracker) {
	const oldTracker = currentTracker;
	currentTracker = tracker;

	let value = fn();

	currentTracker = oldTracker;
	return value;
}
