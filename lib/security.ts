import "server-only";
import {
  timingSafeEqual,
} from "node:crypto";

export function safeCompare(
  supplied: string,
  expected: string,
) {
  if (
    !supplied ||
    !expected
  ) {
    return false;
  }

  const suppliedBuffer =
    Buffer.from(supplied);

  const expectedBuffer =
    Buffer.from(expected);

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    suppliedBuffer,
    expectedBuffer,
  );
}