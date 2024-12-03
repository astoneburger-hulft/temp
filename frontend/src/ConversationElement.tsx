import { useState, useEffect } from "react";
import {
  Button,
  Text,
  TextField,
  Flex,
  View,
  Divider,
  ScrollView,
  Loader,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { generateClient } from 'aws-amplify/data';
import { createMessageAsync } from './graphql/mutations';
import { getConversation } from './graphql/queries';
import { recieveMessageChunkAsync } from "./graphql/subscriptions";
/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */

const client = generateClient({
  authMode: "userPool",
});

type ChatMessage = {
  sender: string;
  message: string;
  createdAt?: string;
};

export default function ConversationElement({conversationId, prompt }: {
    conversationId: string,
    prompt: string
}) {
  const initialMessage: ChatMessage = {sender: "User", message: prompt, createdAt: new Date().toISOString()};
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage>({
    sender: 'Assistant',
    message: ''
  });
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  

   /**
   * Creates a subscription to recieve messages from the chatbot.
   * @returns
   */
   const createSubscription = () => {
    // Create subscription function
    let count = 0;
    let currentMessage : any = {};
    return client
      .graphql({
        query: recieveMessageChunkAsync,
        variables: { input: { conversationId } }
      })
      .subscribe({
        next: ({ data }) => {
          const response = data?.recieveMessageChunkAsync;

          if (response) {
            if (response.chunkType === 'text') {
              console.log("Received response chunk ", count++);
              setLastMessage((prevMessage: any) => {
                if (prevMessage) {
                  currentMessage = {
                    ...prevMessage,
                    message: (response.chunk || ''),
                  };
                } else {
                    currentMessage = {
                    sender: 'Assistant',
                    message: response.chunk || '',
                    createdAt: new Date().toISOString()
                  };
                }
                return currentMessage;
              });
              
            }

            // Error chunk
            if (response.chunkType === 'error') {
              // addAlert(response.chunk, 'error');
              setLoading(false);
            }

            if (response.chunkType === 'status' && response.status === 'COMPLETE') {
              setLoading(false);
              console.log("Received final response chunk", currentMessage);
              count = 0;
              currentMessage = {};
              // setConversation({...conversation, messages: [...(conversation.messages || []), currentMessage]});
              // setLastMessage({});
            }
          }
        },
        error: (error) => {
          console.error(error);
          // addAlert(error?.message ?? 'Something went wrong!', 'warning');
        }
      });
  };


  useEffect(() => {
    if (!conversationId) return;
    setLastMessage({sender: 'Assistant', message: ''});
    getConversationData();
    console.log("Subscription receiveMessageChunkAsync: subscribed to conversation ID ", conversationId);
    const subscription = createSubscription();
    return () => subscription.unsubscribe();
  }, [conversationId]);

  // Once loaded, append lastMessage and clear lastMessage
  useEffect(() => { 
    if (lastMessage && lastMessage.message) {
      setMessages([...messages, {...lastMessage}]);
      setLastMessage({sender: 'Assistant', message: ''});
    }

  }, [loading]);



  async function sendMessage(event: any) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.target as HTMLFormElement);
    let userPrompt =form.get("prompt") as string;
    let msgs = [...messages];
    if (lastMessage && lastMessage.message) {
      msgs.push({...lastMessage});
      setLastMessage({sender: 'Assistant', message: ''});
    }
    msgs.push({
      sender: "User",
      message: userPrompt,
      createdAt: new Date().toISOString()});
    setMessages(msgs);
    
    await client.graphql({
      query: createMessageAsync,
      variables: {
        input: {
          conversationId,
          prompt: userPrompt,
    }}});
    console.log("Mutation createMessageAsync: Sending prompt '" + userPrompt + "' on conversation ID " + conversationId);

    event.target.reset();
  }

  async function getConversationData( ) {
    let val = await client.graphql({
      query: getConversation,
      variables: {
        input: {
          conversationId
        },
    }});
    console.log("Query getConversations: input variable conversation id set to", conversationId, val.data.getConversation);
    let data = val.data.getConversation!.messages;
    setMessages( data?.length ? (val.data.getConversation!.messages as ChatMessage[]) : [initialMessage]);
  }

   

  return (

          <View as="form" onSubmit={sendMessage}>
            <ScrollView width="100%" height="600px" maxWidth="1080px">
              {messages && (
                <View>

                  {messages.map((message, index) => (
                    index >= 0 && (
                    <Flex key={index} direction="row" alignItems="center" margin="1rem 0">
                      <Text>{message.sender}</Text>
                      <Text>{message.message}</Text>
                    </Flex>)
                  ))}
                  {lastMessage && lastMessage.message && (
                  <Flex>
                  <Text>{lastMessage.sender}:</Text>
                  <Text>{lastMessage.message}</Text>
                  </Flex>
                  )}
                </View>
              )}

            <Divider />
              
              </ScrollView>
              {loading &&
            <Loader></Loader>
            }
              <TextField
                name="prompt"
                placeholder="Ask me a question"
                label="Note Name"
                labelHidden
                variation="quiet"
                required
              />
              
              <Button disabled={loading} type="submit" variation="primary">
              Submit
            </Button>
            
          </View>
          
        
  );
}
