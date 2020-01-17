import { Component as PreactComponent } from '../../src/internal';
import { Ref } from '../../src/index';

export { PreactContext } from '../../src/internal';

import { WatchSrc, WatchCallback, EffectCallback, ValueHolder } from './index';

type OldWatcher = {
	/** input src */
	src: WatchSrc;
	/** callback to call whenever src change */
	cb: WatchCallback;
	/** effect onCleanup */
	cl?: () => void;
	/** watch returned value */
	vr?: ValueHolder;
	/** args resultant from src */
	args?: any[];
};

export type Watcher = {
	_isArray?: boolean;
	_value?: any | any[];
	_oldValue?: any | any[];
	/** callback to call whenever src change */
	_callback?: WatchCallback | EffectCallback;
	_store?: any;
	_onCleanup?: () => void;
};

export interface ComponentComposition {
	/** list of prerender callbacks */
	_prerender: (() => void)[];
	/** record of contexts connected via watch */
	_contexts: Record<string, PreactContext>;
	/** record of contexts provided by this component */
	_providers?: Record<string, { _component: Component; _value: any }>;
	/** ref to forward to inner component */
	_ref?: Ref<any>;
	/** list of watchs */
	_watchers: Watcher[];
	/** list of effects */
	_effects: Watcher[];
	_cleanup: Watcher[];
}

export interface Component extends PreactComponent<any, any> {
	constructor: { (c: Component): any };
	__compositions?: ComponentComposition;
}
