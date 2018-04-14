'use babel';
// @flow
import SelectListView from 'atom-select-list';

import type { HookList } from '../Config';

type RunCommand = (filePath: string, command: string) => Promise<void>;

export default class HooksListView {
  runCommand: RunCommand;
  listView: SelectListView;
  panel: *;
  filePath: string;

  constructor({ runCommand }: { runCommand: RunCommand }) {
    this.runCommand = runCommand;
  }

  show(filePath: string, hooks: HookList) {
    if (!this.listView) {
      this.listView = new SelectListView({
        items: [],
        elementForItem: item => {
          const li = document.createElement('li');
          li.textContent = `${item.name}: ${item.command}`;
          return li;
        },
        didConfirmSelection: item => {
          this.runCommand(this.filePath, item.command);
          this.destroyPanel();
        },
        didCancelSelection: () => {
          this.destroyPanel();
        }
      });
    }

    this.filePath = filePath;
    this.listView.update({
      infoMessage: filePath,
      items: hooks
    });

    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({
        item: this.listView.element
      });
    }

    this.listView.focus();
    this.listView.reset();
  }

  destroyPanel() {
    if (this.panel) {
      this.panel.destroy();
      this.panel = null;
    }
  }

  destroy() {
    if (this.listView) {
      this.listView.destroy();
      this.listView = null;
    }

    this.destroyPanel();
  }
}
