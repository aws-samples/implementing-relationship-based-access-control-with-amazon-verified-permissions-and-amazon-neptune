// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
//
// Node.js implementations for the node-web-compatibility layer
import { createPublicKey, createVerify } from "crypto";
import { constructPublicKeyInDerFormat } from "./asn1.js";
import { fetchJson } from "./https-node.js";
/**
 * Enum to map supported JWT signature algorithms with OpenSSL message digest algorithm names
 */
var JwtSignatureAlgorithms;
(function (JwtSignatureAlgorithms) {
    JwtSignatureAlgorithms["RS256"] = "RSA-SHA256";
    JwtSignatureAlgorithms["RS384"] = "RSA-SHA384";
    JwtSignatureAlgorithms["RS512"] = "RSA-SHA512";
})(JwtSignatureAlgorithms || (JwtSignatureAlgorithms = {}));
export const nodeWebCompat = {
    fetchJson,
    transformJwkToKeyObjectSync: (jwk) => createPublicKey({
        key: constructPublicKeyInDerFormat(Buffer.from(jwk.n, "base64"), Buffer.from(jwk.e, "base64")),
        format: "der",
        type: "spki",
    }),
    transformJwkToKeyObjectAsync: async (jwk) => createPublicKey({
        key: constructPublicKeyInDerFormat(Buffer.from(jwk.n, "base64"), Buffer.from(jwk.e, "base64")),
        format: "der",
        type: "spki",
    }),
    parseB64UrlString: (b64) => Buffer.from(b64, "base64").toString("utf8"),
    verifySignatureSync: ({ alg, keyObject, jwsSigningInput, signature }) => 
    // eslint-disable-next-line security/detect-object-injection
    createVerify(JwtSignatureAlgorithms[alg])
        .update(jwsSigningInput)
        .verify(keyObject, signature, "base64"),
    verifySignatureAsync: async ({ alg, keyObject, jwsSigningInput, signature, }) => 
    // eslint-disable-next-line security/detect-object-injection
    createVerify(JwtSignatureAlgorithms[alg])
        .update(jwsSigningInput)
        .verify(keyObject, signature, "base64"),
    defaultFetchTimeouts: {
        socketIdle: 500,
        response: 1500,
    },
    setTimeoutUnref: (...args) => setTimeout(...args).unref(),
};
