import { describe, expect, it } from "vitest";
import { joinPath } from "./url.ts";

describe("joinPath", () => {
  it("should leave trailing slash if present", () => {
    const baseWithout = "path";
    const baseWith = "/path";

    expect(joinPath(baseWithout)).toBe("path");
    expect(joinPath(baseWith)).toBe("/path");
  });
  it("should add slashes to elements if not present", () => {
    const base = "/path";
    const elements = ["elem1", "/elem2"];

    expect(joinPath(base, ...elements)).toBe("/path/elem1/elem2");
  });
  it("should remove trailing slashes", () => {
    const base = "/path/";
    const elements = ["elem1/", "elem2/"];

    expect(joinPath(base, ...elements)).toBe("/path/elem1/elem2");
  });
  it("should leave protocol", () => {
    const base = "http://path/";
    const elements = ["elem1/", "elem2/"];

    expect(joinPath(base, ...elements)).toBe("http://path/elem1/elem2");
  });
});
