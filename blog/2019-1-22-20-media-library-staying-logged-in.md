---
slug: 20-media-library-staying-logged-in
title: 20. Media Library - Staying Logged In
authors: peter
tags: [Firebase Authentication, useEffect]
---

Our application navigation is working great where we are leveraging react-router. However, we do have an issue when we perform navigation outside of our application. For example, if a user is logged in and they use the browser's address bar and enter a route we get what we probably think of as unexpected behavior - the application refreshes and the user is logged out. In fact, what is happening is that the state is flushed when the application is refreshed; which is what is happening when the user leverages the address bar in the browser. The same thing happens if we use the browser's refresh button or closes and reopens the browser. In this post we will address this undesirable behavior.

<!--truncate-->

## Background

Our Redux store (our global state) is stored in memory. This means any refresh of the browser, including updating an address in the address bar, pressing refresh or closing and reopening the browser, disposes of our current state. This is where we are storing information about our logged in user, so losing this is equivalent to the user logging out.

You might be thinking that this should be handled by Firebase Authentication. In fact, Firebase Authentication, by default, maintains a user's sessions after the browser is closed, but only on the back-end. Our application (the front-end) relies of having access to user information in the Redux store.

To address this we need to store key parts of our state somewhere more durable, somewhere that will persist after a refresh or the browser is closed. For this we will leverage Local Storage from the browser. We won't store everything in Local Storage, only the bits we need to reconstruct our state.

In addition to what we have already discussed, one thing to be aware of is that user tokens in Firebase Authentication are valid for 1 hour. That is, a user interacting with our application will be effectively logged out by the back-end after 1 hour. We don't have any way in our application to know this. We probably don't want a user to have to login every hour. We could address this in a couple different ways. I have decided to address this by starting a timer when we deliver a new token to a user and retrieve a new token on their behalf after 59 minutes, just before their existing token expires.

So, we have to things to address in this post:

1. Keep a user logged in regardless of what they do with the browser
2. Keep a user logged in past the life (1 hour) of their initial token

## Walk Through

Let's start with storing the information we need in Local Storage. We can take care of that when the user logs in (or registers - also a login). Let's update our authentication action to store the user's id in Local Storage. Since this is also the time the user's token is generated we can calculate when their token will expire - 1 hour from now. We will store both the token and expiry in Local Storage. However, I am going to write a routine to handle the token storage as we will use it again in a moment. That routine will also start a timer that will update and restore the token and expiry immediately before they expire again (using the handleToken routine we just created). Notice that we set a default timeout for the expiry in 59 minutes. We set this as a default because there may be a case where we want to override it.

```js title="actions/auth.js (updated)"
...
export const authenticate = (user, isLogin) => async (dispatch) => {
  dispatch(authStart());
  let authUser;
  let firstName;
  try {
    if (isLogin) {
      authUser = await login(user.email, user.password);
      const fetchedUser = await fetchUser(authUser.uid);
      firstName = fetchedUser.firstName;
    } else {
      authUser = await register(user.email, user.password);
      firstName = user.firstName;
      try {
        await createUser({
          uid: authUser.uid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          agreeToTerms: user.agree,
          role: 'user'
        });
      } catch (err) {
        await deleteUser();
        throw err;
      }
    }
    localStorage.setItem('ml-uid', authUser.uid);

    await handleToken();

    dispatch(
      authSuccess({
        uid: authUser.uid,
        email: user.email,
        firstName
      })
    );
  } catch (err) {
    dispatch(authFail(err.message));
  }
};

// timeout default = 59 minutes * 60 seconds/minute * 1000 milliseconds/second
const handleToken = async (timeout = 3540000) => {
  if (getUser()) {
    const token = await getToken(true);
    const tokenCreated = Date.now();
    const tokenExpiry = tokenCreated + timeout;
    localStorage.setItem('ml-token', token);
    localStorage.setItem('ml-expiry', tokenExpiry);
    setExpiryTimer(timeout);
  }
};

let TIMER;
const setExpiryTimer = (timeout) => {
  TIMER = setTimeout(async () => {
    await handleToken();
  }, timeout);
};
...
```

