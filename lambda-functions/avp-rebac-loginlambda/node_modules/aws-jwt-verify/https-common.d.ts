/**
 * Sanity check a HTTPS response where we expect to get JSON data back
 *
 * @param uri the uri that was being requested
 * @param statusCode the HTTP status code, should be 200
 * @param contentType the value of the "Content-Type" header in the response, should start with "application/json"
 * @returns void - throws an error if the status code or content type aren't as expected
 */
export declare function validateHttpsJsonResponse(uri: string, statusCode?: number, contentType?: string): void;
