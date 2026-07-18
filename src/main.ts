import { Plugin } from 'obsidian';
import { renderArrow, renderRect, renderSVGCanvas, renderTable } from './render';
import { convertToSVGRect, getRawSize } from './helper';
import { DEFAULT_SETTINGS, PluginSettings, SettingTab } from './settings';
import { parseTikzSyntax } from './parser';

export default class ExamplePlugin extends Plugin {
	settings!: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor('tikzcd', async (source, el, ctx) => {

			let cells = parseTikzSyntax(source);
			let { table, objects, arrows } = await renderTable(cells);
			el.appendChild(table);
			// Wait for all objects to be in the layout
			for (let obj of objects) {
				await getRawSize(obj);
			}

			// We need to adjust sizes of <div> inside <td> to make sure it occupies the whole <td>
			let body = table.firstChild as HTMLElement;
			Array.from(body.children).forEach(r => {
				Array.from(r.children).forEach(c => {
					let d = c.firstChild as HTMLElement // <div>
					let w = c.getBoundingClientRect().width;
					let h = c.getBoundingClientRect().height;
					// eslint-disable-next-line obsidianmd/no-static-styles-assignment
					d.setCssProps({
						'width': `${w - 60}px`,
						'height': `${h - 60}px`,
					});
				});
			});

			let tablebbox = await getRawSize(table);

			let svg = renderSVGCanvas(tablebbox.width, tablebbox.height);
			el.appendChild(svg);

			if (this.settings.toggleDebug) {
				objects.forEach(obj => {
					let rect = obj.getBoundingClientRect();
					svg.appendChild(renderRect(convertToSVGRect(rect, el)))
				})
				svg.addClass('commutative-diagram-svg-debug')
			}

			for (let arrow of arrows) {
				let from = (table.firstChild as HTMLElement).children[arrow.from.row]!.children[arrow.from.col]!.querySelector("mjx-container") as HTMLElement;
				let to = (table.firstChild as HTMLElement).children[arrow.to.row]!.children[arrow.to.col]!.querySelector("mjx-container") as HTMLElement;

				let xrect = await getRawSize(from);
				let yrect = await getRawSize(to);
				let [path, head, tail, label] = await renderArrow(convertToSVGRect(xrect, el), convertToSVGRect(yrect, el), arrow.label, arrow.hook, arrow.mapsto);
				svg.appendChild(path);
				svg.appendChild(head);
				svg.appendChild(label)
				svg.appendChild(tail);
			}

			el.addClass('commutative-diagram-el');
		})
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
