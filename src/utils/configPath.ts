import { homedir } from 'os'
import { resolve } from 'path'
import * as process from 'process'

export default function getConfigPath() {
  if (process.env.TOLGEE_CLI_CONFIG_PATH) {
    return process.env.TOLGEE_CLI_CONFIG_PATH;
  }

  switch (process.platform) {
    case 'win32':
      return resolve(process.env.APPDATA!, 'tolgee');
    case 'darwin':
      return resolve(homedir(), 'Library', 'Application Support', 'tolgee');
    default:
      return process.env.XDG_CONFIG_HOME
        ? resolve(process.env.XDG_CONFIG_HOME, 'tolgee')
        : resolve(homedir(), '.config', 'tolgee');
  }
}
