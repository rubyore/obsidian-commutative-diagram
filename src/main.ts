import { finishRenderMath, loadMathJax, Notice, Plugin, renderMath } from 'obsidian';
import { renderArrow, renderCleanMath, renderRect, renderSVGCanvas } from './render';
import { getRawSize, getSize } from './helper';
import { Cell, parseTikzSyntax, targetCoordinates } from './parser';

export default class ExamplePlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor('tikzcd', async (source, el, ctx) => {

		const X = renderCleanMath("\\bigoplus \\operatorname{Hom}(A, B^C)")
		const Y = renderCleanMath("F_U(Y)")
		const Z = renderCleanMath("F_V(Y)")
		finishRenderMath();

		const table = el.createEl('table');
		const body = table.createEl('tbody');

		for (let i = 0; i < 3; i++) {
			const row = body.createEl('tr');
			for (let j = 0; j < 3; j++) {
				let td = row.createEl("td");
				td.style.padding = "0"
				td.style.width = "50px"
				td.style.height = "50px"
				td.style.borderStyle = "hidden"
				let div = td.createDiv();
				div.style.width = "100%"
				div.style.height = "100%"
				div.style.display = "flex"
				div.style.alignItems = "center"
				div.style.justifyContent = "center"
				//div.style.border = "1px solid white"
			}
		}

		body?.firstChild?.firstChild?.firstChild?.appendChild(X);
		body?.firstChild?.lastChild?.firstChild?.appendChild(Y);
		body?.lastChild?.lastChild?.firstChild?.appendChild(Z);

		// We have to wait for everything to render
		let xrect = await getSize(X);
		let yrect = await getSize(Y);
		let zrect = await getSize(Z);
		// Then get the table size
		let tablebbox = await getRawSize(table);

		let svg = renderSVGCanvas(tablebbox.width, tablebbox.height);
		el.appendChild(svg);

		let [path, head, label] = await renderArrow(xrect, yrect, el, "f");
		let [path2, head2, label2] = await renderArrow(xrect, zrect, el, "g");

		svg.appendChild(path)
		svg.appendChild(head)
		svg.appendChild(path2)
		svg.appendChild(head2)
		svg.appendChild(label)
		svg.appendChild(label2)

    });

	this.registerMarkdownCodeBlockProcessor('tikz', async (source, el, ctx) => {
		const grid = parseTikzSyntax(source);

		const allObjects: HTMLElement[]  = [];
		const allArrows: AbstractArrow[] = [];
		
		type AbstractArrow = {
			from: Cell;
			to: Cell
			label: string;
		}
		
		const table = el.createEl('table');
      	const body = table.createEl('tbody');
		for (var row of grid) {
			const tr = body.createEl('tr');
			for (var cell of row) {
				const td = tr.createEl('td')
				td.style.padding = "0"
				td.style.minWidth = "100px"
				td.style.minHeight = "100px"
				td.style.borderStyle = "hidden"
				let div = td.createDiv();
				div.style.minWidth = "60px"
				div.style.minHeight = "60px"
				div.style.margin = "30px"
				div.style.display = "flex"
				div.style.alignItems = "center"
				div.style.justifyContent = "center"
				if (cell.object != '') {
					const renderedMath = renderCleanMath(cell.object);
					allObjects.push(renderedMath);
					div.appendChild(renderedMath)
				}

				cell.arrows.forEach(arrow => {
					let { row, col } = targetCoordinates(cell, arrow.direction)
					allArrows.push({
						from: cell,
						to: grid[row]![col]!,
						label: arrow.label
					})
				})
			}
		}
		// Wait for all objects to be in the layout
		for (var obj of allObjects) {
			await getSize(obj);
		}
		let tablebbox = await getRawSize(table);

		let svg = renderSVGCanvas(tablebbox.width, tablebbox.height);
		el.appendChild(svg);

		for (var arrow of allArrows) {
			let from = (table.firstChild! as HTMLElement).children[arrow.from.row]!.children[arrow.from.col]!.querySelector("mjx-container")! as HTMLElement;
			let to = (table.firstChild! as HTMLElement).children[arrow.to.row]!.children[arrow.to.col]!.querySelector("mjx-container")! as HTMLElement;

			let xrect = await getSize(from);
			let yrect = await getSize(to)
			let [path, head, label] = await renderArrow(xrect, yrect, el, arrow.label);
			svg.appendChild(path)
			svg.appendChild(head)
			svg.appendChild(label)
		}
	})
  }
}