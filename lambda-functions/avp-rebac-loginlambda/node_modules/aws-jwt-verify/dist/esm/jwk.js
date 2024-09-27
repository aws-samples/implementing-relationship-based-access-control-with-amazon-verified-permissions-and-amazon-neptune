// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { SimpleJsonFetcher, fetchJson } from "./https.js";
import { isJsonObject } from "./safe-json-parse.js";
import { JwkValidationError, JwksNotAvailableInCacheError, JwksValidationError, KidNotFoundInJwksError, WaitPeriodNotYetEndedJwkError, JwtWithoutValidKidError, JwkInvalidUseError, JwkInvalidKtyError, } from "./error.js";
import { nodeWebCompat } from "#node-web-compat";
import { assertStringEquals } from "./assert.js";
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
export function findJwkInJwks(jwks, kid) {
    return jwks.keys.find((jwk) => jwk.kid != null && jwk.kid === kid);
}
export async function fetchJwks(jwksUri) {
    const jwks = await fetchJson(jwksUri);
    assertIsJwks(jwks);
    return jwks;
}
export async function fetchJwk(jwksUri, decomposedJwt) {
    if (!decomposedJwt.header.kid) {
        throw new JwtWithoutValidKidError("JWT header does not have valid kid claim");
    }
    const jwks = await fetchJwks(jwksUri);
    const jwk = findJwkInJwks(jwks, decomposedJwt.header.kid);
    if (!jwk) {
        throw new KidNotFoundInJwksError(`JWK for kid "${decomposedJwt.header.kid}" not found in the JWKS`);
    }
    return jwk;
}
export function assertIsJwks(jwks) {
    if (!jwks) {
        throw new JwksValidationError("JWKS empty");
    }
    if (!isJsonObject(jwks)) {
        throw new JwksValidationError("JWKS should be an object");
    }
    if (!Object.keys(jwks).includes("keys")) {
        throw new JwksValidationError("JWKS does not include keys");
    }
    if (!Array.isArray(jwks.keys)) {
        throw new JwksValidationError("JWKS keys should be an array");
    }
    for (const jwk of jwks.keys) {
        assertIsJwk(jwk);
    }
}
export function assertIsRsaSignatureJwk(jwk) {
    // Check JWK use
    assertStringEquals("JWK use", jwk.use, "sig", JwkInvalidUseError);
    // Check JWK kty
    assertStringEquals("JWK kty", jwk.kty, "RSA", JwkInvalidKtyError);
    // Check modulus (n) has a value
    if (!jwk.n)
        throw new JwkValidationError("Missing modulus (n)");
    // Check exponent (e) has a value
    if (!jwk.e)
        throw new JwkValidationError("Missing exponent (e)");
}
export function assertIsJwk(jwk) {
    if (!jwk) {
        throw new JwkValidationError("JWK empty");
    }
    if (!isJsonObject(jwk)) {
        throw new JwkValidationError("JWK should be an object");
    }
    for (const field of mandatoryJwkFieldNames) {
        // disable eslint rule because `field` is trusted
        // eslint-disable-next-line security/detect-object-injection
        if (typeof jwk[field] !== "string") {
            throw new JwkValidationError(`JWK ${field} should be a string`);
        }
    }
    for (const field of optionalJwkFieldNames) {
        // disable eslint rule because `field` is trusted
        // eslint-disable-next-line security/detect-object-injection
        if (field in jwk && typeof jwk[field] !== "string") {
            throw new JwkValidationError(`JWK ${field} should be a string`);
        }
    }
}
export function isJwks(jwks) {
    try {
        assertIsJwks(jwks);
        return true;
    }
    catch {
        return false;
    }
}
export function isJwk(jwk) {
    try {
        assertIsJwk(jwk);
        return true;
    }
    catch {
        return false;
    }
}
export class SimplePenaltyBox {
    constructor(props) {
        this.waitingUris = new Map();
        this.waitSeconds = props?.waitSeconds ?? 10;
    }
    async wait(jwksUri) {
        // SimplePenaltyBox does not actually wait but bluntly throws an error
        // Any waiting and retries are expected to be done upstream (e.g. in the browser / app)
        if (this.waitingUris.has(jwksUri)) {
            throw new WaitPeriodNotYetEndedJwkError("Not allowed to fetch JWKS yet, still waiting for back off period to end");
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
        const i = nodeWebCompat.setTimeoutUnref(() => {
            this.waitingUris.delete(jwksUri);
        }, this.waitSeconds * 1000);
        this.waitingUris.set(jwksUri, i);
    }
    registerSuccessfulAttempt(jwksUri) {
        this.release(jwksUri);
    }
}
export class SimpleJwksCache {
    constructor(props) {
        this.jwksCache = new Map();
        this.fetchingJwks = new Map();
        this.penaltyBox = props?.penaltyBox ?? new SimplePenaltyBox();
        this.fetcher = props?.fetcher ?? new SimpleJsonFetcher();
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
            throw new JwtWithoutValidKidError("JWT header does not have valid kid claim");
        }
        if (!this.jwksCache.has(jwksUri)) {
            throw new JwksNotAvailableInCacheError(`JWKS for uri ${jwksUri} not yet available in cache`);
        }
        const jwk = findJwkInJwks(this.jwksCache.get(jwksUri), decomposedJwt.header.kid);
        if (!jwk) {
            throw new KidNotFoundInJwksError(`JWK for kid ${decomposedJwt.header.kid} not found in the JWKS`);
        }
        return jwk;
    }
    async getJwk(jwksUri, decomposedJwt) {
        if (typeof decomposedJwt.header.kid !== "string") {
            throw new JwtWithoutValidKidError("JWT header does not have valid kid claim");
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
            throw new KidNotFoundInJwksError(`JWK for kid "${decomposedJwt.header.kid}" not found in the JWKS`);
        }
        else {
            this.penaltyBox.registerSuccessfulAttempt(jwksUri, decomposedJwt.header.kid);
        }
        return jwk;
    }
}
