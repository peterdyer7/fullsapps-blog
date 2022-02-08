---
slug: apollo-subscriptions
title: Apollo Subscriptions
authors: peter
tags: [Apollo Client, Apollo Server, Subscriptions]
---

After writing [this post](/blog/working-up-to-optimistic-response) I was inspired to go further with the Apollo Client. It had been a while since I used subscriptions so I decided to continue to add subscription support to both the Server and Client from the previous post. This ended up being much more involved than I expected. There are a few little tricks that make it more difficult than I was expecting. However, I have come out the other side with an even better understanding of both the Apollo Server and Client, and in particular, the Apollo Client cache.

<!--truncate-->

## Code

Server: https://github.com/peterdyer7/todo-server  
Client: https://github.com/peterdyer7/todo-client

## Background

In the previous version of our todo app (client and server) we simply had todo items that had an id, a name and a description. To make things a little more interesting for subscriptions I have added an additional type called Notes. Notes will have an id and text which is a string. I'm interested in subscribing to Todos but I'm also interested in the subscription pattern for a child item (like a Note) where the subscription is in effect filtered.

## Server

On the server I have added the new Note type to the schema and included Notes in our hard-coded data. I have added an addNote resolver to allow a new note to be added. That should be pretty straightforward given our starting point from the previous [post](/blog/need-quick-graphql-server). I have also adjusted our Todo queries to allow Notes to be retrieved when a Todo is retrieved.

To support subscriptions I have added the PubSub capability built into Apollo Server, along with the withFilter function.

I have written subscriptions for both Todo and Note types. The big difference is that the Note subscription only sends results when the client is subscribed to the appropriate Todo. The subscriptions look as follows:

```js
...
const pubsub = new PubSub();
const TODO_ADDED = 'TODO_ADDED';

const NOTE_ADDED = 'NOTE_ADDED';
...
  Subscription: {
    todoAdded: {
      subscribe: () => pubsub.asyncIterator([TODO_ADDED])
    },
    noteAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([NOTE_ADDED]),
        (payload, variables) => {
          return payload.todoId === variables.todoId;
        }
      )
    }
  }
...
```

When a Todo or Note is added (in the addTodo and addNote resolver) the result is published as follows:

```js
...
      pubsub.publish(TODO_ADDED, { todoAdded: newTodo });
...
      pubsub.publish(NOTE_ADDED, { noteAdded: newNote, todoId: todo.id });
...
```

