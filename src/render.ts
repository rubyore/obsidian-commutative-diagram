import { finishRenderMath, renderMath } from "obsidian";
import { addBuffer, computeIntersections } from "./helper";
import { parseTikzSyntax, targetCoordinates } from "./parser";
import { AbstractArrow } from "./types";

const textColor = document.body.getCssPropertyValue("--text-normal");

export async function renderTable(source: string): Promise<[HTMLTableElement, HTMLElement[], AbstractArrow[]]> {

	const grid = parseTikzSyntax(source);
	const objects: HTMLElement[] = [];
	const arrows: AbstractArrow[] = [];

	// eslint-disable-next-line obsidianmd/prefer-create-el -- .createEl causes <table> to be appended to document, which causes incorrect behaviour. 
	const table = document.createElement('table');
	table.addClass('commutative-diagram-table');

	const body = table.createEl('tbody');

	for (let row of grid) {
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
					to: grid[row]![col]!,
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

export function renderRect(rect: DOMRect, el: HTMLElement): SVGRectElement {
	let { x, y, width, height } = rect;
	let offset = el.getBoundingClientRect();
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	r.setAttribute('x', `${x - offset.x}`)
	r.setAttribute('y', `${y - offset.y}`)
	r.setAttribute('width', `${width}`)
	r.setAttribute('height', `${height}`)
	r.setAttribute('stroke', `${textColor}`)
	r.setAttribute('fill', 'transparent')

	return r;
}

async function renderLine(start: DOMRect, end: DOMRect, el: HTMLElement) {
	let offset = el.getBoundingClientRect();
	let { from, to } = computeIntersections(start, end)

	// eslint-disable-next-line obsidianmd/prefer-create-el
	let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	path.setAttribute('d', `M ${from.x - offset.x} ${from.y - offset.y} L ${to.x - offset.x} ${to.y - offset.y}`)
	path.setAttribute('stroke', `${textColor}`)
	path.setAttribute('fill', `${textColor}`)

	return { path: path, endx: to.x - offset.x, endy: to.y - offset.y }
}

function renderArrowHead(x: number, y: number, angle: number): SVGPathElement {
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	path.setAttribute('d', `M ${x - 7} ${y - 7} A 7 7 0 0 0 ${x} ${y} M ${x} ${y} A 7 7 0 0 0 ${x - 7} ${y + 7}`)
	path.setAttribute('stroke', `${textColor}`)
	path.setAttribute('fill', 'transparent')
	path.setAttribute('transform', `rotate(${angle} ${x} ${y})`)

	return path
}

function renderArrowTailHook(x: number, y: number, untilx: number, untily: number, angle: number): SVGPathElement {
	let dist = Math.sqrt((x - untilx) ** 2 + (y - untily) ** 2);
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	path.setAttribute('d', `M ${x + 10} ${y - 10} A 5 5 0 0 0 ${x + 10} ${y} M ${x + 10} ${y} L ${x + dist} ${y}`);
	path.setAttribute('stroke', `${textColor}`);
	path.setAttribute('transform', `rotate(${angle} ${x} ${y})`)

	return path;
}

function renderArrowTailNormal(x: number, y: number, untilx: number, untily: number, angle: number): SVGPathElement {
	let dist = Math.sqrt((x - untilx) ** 2 + (y - untily) ** 2);
	// eslint-disable-next-line obsidianmd/prefer-create-el
	let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	path.setAttribute('d', `M ${x} ${y} L ${x + dist} ${y}`);
	path.setAttribute('stroke', `${textColor}`);
	path.setAttribute('transform', `rotate(${angle} ${x} ${y})`)

	return path;
}

export async function renderArrow(start: DOMRect, end: DOMRect, el: HTMLElement, str: string, hook: boolean): Promise<[SVGPathElement, SVGPathElement, SVGPathElement, SVGForeignObjectElement]> {
	let linestart = addBuffer(start, 20);
	let tailstart = addBuffer(start, 5);
	end = addBuffer(end, 5);

	let { path, endx, endy } = await renderLine(linestart, end, el);

	let offset = el.getBoundingClientRect();
	let { from, to } = computeIntersections(linestart, end);
	let centerx = (from.x + to.x) / 2 - offset.x
	let centery = (from.y + to.y) / 2 - offset.y

	let angle = Math.atan2(
		to.y - from.y, to.x - from.x
	) / (2 * Math.PI) * 360
	let head = renderArrowHead(endx, endy, angle);

	let { from: from2, to: to2 } = computeIntersections(tailstart, end);
	let tail;
	if (hook) {
		tail = renderArrowTailHook(from2.x - offset.x, from2.y - offset.y, from.x - offset.x, from.y - offset.y, angle);
	} else {
		tail = renderArrowTailNormal(from2.x - offset.x, from2.y - offset.y, from.x - offset.x, from.y - offset.y, angle);
	}
	const label = renderMath(str, false);
	void finishRenderMath();

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
