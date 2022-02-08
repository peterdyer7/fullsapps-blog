---
slug: need-quick-graphql-server
title: Need a Quick GraphQL Server?
authors: peter
tags: [apollo-server, CodeSandbox, Launchpad]
---

Have you ever needed a quick GraphQL server to test or try something? On occasion I do and I often end up building a server locally from scratch. Libraries like apollo-server make this super simple.

To build a basic GraphQL server I install apollo-server, graphql, uuid (for easy id generation) and nodemon (to hot reload any updates I make). I add a little hard-coded data, define a graphql schema and add a few resolvers.

<!--truncate-->

This is my very basic GraphQL server.

```js
const { ApolloServer, gql } = require('apollo-server');
const uuidv4 = require('uuid/v4');

const todos = [
  {
    id: '1',
    name: 'First todo',
    description: 'something about the todo',
  },
  {
    id: '2',
    name: 'Second todo',
    description: 'something about another todo',
  },
];

const typeDefs = gql`
  """
  An item on a Todo list
  """
  type Todo {
    id: ID!
    name: String!
    description: String
  }

  """
  Create a new Todo item by providing a name and optionally a description
  """
  input TodoInput {
    name: String!
    description: String
  }

  type Query {
    "Query that returns all Todo items"
    listTodos: [Todo]
    "Query that returns a single Todo item given an id"
    getTodo(id: String!): Todo
  }

  type Mutation {
    "Add a Todo item"
    addTodo(input: TodoInput): Todo
  }
`;

const resolvers = {
  Query: {
    listTodos: () => todos,
    getTodo: (_, args) => todos.find((todo) => todo.id === args.id),
  },
  Mutation: {
    addTodo: (_, args) => {
      const newTodo = {
        id: uuidv4(),
        name: args.input.name,
        description: args.input.description,
      };
      todos.push(newTodo);
      return newTodo;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
```

The code is available here if anyone wants to take a closer look: https://github.com/peterdyer7/simple-graphql-server

Have you ever wished you had the same thing, but externally accessible? Apollo used to have a service called Launchpad that provided exactly that but they have since shut that down. However, you can use CodeSandbox or Glitch to fill that void.

The process to use CodeSandbox to host your simple GraphQL server is very straightforward. I believe you need to be logged in to CodeSandbox for this but that might not be accurate. I followed these steps to create the same server as we setup above.

1. Start here: https://codesandbox.io/s/apollo-server.
2. Click Fork (top left). This will create a fork of a bare bones apollo-server that you can now edit.
3. If you want the exact same implementation as we used above click on Add Dependency and add uuid.
4. Replace the code on index.js with the code above.
5. Use the API (you can use GraphQL Playgound in CodeSandbox or simply copy the URL and use it wherever you want - it is externally assessible).
