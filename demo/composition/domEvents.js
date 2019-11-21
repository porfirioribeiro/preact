import { createElement } from 'preact';
import { createComponent, watch } from 'preact/composition';
import {
	useMousePosition,
	useWindowSize,
	mousePositionStore,
	windowSizeStore
} from './utils/use';

export default createComponent(function() {
	const mousePos = useMousePosition();
	const windowSize = useWindowSize();

	const size = 100;
	const gap = 5;
	// useMousePosition() or watch(mousePositionStore) begaves the same way
	// using both here for the sake of the sample

	const pos = watch(
		[mousePositionStore, windowSizeStore],
		({ x, y }, { width, height }) => ({
			x: x + gap + size > width ? width - size : x + gap,
			y: y + gap + size > height ? height - size : y + gap,
			color: `RGB(${(255 * x) / width}, 255, ${(255 * y) / height})`
		})
	);

	return () => {
		return (
			<div
				style={{
					background: pos.value.color,
					width: size,
					height: size,
					position: 'absolute',
					left: pos.value.x + 'px',
					top: pos.value.y + 'px'
				}}
			>
				{mousePos.value.x} - {mousePos.value.y} <br />
				{windowSize.value.width} -{windowSize.value.height}
			</div>
		);
	};
});
