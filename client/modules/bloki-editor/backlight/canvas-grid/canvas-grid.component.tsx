import s from './canvas-grid.module.scss';
import { useEditorStore } from '../../editor.store';
import { BlockTransform } from "../../types/blocks";
import { FillColors, IGridImpl, } from '../shared';
import { createEffect } from 'solid-js';
import { useAppStore } from '@/modules/app.store';

export function BlokiCanvasGrid(): IGridImpl {
	let backlightCanvasRef: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const [editor, { gridSize, realSize }] = useEditorStore();
	const [app] = useAppStore();

	createEffect(() => {
		if (app.gridRenderMethod === 'canvas' && backlightCanvasRef) {
			ctx = backlightCanvasRef.getContext('2d');
		}
	});

	function roundRect(x: number, y: number, width: number, height: number, radius: number = 4) {
		if (width < 2 * radius) radius = width / 2;
		if (height < 2 * radius) radius = height / 2;
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.arcTo(x + width, y, x + width, y + height, radius);
		ctx.arcTo(x + width, y + height, x, y + height, radius);
		ctx.arcTo(x, y + height, x, y, radius);
		ctx.arcTo(x, y, x + width, y, radius);
		ctx.closePath();
	}

	// TODO: draw it by one path for optimization
	return {
		drawArea: (transform, cellState) => {
			const { x, y, width, height } = transform;
			const { gap, size } = editor.document.layoutOptions;

			for (let i = x; i < x + width; i++) {
				const absX = gridSize(i);
				for (let j = y; j < y + height; j++) {
					const absY = gridSize(j);
					roundRect(absX + gap, absY + gap, size, size, 4);
					if (typeof cellState === 'function') ctx.fillStyle = FillColors[cellState(x, y)];
					else ctx.fillStyle = FillColors[cellState];
					ctx.fill();
				}
			}
		},
		clearArea: (transform: BlockTransform) => {
			const { gap } = editor.document.layoutOptions;
			const { x, y, width, height } = transform;
			ctx.clearRect(gridSize(x) + gap, gridSize(y) + gap, gridSize(width + 1), gridSize(height + 1));
		},
		component: () => (
			<canvas
				class={s.backlight}
				ref={backlightCanvasRef}
				width={realSize().fGridWidth_px}
				height={realSize().fGridHeight_px}
			/>
		)
	};
}