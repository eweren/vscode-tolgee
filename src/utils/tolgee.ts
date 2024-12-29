import { loadStore } from '../tolgee';
import { Disposable, languages, Location, Position, Uri, window, workspace } from "vscode";
import loadTolgeeRc from '../tolgeerc';
import { TolgeeCore, TolgeeInstance, TolgeeStaticData, TreeTranslationsData } from '@tolgee/core';
import { readFileSync } from 'fs';
import { FormatIcu } from '@tolgee/format-icu';
import { ConfigRef, Ref, useDisposable, useLogger } from 'reactive-vscode';
import { config } from './config';


export async function initTolgee(staticData: TolgeeStaticData, language: ConfigRef<string>, logger: ReturnType<typeof useLogger>): Promise<TolgeeInstance | undefined> {
  logger.info("Initializing tolgee");
  const tolgeeStore = await loadStore();

  if (Object.keys(tolgeeStore).length === 0 || Object.values(tolgeeStore).every(v => typeof v.projects === "undefined" || v.projects === null)) {
    window.showErrorMessage("Please login with Tolgee cli first");
    return;
  }

  const apiKey = Object.values(Object.values(tolgeeStore).find((value) => typeof value?.projects !== "undefined")?.projects ?? {})?.[0]?.token;

  const tolgeeRc = await loadTolgeeRc(logger);

  if (!apiKey) {
    window.showErrorMessage("No API key. Please login with Tolgee cli first");
    return;
  }

  if (!tolgeeRc) {
    window.showErrorMessage("No Tolgee Config. Please provide a tolgee config first.");
    return;
  }
  const tolgeeConfig = tolgeeRc.config;

  if (((!language.value
    || !tolgeeConfig.push?.files?.some(f => f.language === language.value)) && tolgeeConfig.push?.files)) {
    language.value = await window.showQuickPick(tolgeeConfig.push!.files!.map(f => f.language), { title: "Which language values should be shown in VSCode?" }) ?? language.value;
  }

  if (!language.value) {
    return;
  }

  const path = tolgeeConfig.push?.files?.find(f => f.language === language.value)?.path;

  if (!path) {
    window.showErrorMessage(`Expected ${path} to contain translations, but file is missing.`);
    return;
  }

  try {
    const tolgee = TolgeeCore()
      .use(FormatIcu())
      .init(
        {
          // Replace last slash with empty string
          apiUrl: (tolgeeConfig.apiUrl ?? "https://app.tolgee.io/").replace(/\/$/, ""),
          availableLanguages: (tolgeeConfig.push?.files?.map(e => e.language).length ?? 0) > 0 ? Array.from(new Set(tolgeeConfig.push?.files?.map(e => e.language))) : undefined,
          defaultLanguage: language.value ?? tolgeeConfig.push?.files?.map(e => e.language)[0],
          language: language.value ?? tolgeeConfig.push?.files?.map(e => e.language)[0],
          staticData,
          apiKey: apiKey
        });
    logger.info("Initialization done");
    return tolgee;
  } catch (e) {
    logger.error('Initialization failed', e);
    throw Error("Invalid config");
  }
}