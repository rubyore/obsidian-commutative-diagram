export type AbstractArrow = {
	from: Cell;
	to: Cell
	label: string;
	hook: boolean;
}

export type Cell = {
	row: number;
	col: number;
	object: string;
	arrows: Arrow[];
}

export type Arrow = {
	direction: string;
	label: string;
	isHook: boolean;
}

// Represents a point inside the <svg>, starting at 0
export type SVGCoordinate = {
	x: number;
	y: number;
}

export type SVGRect = {
	x: number;
	y: number;
	width: number;
	height: number;
}
