---
slug: calling-aws-appsync-or-any-graphql-api
title: Calling AWS AppSync, or any GraphQL API, from AWS Lambda, part 1
authors: peter
tags: [AWS Amplify, AWS AppSync, AWS Lambda, GraphQL, Lambda Layers]
---

In a [previous post](/blog/calling-rest-api-from-aws-lambda-easy) I discussed calling a REST API from Lambda. In that post we were calling out to an external API to gather data. In this post I want to follow those same patterns but call a GraphQL API. For this post to make sense you should review the previous post.

<!--truncate-->

## Scenario

Although the patterns we will follow is this post are similar to the previous post the motivation is quite different. In this post I want to write data to a GraphQL API, and specifically I want to write data to a GraphQL API created by AWS AppSync. That means the back-end I am writing to (AWS AppSync) is the same back-end I am writing from (AWS Lambda). That being the case, there are a lot of ways to accomplish what I want to do in this post. For example, I could leverage AWS libraries to accomplish what I want.

However, I believe in maintaining separation of concerns wherever and whenever possible. I believe in leaving options open and deferring decisions as long as possible. In a serverless architecture it can be temping to leverage libraries and SDKs to connect components. However, maintaining arms-length integrations by using APIs provides flexibility and to some extent future proofs the application by allowing us to potentially run in a different configuration in the future.

In the case of my real-world application I am leveraging AWS Amplify to build my AppSync API. I would like to leverage the same API calls in my GUI as the ones I will use on the back-end which adds a nice layer of confidence that the API will work as expected.

## GraphQL Client

We could easily use Fetch as our GraphQL client as we did in our previous REST example. A GraphQL request is really just a POST to a known endpoint with a specific (GraphQL) payload. However, to change things up and to simplify the code slightly, I have decided to go with a different library. In this example I am going to use graphql-request. It is a straightforward and simple library for making GraphQL requests courtesy of the folks at Prisma.

<https://github.com/prisma/graphql-request>

## API

For the API in this post I am going to create a boilerplate Amplify React app and add an API to it leveraging the guided Todo example provided by AWS Amplify. I could just as easily create an AppSync API directly but in this case I want to work from front-end back. Essentially, I am going to create the API we discussed in this [post](/blog/aws-amplify-with-graphql-api-aws). I am simply going to follow the steps to setup Amplify, then to create the project (from step 1) and finally follow the steps to add Amplify, configure it and use it to add an API (from step 2). If you don't want to write any of the client code to build the front-end of the Todo app that is fine - in this post we will not be using it. There is one important option to select when setting up the API and that's to chose authentication via API key.

## Layers

In this post I am changing the pattern (from the previous post) for how we will include the external dependencies we will need in our function. I am going to leverage Lambda Layers. By using Layers the dependencies we add can be used in any Lambda function, not just the one we are working on.

This is a straight-forward process and similar to what we followed in the previous post when adding dependencies to a function. I create an empty node project (npm init -y) and I add any dependencies I want to the project (via npm install).

However, there are two tricks.

1. I am not creating an index.js file or any other file for that matter beyond what is created in node_modules.
2. I am creating a zip file but I want the parent folder for the project to be part of the zip. For example, if I had a project folder called nodejs which contained my node_modules folder I would zip nodejs (excluding package.json and package-lock.json). I can then create a Layer in the Lambda console (very straightforward) and upload the zip file.

![Create Layer](./CreateLayer.jpg)

## Function

I am going to create a new Lambda function. The first thing I am going to do is to add the Layer we just created by clicking on the Layers in the middle of the Designer panel. The process of adding the Layer we just created is very straightforward. Be sure to Save after adding the Layer.

![Add Layer](./AddLayer.jpg)

We can now write our function code as if the dependencies have been installed with the function. I am going to create a function that adds a Todo using the CreateTodo mutation that was created automatically through the Amplify / AppSync integration (assuming the steps noted above).

Note we are including the graphql endpoint and api-key in our function. I have replaced both with example values. You can find the real values by accessing AWS AppSync in the AWS Console, select the API you created and bring up the Settings tab (the endpoint is the API URL, the API Key is self-explanatory).

```js
const { GraphQLClient } = require('graphql-request');

exports.handler = async (event, context) => {
  const endpoint = 'https://notarealendpoint.amazonaws.com/graphql';

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      'x-api-key': 'notarealapikey',
    },
  });

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
     "name": "go to the doctor",
     "description": "seeing Dr Ho"
   }
  }
  `;

  const data = await graphQLClient.request(mutation, variables);

  return data;
};
```

As we did in the previous post I have a simple Test that allows me to execute the function. If you are using the code above you can see the todo that was created returned by the function. We can also navigate the to AppSync in the AWS console, select the API we are using and click on the Queries page. We can write a simple query like what follows and we should see the todo we created in the list of todos.

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

## Conclusion

Hopefully, this process looks straightforward. One of the things that makes this process straightforward is that our AppSync API is using an api-key for authentication. If our AppSync API used AWS Cognito for authentication we would have to do more work. I am going to discuss that in a subsequent post - part 2 (available soon).
