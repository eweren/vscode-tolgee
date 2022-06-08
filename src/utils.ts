const matchFunctionalExpression = /(?:\$?t\([\{\s\w]*(?:key:)?\s*["`'])([\w.]*)/g;
const matchHtmlExpression = /(?:\<T\s*key[Nn]ame\s*=\s*?["'`])([\w.]*)/g;

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
  const functionalMatches = [...line.matchAll(matchFunctionalExpression)];
  const htmlMatches = [...line.matchAll(matchHtmlExpression)];
  const matches = [...functionalMatches, ...htmlMatches];

  return matches?.find(m => {
    if (m.index === undefined || m.index === null) {
      return;
    }

    const positionOfOccurrence = m.index + m[0].indexOf(m[1]);
    return positionOfOccurrence <= position && positionOfOccurrence + m[1].length >= position;
  });
};
