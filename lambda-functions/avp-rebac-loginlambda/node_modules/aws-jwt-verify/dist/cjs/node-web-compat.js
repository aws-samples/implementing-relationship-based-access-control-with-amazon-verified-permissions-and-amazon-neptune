"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
//
// To make this library work in both Node.js and Web, some functions require specific code,
// e.g. in Node.js we can use the "crypto" module, whereas in Web we need to use SubtleCrypto.
// This file contains an interface that the specific Node.js and Web implementations must implement.
//
// At runtime, either the Node.js or Web implementation is actually loaded. This works because the
// package.json specifies "#node-web-compat" as a subpath import, with conditions pointing to the right implementation (for Node.js or Web)
Object.defineProperty(exports, "__esModule", { value: true });
