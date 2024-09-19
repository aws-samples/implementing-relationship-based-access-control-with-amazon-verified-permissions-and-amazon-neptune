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

from jose import JWTError
import json
import jwt
import os

import database
import permissions
from util import debug_object

Response = object

ACTIONS = {
    # Directory
    ("/directory/get", "GET"): "ViewDirectory",
    # Video
    ("/video/get", "GET"): "ViewVideo",
}

def handler(event, context) -> Response:
    debug_object(event)
    debug_object(context)

    # Check if the environment variables are set
    if (
        not os.environ.get("POLICY_STORE_ID")
    ):
        print("API Lambda environment variables not set")
        return format_response(
            {
                "message": "API Lambda environment variables not set. Please set POLICY_STORE_ID."
            },
            500,
        )

    # Get the information about the requested action
    resource = event["resource"]
    method = event["httpMethod"]
    action = ACTIONS.get((resource, method), "Unknown")
    if action == "Unknown":
        return format_response({"message": "Unknown API call"}, 404)

    # Get the information about the principal from the JWT token
    access_token = event["headers"]["Authorization"].split(" ")[1]
    try:
        jwt_claims = jwt.decode(access_token, options={"verify_signature": False})
        user_pool_id = jwt_claims["iss"].split("/")[-1]
        principal = "{}|{}".format(user_pool_id, jwt_claims["sub"])
    except JWTError as e:
        debug_object(e)
        return format_response({"message": "Access denied -- token broken"}, 401)

    # Variables that exist only on some requests
    user = None
    directory_name = None
    video_name = None
    if event["body"]:
        body = json.loads(event["body"])
        directory_name = body["directoryName"] if "directoryName" in body else None
        video_name = body["videoName"] if "videoName" in body else None
    elif event["queryStringParameters"]:
        directory_name = str(event["queryStringParameters"]["directoryName"]) if "directoryName" in event["queryStringParameters"] else None
        video_name = str(event["queryStringParameters"]["videoName"]) if "videoName" in event["queryStringParameters"] else None
        
    # Check if the directory and video exists
    if directory_name:
        if database.query_directory_info(directory_name) is None:
            return format_response({"message": "Invalid input -- directory doesn't exist"}, 400)
    elif video_name:
        if database.query_video_info(video_name) is None:
            return format_response({"message": "Invalid input -- video doesn't exist"}, 400)

    id_token = event.get("headers", {}).get("id-token")
    if not id_token:
        return format_response({"message": "Access denied -- no identity token provided"}, 401)
    try:
        if directory_name:
            video_dir = database.query_directory_info(directory_name)
        elif video_name:
            video = database.query_video_info(video_name)
    except JWTError as e:
        debug_object(e)
        return format_response({"message": "Access denied -- token broken"}, 401)

    if action == "ViewDirectory":
        try:
            response = permissions.permissions_check_token_directory(id_token, action, video_dir)
            if response["decision"] == "ALLOW":
                determining_policies = response["determining_policies"][0]["policyId"]
                return format_response({"message": f"Access allowed -- determining policy id is {determining_policies}"})
            else:
                return format_response({"message": "Access denied -- permissions check failed"}, 401)
        except Exception as e:
            return format_response({"message": f"Access denied -- permissions check failed - {str(e)}"}, 401)
    
    elif action == "ViewVideo":
        try:
            response = permissions.permissions_check_token_video(id_token, action, video)
            if response["decision"] == "ALLOW":
                determining_policies = response["determining_policies"][0]["policyId"]
                return format_response({"message": f"Access allowed -- determining policy id is {determining_policies}"})
            else:
                return format_response({"message": "Access denied -- permissions check failed"}, 401)
        except Exception as e:
            return format_response({"message": f"Access denied -- permissions check failed - {str(e)}"}, 401)
    
def get_directory(directory_name: int) -> Response:
    return format_response({"directory": database.get_directory(directory_name)})

def get_video(video_name:str) -> Response:
    return format_response({"video": database.get_video(video_name)})
   
def format_response(body: object, status_code=200) -> object:
    result = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body, default=lambda o: o.__dict__),
    }
    debug_object(result)
    return result