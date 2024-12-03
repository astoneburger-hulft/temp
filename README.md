# Bedrock Realtime chat App

The project is divided in two parts, backend and frontend

## Backend

It is a CDK Project written in typescript that uses AppSync/Cognito/Bedrock/Lambda

## Frontend

A react project that interacts with the backend using GraphQL

## Deployment

```
# To deploy, run in the backend folder
npm i
npm run deploy
# It will output three variables, that need to be written on the Frontend in the file App.tsx
# To run the frontend run in that folder
npm i
npm run dev
```