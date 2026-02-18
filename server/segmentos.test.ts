import { describe, expect, it } from "vitest";
import { SEGMENTOS_ECONOMICOS } from "../client/src/data/segmentosEconomicos";

describe("SEGMENTOS_ECONOMICOS", () => {
  it("should contain more than 1300 entries", () => {
    expect(SEGMENTOS_ECONOMICOS.length).toBeGreaterThan(1300);
  });

  it("should be approximately sorted alphabetically", () => {
    // Verify that the list is generally in alphabetical order
    // by checking that each entry's first letter is >= the previous entry's first letter
    for (let i = 1; i < SEGMENTOS_ECONOMICOS.length; i++) {
      const prevFirst = SEGMENTOS_ECONOMICOS[i - 1][0].toUpperCase();
      const currFirst = SEGMENTOS_ECONOMICOS[i][0].toUpperCase();
      expect(currFirst >= prevFirst).toBe(true);
    }
  });

  it("should not contain duplicates", () => {
    const lowerSet = new Set(SEGMENTOS_ECONOMICOS.map(s => s.toLowerCase()));
    expect(lowerSet.size).toBe(SEGMENTOS_ECONOMICOS.length);
  });

  it("should not contain empty strings", () => {
    const empty = SEGMENTOS_ECONOMICOS.filter(s => !s.trim());
    expect(empty).toHaveLength(0);
  });

  it("should contain known activities like Supermercados and Hotéis", () => {
    expect(SEGMENTOS_ECONOMICOS).toContain("Supermercados");
    expect(SEGMENTOS_ECONOMICOS).toContain("Hotéis");
  });

  it("first entry should start with A and last with U", () => {
    expect(SEGMENTOS_ECONOMICOS[0][0]).toBe("A");
    expect(SEGMENTOS_ECONOMICOS[SEGMENTOS_ECONOMICOS.length - 1][0]).toBe("U");
  });
});
