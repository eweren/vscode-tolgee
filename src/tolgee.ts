import { join, dirname } from 'path';
import { mkdir, readFile } from 'fs/promises';
import { CONFIG_PATH } from './utils/constants';
import { Uri, window, workspace } from 'vscode';
import { readFileSync } from 'fs';
import { TolgeeStaticData, TreeTranslationsData } from '@tolgee/core';
import { FileMatch } from './schema';

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
    const filePath = (await workspace.findFiles(path.replace(/^\//, "")))[0];
    const rawFile = readFileSync(filePath.fsPath, 'utf8');
    return { translations: JSON.parse(rawFile) as TreeTranslationsData, rawFile, filePath };
  } catch (e) {
    window.showErrorMessage(`Translation data under ${path} could not be parsed. Is it valid JSON?`);
    return null;
  }
};


export const getStaticData = async (files: FileMatch[]) => {
  const staticData: { [key: string]: TreeTranslationsData } = {};
  const staticDataFiles: Record<string, { content: string, path: Uri }> = {};

  for (const file of files ?? []) {
    const data = await getFileFromPath(file.path);
    if (!data) {
      continue;
    }
    if (file.namespace) {
      staticData[`${file.language}:${file.namespace}`] = data.translations;
      staticDataFiles[`${file.language}:${file.namespace}`] = { content: data.rawFile, path: data.filePath };
    } else {
      staticData[file.language] = data.translations;
      staticDataFiles[file.language] = { content: data.rawFile, path: data.filePath };
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
