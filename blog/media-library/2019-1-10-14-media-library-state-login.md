---
slug: 14-media-library-state-login
title: 14. Media Library - State - Login
authors: peter
tags: [Redux, Redux DevTools, React Developer Tools, container components]
---

In the last post we added Redux to our application, we created some authentication actions and an auth reducer. In this post we will wire up Redux complete our Login workflow. We will follow a common pattern in React by using container components.

<!--truncate-->

## Background

If you are new to React you may not be familiar with the idea of container components. The idea is very straightforward, it is simply the application of the separation of concerns principal in React components. We create presentation components that are only involved in how things look and we create container components that are only involved in how things work. This typically means container components are responsible for things like fetching data, but it applies to Redux because we perform all of our state updates in container components. In fact, it is such a common pattern with Redux that there is a write up in the Redux documentation - <https://redux.js.org/basics/usage-with-react>.

If you were paying close attention in the last post you may have noticed that I installed the Redux DevTools when I installed Redux. We will use them to make sure everything around Redux is working as expected. Beyond the updates I will make in the application you will need install the browser extension for your preferred browser. I recommend taking a read through the documentation.

[Redux DevTools](https://github.com/zalmoxisus/redux-devtools-extension)

Also, I haven't mentioned it in other posts, but the React Developer Tools are also very useful. If you are not, you probably should be using them too. You can find them in the chrome web store. You simply install the extension in Chrome, there is nothing to add to your application.

## Walk Through

To get started we need to wire up the Redux Store. To do that we are going to use the the Provider component from react-redux. However, I am going to take this opportunity to do a few more things. I am going to create a new component called Root which will use the Provider. It will also wire up redux-thunk and the Redux DevTools. Notice that we only wire up the Redux DevTools when we are in a development environment. Wiring up the Redux DevTools in production would expose more details of our application than we probably want to make easily accessible. I'm using combineReducers to combine reducers :). This may look strange where we only have one reducer, however, I know that more are coming so I will leave the door open to that.

You may be wondering why we are creating a new component when we could do all of this work in the existing App component. The primary reason is for testing. In order to test a container component, or any component that works with the store, we will need the store to be available. By separating out the ability to create the store we will be able to use this component in our tests and have access to the store. To that end, I am leaving the door open to supply initial state via props. This will let us create tests where the store is in a desired state.

```jsx title="Root.jsx"
import React from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';

import auth from '../../shared/redux/reducers/auth';

const rootReducer = combineReducers({
  auth,
});

const composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? composeWithDevTools(applyMiddleware(thunk))
    : applyMiddleware(thunk);

export default function Root({ children, initialState = {} }) {
  const store = createStore(rootReducer, initialState, composeEnhancers);

  return <Provider store={store}>{children}</Provider>;
}
```

Now we need to wrap our application with this new component. I will do that in index.js.

```js title="index.js (updated)"
...
ReactDOM.render(
  <Root>
    <App />
  </Root>,
  document.getElementById('root')
);
...
```

With that done we can create our first container component. I am going to start with the login component. I am also going to create a new folder structure for containers, it will mimic the components folder but will house only container components. The container itself is very straightforward.

```jsx title="LoginContainer.jsx"
import { connect } from 'react-redux';

import Login from '../../../components/auth/Login/Login';
import { authenticate } from '../../../shared/redux/actions/auth';

const mapStateToProps = (state) => ({
  user: state.auth.user,
  error: state.auth.error,
  loading: state.auth.loading,
});

const mapDispatchToProps = (dispatch) => ({
  boundAuthenticate: (user) => dispatch(authenticate(user, true)),
});

const LoginContainer = connect(mapStateToProps, mapDispatchToProps)(Login);

export default LoginContainer;
```

We can now refactor the Login component as it has access to the props exposed by LoginContainer. The Login component can now dispatch the authenticate action. This updates the underlying state to include the newly logged in user, if successful, an error message, if unsuccessful, and a loading flag if the asynchronous call out to Firebase Authentication is running. We will display a loading spinner, courtesy or Semantic UI React, if the loading flag is set. We will dsiplay the error message with some appropriate formatting. Lastly, we will add the user - userId to a hidden span element. This may be a little controversial. The userId doesn't add any value to the application but it does give us a nice element that we can use during testing.

```jsx title=Login.jsx (updates)"
...
                <Dimmer active={loading}>
                  <Loader />
                </Dimmer>
                <LoginForm sendAuth={boundAuthenticate} />
                {error && <Message error>{error}</Message>}
...
      <span data-testid="userId" style={{ visibility: 'hidden' }}>
        {user && user.userId}
      </span>
...
```

We are passing down the authenicate action to LoginForm. Note that I prefer to create bound action creators that automatically dispatch. I use the bound naming convention to reflect this. We can now replace the console.log statement in our submit handling with our authenticate action.

```jsx title="LoginForm.jsx (updates)"
...
export default function LoginForm({ sendAuth }) {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={Yup.object().shape({
        email: Yup.string()
          .email(errors.EMAILVALID)
          .required(errors.REQ),
        password: Yup.string().required(errors.REQ)
      })}
      onSubmit={(values, { setSubmitting, setTouched }) => {
        setSubmitting(true);
        sendAuth({ email: values.email, password: values.password });
        setTouched({ email: false, password: false });
        setSubmitting(false);
      }}
...
```

We now need to swap out our Login component for our LoginContainer component.

```jsx title="App.jsx (updates)"
...
// import Login from '../auth/Login/Login';
import LoginContainer from '../../containers/auth/Login/LoginContainer';
...
      <Route component={LoginContainer} />
...
```

Changing App.js means we need to update App.test.js. Note that we are wrapping the App component in the Root component we created earlier to get access to the store (the test will fail without this). This will now be a common pattern we follow whenever we test components that need access to the store.

```jsx title="App.test.jsx"
import React from 'react';
import { render } from 'react-testing-library';
import App from './App';
import Root from '../Root/Root';

describe('<App />', () => {
  it('renders', () => {
    const { getByText } = render(
      <Root>
        <App />
      </Root>
    );
    expect(getByText('Login')).toBeInTheDocument();
  });
});
```

To verify everything is working as expected we call borrow one of simple tests from the Login component and confirm it still works. We won't repeat all of the tests from the Login component as they should still be valid. We also now have the opportunity to execute a complete end-to-end login test. We can fill in the form values (email and password), submit them and validate that the login was successful by checking the span we created on the Login component.

```jsx title="LoginContainer.test.jsx"
import React from 'react';
import { render, fireEvent, wait } from 'react-testing-library';
import { MemoryRouter } from 'react-router-dom';

import LoginContainer from './LoginContainer';
import Root from '../../../components/Root/Root';
import { COMPANY_LABEL } from '../../../shared/constants/company';

describe('<LoginContainer />', () => {
  it('renders and contains header', () => {
    const { getByText } = render(
      <Root>
        <MemoryRouter initialEntries={['/login']}>
          <LoginContainer />
        </MemoryRouter>
      </Root>
    );
    expect(getByText(COMPANY_LABEL)).toBeInTheDocument();
  });

  it('renders and end-to-end login successful', async () => {
    const { getByTestId } = render(
      <Root>
        <MemoryRouter initialEntries={['/login']}>
          <LoginContainer />
        </MemoryRouter>
      </Root>
    );

    const email = getByTestId('emailInput');
    const validEmail = 'peter_dyer@hotmail.com';
    const password = getByTestId('passwordInput');
    const validPassword = 'password';

    // email and password initially empty, submit disable
    expect(getByTestId('login-form')).toHaveFormValues({
      email: '',
      password: '',
    });
    expect(getByTestId('submit')).toBeDisabled();
    expect(getByTestId('userId').textContent).toBeFalsy();

    // update to valid email and password, submit enabled

    fireEvent.change(email, { target: { value: validEmail } });
    fireEvent.change(password, { target: { value: validPassword } });
    await wait(() => {
      expect(getByTestId('submit')).not.toBeDisabled();
      expect(getByTestId('login-form')).toHaveFormValues({
        email: validEmail,
        password: validPassword,
      });
      fireEvent.click(getByTestId('submit'));
    });
    await wait(() => {
      expect(getByTestId('userId').textContent).toBeTruthy();
    });
  });
});
```

I needed to make a small refactor to the authenticate action to get everything working correctly. I was using an unreliable mechanism for retrieving the user's access token. This wasn't breaking anything at this point but it would have caught up with us.

I also needed to make a small update to the auth reducer. I was not using the correct action name. This change required updates to the auth reducer tests.

I you haven't already done it, this is the right place to execute all tests and make sure everything is still working.

## Next

We can now move on to our other authentication workflows, register and forgot password , which should be much easier with the legwork we've done in this post. However, before we do that I've had a change of heart with regard to types. We will address that in the next post.

## Code

<https://github.com/peterdyer7/media-library/tree/14.StateLogin>
