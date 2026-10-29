import { AuthenticationRequiredError, expireBrowserSession, sessionExpiredMessage } from './sessionService';

/** Feature APIs share this transport so no screen can accidentally ignore a 401. */
export async function sessionFetch(input: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  const response = await globalThis.fetch(input, options);
  if (response.status === 401) {
    await expireBrowserSession();
    throw new AuthenticationRequiredError(sessionExpiredMessage);
  }
  return response;
}
