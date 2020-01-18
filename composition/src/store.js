/**
 * Inspired on svelte stores
 * https://github.com/sveltejs/svelte/blob/master/src/runtime/store/index.ts
 */

export function readable(value) {
	return { subscribe: createStore(value).subscribe };
}

export function createStore(value, start = noop) {
	const subscribers = [];
	let stop;
	function get() {
		return value;
	}
	function set(newValue) {
		if (value != value ? newValue == newValue : value !== newValue) {
			value = newValue;
			if (stop)
				subscribers.some(f => {
					f(value);
				});
		}
	}
	function update(fn) {
		set(fn(value));
	}
	function subscribe(callback) {
		subscribers.push(callback);
		// @ts-ignore
		if (subscribers.length === 1) stop = start(set) || noop;
		callback(value);
		return () => {
			const index = subscribers.indexOf(callback);
			if (index !== -1) subscribers.splice(index, 1);
			if (subscribers.length === 0) {
				stop();
				stop = null;
			}
		};
	}
	return { get, set, update, subscribe };
}

function noop() {}
