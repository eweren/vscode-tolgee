import { TolgeeInstance, TreeTranslationsData } from '@tolgee/core';
import { defineConfigs, defineExtension, ref, useCommand, useDisposable, useEvent, useLogger, useStatusBarItem, watch } from 'reactive-vscode';
import { initTolgee } from './utils/tolgee';
import { useAnnotations } from './annotation';
import { useCompletion } from './completions';
import loadTolgeeRc from './tolgeerc';
import { languages, Location, Position, StatusBarAlignment, Uri, window, workspace } from "vscode";
import { getStaticData } from './tolgee';
import { config } from './utils/config';

const onDidSaveTextDocument = useEvent(workspace.onDidSaveTextDocument);

let staticData = ref<{
	staticData: { [key: string]: TreeTranslationsData };
	staticDataFiles: Record<string, {
		content: string;
		path: Uri;
	}>;
}>({ staticData: {}, staticDataFiles: {} })

const definitionProvider = languages.registerDefinitionProvider(["svelte", "html", "ts", "js", "tsx", "jsx"], {
	provideDefinition(document, position) {
		return new Promise(resolve => {
			const range = document.getWordRangeAtPosition(position);
			if (range) {
				const line = document.lineAt(range.start.line);
				const word = document.getText(range);
				if (!/\"|\'|\`/.test(line.text[line.text.indexOf(word) - 1])) {
					return resolve(null);
				}
				const [nameSpaceOrFull, key] = word.split(".");
				const indexKey = `${config.language}${key ? `:${nameSpaceOrFull}` : ""}`;

				const statData = staticData.value.staticData;
				const statFiles = staticData.value.staticDataFiles;

				if (statData[indexKey][key ? key : nameSpaceOrFull]) {
					const file = statFiles[indexKey];
					const lines = file.content.split('\n');
					const line = lines.find(line => line.trim().startsWith(`"${word}"`));

					return resolve(new Location(file.path, new Position(line ? lines.indexOf(line) : 0, line?.indexOf(word) ?? 0)));
				}
			} return resolve(null);
		})
	}
});

export = defineExtension(async () => {
	const logger = useLogger('Tolgee');
	logger.info('Extension Activated');
	logger.show();

	const { language } = defineConfigs('tolgeev2', {
		language: String,
		highlightColor: String,
		filePattern: String,
	});


	const item = useStatusBarItem({
		alignment: StatusBarAlignment.Right,
		command: 'tolgeev2.changeLanguage',
		tooltip: "Switch tolgee language"
	});

	item.show();
	item.text = `🐭 ${language.value}`;

	useDisposable(definitionProvider);

	const tolgeeRc = ref(await loadTolgeeRc(logger));

	useCommand('tolgeev2.changeLanguage', async () => {
		if (tolgeeRc.value?.config?.push?.files) {
			const newLanguage = await window.showQuickPick(tolgeeRc.value.languages, { title: "Which language values should be shown in VSCode?" }) ?? language.value;
			language.value = newLanguage;
			window.showInformationMessage(`Tolgee preview language set to ${newLanguage}`);
		}
	});

	staticData = ref(await getStaticData(tolgeeRc.value?.config?.pull, logger));

	let tolgee = ref<TolgeeInstance | undefined>(await initTolgee(staticData.value.staticData, language, logger));

	if (!tolgee.value) {
		return;
	}

	if (typeof tolgeeRc.value?.config?.pull?.path !== "undefined") {
		onDidSaveTextDocument(async (document) => {
			if (document.uri.fsPath.includes(tolgeeRc.value!.config!.pull!.path!)) {
				staticData = ref(await getStaticData(tolgeeRc.value?.config?.pull, logger));
				tolgee.value?.updateOptions({ staticData: staticData.value.staticData });
				tolgee.value = tolgee.value;
				init();
			} else if (document.fileName === tolgeeRc.value?.filepath) {
				logger.info("Tolgee config change. Reload");
				staticData = ref(await getStaticData(tolgeeRc.value?.config?.pull, logger));
				tolgee = ref<TolgeeInstance | undefined>(await initTolgee(staticData.value.staticData, language, logger));
			}
		});

	}

	const init = async () => {
		const loadedRecords = ref(await tolgee.value!.loadRecord({ language: language.value }));
		logger.info("Updated tolgee records");
		useAnnotations(loadedRecords, tolgee, logger, language);
		useCompletion(loadedRecords, logger);
		logger.info(`Loaded records for ${language.value}`);
	}
	watch([language], () => {
		tolgee.value?.changeLanguage(language.value);
		item.text = `🐭 ${language.value}`;
		init();
	});

	init();

});
