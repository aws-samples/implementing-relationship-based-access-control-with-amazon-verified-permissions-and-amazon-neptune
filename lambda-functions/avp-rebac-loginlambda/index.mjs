/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import https from 'https';
import querystring from 'querystring';
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Access environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;
const USER_POOL_ID = process.env.USER_POOL_ID;

function exchangeCodeForTokens(code) {
    return new Promise((resolve, reject) => {
        const postData = querystring.stringify({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const options = {
            hostname: COGNITO_DOMAIN,
            port: 443,
            path: '/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Error: ${res.statusCode} ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: "access",
  clientId: CLIENT_ID
});

export const handler = async (event) => {
    if (event.queryStringParameters && event.queryStringParameters.code) {
        const authCode = event.queryStringParameters.code;
        let htmlContent;

        try {
            const tokenResponse = await exchangeCodeForTokens(authCode);
            const accessToken = tokenResponse.access_token;
            const idToken = tokenResponse.id_token;
            
            const payload = await verifier.verify(accessToken);
            const username = payload.username;

            htmlContent = `
                <html>
                <head>
                    <title>PetVideosApp</title>
                    <style>
                        .token-container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            margin: 20px;
                        }
                        .token-box {
                            border: 1px solid #ccc;
                            padding: 10px;
                            width: 60%;
                            word-wrap: break-word;
                            background-color: #f9f9f9;
                            margin-bottom: 20px;
                        }
                        textarea {
                            width: 100%;
                            height: 200px;
                        }
                        h1, h3 {
                            text-align: center;
                        }
                        .logout-button {
                            display: block;
                            margin: 20px auto;
                            padding: 10px 20px;
                            background-color: #F44336;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        }
                    </style>
                </head>
                <body>
                    <h1>Tokens for ${username}</h1>
                    <div class="token-container">
                        <div class="token-box">
                            <h3>Access Token</h3>
                            <textarea readonly>${accessToken}</textarea>
                        </div>
                        <div class="token-box">
                            <h3>ID Token</h3>
                            <textarea readonly>${idToken}</textarea>
                        </div>
                        <button class="logout-button" onclick="logout()">Logout</button>
                    </div>
                    <script>
                        function logout() {
                            window.location.href = 'https://${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${REDIRECT_URI}';
                        }
                    </script>
                </body>
                </html>
            `;
        } catch (error) {
            console.error('Error exchanging code for tokens:', error);
            htmlContent = `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`;
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html'
            },
            body: htmlContent
        };
    } else {
        const authUrl = `https://${COGNITO_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid+PetVideosAppResourceServer/PetVideosAppApi`;

        return {
            statusCode: 302,
            headers: {
                Location: authUrl
            },
            body: null
        };
    }
};