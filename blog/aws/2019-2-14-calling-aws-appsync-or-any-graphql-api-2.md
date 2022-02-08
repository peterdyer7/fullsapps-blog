---
slug: calling-aws-appsync-or-any-graphql-api-2
title: Calling AWS AppSync, or any GraphQL API, from AWS Lambda, part 1
authors: peter
tags: [AWS Amplify, AWS AppSync, AWS Cognito, AWS Lambda]
---

In this post we are going to rewrite the Function we created in [part 1](calling-aws-appsync-or-any-graphql-api) but in this post our API will use AWS Cognito for authentication (as opposed to an api key). Our scenario is the same as part 1 and we will use the same GraphQL client (graphql-request).

<!--truncate-->

## API

I am going to create a new API for this post. I am going to follow the exact same steps as I did in part 1, or maybe I should just say I'm going to bootstrap a React app with create-react-app and run amplify init, amplify add auth, amplify add api and amplify push (that gets us to where I want to start). The one difference from the previous post is that I am selecting Cognito as the API authorization mechanism (this is the third step after running amplify add api - Choose an authorization type for the API - Amazon Cognito User Pool). If you are following the post I referenced in part 1, note that you no longer have to upgrade to the next version of React as React 16.8 has shipped and Hooks are readily available in React.

Once we have done all of that, we need to create a user in Cognito. To do that I'm going to leverage the withAuthenticator higher-order component made available by the amplify react library. I've updated my App component accordingly (see below). I have run the application, created and verified a new user, and logged into the application with that user.

```jsx title="App.js"
import React, { Component } from 'react';
import Amplify from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';

import awsconfig from './aws-exports';
import logo from './logo.svg';
import './App.css';

Amplify.configure(awsconfig);

class App extends Component {
  render() {
    return (
      <div className='App'>
        <header className='App-header'>
          <img src={logo} className='App-logo' alt='logo' />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a className='App-link' href='https://reactjs.org' target='_blank' rel='noopener noreferrer'>
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default withAuthenticator(App, true);
```

The last thing we should add is a little data to use in testing. I could enhance the UI to allow us to add some data (we did exactly that in another post) but instead I am simply going to add the data in the AppSync console. On the Queries tab I can login with our newly created user and run queries and mutations.

I am running the following mutation to add data:

```graphql
mutation {
  createTodo(input: { name: "todo one", description: "description of a todo" }) {
    id
    name
    description
  }
}
```

Then, just to confirm the data was added, I am running the following query:

```graphql
query {
  listTodos {
    items {
      id
      name
      description
    }
  }
}
```

## The Challenge

Now that we have created an API that uses Cognito for authentication, all of our API requests must be made by a user who not only exists in Cognito but has authenticated to Cognito. When we interact with the GUI this follows a natural pattern. We have implemented login (via the withAuthenticator HOC) and the GraphQL client we use takes care of including our authentication details (after we configure it) when we make requests to the back-end.

Similarly, if we want to execute a GraphQL operation from a Lambda function we need to be authenticated for the request to succeed. This means we need to implement authentication in our Lambda function.

I have intentionally included "any GraphQL API" is the title of this post. Bare in mind, the solutions that follow are very specific to AWS Cognito but the mechanism for including credentials in a GraphQL request and executing the request itself are still broadly applicable.

I have to admit that I'm not 100% sure of the "best" way to accomplish this task. I have identified two options and both work. I am going to include both solutions in this post.

Solution #1, uses the Amazon Cognito Identity SDK for JavaScript as outlined here: https://github.com/aws-amplify/amplify-js/tree/master/packages/amazon-cognito-identity-js.

Solution #2, uses the Cognito Identity Service Provider and the adminInitiateAuth function as outlined here: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminInitiateAuth-property.

In order to code the functions in either solution we need to have some data handy:

- Username and Password of the Cognito user we created above
- UserPoolId for the Cognito User Pool created for us by Amplify when we added auth to the Amplify project (see aws-exports or AWS console)
- ClientId - I am using the same app client as our React project (see aws-exports or AWS console)
- GraphQL endpoint for the AppSync API (see aws-exports or AWS console)

## Solution #1

This option follows a very similar pattern to what our GUI is using to authenticate GraphQL requests. To use it we will need to import additional dependencies. To that end, I have installed amazon-cognito-identity-js (npm install --save amazon-cognito-identity-js) in the empty node project I used to build the Layer that I am including in the Lambda function from part 1 (see part 1 for details on Layers). Note, that this library does add a number of its dependencies. I've uploaded a new zip and created a version 2 of the Layer we created in part 1.

