import { Component } from 'preact';
import { assign } from '../../src/util';
import { createStore } from './store';

export { createStore } from './store';

/**
 * @typedef {import('./internal').Component} CompositionComponent
 * @typedef {import('./internal').Watcher} Watcher
 */
/** @type {CompositionComponent} */
let currentComponent;

const $Reactive = Symbol();
const $Store = Symbol();

/** @this {CompositionComponent} */
function _afterRender() {
	// handle all `effect`s
	var effect;
	while ((effect = this.__compositions._effects.pop())) {
		cleanupEffect(effect);
		effect._callback(
			effect._value,
			effect._oldValue,
			onCleanup => (effect._onCleanup = onCleanup)
		);
		effect._oldValue = effect._isArray ? effect._value.slice() : effect._value;
	}
}

/** @this {CompositionComponent} */
function _unmount() {
	// cleanup `effect`s onCleanup and call all onUnmounted lifecycle callbacks
	this.__compositions._cleanup.some(cleanupEffect);
}

export function createComponent(setupFn) {
	function CompositionComponent() {}

	// @ts-ignore
	assign((CompositionComponent.prototype = new Component()), {
		componentWillMount: _initComposition,
		componentDidMount: _afterRender,
		componentDidUpdate: _afterRender,
		componentWillUnmount: _unmount
	});

	/** @this {CompositionComponent} */
	function _initComposition() {
		/** @type {CompositionComponent} */
		const c = (currentComponent = this);
		let init;
		c.__compositions = {
			_contexts: {},
			_prerender: [],
			_watchers: [],
			_effects: [],
			_cleanup: []
		};
		const render = setupFn(c);

		c.render = function(props) {
			if (init) {
				c.__compositions._prerender.some(callArg);
				_handleWatchers(c);
			}
			// get the ref and remove it from vnode
			const ref = (c.__compositions._ref = c._vnode.ref);
			c._vnode.ref = null;

			init = true;
			return render(props, ref);
		};
		currentComponent = null;
	}

	return CompositionComponent;
}

/** @param {CompositionComponent} c */
function _handleWatchers(c) {
	var watcher;
	while ((watcher = c.__compositions._watchers.pop())) {
		const value = watcher._callback
			? watcher._callback.apply(
					null,
					watcher._isArray ? watcher._value : [watcher._value]
			  )
			: watcher._value;

		const store = watcher._store;
		if (value && value.then) {
			// the value is a promise
			value.then(v => {
				store.set(v);
				c.forceUpdate();
			});
		} else store.set(value);
		watcher._oldValue = watcher._isArray
			? watcher._value.slice()
			: watcher._value;
	}
}

export function memo(comparer) {
	currentComponent.shouldComponentUpdate = function(
		nextProps,
		_ns,
		_nc,
		newVNode
	) {
		return (
			newVNode.ref !== this.__compositions._ref ||
			(comparer || shallowDiffers)(this.props, nextProps)
		);
	};
}

export function watch(src, cb, dv) {
	const vr = value(dv, true, false);
	_createWatcher(
		currentComponent.__compositions._watchers,
		src,
		cb,
		vr[$Store]
	);
	_handleWatchers(currentComponent);
	return vr;
}

export function effect(src, cb) {
	_createWatcher(currentComponent.__compositions._effects, src, cb);
}

function _createWatcher(lifecycleList, src, cb, store) {
	const srcIsArray = Array.isArray(src);
	/** @type {Watcher} */
	const watcher = {
		_isArray: srcIsArray,
		_value: srcIsArray ? [] : null,
		_callback: cb,
		_store: store
	};
	srcIsArray
		? src.forEach((s, i) => toValue(watcher, lifecycleList, s, i))
		: toValue(watcher, lifecycleList, src);
}

/**
 * @this {import('./internal').Watcher}
 * @param {*} src
 * @param {Watcher} watcher
 * @param {Watcher[]} watcherList
 * @param {*} [i]
 */
