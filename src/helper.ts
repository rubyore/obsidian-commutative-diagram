import { SVGCoordinate, SVGRect } from "./types";

export async function getRawSize(el: HTMLElement): Promise<DOMRect> {
	while (true) {
		const rect = el.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			return rect;
		}

		await new Promise(resolve => window.setTimeout(resolve, 0));
	}
}

export function addBuffer(rect: SVGRect, buffer: number): SVGRect {
	return {
		x: rect.x - buffer,
		y: rect.y - buffer,
		width: rect.width + buffer * 2,
		height: rect.height + buffer * 2
	};
}

export function computeIntersections(a: SVGRect, b: SVGRect): {
		from: SVGCoordinate,
		to: SVGCoordinate,
	} {
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

export function convertToSVGRect(rect: DOMRect, el: HTMLElement) : SVGRect {
	let offset = el.getBoundingClientRect();
	return {
		x: rect.x - offset.x,
		y: rect.y - offset.y,
		width: rect.width,
		height: rect.height
	}
}
