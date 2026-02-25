import { randomUUID } from "node:crypto";

export type SeverityText =
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"
  | "FATAL";

const SEVERITY_MAP: Record<SeverityText, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

export const severityNumber = (severity: SeverityText): number => {
  // eslint-disable-next-line security/detect-object-injection
  return SEVERITY_MAP[severity];
};

export const generateTraceParent = (): string => {
  const traceId = randomUUID().replaceAll("-", ""); // 32 hex
  const spanId = randomUUID().replaceAll("-", "").slice(0, 16); // 16 hex
  return `00-${traceId}-${spanId}-01`;
};

export const nextSequence = (counter: number): string =>
  counter.toString().padStart(20, "0");

export function* newSequenceGenerator(
  startingCounter: number,
): Generator<string, never, undefined> {
  let counter = startingCounter;
  while (true) {
    yield nextSequence(counter);
    counter += 1;
  }
}
