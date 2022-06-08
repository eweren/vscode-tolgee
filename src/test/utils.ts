import * as assert from 'assert';
import { describe, it } from "mocha";
import { findMatches as findMatch } from '../utils';

describe("utils", () => {
  describe("findMatches", () => {
    it("should find the correct html value", () => {
      const inputString = '        ><T keyName="foo" /></label> <T keyName="second" /></label>';
      assert.equal(findMatch(inputString, 24)?.[1], "foo");
      assert.equal(findMatch(inputString, 4)?.[1], null);
      assert.equal(findMatch(inputString, 28)?.[1], null);
      assert.equal(findMatch(inputString, 52)?.[1], "second");
      assert.equal(findMatch(inputString, 60)?.[1], null);
    });
    it("should find the correct store/hook value", () => {
      const inputString = 'const myString, mySecondString = [t("foo"), t("bar")]';
      assert.equal(findMatch(inputString, inputString.indexOf("foo") + 2)?.[1], "foo");
      assert.equal(findMatch(inputString, 42)?.[1], null);
      assert.equal(findMatch(inputString, inputString.indexOf("bar") + 2)?.[1], "bar");
      assert.equal(findMatch(inputString, 52)?.[1], null);
    });
  });
});
