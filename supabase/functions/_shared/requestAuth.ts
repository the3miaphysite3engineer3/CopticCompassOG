export function hasExpectedBearerToken(
  request: Request,
  expectedToken: string,
) {
  const authorizationHeader = request.headers.get("authorization");
  if (!authorizationHeader) {
    return false;
  }

  const bearerPrefix = "Bearer ";
  if (!authorizationHeader.startsWith(bearerPrefix)) {
    return false;
  }

  const providedToken = authorizationHeader.slice(bearerPrefix.length).trim();
  return providedToken.length > 0 && providedToken === expectedToken;
}
