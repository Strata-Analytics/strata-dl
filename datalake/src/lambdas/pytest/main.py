import boto3
from aws_lambda_powertools.utilities.data_classes import S3Event
import pandas as pd
import paramiko

client = paramiko.SSHClient()

def handler(event, _):
    event = S3Event(event)
    s3 = boto3.client('s3')
    print(pd)
    print(client)
    print('IN PY')
    return {
        "statusCode":200,
        "message":"from py"
    }