You can leverage the Developer Tools in your browser to see the data getting written to Local Storage (in Chrome it's on the Application tab, under Storage - Local Storage - <http://localhost:3000>, unless you changed the defaults). I'm not going to say anymore about how to use the Developer Tools. If you have made it to this point I assume you know how to use them. If you don't it is time to invest in learning how to use them. Note that I have pre-fixed our Local Storage entries with 'ml-' to make them easy to find.

I also want to cleanup Local Storage and the timer if the user logs out. We can address that in the logout action.

```js title="actions/auth.js (updated)"
...
export const logout = () => async (dispatch) => {
  localStorage.removeItem('ml-uid');
  localStorage.removeItem('ml-token');
  localStorage.removeItem('ml-expiry');
  clearTimeout(TIMER);
  await fbLogout();
  dispatch(authLogout());
};
...
```

You should have noticed that I am writing the expiry as a timestamp for convenience (more on this in a moment). If I want to quickly convert the timestamp to something human readable I use <https://www.epochconverter.com/>.

Now that we have this information written to Local Storage, let's write a routine that can pull the information out of Local Storage and rebuild the store as if a user has just logged in. I've added some additional comments to the code to hopefully explain the workflow. It should be fairly straight-forward. We start by looking to see if there is a token in Local Storage, if there is we check the expiry, if the expiry has not passed we retrieve the user from the database (this will ensure the Firebase Authentication current user is populated), if the token we stored in Local Storage previously matches with what Firebase Authentication has for the current user we can populate the store and generate a new token for the user (which starts the expiry timer we setup in the code above).

```js title="actions/auth.js (updated)"
...
export const authCheck = () => async (dispatch) => {
  dispatch(authStart());
  try {
    // retrieve token from Local Storage
    const token = localStorage.getItem('ml-token');
    if (!token) {
      // if there is no token, log as a failed auth and logout to cleanup auth store
      dispatch(authFail(errors.NO_TOKEN));
      dispatch(logout());
    } else {
      const expiry = localStorage.getItem('ml-expiry');
      const now = Date.now();
      if (now > expiry) {
        // if there is a token but the current time is greater than the expriry,
        // log as a failed auth and logout to cleanup auth store
        dispatch(authFail(errors.TOKEN_EXPIRED));
        dispatch(logout());
      } else {
        // retrieve user from db based on what is in local storage
        const uid = localStorage.getItem('ml-uid');
        const dbUser = await fetchUser(uid);
        const curToken = await getToken(false);
        if (token !== curToken) {
          // if token in local storage does not match what Firebase Authentication has,
          // log as a failed auth and logout to cleanup auth store
          dispatch(authFail(errors.TOKEN_NOTVALID));
          dispatch(logout());
        } else {
          // if there is a token and it is not expired,
          // write user info to the store, handle token expiry
          dispatch(
            authSuccess({
              uid,
              role: dbUser.role,
              firstName: dbUser.firstName,
              email: dbUser.email
            })
          );
          handleToken();
        }
      }
    }
  } catch (err) {
    dispatch(authFail(err.message));
    dispatch(logout());
  }
};
...
```

Now we want to run authCheck when the application is loaded. We will do this by exposing authCheck in AppContainer and leverage the new useEffect hook to execute the function when the App component loads. The authCheck function will in turn update the store which will be seen by the App component.

```jsx title="AppContainer.jsx (updated)"
...
import { authCheck } from '../../shared/redux/actions/auth';
...
const mapDispatchToProps = (dispatch) => ({
  boundAuthCheck: () => dispatch(authCheck())
});
...
```

```jsx title="App.jsx (updated)"
...
  useEffect(() => {
    boundAuthCheck();
  }, []);
...
```

I have discussed it previously but this is a really critical time to use the Redux Developer Tools to see what is happening in the store.

Now that we are running an authentication check when the application loads and storing the user's token in Local Storage there is no real need to store the user's token in the state. In fact, it adds overhead that we would rather avoid. We will refactor out the token from the state, and simply look for a uid when the application loads.

There is another element to Firebase Authentication we should talk about. Firebase Authentication exposes an observer called onAuthStateChanged that is triggered when the user logs in or out. In previous applications I have leveraged this observer, however, after implementing the token refresh workflow we implemented above I don't see any need for the observer. It is possible that I am missing a use case where the observer could be valuable but for now we will omit it.

## Next

Our authentication is looking good, let's start to think about authorization and who can do what in the next post.

## Code

<https://github.com/peterdyer7/media-library/tree/20.StayingLoggedIn>
