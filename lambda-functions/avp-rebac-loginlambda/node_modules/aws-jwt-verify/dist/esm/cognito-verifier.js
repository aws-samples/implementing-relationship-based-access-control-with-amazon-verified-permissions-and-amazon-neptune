// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CognitoJwtInvalidClientIdError, CognitoJwtInvalidGroupError, CognitoJwtInvalidTokenUseError, JwtInvalidClaimError, ParameterValidationError, } from "./error.js";
import { JwtRsaVerifierBase } from "./jwt-rsa.js";
import { assertStringArrayContainsString, assertStringEquals, assertStringArraysOverlap, } from "./assert.js";
/**
 * Validate claims of a decoded Cognito JWT.
 * This function throws an error in case there's any validation issue.
 *
 * @param payload - The JSON parsed payload of the Cognito JWT
 * @param options - Validation options
 * @param options.groups - The cognito groups, of which at least one must be present in the JWT's cognito:groups claim
 * @param options.tokenUse - The required token use of the JWT: "id" or "access"
 * @param options.clientId - The required clientId of the JWT. May be an array of string, of which at least one must match
 * @returns void
 */
export function validateCognitoJwtFields(payload, options) {
    // Check groups
    if (options.groups != null) {
        assertStringArraysOverlap("Cognito group", payload["cognito:groups"], options.groups, CognitoJwtInvalidGroupError);
    }
    // Check token use
    assertStringArrayContainsString("Token use", payload.token_use, ["id", "access"], CognitoJwtInvalidTokenUseError);
    if (options.tokenUse !== null) {
        if (options.tokenUse === undefined) {
            throw new ParameterValidationError("tokenUse must be provided or set to null explicitly");
        }
        assertStringEquals("Token use", payload.token_use, options.tokenUse, CognitoJwtInvalidTokenUseError);
    }
    // Check clientId aka audience
    if (options.clientId !== null) {
        if (options.clientId === undefined) {
            throw new ParameterValidationError("clientId must be provided or set to null explicitly");
        }
        if (payload.token_use === "id") {
            assertStringArrayContainsString('Client ID ("audience")', payload.aud, options.clientId, CognitoJwtInvalidClientIdError);
        }
        else {
            assertStringArrayContainsString("Client ID", payload.client_id, options.clientId, CognitoJwtInvalidClientIdError);
        }
    }
}
/**
 * Class representing a verifier for JWTs signed by Amazon Cognito
 */
export class CognitoJwtVerifier extends JwtRsaVerifierBase {
    constructor(props, jwksCache) {
        const issuerConfig = Array.isArray(props)
            ? props.map((p) => ({
                ...p,
                ...CognitoJwtVerifier.parseUserPoolId(p.userPoolId),
                audience: null, // checked instead by validateCognitoJwtFields
            }))
            : {
                ...props,
                ...CognitoJwtVerifier.parseUserPoolId(props.userPoolId),
                audience: null, // checked instead by validateCognitoJwtFields
            };
        super(issuerConfig, jwksCache);
    }
    /**
     * Parse a User Pool ID, to extract the issuer and JWKS URI
     *
     * @param userPoolId The User Pool ID
     * @returns The issuer and JWKS URI for the User Pool
     */
    static parseUserPoolId(userPoolId) {
        // Disable safe regexp check as userPoolId is provided by developer, i.e. is not user input
        // eslint-disable-next-line security/detect-unsafe-regex
        const match = userPoolId.match(/^(?<region>(\w+-)?\w+-\w+-\d)+_\w+$/);
        if (!match) {
            throw new ParameterValidationError(`Invalid Cognito User Pool ID: ${userPoolId}`);
        }
        const region = match.groups.region;
        const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
        return {
            issuer,
            jwksUri: `${issuer}/.well-known/jwks.json`,
        };
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    static create(verifyProperties, additionalProperties) {
        return new this(verifyProperties, additionalProperties?.jwksCache);
    }
    /**
     * Verify (synchronously) a JWT that is signed by Amazon Cognito.
     *
     * @param jwt The JWT, as string
     * @param props Verification properties
     * @returns The payload of the JWT––if the JWT is valid, otherwise an error is thrown
     */
    verifySync(...[jwt, properties]) {
        const { decomposedJwt, jwksUri, verifyProperties } = this.getVerifyParameters(jwt, properties);
        this.verifyDecomposedJwtSync(decomposedJwt, jwksUri, verifyProperties);
        try {
            validateCognitoJwtFields(decomposedJwt.payload, verifyProperties);
        }
        catch (err) {
            if (verifyProperties.includeRawJwtInErrors &&
                err instanceof JwtInvalidClaimError) {
                throw err.withRawJwt(decomposedJwt);
            }
            throw err;
        }
        return decomposedJwt.payload;
    }
    /**
     * Verify (asynchronously) a JWT that is signed by Amazon Cognito.
     * This call is asynchronous, and the JWKS will be fetched from the JWKS uri,
     * in case it is not yet available in the cache.
     *
     * @param jwt The JWT, as string
     * @param props Verification properties
     * @returns Promise that resolves to the payload of the JWT––if the JWT is valid, otherwise the promise rejects
     */
    async verify(...[jwt, properties]) {
        const { decomposedJwt, jwksUri, verifyProperties } = this.getVerifyParameters(jwt, properties);
        await this.verifyDecomposedJwt(decomposedJwt, jwksUri, verifyProperties);
        try {
            validateCognitoJwtFields(decomposedJwt.payload, verifyProperties);
        }
        catch (err) {
            if (verifyProperties.includeRawJwtInErrors &&
                err instanceof JwtInvalidClaimError) {
                throw err.withRawJwt(decomposedJwt);
            }
            throw err;
        }
        return decomposedJwt.payload;
    }
    /**
     * This method loads a JWKS that you provide, into the JWKS cache, so that it is
     * available for JWT verification. Use this method to speed up the first JWT verification
     * (when the JWKS would otherwise have to be downloaded from the JWKS uri), or to provide the JWKS
     * in case the JwtVerifier does not have internet access to download the JWKS
     *
     * @param jwks The JWKS
     * @param userPoolId The userPoolId for which you want to cache the JWKS
     *  Supply this field, if you instantiated the CognitoJwtVerifier with multiple userPoolIds
     * @returns void
     */
    cacheJwks(...[jwks, userPoolId]) {
        let issuer;
        if (userPoolId !== undefined) {
            issuer = CognitoJwtVerifier.parseUserPoolId(userPoolId).issuer;
        }
        else if (this.expectedIssuers.length > 1) {
            throw new ParameterValidationError("userPoolId must be provided");
        }
        const issuerConfig = this.getIssuerConfig(issuer);
        super.cacheJwks(jwks, issuerConfig.issuer);
    }
}
