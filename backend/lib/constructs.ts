import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { Construct } from 'constructs';
import path = require('path');

export interface AppSyncConstructProps {
  customDomain?: cdk.aws_appsync.DomainOptions;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ApiConstruct extends Construct {
  public readonly appsync: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncConstructProps) {
    super(scope, id);

    const { customDomain: domainName, userPool, userPoolClient } = props;

    // Create an AppSync GraphQL API

  }
}
