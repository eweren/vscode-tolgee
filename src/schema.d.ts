/**
 * This file was taken from https://github.com/tolgee/tolgee-cli/blob/main/src/schema.d.ts
 */

/**
 * Localization files format for push and pull operations.
 */
export type Format =
  | "JSON_TOLGEE"
  | "JSON_ICU"
  | "JSON_I18NEXT"
  | "JSON_JAVA"
  | "JSON_PHP"
  | "JSON_RUBY"
  | "JSON_C"
  | "PO_PHP"
  | "PO_C"
  | "PO_JAVA"
  | "PO_ICU"
  | "PO_RUBY"
  | "APPLE_STRINGS"
  | "APPLE_XLIFF"
  | "PROPERTIES_ICU"
  | "PROPERTIES_JAVA"
  | "ANDROID_XML"
  | "FLUTTER_ARB"
  | "CSV_ICU"
  | "CSV_JAVA"
  | "CSV_PHP"
  | "CSV_RUBY"
  | "YAML_RUBY"
  | "YAML_JAVA"
  | "YAML_ICU"
  | "YAML_PHP"
  | "XLIFF_ICU"
  | "XLIFF_JAVA"
  | "XLIFF_PHP"
  | "XLIFF_RUBY";
/**
 * File glob specifying which files to include.
 */
export type Path = string;
/**
 * Specifies how to solve potential conflicts in the pushed data.
 *
 * Options:
 *
 *   `OVERRIDE` - update everything according to local files
 *   `KEEP` - create only non-existent strings, don't touch existing ones
 *   `NO_FORCE` - throw an error, if there are any conflict
 */
export type ForceMode = "OVERRIDE" | "KEEP" | "NO_FORCE";

export interface Schema {
  /**
   * Project ID. Only required when using a Personal Access Token.
   */
  projectId?: number | string;
  /**
   * The url of Tolgee API.
   */
  apiUrl?: string;
  format?: Format;
  /**
   * A path to a custom extractor to use instead of the default one.
   */
  extractor?: string;
  /**
   * File glob patterns to your source code, used for keys extraction.
   */
  patterns?: string[];
  /**
   * Require namespace to be reachable, turn off if you don't use namespaces. (Default: true)
   */
  strictNamespace?: boolean;
  /**
   * Default namespace used in extraction if not specified otherwise.
   */
  defaultNamespace?: string;
  /**
   * Override parser detection.
   */
  parser?: "react" | "vue" | "svelte" | "ngx";
  push?: {
    /**
     * Define, which files should be pushed and attach language/namespace to them. By default Tolgee pushes all files specified here, you can filter them by languages and namespaces properties.
     */
    files?: FileMatch[];
    /**
     * Specifies which languages should be pushed from push.files.
     */
    languages?: string[];
    /**
     * Specifies which namespaces should be pushed from push.files.
     */
    namespaces?: string[];
    forceMode?: ForceMode;
    /**
     * Override existing key descriptions from local files (only relevant for some formats).
     */
    overrideKeyDescriptions?: boolean;
    /**
     * Convert placeholders in local files to ICU format. (Default: true)
     */
    convertPlaceholdersToIcu?: boolean;
    /**
     * Specify tags that will be added to newly created keys.
     */
    tagNewKeys?: string[];
  };
  pull?: {
    /**
     * Path to a folder where the localization files are stored. (Structure itself can be defined with `fileStructureTemplate`)
     */
    path?: string;
    /**
     * List of languages to pull. Leave unspecified to export them all.
     */
    languages?: string[];
    /**
     * List of namespaces to pull. Defaults to all namespaces.
     */
    namespaces?: string[];
    /**
     * List of translation states to include. Defaults all except untranslated.
     */
    states?: ("UNTRANSLATED" | "TRANSLATED" | "REVIEWED")[];
    /**
     * List of tags which to include.
     */
    tags?: string[];
    /**
     * List of tags which to exclude.
     */
    excludeTags?: string[];
    /**
     * Export keys with array syntax (e.g. item[0]) as arrays.
     */
    supportArrays?: boolean;
    /**
     * Defines exported file structure: https://tolgee.io/tolgee-cli/push-pull-strings#file-structure-template-format
     */
    fileStructureTemplate?: string;
    /**
     * Empty [path] folder before inserting pulled files.
     */
    emptyDir?: boolean;
    /**
     * Structure delimiter to use. By default, Tolgee interprets `.` as a nested structure. You can change the delimiter, or disable structure formatting by not specifying any value to the option.
     */
    delimiter?: string | null;
  };
}
export interface FileMatch {
  path: Path;
  language: string;
  namespace?: string;
}