// https://nextjs.org/docs/app/building-your-application/testing/jest#optional-extend-jest-with-custom-matchers
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(globalThis, { TextDecoder, TextEncoder });

Object.assign(globalThis, {
  // eslint-disable-next-line unicorn/prefer-structured-clone
  structuredClone: (value: unknown) => JSON.parse(JSON.stringify(value)),
});

if ("window" in globalThis) {
  globalThis.window.HTMLElement.prototype.scrollIntoView = jest.fn();
}
