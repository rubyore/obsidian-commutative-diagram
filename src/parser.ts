export interface Cell {
  row: number;
  col: number;
  object: string;
  arrows: Arrow[];
}

interface Arrow {
    direction: string;
    label: string;
}

export function parseTikzSyntax(input: string): Cell[][] {
  const rows: string[][] = [];

  let currentRow: string[] = [];
  let currentCell = "";

  let braceDepth = 0;
  let bracketDepth = 0;

  // Split into rows/cells
  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (c === "{") braceDepth++;
    if (c === "}") braceDepth--;
    if (c === "[") bracketDepth++;
    if (c === "]") bracketDepth--;

    const topLevel = braceDepth === 0 && bracketDepth === 0;

    if (topLevel && c === "&") {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if (
      topLevel &&
      c === "\\" &&
      input[i + 1] === "\\"
    ) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);

      currentRow = [];
      currentCell = "";
      i++;
      continue;
    }

    currentCell += c;
  }

  currentRow.push(currentCell.trim());
  rows.push(currentRow);

  const width = Math.max(...rows.map(r => r.length), 0);

  return rows.map((row, r) =>
    Array.from({ length: width }, (_, c) => {
      const { object, arrows } = splitCell(row[c] ?? "");

      return {
        row: r,
        col: c,
        object,
        arrows,
      };
    })
  );
}

function splitCell(cell: string): { object: string; arrows: Arrow[] } {
  const arrows: string[] = [];
  const objarrows: Arrow[] = [];

  let objectEnd = cell.length;

  let i = 0;
  while (i < cell.length) {
    if (cell.startsWith("\\arrow", i)) {
      objectEnd = Math.min(objectEnd, i);

      const start = i;
      i += "\\arrow".length;

      // Consume any optional arguments
      while (true) {
        while (/\s/.test(cell[i] ?? "")) i++;

        if (cell[i] !== "[") break;

        let depth = 1;
        i++;

        while (i < cell.length && depth > 0) {
          if (cell[i] === "[") depth++;
          else if (cell[i] === "]") depth--;
          i++;
        }
      }

      arrows.push(cell.slice(start, i).trim());
      arrows.forEach(arrow => {
        objarrows.push(parseArrow(arrow))
      })
    } else {
      i++;
    }
  }

  return {
    object: cell.slice(0, objectEnd).trim(),
    arrows: objarrows
  };
}

function splitArrowOptions(options: string): string[] {
    const parts: string[] = [];

    let current = "";
    let inQuotes = false;
    let braceDepth = 0;

    for (let i = 0; i < options.length; i++) {
        const c = options[i];

        if (c === '"' && options[i - 1] !== "\\") {
            inQuotes = !inQuotes;
            current += c;
            continue;
        }

        if (!inQuotes) {
            if (c === "{") braceDepth++;
            else if (c === "}") braceDepth--;

            if (c === "," && braceDepth === 0) {
                parts.push(current.trim());
                current = "";
                continue;
            }
        }

        current += c;
    }

    if (current.length) {
        parts.push(current.trim());
    }

    return parts;
}

function parseArrow(source: string): Arrow {
    const options = source.match(/\\arrow\s*\[(.*)\]/)?.[1] ?? "";

    let direction = "";
    let label = "";

    for (const part of splitArrowOptions(options)) {
        const quoted = part.match(/^"(.*)"$/);
        if (quoted) {
            label = quoted[1] || "";
            continue;
        }

        if (/^[udlr]+$/.test(part)) {
            direction = part;
        }
    }

    return {
        direction,
        label,
    };
}

export function targetCoordinates(
    cell: Cell,
    direction: string
): { row: number; col: number } {
    let row = cell.row;
    let col = cell.col;

    for (const c of direction) {
        switch (c) {
            case "u":
                row--;
                break;
            case "d":
                row++;
                break;
            case "l":
                col--;
                break;
            case "r":
                col++;
                break;
            default:
                throw new Error(`Unknown direction '${c}'`);
        }
    }

    return { row, col };
}