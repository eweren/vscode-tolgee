'use strict';
import { Tolgee } from '@tolgee/core';
import * as vscode from 'vscode';
import { findMatches, flattenObj } from './utils';

export class TolgeeCompletionItemProvider implements vscode.CompletionItemProvider {
  private completionItems!: PromiseLike<vscode.CompletionItem[]>;

  constructor(private tolgee: Tolgee, private lang: string) {
    this.refreshCompletionItems();
  }

  public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
    const line = document.getText(new vscode.Range(position.with(undefined, 0), position.with(undefined, Infinity)));

    const match = findMatches(line, position.character);

    if (match) {
      return this.completionItems;
    } else {
      return Promise.reject<vscode.CompletionItem[]>("Not inside html class attribute.");
    }
  }

  public async refreshCompletionItems() {
    this.completionItems = this.tolgee.loadTranslations(this.lang).then(translations => {
      const flattened = flattenObj(translations);
      return Object.keys(flattened).map(key => {
        return new vscode.CompletionItem({ label: key, description: flattened[key] }, vscode.CompletionItemKind.EnumMember);
      });
    }).catch(e => {
      console.error(e);
      vscode.window.showErrorMessage(`Tolgee: ${e.message}`);
      return [];
    });
  }
};
