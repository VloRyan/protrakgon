import { describe, expect, it } from "vitest";
import { capitalize, trimPrefix, trimSuffix } from "./strings.ts";

describe("capitalize", () => {
  it.each([
    ["word", "Word"],
    ["Word", "Word"],
    ["words coming", "Words coming"],
  ])(`(%s) => %s`, (text, expected) => {
    expect(capitalize(text)).toBe(expected);
  });
});

describe("trimPrefix", () => {
  it.each([
    ["prefix text", "prefix", " text"],
    ["text prefix", "prefix", "text prefix"],
    ["Prefix text", "prefix", "Prefix text"],
  ])(`(%s, %s) => %s`, (text, prefix, expected) => {
    expect(trimPrefix(text, prefix)).toBe(expected);
  });
});

describe("trimSuffix", () => {
  it.each([
    ["text suffix", "suffix", "text "],
    ["suffix text", "suffix", "suffix text"],
    ["text Suffix", "suffix", "text Suffix"],
  ])(`(%s, %s) => %s`, (text, suffix, expected) => {
    expect(trimSuffix(text, suffix)).toBe(expected);
  });
});
