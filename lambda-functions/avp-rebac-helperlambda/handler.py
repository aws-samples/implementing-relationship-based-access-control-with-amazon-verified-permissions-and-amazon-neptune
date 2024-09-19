# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import boto3
from crhelper import CfnResource

helper = CfnResource()


@helper.create
def create(event, _):
    client_id = event["ResourceProperties"]["ClientID"]
    user_pool_id = event["ResourceProperties"]["cupid"]
    login_url = event["ResourceProperties"]["LoginURL"]
    lambda_name = event["ResourceProperties"]["LambdaName"]
    cup_client_id = event["ResourceProperties"]["CUP_CLIENT_ID"]
    cup_client_secret = event["ResourceProperties"]["CUP_CLIENT_SECRET"]
    cup_domain = event["ResourceProperties"]["CUP_DOMAIN"]
    cognito_client = boto3.client("cognito-idp")
    lambda_client = boto3.client("lambda")
    
    # Update user pool client
    params = {
        "ClientId": client_id,
        "UserPoolId": user_pool_id,
        "CallbackURLs": [login_url],
        "LogoutURLs": [login_url],
        "AllowedOAuthFlows": ["code"],
        "AllowedOAuthScopes": ["openid", "email", "profile", "PetVideosAppResourceServer/PetVideosAppApi"],
        "ExplicitAuthFlows": ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"],
        "SupportedIdentityProviders": ["COGNITO"],
        "AllowedOAuthFlowsUserPoolClient": True,
    }
    try:
        cognito_client.update_user_pool_client(**params)
    except Exception as e:
        print(e)
        raise e

    # Update Lambda function configuration
    params = {
        "FunctionName": lambda_name,
        "Environment": {
            "Variables": {
                "CLIENT_ID": cup_client_id,
                "CLIENT_SECRET": cup_client_secret,
                "COGNITO_DOMAIN": cup_domain,
                "REDIRECT_URI": login_url,
                "USER_POOL_ID": user_pool_id
            }
        },
    }
    try:
        lambda_client.update_function_configuration(**params)
    except Exception as e:
        print(e)
        raise e

    # Send success response
    helper.Data["Result"] = "Success"

@helper.update
@helper.delete
def no_op(_, __):
    return "Success"

def lambda_handler(event, context):
    print("Received event: " + str(event))
    print("Received context: " + str(context))
    helper(event, context)
