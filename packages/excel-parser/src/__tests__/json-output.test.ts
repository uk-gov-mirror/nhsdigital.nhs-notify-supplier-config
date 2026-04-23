import { stringifyJsonWithSortedKeys } from "../json-output";

describe("stringifyJsonWithSortedKeys", () => {
  it("sorts object keys recursively while preserving array order", () => {
    const output = stringifyJsonWithSortedKeys(
      {
        z: {
          d: 4,
          a: 1,
        },
        a: [
          {
            z: 2,
            a: 1,
          },
          "keep-order",
          {
            b: 2,
            a: 1,
          },
        ],
        m: true,
      },
      2,
    );

    expect(output).toBe(`{
  "a": [
    {
      "a": 1,
      "z": 2
    },
    "keep-order",
    {
      "a": 1,
      "b": 2
    }
  ],
  "m": true,
  "z": {
    "a": 1,
    "d": 4
  }
}`);
  });

  it("produces the same output for equivalent objects with different insertion order", () => {
    const left = {
      variants: {
        beta: {
          status: "DRAFT",
          id: "beta",
        },
        alpha: {
          status: "DRAFT",
          id: "alpha",
        },
      },
      packs: {
        packB: {
          version: 1,
          id: "pack-b",
        },
        packA: {
          version: 1,
          id: "pack-a",
        },
      },
    };
    const right = {
      packs: {
        packA: {
          id: "pack-a",
          version: 1,
        },
        packB: {
          id: "pack-b",
          version: 1,
        },
      },
      variants: {
        alpha: {
          id: "alpha",
          status: "DRAFT",
        },
        beta: {
          id: "beta",
          status: "DRAFT",
        },
      },
    };

    expect(stringifyJsonWithSortedKeys(left)).toBe(
      stringifyJsonWithSortedKeys(right),
    );
  });
});
