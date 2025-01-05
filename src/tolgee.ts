import { join, dirname } from 'path';
import { mkdir, readFile } from 'fs/promises';
import { CONFIG_PATH } from './utils/constants';
import { Uri, window, workspace } from 'vscode';
import { readFileSync } from 'fs';
import { TreeTranslationsData } from '@tolgee/core';
import { Schema } from './schema';
import { useLogger } from 'reactive-vscode';

type Token = { token: string; expires: number };

type Store = {
  [scope: string]: {
    user?: Token;
    // keys cannot be numeric values in JSON
    projects?: Record<string, Token | undefined>;
  };
};

export const getFileFromPath = async (path: string) => {
  try {
    const filePath = (await workspace.findFiles(`${path.replace(/^\//, "").replace(/^\./, "**")}.json`))[0];
    const rawFile = readFileSync(filePath.fsPath, 'utf8');
    return { translations: JSON.parse(rawFile) as TreeTranslationsData, rawFile, filePath };
  } catch (e) {
    window.showErrorMessage(`Translation data under ${path} could not be parsed. Is it valid JSON?`);
    return null;
  }
};

export const readFileUrisFromPath = async (path: string, logger: ReturnType<typeof useLogger>) => {
  try {
    const filePath = (await workspace.findFiles(`${path.replace(/^\//, "").replace(/^\./, "**")}/*.json`));

    logger.info(JSON.stringify(filePath.map(a => a.path), null, 2));
    return filePath;
  } catch (e) {
    window.showErrorMessage(`Translation data under ${path} could not be parsed. Is it valid JSON?`);
    return null;
  }
};

export const readLanguagesFromFromPath = async (path: string, logger: ReturnType<typeof useLogger>) => {
  try {
    const filePath = (await workspace.findFiles(`${path.replace(/^\//, "").replace(/^\./, "**")}/*.json`));
    logger.info("Locales: " + filePath.map(a => a.path.split("/").pop()!.split(".")[0]))
    return filePath.map(a => a.path.split("/").pop()!.split(".")[0]);
  } catch (e) {
    window.showErrorMessage(`Translation data under ${path} could not be parsed. Is it valid JSON?`);
    return null;
  }
};

function createRegexFromTemplate(template: string): RegExp {
  // Escape special regex characters
  const escapedTemplate = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Replace placeholders with regex groups
  const regexPattern = escapedTemplate
    .replace('{namespace}', '(?<namespace>[^/]+)')
    .replace('{languageTag}', '(?<languageTag>[^.]+)')
    .replace('{extension}', '(?<extension>.+)');

  return new RegExp(regexPattern);
}

export const getStaticData = async (pullRoot: Schema["pull"] | undefined, logger: ReturnType<typeof useLogger>) => {
  const staticData: { [key: string]: TreeTranslationsData } = {};
  const staticDataFiles: Record<string, { content: string, path: Uri }> = {};

  if (!pullRoot?.path) {
    window.showErrorMessage("Tolgee config needs pull.path for Tolgee extension to work.");
    return { staticData, staticDataFiles };
  }

  for (const file of await readFileUrisFromPath(pullRoot.path, logger) ?? []) {
    const fileLocalTolgeePath = file.path.split(pullRoot.path.replace(/^\./, ""))[1];
    const data = await getFileFromPath(pullRoot.path + fileLocalTolgeePath.split(".")[0]);
    if (!data) {
      continue;
    }


    const regex = pullRoot.fileStructureTemplate ? createRegexFromTemplate(pullRoot.fileStructureTemplate) : /(?<namespace>[^/]*)\/?(?<languageTag>[^.]+)\.(?<extension>.+)/g

    const match = fileLocalTolgeePath.match(regex);

    if (match && match.groups) {
      const { namespace, languageTag, extension } = match.groups;
      staticData[`${languageTag}:${namespace}`] = data.translations;
      staticDataFiles[`${languageTag}:${namespace}`] = { content: data.rawFile, path: data.filePath };
    } else {
      const parts: Array<string> = fileLocalTolgeePath.split("/");
      const lang = parts[parts.length === 1 ? 0 : 1].split(".")[0];
      staticData[lang] = data.translations;
      staticDataFiles[lang] = { content: data.rawFile, path: data.filePath };
    }
  }
  return { staticData, staticDataFiles };
}


const API_TOKENS_FILE = join(CONFIG_PATH, 'authentication.json');

async function ensureConfigPath() {
  try {
    await mkdir(dirname(API_TOKENS_FILE));
  } catch (e: any) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}

export async function loadStore(): Promise<Store> {
  try {
    await ensureConfigPath();
    const storeData = await readFile(API_TOKENS_FILE, 'utf8');
    return JSON.parse(storeData);
  } catch (e: any) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  return {};
}

export async function getApiKey(
  instance: URL,
  projectId: number
): Promise<string | null> {
  const store = await loadStore();
  if (!store[instance.hostname]) {
    return null;
  }

  const scopedStore = store[instance.hostname];
  if (scopedStore.user) {
    console.warn(`Your personal access token for ${instance.hostname} expired.`);
    return null;
  }

  if (projectId <= 0) {
    return null;
  }

  const pak = scopedStore.projects?.[projectId.toString(10)];
  if (pak) {
    if (pak.expires !== 0 && Date.now() > pak.expires) {
      console.warn(
        `Your project API key for project #${projectId} on ${instance.hostname} expired.`
      );
      return null;
    }

    return pak.token;
  }

  return null;
}
