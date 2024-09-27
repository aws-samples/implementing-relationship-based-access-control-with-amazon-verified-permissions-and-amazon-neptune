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

import logging
from typing import Optional, Union

import os
import boto3
import database
from classtype import Directory, Video
from util import debug_object

POLICY_STORE_ID = os.environ["POLICY_STORE_ID"]
avp = boto3.client("verifiedpermissions")

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def entity(entity_type: str, entity_id: Union[str, int]) -> set:
    return {"entityType": f"PetVideosApp::{entity_type}", "entityId": str(entity_id)}

def entity_set(entity_type: str, entity_ids: list):
    return [{"entityType": f"PetVideosApp::{entity_type}", "entityId": str(entity_id)} for entity_id in entity_ids]

def attributes(**kwargs):
    return {key: attribute_value(value) for key, value in kwargs.items()}

def attribute_value(value: any):
    if isinstance(value, str):
        return {"string": value}
    elif isinstance(value, bool):
        return {"boolean": value}
    elif isinstance(value, set) or isinstance(value, list):
        return {"set": [attribute_value(v) for v in value]}
    elif isinstance(value, dict):
        return {"entityIdentifier": value}
    else:
        raise ValueError(f"Unknown attribute value type: {type(value)}")
    
def permissions_check_token_directory(token: str, action: str, video_dir: Optional[Directory]) -> bool:
    action_entity = {"actionType": "PetVideosApp::Action", "actionId": action}
    resource_entity = entity("Application", "PetVideosApp")

    print(f"Checking permissions for {token} to {action} {video_dir}")
    args = {
        "policyStoreId": POLICY_STORE_ID,
        "identityToken": token,
        "action": action_entity,
        "resource": resource_entity,
    }

    if video_dir:
        list_entity = entity("Directory", video_dir.directory_id)
        resource_entity = list_entity
        parents_entity = entity_set("Directory", video_dir.parents_id)
        entities = {
            "entityList": [
                {
                    "identifier": list_entity,
                    "attributes": {
                        "owner": attribute_value(
                            entity_set("User", video_dir.owner_id)
                            ),
                        "isPublic": attribute_value(video_dir.isPublic)
                    },
                    "parents": parents_entity
                }
            ]
        }
        args["entities"] = entities
    
    args["resource"] = resource_entity

    debug_object(args)
    resp = avp.is_authorized_with_token(**args)
    print(f"Determining policies: {resp['determiningPolicies']}")
    print(resp["decision"])
    return {
            "decision": resp["decision"],
            "determining_policies": resp["determiningPolicies"]
        }

def permissions_check_token_video(token: str, action: str, video: Video) -> bool:
    action_entity = {"actionType": "PetVideosApp::Action", "actionId": action}
    resource_entity = entity("Application", "PetVideosApp")

    print(f"Checking permissions for {token} to {action} {video}")
    args = {
        "policyStoreId": POLICY_STORE_ID,
        "identityToken": token,
        "action": action_entity,
        "resource": resource_entity,
    }

    if video:
        list_entity = entity("Video", video.video_id)
        resource_entity = list_entity
        parents_entity = entity_set("Directory", video.parents_id)
        entities = {
            "entityList": [
                {
                    "identifier": list_entity,
                    "attributes": {
                        "owner": attribute_value(
                            entity_set("User", video.owner_id)
                            ),
                        "isPublic": attribute_value(video.isPublic)
                    },
                    "parents": parents_entity
                }
            ]
        }
        args["entities"] = entities

    args["resource"] = resource_entity

    debug_object(args)
    resp = avp.is_authorized_with_token(**args)
    print(f"Determining policies: {resp['determiningPolicies']}")
    print(resp["decision"])
    return {
            "decision": resp["decision"],
            "determining_policies": resp["determiningPolicies"]
        }