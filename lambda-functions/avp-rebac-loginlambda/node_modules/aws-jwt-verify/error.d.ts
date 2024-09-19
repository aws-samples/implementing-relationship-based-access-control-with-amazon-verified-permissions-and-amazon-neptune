import { JwtHeader, JwtPayload } from "./jwt-model.js";
/**
 * Base Error for all other errors in this file
 */
export declare abstract class JwtBaseError extends Error {
}
/**
 * Interface for an error that is raised because an actual value does not match with the expected value
 */
interface AssertionError extends JwtBaseError {
    failedAssertion: {
        actual: unknown;
        expected?: string | Readonly<string[]>;
    };
}
/**
 * Constructor interface for AssertionError
 */
export interface AssertionErrorConstructor {
    new (msg: string, actual: unknown, expected?: string | Readonly<string[]>): AssertionError;
}
/**
 * An error that is raised because an actual value does not match with the expected value
 */
export declare class FailedAssertionError extends JwtBaseError {
    failedAssertion: {
        actual: unknown;
        expected?: string | Readonly<string[]>;
    };
    constructor(msg: string, actual: unknown, expected?: string | Readonly<string[]>);
}
/**
 * JWT errors
 */
export declare class JwtParseError extends JwtBaseError {
    constructor(msg: string, error?: unknown);
}
export declare class ParameterValidationError extends JwtBaseError {
}
export declare class JwtInvalidSignatureError extends JwtBaseError {
}
export declare class JwtInvalidSignatureAlgorithmError extends FailedAssertionError {
}
interface RawJwt {
    header: JwtHeader;
    payload: JwtPayload;
}
export declare abstract class JwtInvalidClaimError extends FailedAssertionError {
    rawJwt?: RawJwt;
    withRawJwt<T extends JwtInvalidClaimError>(this: T, { header, payload }: RawJwt): T;
}
export declare class JwtInvalidIssuerError extends JwtInvalidClaimError {
}
export declare class JwtInvalidAudienceError extends JwtInvalidClaimError {
}
export declare class JwtInvalidScopeError extends JwtInvalidClaimError {
}
export declare class JwtExpiredError extends JwtInvalidClaimError {
}
export declare class JwtNotBeforeError extends JwtInvalidClaimError {
}
/**
 * Amazon Cognito specific erros
 */
export declare class CognitoJwtInvalidGroupError extends JwtInvalidClaimError {
}
export declare class CognitoJwtInvalidTokenUseError extends JwtInvalidClaimError {
}
export declare class CognitoJwtInvalidClientIdError extends JwtInvalidClaimError {
}
/**
 * ASN.1 errors
 */
export declare class Asn1DecodingError extends JwtBaseError {
}
/**
 * JWK errors
 */
export declare class JwksValidationError extends JwtBaseError {
}
export declare class JwkValidationError extends JwtBaseError {
}
export declare class JwtWithoutValidKidError extends JwtBaseError {
}
export declare class KidNotFoundInJwksError extends JwtBaseError {
}
export declare class WaitPeriodNotYetEndedJwkError extends JwtBaseError {
}
export declare class JwksNotAvailableInCacheError extends JwtBaseError {
}
export declare class JwkInvalidUseError extends FailedAssertionError {
}
export declare class JwkInvalidKtyError extends FailedAssertionError {
}
/**
 * HTTPS fetch errors
 */
export declare class FetchError extends JwtBaseError {
    constructor(uri: string, msg: unknown);
}
export declare class NonRetryableFetchError extends FetchError {
}
/**
 * Web compatibility errors
 */
export declare class NotSupportedError extends JwtBaseError {
}
export {};
