'use strict';
import { Tolgee } from '@tolgee/core';
import * as vscode from 'vscode';

const matchFunctionalExpression = /\$?t\((?:[\{\s\w]*key:\s*)?["`']([\w]*)$/;
const matchHtmlExpression = /\<T(?:\s*key[Nn]ame\s*=\s*)?["'`]([\w]*)$/;

export class TolgeeCompletionItemProvider implements vscode.CompletionItemProvider {
  private completionItems!: PromiseLike<vscode.CompletionItem[]>;

  private tolgee: Tolgee;

  constructor(private config: { apiUrl: string, apiKey: string, language: string }) {
    this.tolgee = Tolgee.init(
      {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        availableLanguages: [config.language],
        defaultLanguage: config.language,
        fallbackLanguage: config.language
      });
    this.refreshCompletionItems();
  }

  public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
    let lineUntilPosition = document.getText(new vscode.Range(position.with(undefined, 0), position));
    let functionalMatch = lineUntilPosition.match(matchFunctionalExpression)?.[0];
    let htmlMatch = lineUntilPosition.match(matchHtmlExpression)?.[0];
    if (functionalMatch || htmlMatch) {
      return this.completionItems;
    } else {
      return Promise.reject<vscode.CompletionItem[]>("Not inside html class attribute.");
    }
  }

  public async refreshCompletionItems() {
    this.completionItems = this.tolgee.loadTranslations(this.config.language).then(translations => {
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

const flattenObj = (obj: any, parent?: any, res: Record<string, string> = {}) => {
  for (const key of Object.keys(obj)) {
    const propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] === 'object') {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}