import { describe, expect, it } from "vitest";
import { successResponse } from "./api-response.js";

describe("successResponse", () => {
  it("returns the standard API envelope", () => {
    expect(successResponse("ok", { value: 1 })).toEqual({ success: true, message: "ok", data: { value: 1 } });
  });
});
