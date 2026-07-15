import { App, MarkdownEditView, MarkdownView, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface PluginSettings {
	toggleDebug: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	toggleDebug: false,
};

export class SettingTab extends PluginSettingTab {

	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

    display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
        .setName('Toggle debug visuals')
        .addToggle((toggle) => {
            toggle.setValue(
                this.plugin.settings.toggleDebug
            )
            .onChange(async () => {
                this.plugin.settings.toggleDebug = !this.plugin.settings.toggleDebug;
                await this.plugin.saveSettings();
            })
            
        })
    }
}