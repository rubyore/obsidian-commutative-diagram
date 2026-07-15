import { Plugin } from 'obsidian';
import { renderArrow, renderCleanMath, renderRect, renderSVGCanvas } from './render';
import { getRawSize, getSize } from './helper';
import { parseTikzSyntax, targetCoordinates } from './parser';
import { AbstractArrow } from './types';

export default class ExamplePlugin extends Plugin {
  async onload() {
	this.registerMarkdownCodeBlockProcessor('tikzcd', async (source, el, ctx) => {
		const grid = parseTikzSyntax(source);

		const allObjects: HTMLElement[]  = [];
		const allArrows: AbstractArrow[] = [];
		
		const table = el.createEl('table');
		table.style.marginTop = "-32px"
		table.style.marginBottom = "-32px"
		const body = table.createEl('tbody');
		for (var row of grid) {
			const tr = body.createEl('tr');
			for (var cell of row) {
				const td = tr.createEl('td')
				td.style.padding = "0px"
				td.style.borderStyle = "hidden"
				let div = td.createDiv();
				div.style.minWidth = "50px"
				div.style.minHeight = "50px"
				div.style.margin = "30px"
				div.style.display = "flex"
				div.style.alignItems = "center"
				div.style.justifyContent = "center"
				if (cell.object != '') {
					const renderedMath = renderCleanMath(cell.object);
					allObjects.push(renderedMath);
					div.appendChild(renderedMath);
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

		// We need to adjust sizes of <div> inside <td> to make sure it occupies the whole <td>
		Array.from(body.children).forEach(r => {
			Array.from(r.children).forEach(c => {
				let d = c.firstChild as HTMLElement // <div>
				let w = c.getBoundingClientRect().width
				let h = c.getBoundingClientRect().height
				d.style.width = `${w - 60}px`
				d.style.height = `${h - 60}px`
			})
		})

		let tablebbox = await getRawSize(table);

		let svg = renderSVGCanvas(tablebbox.width, tablebbox.height);
		el.appendChild(svg);

		/**
		allObjects.forEach(obj => {
			svg.appendChild(renderRect(obj.getBoundingClientRect(), el))
		})
		*/

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

		el.style.display = "flex"
		el.style.justifyContent = "center"
	})
  }
}