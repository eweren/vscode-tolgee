export const REGEX_FUNCTIONAL_EXPRESSION = /[\$]?t\(["`']([\w.]*)["`'],?\s?(?:["`'][\w\s{}]*["`'],\s?)?(\{[\w\s:"',]*\})?/g
export const REGEX_FUNCTIONAL_START_EXPRESSION = /[\$]?t\((?:["'`]([\w.]+))?/g
export const REGEX_HTML_EXPRESSION = /<T\s+keyName\s*=\s*["'`]([\w.]+)["'`]\s*(?:(?:defaultValue\s?=\s?)*["'`][\w\s{}]+["'`]\s*|(?:params\s?=\s?)*["'`{]([\w\s{}:'"`,]+)["'`}]+)*/g
export const REGEX_HTML_START_EXPRESSION = /<T\s+keyName\s*=\s*(?:["'`]([\w.]+))?/g

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

export const findMatches = (line: string, position: number) => {
  const functionalMatches = [...line.matchAll(REGEX_FUNCTIONAL_START_EXPRESSION)];
  const htmlMatches = [...line.matchAll(REGEX_HTML_START_EXPRESSION)];
  const matches = [...functionalMatches, ...htmlMatches];

  return matches?.find(m => {
    if (m.index === undefined || m.index === null) {
      return;
    }

    const positionOfOccurrence = m.index + (m[1] ? m[0].lastIndexOf(m[1]) : m[0].length) + 1;
    return positionOfOccurrence <= position && positionOfOccurrence + (m[1]?.length ?? 1) >= position;
  });
};
