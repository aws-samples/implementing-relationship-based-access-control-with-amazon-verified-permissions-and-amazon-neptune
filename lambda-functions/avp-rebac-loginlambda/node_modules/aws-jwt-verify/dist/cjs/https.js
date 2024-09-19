"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
//
// Utilities for fetching the JWKS URI, to get the public keys with which to verify JWTs
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleJsonFetcher = exports.fetchJson = void 0;
const error_js_1 = require("./error.js");
const _node_web_compat_1 = require("#node-web-compat");
/**
 * Execute a HTTPS request
 * @param uri - The URI
 * @param requestOptions - The RequestOptions to use (depending on the runtime context, either Node.js RequestOptions or Web Fetch init)
 * @param data - Data to send to the URI (e.g. POST data)
 * @returns - The response as parsed JSON
 */
exports.fetchJson = _node_web_compat_1.nodeWebCompat.fetchJson;
/**
 * HTTPS Fetcher for URIs with JSON body
 *
 * @param defaultRequestOptions - The default RequestOptions to use on individual HTTPS requests
 */
class SimpleJsonFetcher {
    constructor(props) {
        this.defaultRequestOptions = {
            timeout: _node_web_compat_1.nodeWebCompat.defaultFetchTimeouts.socketIdle,
            responseTimeout: _node_web_compat_1.nodeWebCompat.defaultFetchTimeouts.response,
            ...props?.defaultRequestOptions,
        };
    }
    /**
     * Execute a HTTPS request (with 1 immediate retry in case of errors)
     * @param uri - The URI
     * @param requestOptions - The RequestOptions to use
     * @param data - Data to send to the URI (e.g. POST data)
     * @returns - The response as parsed JSON
     */
    async fetch(uri, requestOptions, data) {
        requestOptions = { ...this.defaultRequestOptions, ...requestOptions };
        try {
            return await (0, exports.fetchJson)(uri, requestOptions, data);
        }
        catch (err) {
            if (err instanceof error_js_1.NonRetryableFetchError) {
                throw err;
            }
            // Retry once, immediately
            return (0, exports.fetchJson)(uri, requestOptions, data);
        }
    }
}
exports.SimpleJsonFetcher = SimpleJsonFetcher;
