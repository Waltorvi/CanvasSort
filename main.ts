import { App, Modal, Plugin, TFile, TAbstractFile, Notice } from 'obsidian';
import { SortCanvasFilesSettings, DEFAULT_SETTINGS, SortCanvasFilesSettingTab } from './settings';

interface CanvasNode {
    id: string;
    type: string;
    file?: string;
    x: number;
    y: number;
}

interface CanvasEdge {
    id: string;
    fromNode: string;
    toNode: string;
}

interface CanvasData {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

export default class SortCanvasFilesPlugin extends Plugin {
    settings: SortCanvasFilesSettings;
    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: 'sort-canvas-files',
            name: 'Sort files based on Canvas',
            callback: () => this.sortCanvasFiles()
        });
        this.addCommand({
            id: 'sort-canvas-files-custom',
            name: 'Sort files based on Canvas (Custom)',
            callback: () => this.sortCanvasFilesCustom()
        });
        this.addSettingTab(new SortCanvasFilesSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async sortCanvasFiles() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile || activeFile.extension !== 'canvas') {
            new Notice('No active Canvas file');
            return;
        }

        try {
            const canvasData = await this.app.vault.read(activeFile);
            const canvas: CanvasData = JSON.parse(canvasData);

            const sortedNodes = this.sortNodesByConnections(canvas);
            await this.renameFiles(sortedNodes);

            new Notice('Files sorted successfully');
        } catch (error) {
            console.error('Error sorting files:', error);
            new Notice('Error sorting files. Check console for details.');
        }
    }

    sortNodesByConnections(canvas: CanvasData): CanvasNode[] {
        const nodeMap = new Map<string, CanvasNode>();
        const edgeMap = new Map<string, Set<string>>();

        // Создаем карты узлов и ребер
        canvas.nodes.forEach(node => nodeMap.set(node.id, node));
        canvas.edges.forEach(edge => {
            if (!edgeMap.has(edge.fromNode)) {
                edgeMap.set(edge.fromNode, new Set());
            }
            edgeMap.get(edge.fromNode)!.add(edge.toNode);
        });

        // Функция для топологической сортировки
        const visit = (nodeId: string, visited: Set<string>, sorted: CanvasNode[]) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const neighbors = edgeMap.get(nodeId) || new Set();
            neighbors.forEach(neighborId => {
                visit(neighborId, visited, sorted);
            });

            const node = nodeMap.get(nodeId);
            if (node && node.file) {
                sorted.push(node);
            }
        };

        const visited = new Set<string>();
        const sorted: CanvasNode[] = [];

        nodeMap.forEach((_, nodeId) => {
            visit(nodeId, visited, sorted);
        });

        return sorted.reverse();
    }

    async renameFiles(sortedNodes: CanvasNode[]) {
        for (let i = 0; i < sortedNodes.length; i++) {
            const node = sortedNodes[i];
            if (!node.file) continue;
    
            const file = this.app.vault.getAbstractFileByPath(node.file);
            if (file instanceof TFile) {
                const newName = this.getNewFileName(file.name, i + 1);
                if (newName !== file.name) {
                    try {
                        // Сохраняем путь к родительской папке
                        const parentPath = file.parent ? file.parent.path : '';
                        // Создаем новый путь, сохраняя файл в той же папке
                        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
                        await this.app.fileManager.renameFile(file, newPath);
                    } catch (error) {
                        console.error(`Failed to rename file ${file.name}:`, error);
                        new Notice(`Failed to rename file ${file.name}`);
                    }
                }
            }
        }
    }

    getNewFileName(currentName: string, order: number): string {
        const regex = /^\[(\d+)\]/;
        const match = currentName.match(regex);

        let newOrder = (order + this.settings.startNumber - 1).toString();
        if (this.settings.usePadding) {
            newOrder = newOrder.padStart(this.settings.paddingAmount, '0');
        }

        if (this.settings.useSquareBrackets) {
            newOrder = `[${newOrder}]`;
        }

        if (match) {
            return currentName.replace(regex, newOrder);
        } else {
            return `${newOrder} ${currentName}`;
        }
    }

    async sortCanvasFilesCustom() {
        const input = await this.promptForCustomFormat();
        if (input) {
            // Parse the input and update settings temporarily
            const parsedSettings = this.parseCustomFormat(input);
            const originalSettings = {...this.settings};
            Object.assign(this.settings, parsedSettings);

            // Run the sorting
            await this.sortCanvasFiles();

            // Restore original settings
            this.settings = originalSettings;
        }
    }

    async promptForCustomFormat(): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.contentEl.createEl("h2", { text: "Custom Format" });
            const div = modal.contentEl.createDiv();
            div.setText("Enter custom format (e.g. [${start=5, padding=3}]):");
            const input = div.createEl("input", { type: "text" });
            const button = div.createEl("button", { text: "OK" });
            button.onclick = () => {
                modal.close();
                resolve(input.value);
            };
            modal.onClose = () => resolve(null);
            modal.open();
        });
    }

    parseCustomFormat(input: string): Partial<SortCanvasFilesSettings> {
        const match = input.match(/\$\{(.+?)\}/);
        if (!match) return {};

        const params = match[1].split(',').map(param => param.trim());
        const settings: Partial<SortCanvasFilesSettings> = {};

        params.forEach(param => {
            const [key, value] = param.split('=').map(s => s.trim());
            if (key === 'start') settings.startNumber = parseInt(value);
            if (key === 'padding') {
                settings.usePadding = true;
                settings.paddingAmount = parseInt(value);
            }
        });

        return settings;
    }
}