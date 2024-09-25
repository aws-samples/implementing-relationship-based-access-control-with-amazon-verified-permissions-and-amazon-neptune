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

import os, logging, boto3, uuid
from gremlin_python import statics
from gremlin_python.structure.graph import Graph
from gremlin_python.process.graph_traversal import __
from gremlin_python.process.strategies import *
from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection

logger = logging.getLogger(__name__)

# Generate directory IDs
petVideosDir_id = str(uuid.uuid4())
aliceVideosDir_id = str(uuid.uuid4())
bobVideosDir_id = str(uuid.uuid4())

# Generate video IDs
aliceCatVideo_id = str(uuid.uuid4())
bobDogVideo_id = str(uuid.uuid4())

user_pool_id = os.environ['USER_POOL_ID']
neptune_endpoint = os.environ['NEPTUNE_ENDPOINT']
neptune_port = os.environ['NEPTUNE_PORT']
policy_store_id = os.environ['POLICY_STORE_ID']

def handler(event, context):
    verifiedpermissions = boto3.client('verifiedpermissions')
    try:
        # Creating Cognito users "Alice", "Bob" and "Charlie"
        alice_id = create_cognito_user('alice', user_pool_id)
        bob_id = create_cognito_user('bob', user_pool_id)
        charlie_id = create_cognito_user('charlie', user_pool_id)

        # Connecting to Amazon Neptune
        remote_connection = DriverRemoteConnection('wss://' + neptune_endpoint + ':' + neptune_port + '/gremlin', 'g')
        graph = Graph()
        g = graph.traversal().withRemote(remote_connection)
        g.V().drop().iterate()
        
        # Adding user vertices
        alice_vertex = g.addV('user').property('name', 'alice').property('userId', alice_id).next()
        bob_vertex = g.addV('user').property('name', 'bob').property('userId', bob_id).next()
        charlie_vertex = g.addV('user').property('name', 'charlie').property('userId', charlie_id).next()

        # Adding directory vertices
        aliceVideosDir_vertex = g.addV('directory').property('name', 'aliceVideosDirectory').property('directoryId', aliceVideosDir_id).property('ownerId', alice_id).property('ownerName', 'alice').property('isPublic', False).next()
        bobVideosDir_vertex = g.addV('directory').property('name', 'bobVideosDirectory').property('directoryId', bobVideosDir_id).property('ownerId', bob_id).property('ownerName', 'bob').property('isPublic', False).next()
        petVideosDir_vertex = g.addV('directory').property('name', 'petVideosDirectory').property('directoryId', petVideosDir_id).property('ownerId', charlie_id).property('ownerName', 'charlie').property('isPublic', False).next()

        # Adding video vertices
        aliceCatVideo_vertex = g.addV('video').property('name', 'aliceCatVideo.mp4').property('videoId', aliceCatVideo_id).property('ownerId', alice_id).property('ownerName', 'alice').property('isPublic', False).next()
        bobDogVideo_vertex = g.addV('video').property('name', 'bobDogVideo.mp4').property('videoId', bobDogVideo_id).property('ownerId', bob_id).property('ownerName', 'bob').property('isPublic', False).next()
            
        # Adding edges
        g.V(charlie_vertex).addE('OWNER').to(petVideosDir_vertex).iterate()
        g.V(aliceVideosDir_vertex).addE('MEMBEROF').to(petVideosDir_vertex).iterate()
        g.V(bobVideosDir_vertex).addE('MEMBEROF').to(petVideosDir_vertex).iterate()
        g.V(alice_vertex).addE('OWNER').to(aliceVideosDir_vertex).iterate()
        g.V(aliceCatVideo_vertex).addE('MEMBEROF').to(aliceVideosDir_vertex).iterate()
        g.V(bob_vertex).addE('OWNER').to(bobVideosDir_vertex).iterate()        
        g.V(bobDogVideo_vertex).addE('MEMBEROF').to(bobVideosDir_vertex).iterate()
        g.V(alice_vertex).addE('OWNER').to(aliceCatVideo_vertex).iterate()
        g.V(bob_vertex).addE('OWNER').to(bobDogVideo_vertex).iterate()

        # Close the connection
        remote_connection.close()

        # Create Cedar policies in Verified Permissions policy store
        response = verifiedpermissions.create_policy(
            policyStoreId = policy_store_id,
            definition = {
                'static': {
                    'description': 'Resource owner and related persons can access the resources',
                    'statement': f"permit( principal, action in [PetVideosApp::Action::\"OwnerActions\"], resource in PetVideosApp::Directory::\"{petVideosDir_id}\") when {{ resource has owner && principal in resource.owner }};"
                }
            }
        )
        response = verifiedpermissions.create_policy(
            policyStoreId = policy_store_id,
            definition = {
                'static': {
                    'description': 'Allow public access to the resources',
                    'statement': f"permit( principal, action in [PetVideosApp::Action::\"PublicActions\"], resource in PetVideosApp::Directory::\"{petVideosDir_id}\") when {{ resource has isPublic && resource.isPublic == true }};"
                }
            }
        )
        print("The solution is successfully bootstrapped.")
    except Exception as e:
        logger.error(f"An error occurred while bootstrapping the solution: {str(e)}")
        raise
    
def create_cognito_user(username, user_pool_id):
    cognito_idp = boto3.client('cognito-idp')
    try:
        response = cognito_idp.admin_create_user(
            UserPoolId=user_pool_id,
            Username=username,
            TemporaryPassword='TempPassword123!',
            MessageAction='SUPPRESS'
        )
        # Extract the "sub" attribute from the response
        sub = next(attr['Value'] for attr in response['User']['Attributes'] if attr['Name'] == 'sub')
        avp_username_id = f"{user_pool_id}|{sub}"
    except Exception as e:
        print(f"Error creating user {username}: {str(e)}")

    try:
        response = cognito_idp.admin_set_user_password(
            UserPoolId=user_pool_id,
            Username=username,
            Password='Password123!',
            Permanent=True
        )
    except Exception as e:
        print(f"Error setting permanent password for user {username}: {str(e)}")
    return avp_username_id