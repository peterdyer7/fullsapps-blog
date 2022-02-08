---
slug: apollo-link
title: Apollo Link
authors: peter
tags: [Apollo Client, Apollo Link]
---

This is going to be my last post in our recent, impromptu series of posts about Apollo Client, and to a lesser extent Apollo Server. In the first posts we created a very simple Apollo Server and connected it to an equally simple Apollo Client. We worked with various techniques to keep our client and server in sync while also providing users a good user experience. In the end we implemented Optimistic Response where the client is immediately (optimistically) updated and the data sent to the server replaces the optimistic result after a round trip to the server.

The relevant posts are:

- [Working Up to an Optimistic Response in Apollo Client with the Query and Mutation Components](/blog/working-up-to-optimistic-response)
- [Need a Quick GraphQL Server?](/blog/need-quick-graphql-server)

In the next post we implemented Subscriptions in both Apollo Client and Apollo Server. This is a useful feature when we want users to be immediately updated based on the activity of other users. In doing so we learned a lot about not only subscriptions but also how the Apollo cache works.

The relevant post is: [Apollo Subscriptions](/blog/apollo-subscriptions)

<!--truncate-->

## Introduction

In this post I want to talk a bit about Apollo Link (https://www.apollographql.com/docs/link/). It is fairly easy to use the Apollo Client without investing any time in learning about Apollo Link but you would be doing yourself a disservice. Somewhere in the Apollo Link documentation they suggest you think of Apollo Link as middle-ware for your API request. That captures it best for me.

In the latest version of our sample app I have packed in all of the apollo-links I could. At least, I included the ones that I was interested in. Below, I want to briefly touch on the relevance of each link.

Code: https://github.com/peterdyer7/todo-client

## apollo-link-http

This is the most basic and important link. This is where we provide our GraphQL endpoint. This is probably the one link that everyone uses (even if they don't think about Apollo Link in general).

## apollo-link-context

This link allows us to add context to the request. In the case of our samples application we are leveraging this link to add a fake auth token to our request. In a real application we could verify the auth token on the server. That's just one possible use for this link. You can use it wherever and whenever you need additional context added to your request.

## apollo-link-ws

This link sets up the web-socket connection required by subscriptions. There options for this link that allow things like adding an auth token to the web-socket connection; which can be (has to be) auth'ed separately from http connection our API is using.

## apollo-link-error

This link is generally self-explanatory. You can react to errors and do something with them, like log them.

## apollo-link-retry

For me, this is one of the more interesting links. It has the potential to provide the application some durability against intermittent network issues. If you combine the use of this link with optimistic response and a fetch policy of cache-first you can provide the user an experience where they might not even notice the network has disappeared. True offline experience is a steeper task that likely involves use of a service worker and persistence of the Apollo cache, but it is probably a very specific application that requires that level of offline support.

## apollo-link-state

This is the link everyone should look into if they haven't. This link makes it possible to manage your local state in Apollo Client. Using this link you can work with your local state following the exact same patterns you follow for remote data. Following the pattern of this link your local state is now stored and managed from the Apollo cache. This eliminates the need to use a separate library like Redux or MobX (and separate and specific implementation patterns) to implement and manage local state in your application.

In our sample app I integrated this link as follows (in index.js):

```js
...
const stateLink = withClientState({
  cache,
  resolvers: {
    Mutation: {
      updateNetworkStatus: (_, { isConnected }, { cache }) => {
        const data = {
          networkStatus: {
            __typename: 'NetworkStatus',
            isConnected
          }
        };
        cache.writeData({ data });
        return null;
      }
    }
  },
  defaults: {
    networkStatus: {
      __typename: 'NetworkStatus',
      isConnected: true
    }
  }
});
...
```

I then created a very contrived component in our application that displays and manipulates local state (in App.js):

```js
...
function Network() {
  return (
    <Query
      query={gql`
        query NetworkStatus {
          networkStatus @client {
            isConnected
          }
        }
      `}
    >
      {({ loading, error, data }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error! {error.message}</p>;
        const { networkStatus } = data;
        return (
          <>
            Network status:{' '}
            {networkStatus.isConnected ? 'Connected' : 'Disconnected'}{' '}
            <Mutation
              mutation={gql`
                mutation UpdateNetworkStatus($isConnected: Boolen) {
                  updateNetworkStatus(isConnected: $isConnected) @client
                }
              `}
            >
              {(mutate, { data }) => (
                <>
                  <button
                    onClick={() =>
                      mutate({
                        variables: { isConnected: !networkStatus.isConnected }
                      })
                    }
                  >
                    Toggle
                  </button>
                </>
              )}
            </Mutation>
            <br />
            <br />
          </>
        );
      }}
    </Query>
  );
}
...
```

## Order

With links, order matters. When you setup the Apollo client you supply a link object that is composed from the links you want to use, identified in the order you want them to be executed. The last link is often described as the terminating link and would generally be the server endpoint. The documentation for a link will often include guidance on where it should fit into the order.

## Conclusion

The discussion above is a very quick introduction to Apollo Link. Each link has a much longer description in the documentation. In addition to the 10'ish links provided by Apollo there is a large group of community links that is worth browsing. Of course, the truly adventurous may even consider authoring their own links.
