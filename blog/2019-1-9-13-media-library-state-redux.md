---
slug: 13-media-library-state-redux
title: 13. Media Library - State - Redux
authors: peter
tags: [Redux, reducers, actions, redux-thunk]
---

I have spent some time debating how to best handle state in a "modern" way in our application. I keep coming back to using Redux. In this post we will make the case for using Redux and wire it into our application.

<!--truncate-->

## Background

Our application needs somewhere to store information about the logged in user and to store broader application data. We could store the user data in a couple different places. I considered using the updated Context API from React for quite a while. However, it would be difficult to address the broader need for application storage with the Context API.

I really want to use Redux more as a cache than anything else. That is, we will be loading data from the back-end and I don't want to retrieve it over and over again if the data has been previously loaded. I feel like Redux is still the best option for this. Given that we want to use Redux elsewhere in the application it doesn't make sense to store information about the logged in user elsewhere. So, we will use it for user data as well.

One of the big bonuses to using Redux that should not be overlooked is the Redux dev tools. They are an invaluable tool for troubleshooting and they can really help workout what is happening under the hood of your application.

As with the rest of this blog series my goal is not to teach how to use the selected technologies - others have done that better than I can. This applies to Redux too. In order to make sense of how I am using Redux you will want to have a good working understanding of what Redux is and how it is often used in React projects. Below are links to some very valuable resources if you are new to Redux.

