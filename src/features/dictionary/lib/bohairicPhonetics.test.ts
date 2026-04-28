import { describe, expect, it } from "vitest";

import { bohairicToPhonetic } from "./bohairicPhonetics";

describe("bohairicToPhonetic", () => {
  it("strips Bohairic jinkim without pronouncing it", () => {
    expect(bohairicToPhonetic("ⲙ̀ⲡⲉⲣ-")).toBe("mpehr");
    expect(bohairicToPhonetic("ⲙ̀ⲙⲟ=")).toBe("mmo");
    expect(bohairicToPhonetic("ⲛ̀ⲧⲉ-/ⲛ̀ⲧⲁ=")).toBe("nteh ntah");
  });

  it("keeps the Bohairic pseudo-phonetic mappings for common letters and digraphs", () => {
    expect(bohairicToPhonetic("ⲭⲉⲣⲉ")).toBe("shehreh");
    expect(bohairicToPhonetic("ⲭⲁⲓⲣⲉ")).toBe("khahyreh");
    expect(bohairicToPhonetic("ⲟⲩⲟⲓⲛⲓ")).toBe("woynee");
    expect(bohairicToPhonetic("ϯⲟⲩ")).toBe("tee-oo");
  });
});
