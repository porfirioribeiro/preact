export declare const $Observable: unique symbol;

export interface ObservableTracker {
	(nextValue: T): T;
	_observables: Observable[];
}

export interface ObservableInner<T> {
	sub(fn: (v: T) => void): void;
}

export interface Observable<T> {
	(): T;
	(nextValue: T): T;
	[$Observable]: ObservableInner<T>;
}

export function observable<T>(value: T): Observable<T>;
export function track<T>(run: () => T, onUpdate: (T) => void): () => T;
