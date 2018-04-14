'use babel';

import { CompositeDisposable } from 'atom';

export default class StatusView {

  constructor() {
    this.subscriptions = new CompositeDisposable();

    this.el = document.createElement('div');
    this.el.classList.add('hooks-status', 'inline-block');

    this.icon = document.createElement('span');

    const link = document.createElement('a');
    link.classList.add('inline-block');
    link.appendChild(this.icon);
    link.insertAdjacentText('beforeend', 'Hooks');
    link.addEventListener('click', event => this.onListHooks(event));
    this.subscriptions.add(atom.tooltips.add(link, {
      title: 'Show hooks available for current file'
    }));

    this.el.appendChild(link);

    this.updateState();
  }

  updateState(state = 'default') {
    this.state = state;
    this.icon.className = '';
    this.icon.classList.add('inline-block', 'icon');

    switch (state) {
      case 'loading':
        this.icon.classList.add('icon-repo-sync', 'status-modified');
        break;
      case 'success':
        this.icon.classList.add('icon-check', 'status-added');

        this.resetStateFrom('success');
        break;
      case 'fail':
        this.icon.classList.add('icon-alert', 'status-removed');

        this.resetStateFrom('fail');
        break;
      default:
        this.icon.classList.add('icon-plug');
    }
  }

  resetStateFrom(oldState) {
    setTimeout(() => {
      if (oldState === this.state) {
        this.updateState(); // reset to default state
      }
    }, 3000);
  }

  show() {
    this.el.style.display = '';
  }

  hide() {
    this.el.style.display = 'none';
  }

  onListHooks(event) {
    event.preventDefault();

    atom.commands.dispatch(atom.workspace.getCenter().getActivePaneItem().element, 'atom-hooks:show');
  }

  getElement() {
    return this.el;
  }

  destroy() {
    this.subscriptions.dispose();
    // $FlowFixMe
    this.el = null;
    // $FlowFixMe
    this.icon = null;
  }
}