---
slug: aws-amplify-with-graphql-api-todo-example
title: AWS Amplify with GraphQL API (AWS AppSync) - Contrived React ToDo App Example
authors: peter
tags: [AWS, Amplify, Apollo Client, AppSync, GraphQL, React]
---

In this post we will create a very contrived ToDo App in React leveraging AWS Amplify and AWS AppSync. This post assumes a basic understanding of AWS Amplify (link to the docs below). You can get away without knowing very much about AWS AppSync, but the end result may not mean very much to you.

<!--truncate-->

[AWS Amplify docs](https://aws-amplify.github.io/)

Code for this post - <https://github.com/peterdyer7/todo-aws-amplify-appsync>

## Setting up AWS Amplify

Following the Amplify documentation:

1. I have an AWS Account
2. I have installed and configured the Amplify CLI
3. I am using the docs (and will use the libs) that pertain to React, starting here: <https://aws-amplify.github.io/docs/js/start?platform=react>

## Building the App

### Part 1 - Preparation

To get started building the app we will create a typical React app by using create-react-app.

```bash
npx create-react-app aws-todo
cd aws-todo
```

I am going to use the next version of React. This gives us the ability to use hooks.

```bash
npm install --save react@next react-dom@next
```

The last thing I am going to do to prepare our application is to delete some of the create-react-app boilerplate. I am deleting App.test.js, App.css and logo.svg. Then I am stripping App.js down to the basics with my preferred formatting.

```js title="App.js (updated)"
import React from 'react';

export default function App() {
  return (
    <>
      <h1>Todo App</h1>
    </>
  );
}
```

Code: <https://github.com/peterdyer7/todo-aws-amplify-appsync/tree/1-Preparation>

### Part 2 - App with Local State

Before we do anything with AWS Amplify I am going to create a simple version of our Todo app that leverages local state. You may notice that this app is not very durable for a few reasons, one is how I'm generating IDs for new Todos. For the sake of what we are doing here, I am going to live with this awful shortcut.

Our app will be made up of three components:

1. App - This is the primary component of the app where the other components will be used. In the first rev of the app this will hold the todos in local state. Also, the ability to add a new todo is defined in a function in this component.
2. CreateTodo - This component consists of a very simple form that handles adding a new todo. The implementation (function) for how to add a todo is passed in via props.
3. ListTodos - This component lists todos passed in via props.

For simplicity, all three components are implemented together in one file.

```js title="App.js (updated)"
import React, { useState } from 'react';

function ListTodos({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}

function AddTodo({ addTodo }) {
  const [todo, setTodo] = useState('');

  const handleChange = (e) => {
    setTodo(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addTodo({ input: { name: todo } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder='New todo...' onChange={handleChange} />
      <button type='submit'>Add</button>
    </form>
  );
}

export default function App() {
  const [todos, setTodos] = useState([
    { id: '1', name: 'first todo' },
    { id: '2', name: 'second todo' },
  ]);

  const addTodo = ({ input }) => {
    setTodos([...todos, { id: '3', name: input.name }]);
  };

  return (
    <>
      <h1>Todo App</h1>
      <AddTodo addTodo={addTodo} />
      <ListTodos todos={todos} />
    </>
  );
}
```

Code: <https://github.com/peterdyer7/todo-aws-amplify-appsync/tree/2-LocalState>

#### Adding Amplify

I am going to .gitignore anything that looks like amplify config, so, you will not see the amplify related files in the code.

There are two libraries that we will install to add AWS Amplify to the project.

```bash
npm install --save aws-amplify aws-amplify-react
```

We can then run amplify init to enable amplify for this project.

```bash
amplify init
```

My amplify settings (answers to the amplify init questions) look like this:

- editor = Visual Studio Code
- type of app = javascript
- framework = react
- source path = default (src)
- distribution path = default (build)
- build command = default
- start command = default
- use profile = default (Y)
- profile = default

#### Adding an API

With Amplify initialized we can add an API to the application. We do that with the following command.

```bash
amplify add api
```

My api settings (answers to the amplify add api questions) look like this:

- service = GraphQL
- name = default (awstodo)
- authorization = API key
- do you have a schema = default (N)
- do you want a guided schema creation = default (Y)
- what best describes your project = single object ("Todo")
- edit now = default (Y)

When this process completes we have a number of local changes, including a schema file, that defines our API, that we can edit (but won't for this app).

We need to push our local changes to sync with the cloud and build our AWS AppSync back-end.

```bash
amplify push
```

With this being our first push, Amplify should detect that this is a create operation and ask us additional questions to help configure how we will use our API.

My additional api settings (answers to the amplify push questions) look like this:

- generate code = default (Y)
- language = javascript
- file name pattern = default
- generate/update all operations = default (Y)

When this process completes we will have a fully functional AWS AppSync API in the cloud, including a fully realized GraphQL schema (that support full CRUD for the Todo Type defined in our schema). By using the guided Todo schema a DynamoDB table has also been created as the Data Source for our Todo Type (this is a result of the @Model directive included in our schema). That is, our Todo queries and mutations resolve to a DynamoDB table.

We also have some new files and folders in our application. This includes a graphql folder with code generated to support all of the queries, mutations and subscriptions created for us in AppSync. Lastly, a file call aws-exports.js is created which contains our GraphQL endpoint, API key and a few other things.

### Part 3 - Rewiring our app to use the API

Now, we can replace our use of local state with our new API. We need to start by importing a number things. We will import both of the Amplify libraries we installed earlier, we will import our aws config from the newly created aws-exports.js file and we will import the newly generated queries and mutations.

```js title="App.js (updated)"
import React, { useState } from 'react';
import Amplify, { graphqlOperation } from 'aws-amplify';
import { Connect } from 'aws-amplify-react';

import aws_config from './aws-exports';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';

Amplify.configure(aws_config);
...
```

Our ListTodos and AddTodo components remain unchanged. Only our App component is updated by removing the local state and addTodo function we were using previously. We are taking advantage of the Connect component provided by the aws-amplify-react library in conjunction with the Amplify GraphQL Client (via graphqlOperation) to get easy access to the query that enables listing Todos and the mutation that enables adding a Todo.

```js title="App.js (updated)"
...
export default function App() {
  return (
    <>
      <h1>Todo App</h1>
      <Connect mutation={graphqlOperation(mutations.createTodo)}>
        {({ mutation }) => <AddTodo addTodo={mutation} />}
      </Connect>

      <Connect query={graphqlOperation(queries.listTodos)}>
        {({ data: { listTodos }, loading, error }) => {
          if (error) return <h3>Error</h3>;
          if (loading) return <h3>Loading...</h3>;
          if (listTodos.items.length === 0) return <h5>no todos</h5>;
          return (
            listTodos &&
            listTodos.items && <ListTodos todos={listTodos.items} />
          );
        }}
      </Connect>
    </>
  );
}
```

Code: <https://github.com/peterdyer7/todo-aws-amplify-appsync/tree/3-RewiredWithAPI>

### Part 4 - Subscriptions

There is a flaw with our application as it stands. When a Todo is added the UI does not update (but it does with a refresh). The createTodo mutation does not automatically lead to the UI being refreshed. There are a number of ways to resolve this but I will use a GraphQL Subscription for the sake of demonstrating the capability.

Subscriptions were automatically generated for us and we can use the generated code as we did previously for queries and mutations. The Connect component we are using to execute the listTodos query can be extended to include subscriptions. So, we will take advantage of this and update the Connect component.

```js title="App.js (updated)"
...
      <Connect
        query={graphqlOperation(queries.listTodos)}
        subscription={graphqlOperation(subscriptions.onCreateTodo)}
        onSubscriptionMsg={(prev, { onCreateTodo }) => {
          prev.listTodos.items.push(onCreateTodo);
          return prev;
        }}
      >
        {({ data: { listTodos }, loading, error }) => {
          if (error) return <h3>Error</h3>;
          if (loading) return <h3>Loading...</h3>;
          return <ListTodos todos={listTodos.items} />;
        }}
      </Connect>
...
```

Code: https://github.com/peterdyer7/todo-aws-amplify-appsync/tree/4-Subscriptions

### Part 5 - Switching to the AppSync / Apollo Client

To use the AppSync / Apollo Client (switching from using the Amplify GraphQL Client) there are some bits we need to install.

```bash
npm install --save aws-appsync aws-appsync-react react-apollo graphql-tag
```

There is a bit of config for the client using some of the new libraries we have added. We will take care of that in index.js.

```js title="index.js (updated)"
..
import { ApolloProvider } from 'react-apollo';
import { Rehydrated } from 'aws-appsync-react';
...
import aws_config from './aws-exports';

const client = new AWSAppSyncClient({
  url: aws_config.aws_appsync_graphqlEndpoint,
  region: aws_config.aws_appsync_region,
  auth: {
    type: aws_config.aws_appsync_authenticationType,
    apiKey: aws_config.aws_appsync_apiKey
  }
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <Rehydrated>
      <App />
    </Rehydrated>
  </ApolloProvider>,
  document.getElementById('root')
);
...
```

We can now update our App component. We swap out some of the previous libraries for the new ones. We will follow a very similar pattern to what we used previously leveraging the Mutation and Query components in exchange for the Connect component.

I have made a very small change to the addTodo component to format the data as required by the Mutation component. Also, I have opt'ed to leave subscriptions out in favor leveraging the refetchQueries prop exposed by the Mutation component. As the name suggests, this allows us to trigger a refetch after our mutation executes.

```js title="App.js (updated)"
...
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
...
    addTodo({ variables: { input: { name: todo } } });
...
export default function App() {
  return (
    <>
      <h1>Todo App</h1>
      <Mutation
        mutation={gql(mutations.createTodo)}
        refetchQueries={[{ query: gql(queries.listTodos) }]}
      >
        {(mutate) => <AddTodo addTodo={mutate} />}
      </Mutation>

      <Query query={gql(queries.listTodos)}>
        {({ data: { listTodos }, loading, error, refetch }) => {
          if (error) return <h3>Error</h3>;
          if (loading) return <h3>Loading...</h3>;
          return (
            <>
              <ListTodos todos={listTodos.items} />
              <button onClick={() => refetch()}>Refetch</button>
            </>
          );
        }}
      </Query>
    </>
  );
}
```

Code: <https://github.com/peterdyer7/todo-aws-amplify-appsync/tree/5-SDKclient>

### Part 6 - Switching to Optimistic Response

To this point we've used subscription and refetching to update our list of Todos. We can improve user experience, especially on slower networks, by leveraging the Optimistic Response capability exposed by the Apollo Client. This involves rewriting our call to the addTodo function.

```js title="App.js (updated)"
...
    addTodo({
      variables: { input: { name: todo } },
      optimisticResponse: {
        createTodo: {
          name: todo,
          id: Math.round(Math.random() * -1000000),
          description: '',
          __typename: 'Todo'
        }
      },
      update: (cache, { data: { createTodo } }) => {
        const cachedTodos = cache.readQuery({
          query: gql(queries.listTodos)
        });
        cachedTodos.listTodos.items.push(createTodo);
        cache.writeQuery({
          query: gql(queries.listTodos),
          data: cachedTodos
        });
      }
    });
...
```

There appears to be an outstanding issue with the AppSync client and its' offline capabilities. The issue was initially logged here: <https://github.com/awslabs/aws-mobile-appsync-sdk-js/issues/65>. To workaround this I have disabled offline mode when configuring the AppSync client.

```js title="Index.js (updated)"
...
const client = new AWSAppSyncClient({
  url: aws_config.aws_appsync_graphqlEndpoint,
  region: aws_config.aws_appsync_region,
  auth: {
    type: aws_config.aws_appsync_authenticationType,
    apiKey: aws_config.aws_appsync_apiKey
  },
  disableOffline: true
});
...
```

Code: <https://github.com/peterdyer7/todo-aws-amplify-appsync/tree/6-OptimisticResponse>

## Wrap Up

That's all. Hopefully, this helps to illustrate how easy it is to build a React application that leverages a GraphQL API provided by AWS AppSync (with some help from AWS Amplify).
