// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
//
// Utilities for fetching the JWKS URI, to get the public keys with which to verify JWTs
import { NonRetryableFetchError } from "./error.js";
import { nodeWebCompat } from "#node-web-compat";
/**
 * Execute a HTTPS request
 * @param uri - The URI
 * @param requestOptions - The RequestOptions to use (depending on the runtime context, either Node.js RequestOptions or Web Fetch init)
 * @param data - Data to send to the URI (e.g. POST data)
 * @returns - The response as parsed JSON
 */
export const fetchJson = nodeWebCompat.fetchJson;
/**
 * HTTPS Fetcher for URIs with JSON body
 *
 * @param defaultRequestOptions - The default RequestOptions to use on individual HTTPS requests
 */
export class SimpleJsonFetcher {
    constructor(props) {
        this.defaultRequestOptions = {
            timeout: nodeWebCompat.defaultFetchTimeouts.socketIdle,
            responseTimeout: nodeWebCompat.defaultFetchTimeouts.response,
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
            return await fetchJson(uri, requestOptions, data);
        }
        catch (err) {
            if (err instanceof NonRetryableFetchError) {
                throw err;
            }
            // Retry once, immediately
            return fetchJson(uri, requestOptions, data);
        }
    }
}
