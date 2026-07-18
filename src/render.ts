import { finishRenderMath, renderMath } from "obsidian";
import { addBuffer, computeIntersections } from "./helper";
import { targetCoordinates } from "./parser";
import { AbstractArrow, Cell, SVGCoordinate } from "./types";
import { SVGRect } from "./types";

const textColor = document.body.getCssPropertyValue("--text-normal");

export async function renderTable(cells: Cell[][]): Promise<[HTMLTableElement, HTMLElement[], AbstractArrow[]]> {

	const objects: HTMLElement[] = [];
	const arrows: AbstractArrow[] = [];

	// eslint-disable-next-line obsidianmd/prefer-create-el -- .createEl causes <table> to be appended to document, which causes incorrect behaviour. 
	const table = document.createElement('table');
	table.addClass('commutative-diagram-table');

	const body = table.createEl('tbody');

	for (let row of cells) {
		const tr = body.createEl('tr');
		for (let cell of row) {
			const td = tr.createEl('td', { cls: 'commutative-diagram-td' })
			let div = td.createDiv({ cls: 'commutative-diagram-container' });

			if (cell.object != '') {
				const renderedMath = await renderCleanMath(cell.object);
				objects.push(renderedMath);
				div.appendChild(renderedMath);
			}

			cell.arrows.forEach(arrow => {
				let { row, col } = targetCoordinates(cell, arrow.direction)
				arrows.push({
					from: cell,
					to: cells[row]![col]!,
					label: arrow.label,
					hook: arrow.isHook,
				})
			})
		}
	}

	return [table, objects, arrows];
}

export function renderSVGCanvas(width: number, height: number): SVGSVGElement {
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.addClass('commutative-diagram-svg')

	// eslint-disable-next-line obsidianmd/no-static-styles-assignment
	svg.setCssProps({
		'width': `${width}px`,
		'height': `${height}px`,
	})
	svg.setAttribute('width', `${width}`)
	svg.setAttribute('height', `${height}`)
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

	return svg;
}

export async function renderCleanMath(latex: string) {
	let html = renderMath(latex, true);
	html.addClass('commutative-diagram-math');
	void finishRenderMath();
	return html;
}

export function renderRect(rect: SVGRect): SVGRectElement {
	let { x, y, width, height } = rect;
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	r.setAttribute('x', `${x}`)
	r.setAttribute('y', `${y}`)
	r.setAttribute('width', `${width}`)
	r.setAttribute('height', `${height}`)
	r.setAttribute('stroke', `${textColor}`)
	r.setAttribute('fill', 'transparent')

	return r;
}

async function renderLine(start: SVGRect, end: SVGRect): Promise<{
	path: SVGPathElement,
	end: SVGCoordinate,
}> {
	let { from, to } = computeIntersections(start, end)

	// eslint-disable-next-line obsidianmd/prefer-create-el
	let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	path.setAttribute('d', `M ${from.x} ${from.y} L ${to.x} ${to.y}`)
	path.setAttribute('stroke', `${textColor}`)
	path.setAttribute('fill', `${textColor}`)

	return {
		path: path, 
		end: { x: to.x, y: to.y}
	}
}

function renderArrowHead(coord: SVGCoordinate, angle: number): SVGPathElement {
	let { x, y } = coord;
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	path.setAttribute('d', `M ${x - 7} ${y - 7} A 7 7 0 0 0 ${x} ${y} M ${x} ${y} A 7 7 0 0 0 ${x - 7} ${y + 7}`);
	path.setAttribute('stroke', `${textColor}`);
	path.setAttribute('fill', 'transparent');
	path.setAttribute('transform', `rotate(${angle} ${x} ${y})`);

	return path;
}

function renderArrowTailHook(coord: SVGCoordinate, untilx: number, untily: number, angle: number): SVGPathElement {
	let { x, y } = coord; 
	let dist = Math.sqrt((x - untilx) ** 2 + (y - untily) ** 2);
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	path.setAttribute('d', `M ${x + 10} ${y - 10} A 5 5 0 0 0 ${x + 10} ${y} M ${x + 10} ${y} L ${x + dist} ${y}`);
	path.setAttribute('stroke', `${textColor}`);
	path.setAttribute('transform', `rotate(${angle} ${x} ${y})`);

	return path;
}

function renderArrowTailNormal(coord: SVGCoordinate, untilx: number, untily: number, angle: number): SVGPathElement {
	let { x, y } = coord;
	let dist = Math.sqrt((x - untilx) ** 2 + (y - untily) ** 2);
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	path.setAttribute('d', `M ${x} ${y} L ${x + dist} ${y}`);
	path.setAttribute('stroke', `${textColor}`);
	path.setAttribute('transform', `rotate(${angle} ${x} ${y})`);

	return path;
}

export async function renderArrow(start: SVGRect, end: SVGRect, str: string, hook: boolean): Promise<[SVGPathElement, SVGPathElement, SVGPathElement, SVGForeignObjectElement]> {
	let linestart = addBuffer(start, 20);
	let tailstart = addBuffer(start, 5);
	end = addBuffer(end, 5);

	let { path, end: endpoint } = await renderLine(linestart, end);

	let { from, to } = computeIntersections(linestart, end);

	let angle = Math.atan2(
		to.y - from.y, to.x - from.x
	) / (2 * Math.PI) * 360
	let head = renderArrowHead(endpoint, angle);

	let { from: from2 } = computeIntersections(tailstart, end);
	let tail;
	if (hook) {
		tail = renderArrowTailHook(from2, from.x, from.y, angle);
	} else {
		tail = renderArrowTailNormal(from2, from.x, from.y, angle);
	}
	const label = renderMath(str, false);
	void finishRenderMath();

	let centerx = (from2.x + to.x) / 2;
	let centery = (from2.y + to.y) / 2;

	// eslint-disable-next-line obsidianmd/prefer-create-el
	const FO = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
	FO.setAttribute("x", `${centerx - 50}`)
	FO.setAttribute("y", `${centery - 50 - 10}`)
	FO.setAttribute("width", `${100}`)
	FO.setAttribute("height", `${100}`)
	FO.addClass('commutative-diagram-foreignObject')
	const flex = document.createElementNS(
		"http://www.w3.org/1999/xhtml",
		"div"
	);
	flex.addClass('commutative-diagram-inner-flex')

	const div = document.createElementNS(
		"http://www.w3.org/1999/xhtml",
		"div"
	);
	FO.appendChild(flex)
	flex.appendChild(div)
	div.appendChild(label)

	return [path, head, tail, FO];
}
