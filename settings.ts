import { App, PluginSettingTab, Setting } from 'obsidian';
import SortCanvasFilesPlugin from './main';

export interface SortCanvasFilesSettings {
    useSquareBrackets: boolean;
    startNumber: number;
    usePadding: boolean;
    paddingAmount: number;
}

export const DEFAULT_SETTINGS: SortCanvasFilesSettings = {
    useSquareBrackets: true,
    startNumber: 1,
    usePadding: false,
    paddingAmount: 3
}

export class SortCanvasFilesSettingTab extends PluginSettingTab {
    plugin: SortCanvasFilesPlugin;

    constructor(app: App, plugin: SortCanvasFilesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Use square brackets')
            .setDesc('Enable to use square brackets around numbers')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useSquareBrackets)
                .onChange(async (value) => {
                    this.plugin.settings.useSquareBrackets = value;
                    await this.plugin.saveSettings();
                }))
            .addExtraButton(button => button
                .setIcon('question-mark')
                .setTooltip('If enabled, numbers will be enclosed in square brackets, e.g. [1]')
            );

        new Setting(containerEl)
            .setName('Start number')
            .setDesc('Set the starting number for file naming')
            .addText(text => text
                .setPlaceholder('1')
                .setValue(this.plugin.settings.startNumber.toString())
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num)) {
                        this.plugin.settings.startNumber = num;
                        await this.plugin.saveSettings();
                    }
                }))
            .addExtraButton(button => button
                .setIcon('question-mark')
                .setTooltip('The first file will start with this number')
            );

        new Setting(containerEl)
            .setName('Use padding')
            .setDesc('Enable to use padding for numbers')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.usePadding)
                .onChange(async (value) => {
                    this.plugin.settings.usePadding = value;
                    await this.plugin.saveSettings();
                }))
            .addExtraButton(button => button
                .setIcon('question-mark')
                .setTooltip('If enabled, numbers will be padded with zeros, e.g. 001')
            );

        new Setting(containerEl)
            .setName('Padding amount')
            .setDesc('Set the amount of padding (if padding is enabled)')
            .addText(text => text
                .setPlaceholder('3')
                .setValue(this.plugin.settings.paddingAmount.toString())
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num)) {
                        this.plugin.settings.paddingAmount = num;
                        await this.plugin.saveSettings();
                    }
                }))
            .addExtraButton(button => button
                .setIcon('question-mark')
                .setTooltip('The total number of digits, including padding zeros')
            );
    }
}