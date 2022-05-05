import { LayoutOptions } from "@/lib/entities";
import { AnyBlock, BlockTransform, Dimension, PlacementStatus, Point } from "./types/blocks";

export function calcGridSize(factor: number, size: number, gap: number) {
	if (factor <= 0) return 0;
	return factor * (size + gap) - gap;
}

export function getImgDimension(dataURL: string): Promise<Dimension> {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => {
			resolve({
				height: img.naturalHeight,
				width: img.naturalWidth
			});
			img.remove();
		};
		img.src = dataURL;
	});
}

export const getImageOrFallback = (src: string) => {
	return new Promise<string>((resolve, reject) => {
		const img = new Image();
		img.src = src;
		img.onload = () => resolve(src);
		img.onerror = () => reject();
	});
};
export const toBase64 = file => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = () => resolve(reader.result);
	reader.onerror = error => reject(error);
});

export function distanceBetweenPoints(p1: Point, p2: Point) {
	return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function isInsideRect(x: number, y: number, rect: BlockTransform | DOMRect) {
	return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

export function readAsDataUrl(b: Blob) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = (e) => reject(reader.error);
		reader.readAsDataURL(b);
	});
}

export async function getGoodImageRelativeSize(imgSrc: string, options: LayoutOptions) {
	if (!imgSrc) {
		return { width: options.mGridWidth, height: options.mGridWidth * 2 / 3 };
	}
	let dimension: Dimension;
	if (imgSrc.includes('svg')) {
		dimension = { width: options.mGridWidth, height: options.mGridWidth };
	}
	else dimension = await getImgDimension(imgSrc);
	const ratio = dimension.width / dimension.height;
	const width = options.mGridWidth;
	const height = Math.ceil(width / ratio);
	return { width, height };
}

export const getAsString = (item: DataTransferItem) => new Promise<string>((res, rej) => {
	item.getAsString((value) => {
		res(value);
	});
});

export function checkPlacement(layout: AnyBlock[], layoutOptions: LayoutOptions, block: AnyBlock, x = block.x, y = block.y, width = block.width, height = block.height): PlacementStatus {
	const intersections: BlockTransform[] = [];
	const affected: AnyBlock[] = [];
	let correct = true;
	let outOfBorder = false;

	const { fGridHeight, fGridWidth, blockMinSize, blockMaxSize } = layoutOptions;

	if (width > blockMaxSize.width || width < blockMinSize.width || height > blockMaxSize.height || height < blockMinSize.height) {
		correct = false;
		outOfBorder = true;
	}

	// TODO: different grid sizes?
	if (x < 0 || y < 0 || y + height > fGridHeight || x + width > fGridWidth) {
		correct = false;
		outOfBorder = true;
	}

	for (let i = 0; i < layout.length; i++) {
		const sBlock = layout[i];
		if (sBlock.id === block.id) continue;

		const x1 = x;
		const y1 = y;
		const sizeX1 = width;
		const sizeY1 = height;

		const x2 = sBlock.x;
		const y2 = sBlock.y;
		const sizeX2 = sBlock.width;
		const sizeY2 = sBlock.height;

		const dx = x2 - x1;
		const dy = y2 - y1;

		const colXDist = dx > 0 ? sizeX1 : sizeX2;
		const colYDist = dy > 0 ? sizeY1 : sizeY2;

		const adx = Math.abs(dx);
		const ady = Math.abs(dy);

		if (adx < colXDist && ady < colYDist) {
			correct = false;
			affected.push(sBlock);
			const startX = Math.max(x1, x2);
			const startY = Math.max(y1, y2);

			const xEnd = Math.min(x1 + sizeX1, x2 + sizeX2);
			const yEnd = Math.min(y1 + sizeY1, y2 + sizeY2);

			intersections.push({
				x: startX,
				width: xEnd - startX,
				y: startY,
				height: yEnd - startY,
			});
			// continue;
		}
	}
	return {
		correct,
		intersections,
		outOfBorder,
		affected
	};
}