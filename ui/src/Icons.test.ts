import { describe, expect, it } from "vitest";

import {
  faBuilding,
  faDatabase,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { initIcons, resolveIcon } from "./Icons.ts";

describe("resolveIcon", () => {
  it("should return direct match", () => {
    initIcons(new Map([["domain.type.subType", faBuilding]]));

    const icon = resolveIcon("domain.type.subType");

    expect(icon).toBe(faBuilding);
  });
  it("should return parent icon", () => {
    initIcons(
      new Map([
        ["domain", faDatabase],
        ["domain.type1", faUser],
        ["domain.type1.subType", faBuilding],
      ]),
    );

    const type1Icon = resolveIcon("domain.type1.subType2");
    const domainIcon = resolveIcon("domain.type2");

    expect(type1Icon).toBe(faUser);
    expect(domainIcon).toBe(faDatabase);
  });
});
