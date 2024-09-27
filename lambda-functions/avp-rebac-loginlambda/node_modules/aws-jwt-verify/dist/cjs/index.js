"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoJwtVerifier = exports.JwtRsaVerifier = void 0;
var jwt_rsa_js_1 = require("./jwt-rsa.js");
Object.defineProperty(exports, "JwtRsaVerifier", { enumerable: true, get: function () { return jwt_rsa_js_1.JwtRsaVerifier; } });
var cognito_verifier_js_1 = require("./cognito-verifier.js");
Object.defineProperty(exports, "CognitoJwtVerifier", { enumerable: true, get: function () { return cognito_verifier_js_1.CognitoJwtVerifier; } });
