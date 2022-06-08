import { Tolgee } from '@tolgee/core';
import { countReset } from 'console';
import * as vscode from 'vscode';
import { TolgeeCompletionItemProvider } from './tolgeeCompletionProvider';
import { TolgeeHoverProvider } from './tolgeeHoverProvider';

export function activate(context: vscode.ExtensionContext) {

	let config = vscode.workspace.getConfiguration("tolgee");
	let tolgee: Tolgee;

	const setupTolgee = () => {
		if (!(config.apiKey && config.apiUrl && config.language)) {
			vscode.window.showErrorMessage("Tolgee: Please configure your API key, API URL and language via settings.");
			return;
		}

		tolgee = Tolgee.init(
			{
				apiUrl: config.apiUrl,
				apiKey: config.apiKey,
				availableLanguages: [config.language],
				defaultLanguage: config.language,
				fallbackLanguage: config.language
			});

		let provider = new TolgeeCompletionItemProvider(tolgee, config.language);
		let hoverProvider = new TolgeeHoverProvider(tolgee, config.language);

		context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ pattern: '**/*.{tsx,jsx,js,ts,svelte,html}', scheme: 'file' }, provider));
		context.subscriptions.push(vscode.languages.registerHoverProvider({ pattern: '**/*.{tsx,jsx,js,ts,svelte,html}', scheme: 'file' }, hoverProvider));

		context.subscriptions.push(vscode.window.onDidChangeWindowState(() => {
			provider.refreshCompletionItems();
		}));
	};
	setupTolgee();
	vscode.workspace.onDidChangeConfiguration(() => {
		config = vscode.workspace.getConfiguration("tolgee");
		setupTolgee();
	});


}

// this method is called when your extension is deactivated
export function deactivate() { }
