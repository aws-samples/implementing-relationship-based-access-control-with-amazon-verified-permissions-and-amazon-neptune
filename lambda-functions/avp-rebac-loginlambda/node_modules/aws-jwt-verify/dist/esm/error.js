// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
/**
 * Base Error for all other errors in this file
 */
export class JwtBaseError extends Error {
}
/**
 * An error that is raised because an actual value does not match with the expected value
 */
export class FailedAssertionError extends JwtBaseError {
    constructor(msg, actual, expected) {
        super(msg);
        this.failedAssertion = {
            actual,
            expected,
        };
    }
}
/**
 * JWT errors
 */
export class JwtParseError extends JwtBaseError {
    constructor(msg, error) {
        const message = error != null ? `${msg}: ${error}` : msg;
        super(message);
    }
}
export class ParameterValidationError extends JwtBaseError {
}
export class JwtInvalidSignatureError extends JwtBaseError {
}
export class JwtInvalidSignatureAlgorithmError extends FailedAssertionError {
}
export class JwtInvalidClaimError extends FailedAssertionError {
    withRawJwt({ header, payload }) {
        this.rawJwt = {
            header,
            payload,
        };
        return this;
    }
}
export class JwtInvalidIssuerError extends JwtInvalidClaimError {
}
export class JwtInvalidAudienceError extends JwtInvalidClaimError {
}
export class JwtInvalidScopeError extends JwtInvalidClaimError {
}
export class JwtExpiredError extends JwtInvalidClaimError {
}
export class JwtNotBeforeError extends JwtInvalidClaimError {
}
/**
 * Amazon Cognito specific erros
 */
export class CognitoJwtInvalidGroupError extends JwtInvalidClaimError {
}
export class CognitoJwtInvalidTokenUseError extends JwtInvalidClaimError {
}
export class CognitoJwtInvalidClientIdError extends JwtInvalidClaimError {
}
/**
 * ASN.1 errors
 */
export class Asn1DecodingError extends JwtBaseError {
}
/**
 * JWK errors
 */
export class JwksValidationError extends JwtBaseError {
}
export class JwkValidationError extends JwtBaseError {
}
export class JwtWithoutValidKidError extends JwtBaseError {
}
export class KidNotFoundInJwksError extends JwtBaseError {
}
export class WaitPeriodNotYetEndedJwkError extends JwtBaseError {
}
export class JwksNotAvailableInCacheError extends JwtBaseError {
}
export class JwkInvalidUseError extends FailedAssertionError {
}
export class JwkInvalidKtyError extends FailedAssertionError {
}
/**
 * HTTPS fetch errors
 */
export class FetchError extends JwtBaseError {
    constructor(uri, msg) {
        super(`Failed to fetch ${uri}: ${msg}`);
    }
}
export class NonRetryableFetchError extends FetchError {
}
/**
 * Web compatibility errors
 */
export class NotSupportedError extends JwtBaseError {
}
