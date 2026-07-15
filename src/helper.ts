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

export async function getBiggerSize(el: HTMLElement, old: DOMRect): Promise<DOMRect> {
    while (true) {
        const rect = el.getBoundingClientRect();
        if (rect.width > old.width || rect.height > old.height) {
            return rect;
        }

        await new Promise(resolve => setTimeout(resolve, 0));
    }
}