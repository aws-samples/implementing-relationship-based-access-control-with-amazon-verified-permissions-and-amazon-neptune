"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleJwksCache = exports.SimplePenaltyBox = exports.isJwk = exports.isJwks = exports.assertIsJwk = exports.assertIsRsaSignatureJwk = exports.assertIsJwks = exports.fetchJwk = exports.fetchJwks = exports.findJwkInJwks = void 0;
const https_js_1 = require("./https.js");
const safe_json_parse_js_1 = require("./safe-json-parse.js");
const error_js_1 = require("./error.js");
const _node_web_compat_1 = require("#node-web-compat");
const assert_js_1 = require("./assert.js");
const optionalJwkFieldNames = [
    "use",
    "alg",
    "kid",
    "n",
    "e", // https://datatracker.ietf.org/doc/html/rfc7518#section-6.3.1.2
];
const mandatoryJwkFieldNames = [
    "kty", // https://datatracker.ietf.org/doc/html/rfc7517#section-4.1
];
function findJwkInJwks(jwks, kid) {
    return jwks.keys.find((jwk) => jwk.kid != null && jwk.kid === kid);
}
exports.findJwkInJwks = findJwkInJwks;
async function fetchJwks(jwksUri) {
    const jwks = await (0, https_js_1.fetchJson)(jwksUri);
    assertIsJwks(jwks);
    return jwks;
}
exports.fetchJwks = fetchJwks;
async function fetchJwk(jwksUri, decomposedJwt) {
    if (!decomposedJwt.header.kid) {
        throw new error_js_1.JwtWithoutValidKidError("JWT header does not have valid kid claim");
    }
    const jwks = await fetchJwks(jwksUri);
    const jwk = findJwkInJwks(jwks, decomposedJwt.header.kid);
    if (!jwk) {
        throw new error_js_1.KidNotFoundInJwksError(`JWK for kid "${decomposedJwt.header.kid}" not found in the JWKS`);
    }
    return jwk;
}
exports.fetchJwk = fetchJwk;
function assertIsJwks(jwks) {
    if (!jwks) {
        throw new error_js_1.JwksValidationError("JWKS empty");
    }
    if (!(0, safe_json_parse_js_1.isJsonObject)(jwks)) {
        throw new error_js_1.JwksValidationError("JWKS should be an object");
    }
    if (!Object.keys(jwks).includes("keys")) {
        throw new error_js_1.JwksValidationError("JWKS does not include keys");
    }
    if (!Array.isArray(jwks.keys)) {
        throw new error_js_1.JwksValidationError("JWKS keys should be an array");
    }
    for (const jwk of jwks.keys) {
        assertIsJwk(jwk);
    }
}
exports.assertIsJwks = assertIsJwks;
function assertIsRsaSignatureJwk(jwk) {
    // Check JWK use
    (0, assert_js_1.assertStringEquals)("JWK use", jwk.use, "sig", error_js_1.JwkInvalidUseError);
    // Check JWK kty
    (0, assert_js_1.assertStringEquals)("JWK kty", jwk.kty, "RSA", error_js_1.JwkInvalidKtyError);
    // Check modulus (n) has a value
    if (!jwk.n)
        throw new error_js_1.JwkValidationError("Missing modulus (n)");
    // Check exponent (e) has a value
    if (!jwk.e)
        throw new error_js_1.JwkValidationError("Missing exponent (e)");
}
exports.assertIsRsaSignatureJwk = assertIsRsaSignatureJwk;
function assertIsJwk(jwk) {
    if (!jwk) {
        throw new error_js_1.JwkValidationError("JWK empty");
    }
    if (!(0, safe_json_parse_js_1.isJsonObject)(jwk)) {
        throw new error_js_1.JwkValidationError("JWK should be an object");
    }
    for (const field of mandatoryJwkFieldNames) {
        // disable eslint rule because `field` is trusted
        // eslint-disable-next-line security/detect-object-injection
        if (typeof jwk[field] !== "string") {
            throw new error_js_1.JwkValidationError(`JWK ${field} should be a string`);
        }
    }
    for (const field of optionalJwkFieldNames) {
        // disable eslint rule because `field` is trusted
        // eslint-disable-next-line security/detect-object-injection
        if (field in jwk && typeof jwk[field] !== "string") {
            throw new error_js_1.JwkValidationError(`JWK ${field} should be a string`);
        }
    }
}
exports.assertIsJwk = assertIsJwk;
function isJwks(jwks) {
    try {
        assertIsJwks(jwks);
        return true;
    }
    catch {
        return false;
    }
}
exports.isJwks = isJwks;
function isJwk(jwk) {
    try {
        assertIsJwk(jwk);
        return true;
    }
    catch {
        return false;
    }
}
exports.isJwk = isJwk;
class SimplePenaltyBox {
    constructor(props) {
        this.waitingUris = new Map();
        this.waitSeconds = props?.waitSeconds ?? 10;
    }
    async wait(jwksUri) {
        // SimplePenaltyBox does not actually wait but bluntly throws an error
        // Any waiting and retries are expected to be done upstream (e.g. in the browser / app)
        if (this.waitingUris.has(jwksUri)) {
            throw new error_js_1.WaitPeriodNotYetEndedJwkError("Not allowed to fetch JWKS yet, still waiting for back off period to end");
        }
    }
    release(jwksUri) {
        const i = this.waitingUris.get(jwksUri);
        if (i) {
            clearTimeout(i);
            this.waitingUris.delete(jwksUri);
        }
    }
    registerFailedAttempt(jwksUri) {
        const i = _node_web_compat_1.nodeWebCompat.setTimeoutUnref(() => {
            this.waitingUris.delete(jwksUri);
        }, this.waitSeconds * 1000);
        this.waitingUris.set(jwksUri, i);
    }
    registerSuccessfulAttempt(jwksUri) {
        this.release(jwksUri);
    }
}
exports.SimplePenaltyBox = SimplePenaltyBox;
class SimpleJwksCache {
    constructor(props) {
        this.jwksCache = new Map();
        this.fetchingJwks = new Map();
        this.penaltyBox = props?.penaltyBox ?? new SimplePenaltyBox();
        this.fetcher = props?.fetcher ?? new https_js_1.SimpleJsonFetcher();
    }
    addJwks(jwksUri, jwks) {
        this.jwksCache.set(jwksUri, jwks);
    }
    async getJwks(jwksUri) {
        const existingFetch = this.fetchingJwks.get(jwksUri);
        if (existingFetch) {
            return existingFetch;
        }
        const jwksPromise = this.fetcher.fetch(jwksUri).then((res) => {
            assertIsJwks(res);
            return res;
        });
        this.fetchingJwks.set(jwksUri, jwksPromise);
        let jwks;
        try {
            jwks = await jwksPromise;
        }
        finally {
            this.fetchingJwks.delete(jwksUri);
        }
        this.jwksCache.set(jwksUri, jwks);
        return jwks;
    }
    getCachedJwk(jwksUri, decomposedJwt) {
        if (typeof decomposedJwt.header.kid !== "string") {
            throw new error_js_1.JwtWithoutValidKidError("JWT header does not have valid kid claim");
        }
        if (!this.jwksCache.has(jwksUri)) {
            throw new error_js_1.JwksNotAvailableInCacheError(`JWKS for uri ${jwksUri} not yet available in cache`);
        }
        const jwk = findJwkInJwks(this.jwksCache.get(jwksUri), decomposedJwt.header.kid);
        if (!jwk) {
            throw new error_js_1.KidNotFoundInJwksError(`JWK for kid ${decomposedJwt.header.kid} not found in the JWKS`);
        }
        return jwk;
    }
    async getJwk(jwksUri, decomposedJwt) {
        if (typeof decomposedJwt.header.kid !== "string") {
            throw new error_js_1.JwtWithoutValidKidError("JWT header does not have valid kid claim");
        }
        // Try to get JWK from cache:
        const cachedJwks = this.jwksCache.get(jwksUri);
        if (cachedJwks) {
            const cachedJwk = findJwkInJwks(cachedJwks, decomposedJwt.header.kid);
            if (cachedJwk) {
                return cachedJwk;
            }
        }
        // Await any wait period that is currently in effect
        // This prevents us from flooding the JWKS URI with requests
        await this.penaltyBox.wait(jwksUri, decomposedJwt.header.kid);
        // Fetch the JWKS and (try to) locate the JWK
        const jwks = await this.getJwks(jwksUri);
        const jwk = findJwkInJwks(jwks, decomposedJwt.header.kid);
        // If the JWK could not be located, someone might be messing around with us
        // Register the failed attempt with the penaltyBox, so it can enforce a wait period
        // before trying again next time (instead of flooding the JWKS URI with requests)
        if (!jwk) {
            this.penaltyBox.registerFailedAttempt(jwksUri, decomposedJwt.header.kid);
            throw new error_js_1.KidNotFoundInJwksError(`JWK for kid "${decomposedJwt.header.kid}" not found in the JWKS`);
        }
        else {
            this.penaltyBox.registerSuccessfulAttempt(jwksUri, decomposedJwt.header.kid);
        }
        return jwk;
    }
}
exports.SimpleJwksCache = SimpleJwksCache;
