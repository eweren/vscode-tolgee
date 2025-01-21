import type { CompletionItemProvider, TextDocument } from 'vscode';
import { computed, ConfigRef, extensionContext, Ref, useLogger } from 'reactive-vscode';
import { CompletionItem, CompletionItemKind, languages, Position, Range } from 'vscode';
import { config, } from './utils/config';
import { findMatches } from './utils';
import { TranslationsFlat } from '@tolgee/core';

export function useCompletion(translations: Ref<TranslationsFlat>, logger: ReturnType<typeof useLogger>) {
  const ctx = extensionContext.value!;

  const translationsAsArray = computed(() => Array.from(new Set(translations.value.keys())).map(key => {
    return new CompletionItem({ label: key, description: translations.value.get(key)! }, CompletionItemKind.EnumMember);
  }));

  const completionItemProvider: CompletionItemProvider = {
    provideCompletionItems(document: TextDocument, position: Position) {
      const line = document.getText(new Range(new Position(position.line, 0), new Position(position.line, position.character)));
      const match = findMatches(line, position.character);
      if (!match) { return null; }

      return translationsAsArray.value;

    },
  };
  ctx.subscriptions.push(languages.registerCompletionItemProvider({ pattern: config.filePattern ?? '**/*.{tsx,jsx,js,ts,svelte,html}', scheme: 'file' }, completionItemProvider, "'", '"', "`"));

}