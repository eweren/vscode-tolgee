import { cosmiconfig, type CosmiconfigResult, defaultLoaders } from 'cosmiconfig';
import { Validator } from 'jsonschema';
import { readFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { workspace } from "vscode";

import { existsSync } from 'fs';
import type { Schema } from './schema';

const explorer = cosmiconfig('tolgee', {
  loaders: {
    noExt: defaultLoaders['.json'],
  },
});

function parseConfig(input: Schema, configDir: string): Schema {
  const rc = { ...input };

  if (rc.apiUrl !== undefined) {
    try {
      new URL(rc.apiUrl);
    } catch {
      throw new Error('Invalid config: apiUrl is an invalid URL');
    }
  }

  if (rc.projectId !== undefined) {
    rc.projectId = Number(rc.projectId); // Number("") returns 0
    if (!Number.isInteger(rc.projectId) || rc.projectId <= 0) {
      throw new Error(
        'Invalid config: projectId should be an integer representing your project Id'
      );
    }
  }

  // convert relative paths in config to absolute
  if (rc.extractor !== undefined) {
    rc.extractor = resolve(configDir, rc.extractor).replace(/\\/g, '/');
    if (!existsSync(rc.extractor)) {
      throw new Error(
        `Invalid config: extractor points to a file that does not exists (${rc.extractor})`
      );
    }
  }

  // convert relative paths in config to absolute
  if (rc.patterns !== undefined) {
    rc.patterns = rc.patterns.map((pattern: string) =>
      resolve(configDir, pattern).replace(/\\/g, '/')
    );
  }

  // convert relative paths in config to absolute
  if (rc.push?.files) {
    rc.push.files = rc.push.files.map((r) => ({
      ...r,
      path: resolve(configDir, r.path).replace(/\\/g, '/'),
    }));
  }

  // convert relative paths in config to absolute
  if (rc.pull?.path !== undefined) {
    rc.pull.path = resolve(configDir, rc.pull.path).replace(/\\/g, '/');
  }

  return rc;
}

async function getSchema() {
  const path = join(
    __dirname,
    '..',
    'src',
    'schema.json'
  );
  return JSON.parse((await readFile(path)).toString());
}

export default async function loadTolgeeRc(): Promise<{ config: Schema, filepath: string } | null> {
  let res: CosmiconfigResult;

  res = await explorer.search(workspace.rootPath);

  if (!res || res.isEmpty) { return null; }

  const config = parseConfig(res.config, dirname('.'));

  const validator = new Validator();
  const schema = await getSchema();
  const result = validator.validate(config, schema);

  if (result.errors.length) {
    const { message, property } = result.errors[0];
    const errMessage = `Tolgee config: '${property.replace(
      'instance.',
      ''
    )}' ${message}`;
    console.error(errMessage);
    throw new Error(errMessage);
  }

  return { config, filepath: res.filepath };
}