import { finishRenderMath, renderMath } from "obsidian";
import { computeIntersections } from "./helper";
import { parseTikzSyntax, targetCoordinates } from "./parser";
import { AbstractArrow } from "./types";

const textColor = document.body.getCssPropertyValue("--text-normal");

export async function renderTable(source: string): Promise<[HTMLTableElement, HTMLElement[], AbstractArrow[]]> {

  const grid = parseTikzSyntax(source);
  const objects: HTMLElement[] = [];
	const arrows: AbstractArrow[] = [];
  
  
  // eslint-disable-next-line eslint-comments/no-restricted-disable -- See below
  // eslint-disable-next-line obsidianmd/prefer-create-el -- .createEl causes <table> to be appended to document, which causes incorrect behaviour. 
  const table = document.createElement('table');

  table.setCssProps({
    'margin-top': '-32px',
    'margin-bottom': '-32px'
  })

  const body = table.createEl('tbody');

  for (let row of grid) {
    const tr = body.createEl('tr');
    for (let cell of row) {
      const td = tr.createEl('td')
      td.setCssProps({
        'padding': '0px',
        'border-style': 'hidden',
      });
      let div = td.createDiv();
      div.setCssProps({
        'minWidth': '50px',
        'minHeight': '50px',
        'margin': '30px',
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'center'
      })
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
          label: arrow.label
        })
      })
    }
  }

  return [table, objects, arrows];
}

export function renderSVGCanvas(width: number, height: number): SVGSVGElement {
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setCssProps({
    'display': 'block',
    'position': 'absolute',
    'top': '-32px',
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
  await finishRenderMath();
  html.setCssProps({
    'padding': '0px',
    'margin': '5px',
  })
  return html
}

export function renderRect(rect: DOMRect, el: HTMLElement): SVGRectElement {
  let { x, y, width, height } = rect;
  let offset = el.getBoundingClientRect();
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

  let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  path.setAttribute('d', `M ${from.x - offset.x} ${from.y - offset.y} L ${to.x - offset.x} ${to.y - offset.y}`)
  path.setAttribute('stroke', `${textColor}`)
  path.setAttribute('fill', `${textColor}`)

  return { path: path, endx: to.x - offset.x, endy: to.y - offset.y }
}

function renderArrowHead(x: number, y: number, angle: number): SVGPathElement {
  let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  path.setAttribute('d', `M ${x - 7} ${y - 7} A 7 7 0 0 0 ${x} ${y} M ${x} ${y} A 7 7 0 0 0 ${x - 7} ${y + 7}`)
  path.setAttribute('stroke', `${textColor}`)
  path.setAttribute('fill', 'transparent')
  path.setAttribute('transform', `rotate(${angle} ${x} ${y})`)

  return path
}

export async function renderArrow(start: DOMRect, end: DOMRect, el: HTMLElement, str: string): Promise<[SVGPathElement, SVGPathElement, SVGForeignObjectElement]> {
  let { path, endx, endy } = await renderLine(start, end, el);

  let offset = el.getBoundingClientRect();
  let { from, to } = computeIntersections(start, end);
  let centerx = (from.x + to.x) / 2 - offset.x
  let centery = (from.y + to.y) / 2 - offset.y

  let angle = Math.atan2(
    to.y - from.y, to.x - from.x
  ) / (2 * Math.PI) * 360
  let head = renderArrowHead(endx, endy, angle);

  const label = renderMath(str, false)
  finishRenderMath();

  const FO = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  FO.setAttribute("x", `${centerx - 50}`)
  FO.setAttribute("y", `${centery - 50 - 10}`)
  FO.setAttribute("width", `${100}`)
  FO.setAttribute("height", `${100}`)
  FO.setCssProps({
    'transform-origin': 'center',
    'transform-box': 'fill-box',
    'transform': 'scale(0.7)',
  })
  const flex = document.createElementNS(
    "http://www.w3.org/1999/xhtml",
    "div"
  );
  flex.setCssProps({
    'display': 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'width': '100%',
    'height': '100%',
  });

  const div = document.createElementNS(
    "http://www.w3.org/1999/xhtml",
    "div"
  );
  FO.appendChild(flex)
  flex.appendChild(div)
  div.appendChild(label)

  return [path, head, FO];
}