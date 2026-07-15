import { finishRenderMath, renderMath } from "obsidian";
import { getBiggerSize, getRawSize, getSize } from "./helper";

export function renderSVGCanvas(width: number, height: number): SVGSVGElement {
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.display = "block"
  svg.style.position = "absolute"
  svg.style.top = "16px"
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.style.zIndex = "-1000"
  //svg.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
  svg.setAttribute('width', `${width}`)
  svg.setAttribute('height', `${height}`)
  svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

  return svg;
}

export function renderCleanMath(latex: string): HTMLElement {
  let html = renderMath(latex, true);
  html.style.padding = '0'
  html.style.margin = '0'
  html.style.margin = "5px"
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
  r.setAttribute('stroke', 'white')
  r.setAttribute('fill', 'transparent')

  return r;
}

async function renderLine(start: DOMRect, end: DOMRect, el: HTMLElement) {
  let offset = el.getBoundingClientRect();
  let { from, to } = computeIntersections(start, end)

  let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  path.setAttribute('d', `M ${from.x - offset.x} ${from.y - offset.y} L ${to.x - offset.x} ${to.y - offset.y}`)
  path.setAttribute('stroke', 'white')
  path.setAttribute('fill', 'white')
  path.style.zIndex = "-1000"

  return { path: path, endx: to.x - offset.x, endy: to.y - offset.y }
}

function renderArrowHead(x: number, y: number, angle: number): SVGPathElement {
  let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  path.setAttribute('d', `M ${x - 7} ${y - 7} A 7 7 0 0 0 ${x} ${y} M ${x} ${y} A 7 7 0 0 0 ${x - 7} ${y + 7}`)
  path.setAttribute('stroke', 'white')
  path.setAttribute('fill', 'transparent')
  path.setAttribute('transform', `rotate(${angle} ${x} ${y})`)

  return path
}

export async function renderArrow(start: DOMRect, end: DOMRect, el: HTMLElement, str: string): Promise<[SVGPathElement, SVGPathElement, SVGForeignObjectElement]> {
  let { path, endx, endy } = await renderLine(start, end, el);
  let angle = Math.atan2(
    end.y - start.y, end.x - start.x
  ) / (2 * Math.PI) * 360
  let head = renderArrowHead(endx, endy, angle);

  let offset = el.getBoundingClientRect();
  let { from, to } = computeIntersections(start, end);
  let centerx = (from.x + to.x)/2 - offset.x
  let centery = (from.y + to.y)/2 - offset.y

  const label = renderMath(str, false)
  finishRenderMath();

  const FO = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  FO.setAttribute("x", `${centerx - 50}`)
  FO.setAttribute("y", `${centery - 50 - 10}`)
  FO.setAttribute("width", `${100}`)
  FO.setAttribute("height", `${100}`)
  FO.style.transformOrigin = "center"
  FO.style.transformBox = "fill-box"
  FO.style.transform = "scale(0.7)"
  const flex = document.createElementNS(
    "http://www.w3.org/1999/xhtml",
    "div"
  );
  flex.style.display = "flex"
  flex.style.alignItems = "center"
  flex.style.justifyContent = "center"
  flex.style.width = "100%"
  flex.style.height = "100%"
  const div = document.createElementNS(
    "http://www.w3.org/1999/xhtml",
    "div"
  );
  FO.appendChild(flex)
  flex.appendChild(div)
  div.appendChild(label)

  return [path, head, FO];
}

function computeIntersections(a: DOMRect, b: DOMRect) {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;

  const dx = bx - ax;
  const dy = by - ay;

  function intersect(cx: number, cy: number, w: number, h: number, dx: number, dy: number) {
    const t = Math.min(
      dx === 0 ? Infinity : (w / 2) / Math.abs(dx),
      dy === 0 ? Infinity : (h / 2) / Math.abs(dy)
    );

    return {
      x: cx + dx * t,
      y: cy + dy * t,
    };
  }

  return {
    from: intersect(ax, ay, a.width, a.height, dx, dy),
    to: intersect(bx, by, b.width, b.height, -dx, -dy),
  };
}