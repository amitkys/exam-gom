// Database errors may embed credentials or personal data. Record classification
// only, never raw errors or SQL parameters.
export function logAuthError(operation: string, error: unknown) {
  console.error(`${operation} error`, {
    type: error instanceof Error ? error.name : "UnknownError",
  });
}
