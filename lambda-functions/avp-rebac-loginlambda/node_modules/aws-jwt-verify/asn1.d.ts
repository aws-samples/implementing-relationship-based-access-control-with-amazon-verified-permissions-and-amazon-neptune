/// <reference types="node" />
/**
 * Transform an RSA public key, which is a pair of modulus (n) and exponent (e),
 *  into a buffer per ASN.1 spec (DER-encoding)
 *
 * @param n - The modulus of the public key as buffer
 * @param e - The exponent of the public key as buffer
 * @returns The buffer, which is the public key encoded per ASN.1 spec (DER-encoding)
 */
export declare function constructPublicKeyInDerFormat(n: Buffer, e: Buffer): Buffer;
/**
 * Decode an ASN.1 DER-encoded public key, into its modulus (n) and exponent (e)
 *
 * @param publicKey - The ASN.1 DER-encoded public key
 * @returns Object with modulus (n) and exponent (e)
 */
export declare function deconstructPublicKeyInDerFormat(publicKey: Buffer): {
    n: Buffer;
    e: Buffer;
};
