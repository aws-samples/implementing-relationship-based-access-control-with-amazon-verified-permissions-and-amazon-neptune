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

from __future__ import print_function
import os, uuid
from classtype import Directory, Video, User
from gremlin_python import statics
from gremlin_python.structure.graph import Graph
from gremlin_python.process.graph_traversal import __
from gremlin_python.process.strategies import *
from gremlin_python.process.traversal import Cardinality
from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection

neptune_endpoint = os.environ['NEPTUNE_ENDPOINT']
neptune_port = os.environ['NEPTUNE_PORT']

# Connecting to Amazon Neptune
remote_connection = DriverRemoteConnection('wss://' + neptune_endpoint + ':' + neptune_port + '/gremlin', 'g')
graph = Graph()
g = graph.traversal().withRemote(remote_connection)

directory_id = str(uuid.uuid4())
video_id = str(uuid.uuid4())

def query_user_info(user_name: str):
    user_id = g.V().hasLabel('user').has('name', user_name).values('userId').next()
    user_vertex = g.V().hasLabel('user').has('userId', user_id).has('name', user_name).next()
    return User(user_id, user_name, user_vertex)
        
def query_directory_info(directory_name: str):
    directoryExists = g.V().hasLabel('directory').has('name', directory_name).toList()
    if not directoryExists:
        return None
    else:
        directory_id = g.V().hasLabel('directory').has('name', directory_name).values('directoryId').next()
        directory_vertex = g.V().hasLabel('directory').has('directoryId', directory_id).has('name', directory_name).next()
        owner_id = g.V().hasLabel('directory').has('directoryId',directory_id).union(__.in_('OWNER'),__.repeat(__.out('MEMBEROF')).until(__.has('name', 'petVideosDirectory')).in_('OWNER')).dedup().values('userId').toList()
        owner_name = g.V().hasLabel('directory').has('directoryId',directory_id).union(__.in_('OWNER'),__.repeat(__.out('MEMBEROF')).until(__.has('name', 'petVideosDirectory')).in_('OWNER')).dedup().values('name').toList()
        parents_id = g.V().hasLabel('directory').has('directoryId',directory_id).union(__.out('MEMBEROF'),__.repeat(__.out('MEMBEROF')).until(__.has('name', 'petVideosDirectory'))).dedup().values('directoryId').toList()
        isPublic = g.V().hasLabel('directory').has('directoryId', directory_id).has('name', directory_name).values('isPublic').next()
        return Directory(directory_id, directory_name, directory_vertex, owner_id, owner_name, parents_id, isPublic)
        
def query_video_info(video_name: str):
    videoExists = g.V().hasLabel('video').has('name', video_name).toList()
    if not videoExists:
        return None
    else:
        video_id = g.V().hasLabel('video').has('name', video_name).values('videoId').next()
        video_vertex = g.V().hasLabel('video').has('videoId', video_id).has('name', video_name).next()
        owner_id = g.V().hasLabel('video').has('videoId',video_id).union(__.in_('OWNER'),__.repeat(__.out('MEMBEROF')).until(__.has('name', 'petVideosDirectory')).in_('OWNER')).dedup().values('userId').toList()
        owner_name = g.V().hasLabel('video').has('videoId',video_id).union(__.in_('OWNER'),__.repeat(__.out('MEMBEROF')).until(__.has('name', 'petVideosDirectory')).in_('OWNER')).dedup().values('name').toList()
        parents_id = g.V().hasLabel('video').has('videoId',video_id).union(__.out('MEMBEROF'),__.repeat(__.out('MEMBEROF')).until(__.has('name', 'petVideosDirectory'))).dedup().values('directoryId').toList()
        isPublic = g.V().hasLabel('video').has('videoId', video_id).has('name', video_name).values('isPublic').next()
        return Video(video_id, video_name, video_vertex, owner_id, owner_name, parents_id, isPublic)
        
def get_directory(directory_name: str):
    directoryInfo = query_directory_info(directory_name)
    return directoryInfo
    
def get_video(video_name:str):
    videoInfo = query_video_info(video_name)
    return videoInfo