import { AppSyncRequestIAM } from './appsync';
import { MessageSystemStatus } from './types';

const GRAPHQL_URL = process.env.GRAPHQL_URL || '';
const REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Sends a chunk to the all subscribers of the conversation providing the conversation's status, the chunk's order, type, and content.
 */
const sendMessageChunkMutation = `mutation Mutation($userId: ID!, $conversationId: ID!, $status: ConversationStatus!, $chunkType: String!, $chunk: String!) {
  systemSendMessageChunk(input: {userId: $userId, conversationId: $conversationId, status: $status, chunkType: $chunkType, chunk: $chunk}) {
        status
        userId
        conversationId
        chunkType
        chunk
  }
}`;

/**
 * A helper function for sending a request to AppSync.
 * @param query {string} - The GraphQL query
 * @param variables {object} - The GraphQL variables { [key: string]: string
 * @returns {Promise<any>}
 */
async function sendRequest(
  query: string,
  variables: { [key: string]: any }
): Promise<any> {
  if (!GRAPHQL_URL) {
    throw new Error('GRAPHQL_URL is missing. Aborting operation.');
  }

  return await AppSyncRequestIAM({
    config: {
      url: GRAPHQL_URL,
      region: REGION
    },
    operation: { query, operationName: 'Mutation', variables }
  });
}

export async function sendChunk({
  userId,
  conversationId,
  status,
  chunkType,
  chunk
}: {
  userId: string;
  conversationId: string;
  status?: MessageSystemStatus;
  chunkType?: 'text' | 'audio' | 'image' | 'error' | 'status';
  chunk?: string;
}) {
  status = status || MessageSystemStatus.PROCESSING;
  chunkType = chunkType || 'text';
  chunk = chunk || '';

  return (await sendRequest(sendMessageChunkMutation, {
    userId,
    conversationId,
    status,
    chunkType,
    chunk
  })) as { errors?: any[]; data?: any };
}
