"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
//
// NodeJS implementation for fetching JSON documents over HTTPS
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJson = void 0;
const https_1 = require("https");
const https_common_js_1 = require("./https-common.js");
const stream_1 = require("stream");
const util_1 = require("util");
const safe_json_parse_js_1 = require("./safe-json-parse.js");
const error_js_1 = require("./error.js");
/**
 * Execute a HTTPS request
 * @param uri - The URI
 * @param requestOptions - The RequestOptions to use
 * @param data - Data to send to the URI (e.g. POST data)
 * @returns - The response as parsed JSON
 */
async function fetchJson(uri, requestOptions, data) {
    let responseTimeout;
    return new Promise((resolve, reject) => {
        const req = (0, https_1.request)(uri, {
            method: "GET",
            ...requestOptions,
        }, (response) => {
            // Capture response data
            // @types/node is incomplete so cast to any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stream_1.pipeline([
                response,
                getJsonDestination(uri, response.statusCode, response.headers),
            ], done);
        });
        if (requestOptions?.responseTimeout) {
            responseTimeout = setTimeout(() => done(new error_js_1.FetchError(uri, `Response time-out (after ${requestOptions.responseTimeout} ms.)`)), requestOptions.responseTimeout);
            responseTimeout.unref(); // Don't block Node from exiting
        }
        function done(...args) {
            if (responseTimeout)
                clearTimeout(responseTimeout);
            if (args[0] == null) {
                resolve(args[1]);
                return;
            }
            // In case of errors, let the Agent (if any) know to abandon the socket
            // This is probably best, because the socket may have become stale
            /* istanbul ignore next */
            req.socket?.emit("agentRemove");
            // Turn error into FetchError so the URI is nicely captured in the message
            let error = args[0];
            if (!(error instanceof error_js_1.FetchError)) {
                error = new error_js_1.FetchError(uri, error.message);
            }
            req.destroy();
            reject(error);
        }
        // Handle errors while sending request
        req.on("error", done);
        // Signal end of request (include optional data)
        req.end(data);
    });
}
exports.fetchJson = fetchJson;
/**
 * Ensures the HTTPS response contains valid JSON
 *
 * @param uri - The URI you were requesting
 * @param statusCode - The response status code to your HTTPS request
 * @param headers - The response headers to your HTTPS request
 *
 * @returns - Async function that can be used as destination in a stream.pipeline, it will return the JSON, if valid, or throw an error otherwise
 */
function getJsonDestination(uri, statusCode, headers) {
    return async (responseIterable) => {
        (0, https_common_js_1.validateHttpsJsonResponse)(uri, statusCode, headers["content-type"]);
        const collected = [];
        for await (const chunk of responseIterable) {
            collected.push(chunk);
        }
        try {
            return (0, safe_json_parse_js_1.safeJsonParse)(new util_1.TextDecoder("utf8", { fatal: true, ignoreBOM: true }).decode(Buffer.concat(collected)));
        }
        catch (err) {
            throw new error_js_1.NonRetryableFetchError(uri, err);
        }
    };
}
