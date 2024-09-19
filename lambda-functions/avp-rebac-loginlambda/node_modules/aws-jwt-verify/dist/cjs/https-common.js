"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
//
// Lower-level HTTPS functionalities, common for Node.js and Web
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHttpsJsonResponse = void 0;
const error_js_1 = require("./error.js");
/**
 * Sanity check a HTTPS response where we expect to get JSON data back
 *
 * @param uri the uri that was being requested
 * @param statusCode the HTTP status code, should be 200
 * @param contentType the value of the "Content-Type" header in the response, should start with "application/json"
 * @returns void - throws an error if the status code or content type aren't as expected
 */
function validateHttpsJsonResponse(uri, statusCode, contentType) {
    if (statusCode === 429) {
        throw new error_js_1.FetchError(uri, "Too many requests");
    }
    else if (statusCode !== 200) {
        throw new error_js_1.NonRetryableFetchError(uri, `Status code is ${statusCode}, expected 200`);
    }
    if (!contentType ||
        !contentType.toLowerCase().startsWith("application/json")) {
        throw new error_js_1.NonRetryableFetchError(uri, `Content-type is "${contentType}", expected "application/json"`);
    }
}
exports.validateHttpsJsonResponse = validateHttpsJsonResponse;
