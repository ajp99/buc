import { describe, expect, it } from "vitest";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import { t } from "@/lib/i18n";

function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

describe("i18n", () => {
  it("en and hi dictionaries have identical keys", () => {
    expect(keys(hi).sort()).toEqual(keys(en).sort());
  });

  it("translates, interpolates, and falls back to the key", () => {
    expect(t("hi", "common.save")).toBe("सहेजें");
    expect(t("en", "missing.key")).toBe("missing.key");
  });
});
