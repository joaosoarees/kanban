/// <reference types="bun" />

declare module "vitest" {
  export {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    mock,
    spyOn,
    test,
    vi,
  } from "bun:test";
}
