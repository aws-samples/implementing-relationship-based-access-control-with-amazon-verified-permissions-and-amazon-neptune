"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotSupportedError = exports.NonRetryableFetchError = exports.FetchError = exports.JwkInvalidKtyError = exports.JwkInvalidUseError = exports.JwksNotAvailableInCacheError = exports.WaitPeriodNotYetEndedJwkError = exports.KidNotFoundInJwksError = exports.JwtWithoutValidKidError = exports.JwkValidationError = exports.JwksValidationError = exports.Asn1DecodingError = exports.CognitoJwtInvalidClientIdError = exports.CognitoJwtInvalidTokenUseError = exports.CognitoJwtInvalidGroupError = exports.JwtNotBeforeError = exports.JwtExpiredError = exports.JwtInvalidScopeError = exports.JwtInvalidAudienceError = exports.JwtInvalidIssuerError = exports.JwtInvalidClaimError = exports.JwtInvalidSignatureAlgorithmError = exports.JwtInvalidSignatureError = exports.ParameterValidationError = exports.JwtParseError = exports.FailedAssertionError = exports.JwtBaseError = void 0;
/**
 * Base Error for all other errors in this file
 */
class JwtBaseError extends Error {
}
exports.JwtBaseError = JwtBaseError;
/**
 * An error that is raised because an actual value does not match with the expected value
 */
class FailedAssertionError extends JwtBaseError {
    constructor(msg, actual, expected) {
        super(msg);
        this.failedAssertion = {
            actual,
            expected,
        };
    }
}
exports.FailedAssertionError = FailedAssertionError;
/**
 * JWT errors
 */
class JwtParseError extends JwtBaseError {
    constructor(msg, error) {
        const message = error != null ? `${msg}: ${error}` : msg;
        super(message);
    }
}
exports.JwtParseError = JwtParseError;
class ParameterValidationError extends JwtBaseError {
}
exports.ParameterValidationError = ParameterValidationError;
class JwtInvalidSignatureError extends JwtBaseError {
}
exports.JwtInvalidSignatureError = JwtInvalidSignatureError;
class JwtInvalidSignatureAlgorithmError extends FailedAssertionError {
}
exports.JwtInvalidSignatureAlgorithmError = JwtInvalidSignatureAlgorithmError;
class JwtInvalidClaimError extends FailedAssertionError {
    withRawJwt({ header, payload }) {
        this.rawJwt = {
            header,
            payload,
        };
        return this;
    }
}
exports.JwtInvalidClaimError = JwtInvalidClaimError;
class JwtInvalidIssuerError extends JwtInvalidClaimError {
}
exports.JwtInvalidIssuerError = JwtInvalidIssuerError;
class JwtInvalidAudienceError extends JwtInvalidClaimError {
}
exports.JwtInvalidAudienceError = JwtInvalidAudienceError;
class JwtInvalidScopeError extends JwtInvalidClaimError {
}
exports.JwtInvalidScopeError = JwtInvalidScopeError;
class JwtExpiredError extends JwtInvalidClaimError {
}
exports.JwtExpiredError = JwtExpiredError;
class JwtNotBeforeError extends JwtInvalidClaimError {
}
exports.JwtNotBeforeError = JwtNotBeforeError;
/**
 * Amazon Cognito specific erros
 */
class CognitoJwtInvalidGroupError extends JwtInvalidClaimError {
}
exports.CognitoJwtInvalidGroupError = CognitoJwtInvalidGroupError;
class CognitoJwtInvalidTokenUseError extends JwtInvalidClaimError {
}
exports.CognitoJwtInvalidTokenUseError = CognitoJwtInvalidTokenUseError;
class CognitoJwtInvalidClientIdError extends JwtInvalidClaimError {
}
exports.CognitoJwtInvalidClientIdError = CognitoJwtInvalidClientIdError;
/**
 * ASN.1 errors
 */
class Asn1DecodingError extends JwtBaseError {
}
exports.Asn1DecodingError = Asn1DecodingError;
/**
 * JWK errors
 */
class JwksValidationError extends JwtBaseError {
}
exports.JwksValidationError = JwksValidationError;
class JwkValidationError extends JwtBaseError {
}
exports.JwkValidationError = JwkValidationError;
class JwtWithoutValidKidError extends JwtBaseError {
}
exports.JwtWithoutValidKidError = JwtWithoutValidKidError;
class KidNotFoundInJwksError extends JwtBaseError {
}
exports.KidNotFoundInJwksError = KidNotFoundInJwksError;
class WaitPeriodNotYetEndedJwkError extends JwtBaseError {
}
exports.WaitPeriodNotYetEndedJwkError = WaitPeriodNotYetEndedJwkError;
class JwksNotAvailableInCacheError extends JwtBaseError {
}
exports.JwksNotAvailableInCacheError = JwksNotAvailableInCacheError;
class JwkInvalidUseError extends FailedAssertionError {
}
exports.JwkInvalidUseError = JwkInvalidUseError;
class JwkInvalidKtyError extends FailedAssertionError {
}
exports.JwkInvalidKtyError = JwkInvalidKtyError;
/**
 * HTTPS fetch errors
 */
class FetchError extends JwtBaseError {
    constructor(uri, msg) {
        super(`Failed to fetch ${uri}: ${msg}`);
    }
}
exports.FetchError = FetchError;
class NonRetryableFetchError extends FetchError {
}
exports.NonRetryableFetchError = NonRetryableFetchError;
/**
 * Web compatibility errors
 */
class NotSupportedError extends JwtBaseError {
}
exports.NotSupportedError = NotSupportedError;
