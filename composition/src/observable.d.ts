export interface ObservableTracker {
	(nextValue: T): T;
	_observables: Observable[];
}

export interface Observable<T> {
	(): T;
	(nextValue: T): T;
	_observers: Set<ObservableTracker>;
}

export function observable<T>(value: T): Observable<T>;
export function track<T>(run: () => T, onUpdate: (T) => void): () => T;
