import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda';
import { updateConversationStatus, addMessage} from './dynamodb';
import { processSingleEvent } from './logic';
import { MessageSystemStatus } from './types';

const {
    TABLE_NAME = '',
  } = process.env;


export async function handler(
  event: AppSyncResolverEvent<{
    input: { prompt: string; conversationId: string; includeAudio: boolean };
  }>,
  context: any,
) {
  console.log("Received event", JSON.stringify(event, null, 2));
  console.log("Received context", JSON.stringify(context, null, 2));
  const {
    identity,
    prev,
    arguments: {
      input: { prompt, includeAudio }
    }
  } = event;

  // Condition 1: User is authenticated. If not, throw an error.
  if (!(identity as AppSyncIdentityCognito)?.sub) {
    throw new Error('Missing identity');
  }
  const id = (identity as AppSyncIdentityCognito).sub;

  // Condition 2: The conversation is not currently processing. If it is, throw an error.
  if (
    !id ||
    (prev?.result?.status &&
      [MessageSystemStatus.PENDING, MessageSystemStatus.PROCESSING].includes(
        prev.result.status
      ))
  ) {
    throw new Error('Conversation is currently processing');
  }

  // Condition 3: The conversation ID is missing.
  let conversationId = prev?.result?.sk;
  if (!conversationId) throw new Error('That conversation does not exist');
  conversationId = conversationId.split('#')[1];

  try {
    // Inserts the user's request into the queue, and peforms the DynamoDB update in parallel.
    await Promise.all([
      updateConversationStatus({
        userId: id,
        conversationId,
        status: MessageSystemStatus.PENDING,
        tableName: TABLE_NAME
      }),
      processSingleEvent({
        userId: id,
        conversationId: conversationId,
        history: prev?.result.messages || [],
        query: prompt,
        eventTimeout: context.getRemainingTimeInMillis(),
      })
    ]);

    return {
      message: {
        sender: 'User',
        message: prompt,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error('An error occurred');
  }
}