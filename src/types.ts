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