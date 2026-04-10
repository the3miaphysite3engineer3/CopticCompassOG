const FLASH_PARAM_KEYS = ["message", "messageType", "state"] as const;

/**
 * Removes transient login flash parameters from a URL after they have been
 * displayed.
 */
export function stripLoginFlashParams(
  pathname: string,
  searchParams: URLSearchParams,
) {
  const nextParams = new URLSearchParams(searchParams);

  for (const key of FLASH_PARAM_KEYS) {
    nextParams.delete(key);
  }

  const nextQuery = nextParams.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
