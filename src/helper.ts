export async function getRawSize(el: HTMLElement): Promise<DOMRect> {
    while (true) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            return rect;
        }

        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

// Adds a 5px buffer to each side
export async function getSize(el: HTMLElement): Promise<DOMRect> {
    while (true) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            return new DOMRect(rect.x - 5, rect.y - 5, rect.width + 10, rect.height + 10)
        }

        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

export function computeIntersections(a: DOMRect, b: DOMRect) {
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