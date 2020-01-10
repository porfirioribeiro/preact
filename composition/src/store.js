/**
 * Inspired on svelte stores
 * https://github.com/sveltejs/svelte/blob/master/src/runtime/store/index.ts
 */

export function readable(value) {
	return { subscribe: createStore(value).subscribe };
}

export function createStore(value) {
	const subscribers = [];
	function set(newValue) {
		if (value != value ? newValue == newValue : value !== newValue) {
			value = newValue;
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
		callback(value);
		return () => {
			const index = subscribers.indexOf(callback);
			if (index !== -1) subscribers.splice(index, 1);
		};
	}
	return { set, update, subscribe };
}

export function subscribe(store, callback) {
	const unsub = store.subscribe(callback);
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
