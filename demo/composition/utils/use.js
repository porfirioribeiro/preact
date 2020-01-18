import { onMounted, onUnmounted, value, createStore } from 'preact/composition';

export const mousePositionStore = createStore({ x: 0, y: 0 }, set => {
	let t;
	function update(e) {
		cancelAnimationFrame(t);
		t = requestAnimationFrame(() => set({ x: e.pageX, y: e.pageY }));
	}

	window.addEventListener('mousemove', update);
	return () => window.removeEventListener('mousemove', update);
});

export const windowSizeStore = createStore(null, set => {
	let t;
	const updateSize = () => set(getWindowSize());
	function update() {
		cancelAnimationFrame(t);
		t = requestAnimationFrame(updateSize);
	}
	updateSize();

	window.addEventListener('resize', update);
	return () => window.removeEventListener('resize', update);
});

export function useMousePosition() {
	const pos = value({ x: 0, y: 0 });

	let t;
	function update(e) {
		cancelAnimationFrame(t);
		t = requestAnimationFrame(() => {
			pos.value = {
				x: e.pageX,
				y: e.pageY
			};
		});
	}

	onMounted(() => window.addEventListener('mousemove', update));
	onUnmounted(() => window.removeEventListener('mousemove', update));

	return pos;
}

export function useWindowSize() {
	const size = value(getWindowSize());

	let t;
	function update() {
		cancelAnimationFrame(t);
		t = requestAnimationFrame(() => (size.value = getWindowSize()));
	}

	onMounted(() => window.addEventListener('resize', update));
	onUnmounted(() => window.removeEventListener('resize', update));

	return size;
}

function getWindowSize() {
	return {
		width: window.innerWidth,
		height: window.innerHeight
	};
}
