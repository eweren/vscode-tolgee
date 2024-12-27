# Unofficial Tolgee VS Code Extension

This is an unofficial vscode extension for tolgee.

You can see previews of your tolgee keys, missing translations and goto definition right inside your vscode. It even prefills params so that you see how your translations would behave.

Take a look ⬇️

![demo](demo.gif)


## Requirements

You should have the tolgee cli installed on your machine and have an exisiting tolgee config for the use with the cli in your project directory.

This extension heavily relies on having this config. For example it is used to detect the available languages and provide goto-definition for your project by scanning the files defined in the push section.

Currently this extension only allows project-api-keys. So be sure to scope your tolgee cli for your working directory with a project api key.
You can set one by executing the command

```bash
tolgee login [--api-url=https://...] tgpak_...
```

Example .tolgeerc

```json
{
  "projectId": 1,
  "apiUrl": "https://tolgee.example.com/",
  "pull": {
    "path": "./src/i18n"
  }
}
```

## Config

This extension can be adjusted by the following settings

```json
"properties": {
  "tolgeev2.language": {
    "type": "string",
    "default": "en",
    "description": "The language to use for the tolgee value preview."
  },
  "tolgeev2.highlightColor": {
    "type": "string",
    "default": "#ec417a",
    "description": "The color to be used to highlight tolgee keys."
  },
  "tolgeev2.filePattern": {
    "type": "string",
    "default": "**/*.{tsx,jsx,js,ts,svelte,html}",
    "description": "The pattern in which the extension should search for tolgee keys."
  }
}
```

## Commands

```bash
# change the inline-preview language to one of the languages found within the pull-path from config
tolgeev2.changeLanguage 
```

## Changelog

v0.1.1, v0.1.2, v0.1.3
- small bugfixes

v0.1.0
- change architecture to use reactive-vscode
- make use of tolgee cli to auto-detect secrets
- add goto definition functionality
- add preview functionality
- optimize suggestions

v0.0.3
- add tests
- fix typo

v0.0.2
- add hover provider
- fix regex for finding occurrences

