// This file is generated by `vscode-ext-gen`. Do not modify manually.
// @see https://github.com/antfu/vscode-ext-gen

// Meta info
export const publisher = "LILAGLASS"
export const name = "tolgee"
export const version = "0.1.0"
export const displayName = "Tolgee"
export const description = "Get autocompletion and inline preview for your tolgee projects"
export const extensionId = `${publisher}.${name}`

/**
 * Type union of all commands
 */
export type CommandKey = 
  | "tolgee.changeLanguage"

/**
 * Commands map registed by `LILAGLASS.tolgee`
 */
export const commands = {
  /**
   * Tolgee: Change language
   * @value `tolgee.changeLanguage`
   */
  changeLanguage: "tolgee.changeLanguage",
} satisfies Record<string, CommandKey>

/**
 * Type union of all configs
 */
export type ConfigKey = 
  | "tolgee.language"
  | "tolgee.highlightColor"
  | "tolgee.filePattern"

export interface ConfigKeyTypeMap {
  "tolgee.language": string,
  "tolgee.highlightColor": string,
  "tolgee.filePattern": string,
}

export interface ConfigShorthandMap {
  language: "tolgee.language",
  highlightColor: "tolgee.highlightColor",
  filePattern: "tolgee.filePattern",
}

export interface ConfigItem<T extends keyof ConfigKeyTypeMap> {
  key: T,
  default: ConfigKeyTypeMap[T],
}


/**
 * Configs map registered by `LILAGLASS.tolgee`
 */
export const configs = {
  /**
   * The language to use for the tolgee value preview.
   * @key `tolgee.language`
   * @default `"en"`
   * @type `string`
   */
  language: {
    key: "tolgee.language",
    default: "en",
  } as ConfigItem<"tolgee.language">,
  /**
   * The color to be used to highlight tolgee keys.
   * @key `tolgee.highlightColor`
   * @default `"#ec417a"`
   * @type `string`
   */
  highlightColor: {
    key: "tolgee.highlightColor",
    default: "#ec417a",
  } as ConfigItem<"tolgee.highlightColor">,
  /**
   * The pattern in which the extension should search for tolgee keys.
   * @key `tolgee.filePattern`
   * @default `"**\/*.{tsx,jsx,js,ts,svelte,html}"`
   * @type `string`
   */
  filePattern: {
    key: "tolgee.filePattern",
    default: "**/*.{tsx,jsx,js,ts,svelte,html}",
  } as ConfigItem<"tolgee.filePattern">,
}

export interface ScopedConfigKeyTypeMap {
  "language": string,
  "highlightColor": string,
  "filePattern": string,
}

export const scopedConfigs = {
  scope: "tolgee",
  defaults: {
    "language": "en",
    "highlightColor": "#ec417a",
    "filePattern": "**/*.{tsx,jsx,js,ts,svelte,html}",
  } satisfies ScopedConfigKeyTypeMap,
}

export interface NestedConfigs {
  "tolgee": {
    "language": string,
    "highlightColor": string,
    "filePattern": string,
  },
}

export interface NestedScopedConfigs {
  "language": string,
  "highlightColor": string,
  "filePattern": string,
}
