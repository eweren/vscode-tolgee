import type { TolgeeInstance, TranslationsFlat } from '@tolgee/core';
import type { ConfigRef, Ref, useLogger } from 'reactive-vscode';
import type { DecorationOptions } from 'vscode';
import { computed, shallowRef, useActiveEditorDecorations, useActiveTextEditor, useDocumentText, useIsDarkTheme, useTextEditorSelections, watch } from 'reactive-vscode';
import { DecorationRangeBehavior, Range, window } from 'vscode';
import { REGEX_FUNCTIONAL_EXPRESSION, REGEX_HTML_EXPRESSION } from './utils';
import { config } from './utils/config';

const isDark = useIsDarkTheme();
export const color = computed(() => isDark.value ? '#eee' : '#222');

export interface DecorationMatch extends DecorationOptions {
  key: string
}

const INLINE_INVALID_DECORATION = window.createTextEditorDecorationType({
  textDecoration: 'none;',
  border: '1px solid',
  borderSpacing: '0px',
  borderColor: `transparent transparent ${config.highlightColor ?? '#ec417a'}aa transparent`,
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

const INLINE_TEXT_DECORATION = window.createTextEditorDecorationType({
  textDecoration: 'none;opacity: 0.6;margin-right: 8px;',
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

const HIDE_TEXT_DECORATION = window.createTextEditorDecorationType({
  textDecoration: 'none; display: none;', // a hack to inject custom style
});

export function useAnnotations(loadedRecords: Ref<TranslationsFlat>, tolgee: Ref<TolgeeInstance | undefined>, logger: ReturnType<typeof useLogger>, language: ConfigRef<string>) {
  logger.info("Initializing annotation engine");
  if (!loadedRecords || !language.value) {
    logger.info("Either no loadedRecords or no config.language");
    return
  }

  const editor = useActiveTextEditor();
  const selections = useTextEditorSelections(editor);
  const text = useDocumentText(() => editor.value?.document);

  const validDecorations = shallowRef<DecorationMatch[]>([]);
  const invalidDecorations = shallowRef<DecorationMatch[]>([]);

  useActiveEditorDecorations(INLINE_INVALID_DECORATION, invalidDecorations);
  useActiveEditorDecorations(INLINE_TEXT_DECORATION, validDecorations);
  useActiveEditorDecorations(
    HIDE_TEXT_DECORATION,
    () => validDecorations.value
      .map(({ range }) => range)
      .filter(i => !selections.value.map(({ start }) => start.line).includes(i.start.line)),
  );

  const checkDecorations = () => {
    if (!editor.value || editor.value.document.languageId === "Log") {
      return;
    }
    logger.info("Checking annotation changes");

    const { document } = editor.value;

    let match;
    if (!REGEX_FUNCTIONAL_EXPRESSION) {
      return;
    }
    REGEX_FUNCTIONAL_EXPRESSION.lastIndex = 0;
    const keys: [Range, string, Record<string, string | number>?][] = [];

    match = REGEX_FUNCTIONAL_EXPRESSION.exec(text.value!);
    while (text.value && match) {
      const key = match[1];
      if (!key) {
        match = REGEX_FUNCTIONAL_EXPRESSION.exec(text.value!);
        continue;
      }

      const startPos = document.positionAt(match.index + match[0].indexOf(key));
      const endPos = document.positionAt(match.index + match[0].indexOf(key) + key.length);
      if (match.length > 2 && typeof match[2] !== "undefined") {
        try {
          const params = JSON.parse(match[2]?.replace(/(\w+):/g, '"$1":').replace(/'/g, '"').replace(/[\s:](\w+)/g, '"{$1}"') ?? {}) as Record<string, string | number>;
          keys.push([new Range(startPos, endPos), key, params]);
        } catch (e) {
          keys.push([new Range(startPos, endPos), key]);
        }
      }
      else {
        keys.push([new Range(startPos, endPos), key]);
      }
      match = REGEX_FUNCTIONAL_EXPRESSION.exec(text.value!);
    }
    REGEX_HTML_EXPRESSION.lastIndex = 0;

    match = REGEX_HTML_EXPRESSION.exec(text.value!);
    while (text.value && match) {
      const key = match[1];
      if (!key) {
        continue;
      }

      const startPos = document.positionAt(match.index + match[0].indexOf(key));
      const endPos = document.positionAt(match.index + match[0].indexOf(key) + key.length);
      if (match.length > 2 && typeof match[2] !== "undefined") {
        try {
          const params = JSON.parse(match[2]?.replace(/(\w+):/g, '"$1":').replace(/'/g, '"').replace(/[\s:](\w+)/g, '"{$1}"') ?? {}) as Record<string, string | number>;
          keys.push([new Range(startPos, endPos), key, params]);
        } catch (e) {
          keys.push([new Range(startPos, endPos), key]);
        }
      }
      else {
        keys.push([new Range(startPos, endPos), key]);
      }
      match = REGEX_HTML_EXPRESSION.exec(text.value!);
    }

    logger.info(`Found ${keys.length} tolgee matches in active file`);

    const newInvalidDecorations: DecorationMatch[] = [];
    validDecorations.value = (keys.map(([range, key, params]) => {
      let info: string | undefined = 'Invalid';
      try {

        info = tolgee.value?.t({ key, language: language.value, params });
        if (!info) {
          return undefined;
        }
      } catch (e) {
        console.error(e);
      }

      const rawValue = loadedRecords.value.get(key) as string;

      if (info === 'invalid') {
        const item: DecorationMatch = {
          range,
          renderOptions: {
            before: {
              color: config.highlightColor ?? '#ec417a',
              fontStyle: 'italic',
              contentText: '🚧 Invalid translation for: ',
            },
          },
          hoverMessage: rawValue,
          key,
        };
        newInvalidDecorations.push(item);
        return undefined;
      } else if (rawValue === undefined && info !== undefined) {
        const item: DecorationMatch = {
          range,
          renderOptions: {
            before: {
              color: config.highlightColor ?? '#ec417a',
              fontStyle: 'italic',
              contentText: '🐭 Untranslated key: ',
            },
          },
          key,
        };
        newInvalidDecorations.push(item);
        return undefined;
      }

      const item: DecorationMatch = {
        range,
        renderOptions: {
          after: {
            contentText: `🐭 ${info}`,
            borderColor: `transparent transparent ${config.highlightColor ?? '#ec417a'}aa transparent`,
            fontStyle: 'italic',
            margin: `-16px 2px; transform: translate(-2px, 3px);`,
            border: `1px dashed;`,
          },
        },
        hoverMessage: `${key}: ${rawValue}`,
        key,
      };

      return item;
    })).filter(e => !!e)
    invalidDecorations.value = newInvalidDecorations;
  };

  checkDecorations();
  watch([text], checkDecorations);
}
