'use strict';
import { Tolgee } from '@tolgee/core';
import * as vscode from 'vscode';
import { findMatches } from './utils';

export class TolgeeHoverProvider implements vscode.HoverProvider {

  constructor(private tolgee: Tolgee, private lang: string) {
    this.getTranslations();
  }
  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    const line = document.getText(new vscode.Range(position.with(undefined, 0), position.with(undefined, Infinity)));

    const match = findMatches(line, position.character);

    if (match) {
      return this.getTranslations().then(translations => {
        const translation = translations[match[1]];

        if (translation) {
          return new vscode.Hover(translation);
        }
        return Promise.reject<vscode.Hover>("No tolgee key for this.");
      });
    } else {
      return Promise.reject<vscode.Hover>("No tolgee key for this.");
    }
  }

  public async getTranslations() {
    try {
      return await this.tolgee.loadTranslations(this.lang);
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage(`Tolgee error: ${e}`);
      return {};
    }
  }
};
