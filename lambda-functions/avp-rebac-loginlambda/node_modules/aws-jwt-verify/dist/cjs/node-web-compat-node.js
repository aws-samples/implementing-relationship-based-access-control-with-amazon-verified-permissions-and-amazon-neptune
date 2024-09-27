"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
//
// Node.js implementations for the node-web-compatibility layer
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeWebCompat = void 0;
const crypto_1 = require("crypto");
const asn1_js_1 = require("./asn1.js");
const https_node_js_1 = require("./https-node.js");
/**
 * Enum to map supported JWT signature algorithms with OpenSSL message digest algorithm names
 */
var JwtSignatureAlgorithms;
(function (JwtSignatureAlgorithms) {
    JwtSignatureAlgorithms["RS256"] = "RSA-SHA256";
    JwtSignatureAlgorithms["RS384"] = "RSA-SHA384";
    JwtSignatureAlgorithms["RS512"] = "RSA-SHA512";
})(JwtSignatureAlgorithms || (JwtSignatureAlgorithms = {}));
exports.nodeWebCompat = {
    fetchJson: https_node_js_1.fetchJson,
    transformJwkToKeyObjectSync: (jwk) => (0, crypto_1.createPublicKey)({
        key: (0, asn1_js_1.constructPublicKeyInDerFormat)(Buffer.from(jwk.n, "base64"), Buffer.from(jwk.e, "base64")),
        format: "der",
        type: "spki",
    }),
    transformJwkToKeyObjectAsync: async (jwk) => (0, crypto_1.createPublicKey)({
        key: (0, asn1_js_1.constructPublicKeyInDerFormat)(Buffer.from(jwk.n, "base64"), Buffer.from(jwk.e, "base64")),
        format: "der",
        type: "spki",
    }),
    parseB64UrlString: (b64) => Buffer.from(b64, "base64").toString("utf8"),
    verifySignatureSync: ({ alg, keyObject, jwsSigningInput, signature }) => 
    // eslint-disable-next-line security/detect-object-injection
    (0, crypto_1.createVerify)(JwtSignatureAlgorithms[alg])
        .update(jwsSigningInput)
        .verify(keyObject, signature, "base64"),
    verifySignatureAsync: async ({ alg, keyObject, jwsSigningInput, signature, }) => 
    // eslint-disable-next-line security/detect-object-injection
    (0, crypto_1.createVerify)(JwtSignatureAlgorithms[alg])
        .update(jwsSigningInput)
        .verify(keyObject, signature, "base64"),
    defaultFetchTimeouts: {
        socketIdle: 500,
        response: 1500,
    },
    setTimeoutUnref: (...args) => setTimeout(...args).unref(),
};