The last thing I have done on the server is to add the subscriptions definition so that a websocket connection can be established with the client, per what follows (notice that I'm logging some information from the client - strictly for educational purposes at this time):

```js
...
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, connection }) => {
    if (connection) {
      console.log('connection.context: ', connection.context);
      return connection.context;
    } else {
      const token = req.headers.authorization || '';
      console.log('token: ', token);
      return token;
    }
  },
  subscriptions: {
    onConnect: (connectionParams, webSocket) => {
      if (connectionParams.authToken) {
        console.log('subscription authToken: ', connectionParams.authToken);
        return true;
      }
    }
  }
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
```

## Client

Similar to the server we have an established starting point that was discussed [here](/blog/working-up-to-optimistic-response). To get started with adding support for the new subscriptions added to the server I am going to update React to the latest (experimental) version to leverage hooks. I have also added some additional Apollo libraries to support subscriptions in our Apollo Client. Our updated client definition looks like this (note that I'm including some fake auth for the time being - I am using this to see what shows up in the server):

```jsx
...
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

const authLink = setContext((_, { headers }) => {
  const token = 'auth987';
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});

const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: {
    reconnect: true,
    connectionParams: {
      authToken: 'auth123'
    }
  }
});

const terminatingLink = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: ApolloLink.from([terminatingLink]),
...
```

I have updated the defined queries to include the new Note type as follows:

```jsx
...
const LIST_TODOS_QUERY = gql`
  query ListTodos {
    listTodos {
      id
      name
      description
      notes {
        id
        text
      }
    }
  }
`;

const GET_TODO_QUERY = gql`
  query GetTodo($todoId: ID!) {
    getTodo(id: $todoId) {
      id
      name
      description
      notes {
        id
        text
      }
    }
  }
`;
...
```

I'm taking advantage of the cacheRedirect capability in Apollo Client (https://www.apollographql.com/docs/react/advanced/caching.html#cacheRedirect) to retrieve existing data from the cache. You can see this where the cache is setup (in index.js):

```jsx
...
  cache: new InMemoryCache({
    cacheRedirects: {
      Query: {
        getTodo: (_, { id }, { getCacheKey }) =>
          getCacheKey({ __typename: 'Todo', id })
      }
    }
  })
...
```

The first place we have implemented subscriptions is to subscribe to new Todos. For this I have leveraged the Subscription component from React Apollo and I am simply printing the result to the screen. This is a very ugly and not practical implementation of this capability but it is a reasonable implementation to prove subscriptions are working as we expect.

```jsx
...
function TodoNew() {
  return (
    <Subscription
      subscription={gql`
        subscription TodoAdded {
          todoAdded {
            id
            name
            description
          }
        }
      `}
    >
      {({ loading, error, data }) => {
        if (loading) return null;
        if (error) return <p>Error! {error.message}</p>;
        return (
          <>
            <br />
            {data && data.todoAdded && <h4>New todo: {data.todoAdded.name}</h4>}
            <br />
          </>
        );
      }}
    </Subscription>
  );
}
...
```

There is quite a bit more involved in subscribing to added Notes. The first thing I have done is to add a button to the TodoList that allows a Todo to be selected.

```jsx
...
                <button onClick={() => setSelected(todo.id)}>Details</button>
...
```

The selected Todo and the function to set the selected Todo are defined in the App component as local state leveraging the useState hook. We are leveraging this to determine the list of Notes to display (defined in TodoDetail) and to allow a note to be added.

```jsx
...
export default function App() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <h1>Opti App</h1>
      <TodoAdd />
      <TodoList setSelected={setSelected} />
      <TodoNew />
      {selected && <TodoDetail selected={selected} />}
      {selected && <NoteAdd selected={selected} />}
    </>
  );
}
```

Listing Notes follows a similar to pattern to what we've used in listing Todos. We leverage the Query component from React Apollo. However, we do not actually display the list of Notes using the TodoDetail component where the Query component is used. Instead, we pass down the data retrieved by the Query component to a separate component - TodoDetailView. Also, we define a function to subscribe to new notes leveraging the subscribeToMore function exposed by the Query component as a prop. This function allows us to incorporate newly added Notes to the existing list of Notes. We are returning the unsubscribe function made available from subscribeToMore so that we can unsubscribe from a selected Todo when the user no longer wants to see the notes from a selected Todo. If we did not do this we would end up with issues resulting from multiple subscriptions being open. Lastly, we have updated the fetchPolicy on the Query component to cache-and-network in anticipation of Notes being added by other users (those Notes won't be in our cache so we will need to retrieve them).

```jsx
...
function TodoDetail({ selected }) {
  return (
    <Query
      query={GET_TODO_QUERY}
      variables={{ todoId: selected }}
      fetchPolicy={'cache-and-network'}
    >
      {({ loading, error, data, subscribeToMore }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error! {error.message}</p>;

        const subscribeToNewNotes = () => {
          const unsubscribe = subscribeToMore({
            document: gql`
              subscription onNoteAdded($todoId: ID!) {
                noteAdded(todoId: $todoId) {
                  id
                  text
                }
              }
            `,
            variables: { todoId: selected },
            updateQuery: (prev, { subscriptionData }) => {
              if (!subscriptionData.data) return prev;
              const newNote = subscriptionData.data.noteAdded;
              const newData = {
                ...prev,
                getTodo: {
                  ...prev.getTodo,
                  notes: [...prev.getTodo.notes, newNote]
                }
              };
              return newData;
            }
          });
          return unsubscribe;
        };

        return (
          <TodoDetailView data={data} subscribeToMore={subscribeToNewNotes} />
        );
      }}
    </Query>
  );
}
...
```

We can leverage the TodoDetailView component to establish the subscription for Notes with the server. Leveraging the useEffect hook we subscribe to updates when the component is mounted and unsubscribe (via the function we return from useEffect) when the component is unmounted. This is a very handy way to manage subscribing and unsubscribing from a selected Todo.

```jsx
...
function TodoDetailView({ data, subscribeToMore }) {
  useEffect(() => {
    const unsubscribe = subscribeToMore();
    return () => unsubscribe();
  });

  return (
    <>
      <h3>Details</h3>
      <h4>{data.getTodo.name}</h4>
      Notes
      <br />
      {data.getTodo.notes &&
        data.getTodo.notes.map((note) => <li key={note.id}>{note.text}</li>)}
    </>
  );
}
...
```

I am also going to create a component that allows us to add new Notes. This follows similar patterns to what we've using in adding Todos leveraging the Mutation component exposed by React Apollo. There is another hidden detail that we need to take care of (highlighted in bold). We are using optimisticResponse as we did when we added a Todo but we are also subscribing to updates. We end up in a situation where we get two responses back from the server with the added Note. To avoid issues we can check if the new Note already exists in the cache (because the subscription updated it) and only update the cache if the Note is not already there.

```jsx
...
function NoteAdd({ selected }) {
  const handleKeyPress = (e, addNote) => {
    if (e.keyCode === 13) {
      addNote({
        variables: { input: { id: selected, text: e.target.value } },
        optimisticResponse: {
          addNote: {
            text: e.target.value,
            id: Math.round(Math.random() * -1000000),
            __typename: 'Note'
          }
        },
        update: (cache, { data: { addNote } }) => {
          const cachedTodo = cache.readQuery({
            query: GET_TODO_QUERY,
            variables: { todoId: selected }
          });
          if (
            !cachedTodo.getTodo.notes.find((note) => note.id === addNote.id)
          ) {
            cachedTodo.getTodo.notes.push(addNote);
            cache.writeQuery({
              query: GET_TODO_QUERY,
              variables: { todoId: selected },
              data: cachedTodo
            });
          }
        }
      });
      e.target.value = '';
    }
  };

  return (
    <Mutation
      mutation={gql`
        mutation AddNote($input: NoteInput) {
          addNote(input: $input) {
            id
            text
          }
        }
      `}
    >
      {(addNote, { data }) => (
        <input
          type="text"
          placeholder="Add note..."
          onKeyUp={(e) => handleKeyPress(e, addNote)}
        />
      )}
    </Mutation>
  );
}
...
```

## Conclusion

With that we have a working, yet very ugly, Todo app that supports Notes being added to Todos and will automatically update us if either a new Todo or Note is added. In the case of Notes we will only see the update if we are working with the Todo where the Note has been added.