function toValue(watcher, watcherList, src, i) {
	const callback = v => {
		i == undefined ? (watcher._value = v) : (watcher._value[i] = v);
		if (watcherList.indexOf(watcher) < 0) watcherList.push(watcher);
	};
	const c = currentComponent;

	if (src) {
		let tmp, value;
		const isFunc = typeof src === 'function';
		const isContext = src.Provider;
		// use the value from a getter function
		// unrap the value and subscribe to the context
		if (isFunc || isContext) {
			if (isContext) {
				const id = src._id;
				const provider = c.context[id];
				if (provider && !c.__compositions._contexts[id]) {
					provider.sub(c);
					c.__compositions._contexts[id] = src;
				}
			}
			const prerender = () => {
				const v = isContext
					? (tmp = c.context[src._id])
						? tmp.props.value
						: src._defaultValue
					: src(c.props);

				if (v !== value) callback((value = v));
			};
			prerender();
			return c.__compositions._prerender.push(prerender);
		}
		// unwrap value or reactive, returning their immutable value
		else if (trySubscribe(src, callback)) return;
	}
	callback(src);
}

export function onMounted(cb) {
	currentComponent._renderCallbacks.push(cb);
}

export function onUnmounted(cb) {
	currentComponent.__compositions._cleanup.push({ _onCleanup: cb });
}

export function provide(name, _value) {
	const c = currentComponent;
	if (!c.__compositions._providers) {
		c.__compositions._providers = {};
		c.getChildContext = () => c.__compositions._providers;
	}
	c.__compositions._providers[`__sC_${name}`] = { _component: c, _value };
}

export function inject(name, defaultValue) {
	const c = currentComponent;
	const ctx = c.context[`__sC_${name}`];
	const src = ctx ? ctx._value : defaultValue;

	trySubscribe(src, () => c.forceUpdate());

	return src;
}

function trySubscribe(src, callback, tmp) {
	if ((tmp = src[$Store]) || (tmp = src.subscribe && src)) {
		const unsub = tmp.subscribe(callback);
		onUnmounted(unsub.unsubscribe ? () => unsub.unsubscribe() : unsub);
		return true;
	}
}

export function reactive(v) {
	const rv = value(v);
	const $value = rv[$Store];

	delete rv.value;
	const properties = { $value };

	Object.keys(v).forEach(key => {
		properties[key] = _propDescriptor(
			function() {
				return $value.get()[key];
			},
			function(newValue) {
				let x = $value.get();
				if (newValue !== x[key]) {
					x = assign({}, x);
					x[key] = newValue;
					$value.set(x);
				}
			}
		);
	});
	return Object.defineProperties(rv, properties);
}

/**
 *
 * @param {any} v
 * @param {boolean|undefined} [readonly]
 * @param {CompositionComponent|false|undefined} [c]
 */
export function value(v, readonly, c = currentComponent) {
	const store = createStore(v);
	const set = readonly ? undefined : store.set;
	const get = store.get;
	if (c) {
		onUnmounted(
			store.subscribe(() => {
				c.forceUpdate();
			})
		);
	}

	return Object.defineProperties(
		{},
		{
			[$Reactive]: store,
			[$Store]: { value: store },
			value: _propDescriptor(get, set)
		}
	);
}

function _propDescriptor(get, set) {
	return { get, set, enumerable: true, configurable: true };
}

export function unwrap(v) {
	return isReactive(v) ? v[$Reactive] : v;
}

export function isReactive(v) {
	return typeof v === 'object' && !!v && $Reactive in v;
}

/** @param {Watcher} effect */
function cleanupEffect(effect) {
	if (effect._onCleanup) {
		effect._onCleanup();
		effect._onCleanup = undefined;
	}
}

function callArg(f) {
	f();
}

/**
 * Check if two objects have a different shape
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function shallowDiffers(a, b) {
	for (let i in a) if (i !== '__source' && !(i in b)) return true;
	for (let i in b) if (i !== '__source' && a[i] !== b[i]) return true;
	return false;
}
