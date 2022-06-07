import * as vscode from 'vscode';
import { TolgeeCompletionItemProvider } from './tolgeeCompletionProvider';

export function activate(context: vscode.ExtensionContext) {

	let config = vscode.workspace.getConfiguration("tolgee");

	const setupTolgee = () => {
		if (!(config.apiKey && config.apiUrl && config.language)) {
			vscode.window.showErrorMessage("Tolgee: Please configure your API key, API URL and language via settings.");
			return;
		}
		let provider = new TolgeeCompletionItemProvider(config as any);

		context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ pattern: '**/*.{tsx,jsx,js,ts,svelte,html}', scheme: 'file' }, provider));

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
