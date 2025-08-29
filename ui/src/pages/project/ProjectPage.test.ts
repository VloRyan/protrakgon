import { describe, expect, it } from "vitest";
import { Comparator, testables } from "./ProjectPage.tsx";
describe("formatTimespan", () => {
  it("start eq", () => {
    expect(testables.formatTimespan("01.01.2000", Comparator.Eq)).toBe(
      "01.01.2000",
    );
  });
  it("start neq", () => {
    expect(testables.formatTimespan("01.01.2000", Comparator.NeEq)).toBe(
      "!01.01.2000",
    );
  });
  it("start lt", () => {
    expect(testables.formatTimespan("01.01.2000", Comparator.Lt)).toBe(
      "<01.01.2000",
    );
  });
  it("start lteq", () => {
    expect(testables.formatTimespan("01.01.2000", Comparator.LtEq)).toBe(
      "<=01.01.2000",
    );
  });
  it("start gt", () => {
    expect(testables.formatTimespan("01.01.2000", Comparator.Gt)).toBe(
      ">01.01.2000",
    );
  });
  it("start gteq", () => {
    expect(testables.formatTimespan("01.01.2000", Comparator.GtEq)).toBe(
      "01.01.2000",
    );
  });

  it("end eq", () => {
    expect(
      testables.formatTimespan(
        undefined,
        undefined,
        "01.01.2005",
        Comparator.Eq,
      ),
    ).toBe("... 01.01.2005");
  });
  it("end neq", () => {
    expect(
      testables.formatTimespan(
        undefined,
        undefined,
        "01.01.2005",
        Comparator.NeEq,
      ),
    ).toBe("... !01.01.2005");
  });
  it("end lt", () => {
    expect(
      testables.formatTimespan(
        undefined,
        undefined,
        "01.01.2005",
        Comparator.Lt,
      ),
    ).toBe("... <01.01.2005");
  });
  it("end gt", () => {
    expect(
      testables.formatTimespan(
        undefined,
        undefined,
        "01.01.2005",
        Comparator.Gt,
      ),
    ).toBe("... >01.01.2005");
  });
  it("end gteq", () => {
    expect(
      testables.formatTimespan(
        undefined,
        undefined,
        "01.01.2005",
        Comparator.GtEq,
      ),
    ).toBe("... >=01.01.2005");
  });
});
