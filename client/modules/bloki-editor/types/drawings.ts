import { Point } from "./blocks";

// unify with Instrument?
enum DrawingType {
	Marker = 1,
	Circle,
	Lastik
}

enum DrawingColor {
	Red = '#FA6342',
	Blue = '#4281FA',
	Green = '#4DE56F',
	Purple = '#D949FD',
	Cyan = '#79EFFF',
	Yellow = '#FAD242',
	Grey = '#312F2F',
}

type BlokiWhiteboard = {
	blob?: any;
	drawings: Drawing[];
};
class Drawing {
	public drawingTypeName: string;
	public color: DrawingColor | string;
	public strokeWidth: number;
};

class MarkerDrawing extends Drawing {
	drawingTypeName = MarkerDrawing.prototype.constructor.name;
	points: Point[] = [];
}

class LastikDrawing extends Drawing {
	drawingTypeName = LastikDrawing.prototype.constructor.name;
	points: Point[] = [];
	constructor() {
		super();
		this.color = '#FFFFFF';
	}
}

class CircleDrawing extends Drawing {
	drawingTypeName = CircleDrawing.prototype.constructor.name;
	center: Point;
	radius: number;
}
// Javascript pain.
const drawingTypeNamesToType = {
	[LastikDrawing.prototype.constructor.name]: LastikDrawing,
	[MarkerDrawing.prototype.constructor.name]: MarkerDrawing,
	[CircleDrawing.prototype.constructor.name]: CircleDrawing,
} as const;

export {
	BlokiWhiteboard,
	Drawing,
	DrawingType,
	DrawingColor,

	MarkerDrawing,
	LastikDrawing,
	CircleDrawing,

	drawingTypeNamesToType,
};