import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { MessageSystemStatus } from './types';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import * as AWSXRay from 'aws-xray-sdk';

const dynamodbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient());

export async function updateConversationStatus({
  userId,
  conversationId,
  status,
  tableName
}: {
  userId: string;
  conversationId: string;
  status: MessageSystemStatus;
  tableName: string;
}) {
  return await dynamodbClient.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: { pk: { S: `USER#${userId}` }, sk: { S: `CONVERSATION#${conversationId}` } },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': { S: status }
      }
    })
  );
}

export async function addMessage({
  id,
  conversationId,
  message,
  sender,
  tableName
}: {
  id: string;
  conversationId: string;
  message: string;
  sender: string;
  tableName: string;
}) {
  await dynamodbClient.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: { pk: { S: `USER#${id}` }, sk: { S: `CONVERSATION#${conversationId}` } },
      UpdateExpression:
        'SET #messages = list_append(if_not_exists(#messages, :empty_list), :messages)',
      ExpressionAttributeNames: {
        '#messages': 'messages'
      },
      ExpressionAttributeValues: {
        ':messages': {
          L: [
            {
              M: {
                sender: { S: sender },
                message: { S: message },
                createdAt: { S: new Date().toISOString() }
              }
            }
          ]
        },
        ':empty_list': { L: [] }
      }
    })
  );
}
