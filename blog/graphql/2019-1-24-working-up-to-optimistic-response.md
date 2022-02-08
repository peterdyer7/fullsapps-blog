---
slug: working-up-to-optimistic-response
title: Working Up to an Optimistic Response in Apollo Client with the Query and Mutation Components
authors: peter
tags: [Apollo Client, Apollo Client Developer Tools, AWS AppSync, optimistic response]
---

In a recent project a few different streams of work converged. I thought it might be worth capturing some of the things I learned in a post.

I have previously used the Apollo Client. A lot of my work with it predates the release of React Apollo 2.1 where the Query and Mutation components were introduced. At the same time, I have been embracing render props whenever and wherever I can. It has become my preferred integration pattern whenever an option exists. So, it made sense to circle back on using the Query and Mutation components (they leverage render props) when the opportunity arose.

I recently started work on a project that uses AWS AppSync (AWS's GraphQL service). AWS AppSync provides a GraphQL client that is an extended (or enhanced) version of the Apollo Client. I believe the AppSync client exists to provide a more seamless AppSync experience but it also includes some extra bits such as offline capabilities.

The timing was perfect to not only learn about AppSync but to re-visit the Apollo Client and update my knowledge there too. Whenever I learn something new I tend start with a very simple project that I can later build on to do something more meaningful. That's exactly what I did in this case.

<!--truncate-->

You can see my simple start with AppSync (via AWS Amplify) in the following [post](/blog/aws-amplify-with-graphql-api-aws).

When I got to the final step in the post I ran into an issue with optimistic response. Initially, I wasn't sure if my issue was related to AppSync (as it turned out) or with how I was applying the optimistic response pattern in Apollo Client. So, I decided to take AppSync out of the equation and work through the Apollo Client docs to implement optimistic response using the Apollo Client directly. That's what is captured in this post - working my way up from scratch in a very simple project to implement optimistic response in the Apollo Client using the Query and Mutation components.

## Getting Started

To get started I need a server. I'm going to use the solution discussed [here](/blog/need-quick-graphql-server).

To create a client I am simply using create-react-app. I am deleting some of the boilerplate I will not be using (App.test.js, App.css, logo.svg) and I am emptying the contents of App.js

Next, to setup Apollo Client I am going to use apollo-client (meant to be funny, and true). I mean, I am not going to use apollo-boost. As I work through this, I want to make use of the Apollo Client Developer Tools (https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm). The tools are good but I don't believe they work when you use apollo-boost.

Initially, I thought the developer tools might help troubleshoot my issue. They didn't really help in that regard but they provide some good insight. They have some refresh issues that lots of others have mentioned so I won't (maybe I just did).

My Apollo Client setup follows this: https://www.apollographql.com/docs/react/advanced/boost-migration.html#after. The only change is the server uri, for me that is http://localhost:4000/graphql (using the server I just mentioned). Then I am simply using the ApolloProvider from react-apollo to wrap my App component.

I'm going to create the App in series of iterations working up to an optimistic response.

## Iteration #1 - Todo list updated on refresh

Let's use 3 components:

1. App - parent component
2. TodoAdd - component that can add a Todo (using GraphQL mutation)
3. TodoList - component that lists Todos (using GraphQL query)

It looks like this:

```jsx
import React from 'react';
import gql from 'graphql-tag';
import { Query, Mutation } from 'react-apollo';

function TodoList() {
  return (
    <Query
      query={gql`
        query ListTodos {
          listTodos {
            id
            name
          }
        }
      `}
    >
      {({ loading, error, data }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error!</p>;
        return (
          <ul>
            {data.listTodos.map((todo) => (
              <li key={todo.id}>{todo.name}</li>
            ))}
          </ul>
        );
      }}
    </Query>
  );
}

function TodoAdd() {
  const handleKeyPress = (e, addTodo) => {
    if (e.keyCode === 13) {
      addTodo({
        variables: { input: { name: e.target.value } },
      });
      e.target.value = '';
    }
  };

  return (
    <Mutation
      mutation={gql`
        mutation AddTodo($input: TodoInput) {
          addTodo(input: $input) {
            id
            name
          }
        }
      `}
    >
      {(addTodo, { data }) => (
        <input type='text' placeholder='New todo...' onKeyUp={(e) => handleKeyPress(e, addTodo)} />
      )}
    </Mutation>
  );
}

export default function App() {
  return (
    <>
      <h1>Opti App</h1>
      <TodoAdd />
      <TodoList />
    </>
  );
}
```

The App works but the only way to get a new todo to show up in the list is to refresh the page. That's not great. Let's explore some other options.

## Iteration #2 - Todo list updated by polling

We can add one line of code that tells our Query component to refresh its data on a specified polling interval.

It looks like this:

```jsx
...
    <Query
      query={gql`
        query ListTodos {
          listTodos {
            id
            name
          }
        }
      `}
      pollInterval={5000}
    >
...
```

The user experience with polling is at best, okay, but probably more like not good. If you add a new item you might hit the start or the end of the polling interval which is just strange. Also, it makes for a very chatty application. If we were regularly pulling back new data this might be get very unmanageable.

## Iteration #3 - Refetch Todo list when new Todo added

Similar to polling we can add a single line of code when we execute our addTodo mutation that will trigger a named query to be rerun; which, in our case, will update our Todo list.

It looks like this:

```jsx
...
      addTodo({
        variables: { input: { name: e.target.value } },
        refetchQueries: ['ListTodos']
      });
...
```

The user experience with refetchQueries is probably better than polling but is only okay. This still requires a full round-trip back to the server before data is available to be displayed. On a fast network, that is probably okay, but on a slow network there can be a long delay before the newly added data shows up.

## Pro tip:

Use the network tab in the developer tools in your browser for testing like this. In Chrome you can set the network speed (including to offline). When testing stuff like this I like to set the network to Slow 3G, it really shows you what is happening in the application - you can see the lag that might otherwise be missed on a fast network.

## Interaction #4 - Optimistic Response

What we really want is something that adds the new Todo to the list immediately after hitting enter it and then sync's that with what the server returns (and do that transparently). Apollo Client supports this, and they have documented it - https://www.apollographql.com/docs/react/features/optimistic-ui.html#optimistic-advanced. We fake the response to the addTodo mutation (not knowing what it will be until a round trip to the server, but we can make a good guess) and update the cache according.

I have also pulled out the ListTodos query so that I can use it in a few different places (we now use it when inspecting the cache). Lastly, I have added a little visual candy to the list items we are rendering just to allow us to visually inspect whether the item is being rendered as a result of our optimistic response, or is a "real" item coming from the server. I stole this trick from an Apollo tutorial where they render an "optimistic" id as a randomly generated negative number (random in an attempt to avoid id collisions).

In our app, it looks like this:

```jsx
...
const LIST_TODOS_QUERY = gql`
  query ListTodos {
    listTodos {
      id
      name
    }
  }
`;

function TodoList() {
  return (
    <Query
      query={LIST_TODOS_QUERY}
      // pollInterval={5000}
    >
      {({ loading, error, data }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error!</p>;
        return (
          <ul>
            {data.listTodos.map((todo) => (
              <li key={todo.id}>
                {todo.name} - {todo.id < 0 ? 'optimistic' : 'real'}
              </li>
            ))}
          </ul>
        );
      }}
    </Query>
  );
}
...
      addTodo({
        variables: { input: { name: e.target.value } },
        optimisticResponse: {
          addTodo: {
            name: e.target.value,
            id: Math.round(Math.random() * -1000000),
            __typename: 'Todo'
          }
        },
        update: (cache, { data: { addTodo } }) => {
          const cachedTodos = cache.readQuery({
            query: LIST_TODOS_QUERY
          });
          cachedTodos.listTodos.push(addTodo);
          cache.writeQuery({
            query: LIST_TODOS_QUERY,
            data: cachedTodos
          });
        }
        //refetchQueries: ['ListTodos']
      });
...
```

## Conclusion

If you run the completed application (code here: https://github.com/peterdyer7/todo-client) what you should see is a good user experience (even on a slow network). As soon as I hit enter I see the new Todo in the list and it transparently changes from our optimistically generated response to the "real" response from the server.
