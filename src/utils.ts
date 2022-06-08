import type { Position } from 'vscode';

export const flattenObj = (obj: any, parent?: any, res: Record<string, string> = {}) => {
  for (const key of Object.keys(obj)) {
    const propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] === 'object') {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

export const findMatches = (matches: RegExpMatchArray[], position: Position) => matches?.find(m => m.index && m.index + m[0].indexOf(m[1]) < position.character && m.index + m[0].indexOf(m[1]) + m[1].length > position.character);
