import { assertServerOnly } from "@/lib/server/assertServerOnly";

assertServerOnly("server/observability");

type ScalabilityMetadataValue = boolean | number | string | null | undefined;

export type ScalabilityMetadata = Record<string, ScalabilityMetadataValue>;

type TimedOperationOptions<T> = {
  metadata?: ScalabilityMetadata;
  summarizeError?: (error: unknown) => ScalabilityMetadata;
  summarizeResult?: (result: T) => ScalabilityMetadata;
};

const ENABLED_SCALABILITY_LOG_VALUES = new Set(["1", "on", "true", "yes"]);

/**
 * Cache process.env lookup since it is extremely slow in Node.js when hit on hot paths
 */
const IS_SCALABILITY_LOGGING_ENABLED = (() => {
  const configuredValue = process.env.SCALABILITY_LOGGING?.trim().toLowerCase();
  return configuredValue
    ? ENABLED_SCALABILITY_LOG_VALUES.has(configuredValue)
    : false;
})();

/**
 * Returns whether the lightweight scalability timing logs are enabled for the
 * current server process.
 */
function isScalabilityLoggingEnabled() {
  return IS_SCALABILITY_LOGGING_ENABLED;
}

function getTimerNow() {
  /** performance.now() is native and globally available; avoiding chaining overhead fallback */
  return performance.now();
}

function roundDurationMs(durationMs: number) {
  return Number(durationMs.toFixed(1));
}

function omitUndefinedValues(metadata: ScalabilityMetadata = {}) {
  /** Avoid heavy array/tuple array allocations of Object.entries().filter() during logging loop */
  const result: ScalabilityMetadata = {};
  for (const key in metadata) {
    if (metadata[key] !== undefined) {
      result[key] = metadata[key];
    }
  }
  return result;
}

function summarizeThrownError(error: unknown): ScalabilityMetadata {
  if (error instanceof Error) {
    return {
      errorMessage: error.message,
      errorName: error.name,
    };
  }

  return {
    errorName: "UnknownError",
  };
}

/**
 * Measures one server-side operation and emits a coarse structured timing log
 * when `SCALABILITY_LOGGING` is enabled.
 */
export async function withScalabilityTimer<T>(
  event: string,
  operation: () => Promise<T> | T,
  options: TimedOperationOptions<T> = {},
): Promise<T> {
  if (!isScalabilityLoggingEnabled()) {
    return await operation();
  }

  const startedAt = getTimerNow();

  try {
    const result = await operation();

    console.warn("[scalability]", {
      durationMs: roundDurationMs(getTimerNow() - startedAt),
      event,
      phase: "baseline",
      status: "ok",
      ...omitUndefinedValues(options.metadata),
      ...omitUndefinedValues(options.summarizeResult?.(result)),
    });

    return result;
  } catch (error) {
    console.warn("[scalability]", {
      durationMs: roundDurationMs(getTimerNow() - startedAt),
      event,
      phase: "baseline",
      status: "error",
      ...omitUndefinedValues(options.metadata),
      ...omitUndefinedValues(options.summarizeError?.(error)),
      ...summarizeThrownError(error),
    });

    throw error;
  }
}
