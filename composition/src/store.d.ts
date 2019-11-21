/** Callback to inform of a value updates. */
declare type Subscriber<T> = (value: T) => void;
/** Unsubscribes from value updates. */
declare type Unsubscriber = () => void;
/** Callback to update a value. */
declare type Updater<T> = (value: T) => T;
/** Cleanup logic callback. */
declare type Invalidator<T> = (value?: T) => void;
/** Start and stop notification callbacks. */
declare type StartStopNotifier<T> = (set: Subscriber<T>) => Unsubscriber | void;

export interface Store<T> {
	/**
	 * Get the current value on the store
	 */
	get(): T;
	/**
	 * Subscribe on value changes.
	 * @param run subscription callback
	 * @param invalidate cleanup callback
	 */
	subscribe(run: Subscriber<T>, invalidate?: Invalidator<T>): Unsubscriber;
	/**
	 * Set value and inform subscribers.
	 * @param value to set
	 */
	set(value: T): void;
	/**
	 * Update value using callback and inform subscribers.
	 * @param updater callback
	 */
	update(updater: Updater<T>): void;
}
/**
 * Create a `Store` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
export declare function createStore<T>(
	value: T,
	start?: StartStopNotifier<T>
): Store<T>;
