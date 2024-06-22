/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SortCanvasFilesPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  useSquareBrackets: true,
  startNumber: 1,
  usePadding: false,
  paddingAmount: 3
};
var SortCanvasFilesSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Use square brackets").setDesc("Enable to use square brackets around numbers").addToggle((toggle) => toggle.setValue(this.plugin.settings.useSquareBrackets).onChange(async (value) => {
      this.plugin.settings.useSquareBrackets = value;
      await this.plugin.saveSettings();
    })).addExtraButton((button) => button.setIcon("question-mark").setTooltip("If enabled, numbers will be enclosed in square brackets, e.g. [1]"));
    new import_obsidian.Setting(containerEl).setName("Start number").setDesc("Set the starting number for file naming").addText((text) => text.setPlaceholder("1").setValue(this.plugin.settings.startNumber.toString()).onChange(async (value) => {
      const num = parseInt(value);
      if (!isNaN(num)) {
        this.plugin.settings.startNumber = num;
        await this.plugin.saveSettings();
      }
    })).addExtraButton((button) => button.setIcon("question-mark").setTooltip("The first file will start with this number"));
    new import_obsidian.Setting(containerEl).setName("Use padding").setDesc("Enable to use padding for numbers").addToggle((toggle) => toggle.setValue(this.plugin.settings.usePadding).onChange(async (value) => {
      this.plugin.settings.usePadding = value;
      await this.plugin.saveSettings();
    })).addExtraButton((button) => button.setIcon("question-mark").setTooltip("If enabled, numbers will be padded with zeros, e.g. 001"));
    new import_obsidian.Setting(containerEl).setName("Padding amount").setDesc("Set the amount of padding (if padding is enabled)").addText((text) => text.setPlaceholder("3").setValue(this.plugin.settings.paddingAmount.toString()).onChange(async (value) => {
      const num = parseInt(value);
      if (!isNaN(num)) {
        this.plugin.settings.paddingAmount = num;
        await this.plugin.saveSettings();
      }
    })).addExtraButton((button) => button.setIcon("question-mark").setTooltip("The total number of digits, including padding zeros"));
  }
};

// main.ts
var SortCanvasFilesPlugin = class extends import_obsidian2.Plugin {
  async onload() {
    await this.loadSettings();
    this.addCommand({
      id: "sort-canvas-files",
      name: "Sort files based on Canvas",
      callback: () => this.sortCanvasFiles()
    });
    this.addCommand({
      id: "sort-canvas-files-custom",
      name: "Sort files based on Canvas (Custom)",
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
    if (!activeFile || activeFile.extension !== "canvas") {
      new import_obsidian2.Notice("No active Canvas file");
      return;
    }
    try {
      const canvasData = await this.app.vault.read(activeFile);
      const canvas = JSON.parse(canvasData);
      const sortedNodes = this.sortNodesByConnections(canvas);
      await this.renameFiles(sortedNodes);
      new import_obsidian2.Notice("Files sorted successfully");
    } catch (error) {
      console.error("Error sorting files:", error);
      new import_obsidian2.Notice("Error sorting files. Check console for details.");
    }
  }
  sortNodesByConnections(canvas) {
    const nodeMap = /* @__PURE__ */ new Map();
    const edgeMap = /* @__PURE__ */ new Map();
    canvas.nodes.forEach((node) => nodeMap.set(node.id, node));
    canvas.edges.forEach((edge) => {
      if (!edgeMap.has(edge.fromNode)) {
        edgeMap.set(edge.fromNode, /* @__PURE__ */ new Set());
      }
      edgeMap.get(edge.fromNode).add(edge.toNode);
    });
    const visit = (nodeId, visited2, sorted2) => {
      if (visited2.has(nodeId))
        return;
      visited2.add(nodeId);
      const neighbors = edgeMap.get(nodeId) || /* @__PURE__ */ new Set();
      neighbors.forEach((neighborId) => {
        visit(neighborId, visited2, sorted2);
      });
      const node = nodeMap.get(nodeId);
      if (node && node.file) {
        sorted2.push(node);
      }
    };
    const visited = /* @__PURE__ */ new Set();
    const sorted = [];
    nodeMap.forEach((_, nodeId) => {
      visit(nodeId, visited, sorted);
    });
    return sorted.reverse();
  }
  async renameFiles(sortedNodes) {
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      if (!node.file)
        continue;
      const file = this.app.vault.getAbstractFileByPath(node.file);
      if (file instanceof import_obsidian2.TFile) {
        const newName = this.getNewFileName(file.name, i + 1);
        if (newName !== file.name) {
          try {
            const parentPath = file.parent ? file.parent.path : "";
            const newPath = parentPath ? `${parentPath}/${newName}` : newName;
            await this.app.fileManager.renameFile(file, newPath);
          } catch (error) {
            console.error(`Failed to rename file ${file.name}:`, error);
            new import_obsidian2.Notice(`Failed to rename file ${file.name}`);
          }
        }
      }
    }
  }
  getNewFileName(currentName, order) {
    const regex = /^\[(\d+)\]/;
    const match = currentName.match(regex);
    let newOrder = (order + this.settings.startNumber - 1).toString();
    if (this.settings.usePadding) {
      newOrder = newOrder.padStart(this.settings.paddingAmount, "0");
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
      const parsedSettings = this.parseCustomFormat(input);
      const originalSettings = { ...this.settings };
      Object.assign(this.settings, parsedSettings);
      await this.sortCanvasFiles();
      this.settings = originalSettings;
    }
  }
  async promptForCustomFormat() {
    return new Promise((resolve) => {
      const modal = new import_obsidian2.Modal(this.app);
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
  parseCustomFormat(input) {
    const match = input.match(/\$\{(.+?)\}/);
    if (!match)
      return {};
    const params = match[1].split(",").map((param) => param.trim());
    const settings = {};
    params.forEach((param) => {
      const [key, value] = param.split("=").map((s) => s.trim());
      if (key === "start")
        settings.startNumber = parseInt(value);
      if (key === "padding") {
        settings.usePadding = true;
        settings.paddingAmount = parseInt(value);
      }
    });
    return settings;
  }
};