I have found that this function takes a while to execute. I have increased the default timeout to 10 seconds (that's in the bottom half of the Lambda function page under the heading Basic settings).

Note that I have created both a query and mutation that can be executed by choosing which one to comment out at the end of the function.

With all of that done, this is what my final function(s) look like:

```js
global.fetch = require('node-fetch');
const AWS = require('aws-sdk/global');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const { GraphQLClient } = require('graphql-request');

function authUser() {
  return new Promise((resolve, reject) => {
    const authenticationData = {
      Username: 'notarealuser',
      Password: 'notarealpasword',
    };
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    const poolData = {
      UserPoolId: 'notarealuserpoolid',
      ClientId: 'notarealclient',
    };
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const userData = {
      Username: authenticationData.Username,
      Pool: userPool,
    };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        const accessToken = result.getAccessToken().getJwtToken();
        // const idToken = result.idToken.jwtToken;
        resolve(accessToken);
      },
      onFailure: function (err) {
        reject(err.message);
      },
    });
  });
}

function listTodos(graphQLClient) {
  const query = `
        query {
          listTodos {
            items {
              id
              name
              description
            }
          }
        }
    `;
  return graphQLClient.request(query);
}

function addTodo(graphQLClient) {
  const mutation = `
        mutation CreateTodo($input:CreateTodoInput!) {
          createTodo(input:$input) {
            id
            name
            description
          }
        }
    `;
  const variables = `
        {
        "input": {
            "name": "todo from Lambda",
            "description": "New Todo created in a Lambda function"
          }
        }
    `;

  return graphQLClient.request(mutation, variables);
}

exports.handler = async (event) => {
  const result = await authUser();

  if (result.errorMessage) {
    return result;
  }

  const endpoint = 'https://notarealendpoint.amazonaws.com/graphql';

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      Authorization: result,
    },
  });

  return await listTodos(graphQLClient);
  // return await addTodo(graphQLClient);
};
```

## Solution #2

This option only requires the use of aws-sdk which is available to us in Lambda without needing to import any additional dependencies. To that end I will continue using the Layer we created in the part 1.

It does require we execute our Lambda function via a role that has a significant level of permissions. I have adjusted the Execute role accordingly (that's in the bottom half of the Lambda function page under the heading Basic settings).

This function also requires an update to Cognito App client we are using in order to support server-based authentication (alternatively, you could create a new App client following the other settings of the clientWeb). You can make this update in the Cognito console in AWS under General settings, App clients, select the client that ends with 'clientWeb' and check on 'Enable sign-in API for server-based-authentication', and save the app client.

With all of that done, this is what my final function(s) look like (only the authUser function differs from Solution #1):

```js
const { GraphQLClient } = require('graphql-request');
const AWS = require('aws-sdk');

function authUser() {
  return new Promise((resolve, reject) => {
    const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
    cognitoidentityserviceprovider.adminInitiateAuth(
      {
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        ClientId: 'notarealclientid',
        UserPoolId: 'notarealuserpoolid',
        AuthParameters: {
          USERNAME: 'notarealusername',
          PASSWORD: 'notarealpassword',
        },
      },
      function (err, data) {
        if (err) {
          reject(err.message);
        } else {
          resolve(data);
        }
      }
    );
  });
}

function listTodos(graphQLClient) {
  const query = `
        query {
          listTodos {
            items {
              id
              name
              description
            }
          }
        }
    `;
  return graphQLClient.request(query);
}

function addTodo(graphQLClient) {
  const mutation = `
        mutation CreateTodo($input:CreateTodoInput!) {
          createTodo(input:$input) {
            id
            name
            description
          }
        }
    `;
  const variables = `
        {
        "input": {
            "name": "todo from Lambda",
            "description": "New Todo created in a Lambda function"
          }
        }
    `;

  return graphQLClient.request(mutation, variables);
}

exports.handler = async (event, context) => {
  const result = await authUser();

  if (result.errorMessage) {
    return result;
  }

  const endpoint = 'https://noarealendpoint.amazonaws.com/graphql';

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      Authorization: result.AuthenticationResult.IdToken,
    },
  });

  return await listTodos(graphQLClient);
  // return await addTodo(graphQLClient);
};
```

## Conclusion

Let's compare the salient points for both solutions.

Solution #1

- Requires additional libraries to be loaded
- Slow to execute (around 4x slower in my case), as a result requires default Lambda timeout to be increased
- Doesn't require any additional config of Cognito
- Doesn't require any additional permissions for Lambda execution role

Solution #2

- Additional required libraries are available in Lambda without needing to load anything new
- About 4x faster than Solution #1 to execute (that number may be specific to my setup)
- Requires an update to Cognito (albeit a very simple config change)
- Requires elevated permissions for Lambda execution role
- Less code

As of this moment in time, I am using Solution #2 in my application primary because it executes faster (that could/will translate to dollars when working with Lambda).