[Redux](https://redux.js.org/)
[React Redux](https://react-redux.js.org/)

## Walk Through

Let's start by installing the bits we need.

```bash
npm install --save redux react-redux redux-thunk redux-devtools-extension
```

We will use our authentication use cases to get started with Redux. As I mentioned above we will store information about our logged in user in Redux. I'm going to create a redux folder in which I will create sub folders for action creators and reducers.

We will start by creating the immediate actions we need. I am combining login and register into one action called authenticate because of the amount of code they (will) share.

```js title="actions/auth.js"
import { login, register, logout as fbLogout } from '../../firebase/auth/auth';

export const AUTH_START = 'AUTH_START';
export const AUTH_SUCCESS = 'AUTH_SUCCESS';
export const AUTH_FAIL = 'AUTH_FAIL';
export const AUTH_LOGOUT = 'AUTH_LOGOUT';

export const authStart = () => ({
  type: AUTH_START,
});

/**
 * authUser = { userId, token }
 */
const authSuccess = (authUser) => ({
  type: AUTH_SUCCESS,
  authUser,
});

const authFail = (error) => ({
  type: AUTH_FAIL,
  error,
});

const authLogout = () => {
  return {
    type: AUTH_LOGOUT,
  };
};

/**
 * user = { email, password }
 * isLogin = true for login : false for register
 */
export const authenticate = (user, isLogin) => async (dispatch) => {
  dispatch(authStart());
  let authUser;
  try {
    if (isLogin) {
      authUser = await login(user.email, user.password);
    } else {
      authUser = await register(user.email, user.password);
    }
    dispatch(
      authSuccess({
        userId: authUser.uid,
        token: authUser.qa,
      })
    );
  } catch (err) {
    dispatch(authFail(err.message));
  }
};

export const logout = () => async (dispatch) => {
  await fbLogout();
  dispatch(authLogout());
};
```

The corresponding reducer looks like this.

```js title="reducers/auth.js"
import {
  AUTH_START,
  AUTH_SUCCESS,
  AUTH_FAIL,
  AUTH_LOGOUT,
} from '../actions/auth';

const INITIAL_STATE = {
  user: {},
  error: null,
  loading: false,
};

const start = (state, action) => ({
  ...state,
  error: null,
  loading: true,
});

const fail = (state, action) => ({
  ...state,
  user: {},
  error: action.error,
  loading: false,
});

const updateUser = (state, action) => ({
  ...state,
  user: action.user,
  error: null,
  loading: false,
});

const removeUser = (state, action) => ({
  ...state,
  user: {},
  error: null,
  loading: false,
});

const auth = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case AUTH_START: {
      return start(state, action);
    }
    case AUTH_SUCCESS: {
      return updateUser(state, action);
    }
    case AUTH_FAIL: {
      return fail(state, action);
    }
    case AUTH_LOGOUT: {
      return removeUser(state, action);
    }
    default:
      return state;
  }
};

export default auth;
```

That's great, we just wrote a bunch of code but need to figure out if it works. Let's install some addition bits to help us test what we just created.

```bash
npm install --save-dev deep-freeze redux-mock-store
```

I am using redux-mock-store to help test my actions.

```js title="actions/auth.test.js"
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  authenticate,
  logout,
  AUTH_START,
  AUTH_SUCCESS,
  AUTH_FAIL,
  AUTH_LOGOUT,
} from './auth';
import { deleteUser } from '../../firebase/auth/auth';

describe('auth async dispatch actions', () => {
  let middlewares;
  let mockStore;
  let initialState;
  let store;
  beforeAll(() => {
    middlewares = [thunk];
    mockStore = configureStore(middlewares);
  });

  beforeEach(() => {
    initialState = {};
    store = mockStore(initialState);
  });

  it('dispatchs authenticate (login) and logout actions (success)', async () => {
    const user = {
      email: 'peter_dyer@hotmail.com',
      password: 'password',
    };
    await store.dispatch(authenticate(user, true));
    let actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_SUCCESS });

    await store.dispatch(logout());
    actions = store.getActions();
    expect(actions).toHaveLength(3);
    expect(actions[2]).toMatchObject({ type: AUTH_LOGOUT });
  });

  it('dispatchs auth (login) action (fail)', async () => {
    const user = {
      email: 'idonotexist@example.com',
      password: 'password',
    };
    await store.dispatch(authenticate(user, true));
    const actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_FAIL });
  });

  it('dispatchs authenticate (register) action (success)', async () => {
    const user = {
      email: 'anewuser@example.com',
      password: 'password',
    };
    await store.dispatch(authenticate(user, false));
    const actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_SUCCESS });

    // cleanup
    await deleteUser();
  });

  it('dispatchs authenticate (register) action (fail)', async () => {
    const user = {
      email: 'anewuser@example.com',
      password: 'pass',
    };
    await store.dispatch(authenticate(user, false));
    const actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_FAIL });
  });
});
```

I am using deep-freeze to ensure I am not mutating state. Using deep-freeze might seem like overkill. However, this is compromise for not using a 3rd party library to ensure we don't mutate our state (like Immutable.JS - for a deeper discussion on this topic see <https://redux.js.org/recipes/using-immutablejs-with-redux>).

```js title="reducers/auth.test.js"
import deepFreeze from 'deep-freeze';

import auth from './auth';

describe('auth reducer', () => {
  it('returns the initial state', () => {
    const stateBefore = undefined;
    const action = {};
    const stateAfter = {
      user: {},
      error: null,
      loading: false,
    };
    // deepFreeze(stateBefore); cannot deepFreeze undefined
    deepFreeze(stateAfter);
    expect(auth(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles AUTH_START', () => {
    const action = { type: 'AUTH_START' };
    const user = {
      userId: '123',
      token: 'abc',
    };
    const stateBefore = {
      user,
      error: null,
      loading: false,
    };
    const stateAfter = {
      user,
      error: null,
      loading: true,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(auth(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles AUTH_SUCCESS', () => {
    const user1 = {
      userId: '123',
      token: 'abc',
    };
    let stateBefore = {
      user: {},
      error: null,
      loading: true,
    };
    let action = { type: 'AUTH_SUCCESS', user: user1 };
    let stateAfter = {
      user: user1,
      error: null,
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(auth(stateBefore, action)).toEqual(stateAfter);

    const user2 = {
      userId: '789',
      token: 'xyz',
    };
    stateBefore = {
      user: user1,
      error: null,
      loading: true,
    };
    action = { type: 'AUTH_SUCCESS', user: user2 };
    stateAfter = {
      user: user2,
      error: null,
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(auth(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles AUTH_FAIL', () => {
    const error = 'Auth fail';
    let stateBefore = {
      user: {},
      error: null,
      loading: true,
    };
    const action = { type: 'AUTH_FAIL', error };
    let stateAfter = {
      user: {},
      error,
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(auth(stateBefore, action)).toEqual(stateAfter);

    const user = {
      userId: '123',
      token: 'abc',
    };
    stateBefore = {
      user,
      error: null,
      loading: true,
    };
    stateAfter = {
      user: {},
      error: error,
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(auth(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles AUTH_LOGOUT', () => {
    const user = {
      userId: '123',
      token: 'abc',
    };
    const stateBefore = {
      user,
      error: null,
      loading: false,
    };
    const action = { type: 'AUTH_LOGOUT' };
    const stateAfter = {
      user: {},
      error: null,
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(auth(stateBefore, action)).toEqual(stateAfter);
  });
});
```

I have started to form some thoughts on my preferred way to test Redux. Those thoughts are captured in the tests above. I have seen others suggest you should test all of your action creators. I do not like this approach. I prefer to test just my publicly exposed actions, which use my internal actions, and confirm the output is correct and that the right actions have been dispatched. That is, I want to test what is coming in and going out, not the internal details in this case. The other reason I prefer this approach is that I don't have to export my internal functions strictly for the purposes of testing. In my opinion, that introduces and opportunity to mistakenly call a function that isn't meant to be called form the outside.

Also, I like the pattern of keeping my reducer switch statement easy to read by leveraging functions and not filling the switch statement with code. With that said, I know some people like to test the individual functions, I prefer to test the reducer function directly and confirm the expected output is correct. Similar to our previous discussion I would rather not export these internal functions for fear that I might mistakenly call one somewhere that I do not want to.

One final note, I am using redux-thunk to make it possible to execute actions with side-effect. If you are new to Redux I highly recommend getting to know redux-thunk - <https://github.com/reduxjs/redux-thunk>. There are alternatives to redux-thunk like redux-saga. I have spent a bit of time looking at redux-saga and concluded for myself that it doesn't simplify anything to the point where I want to invest time in learning another pattern. You may feel differently.

## Next

We've exposed our auth functionality through Redux. We should now be able to add it to our UI.

## Code

<https://github.com/peterdyer7/media-library/tree/13.Redux>
