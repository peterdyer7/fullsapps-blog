---
slug: 18-media-library-user-authenticated
title: 18. Media Library - User Authenticated
authors: peter
tags: [Google Firebase Authentication, Semantic UI Menu, useState]
---

In this post it is time to start leveraging our authenticated user. Upon successful login (or register) we will bring the user inside the application. We will also give them a mechanism to leave the application (logout). One of the key ways to help a user understand where they are in our application is through the menu. We will do some menu refactoring to make this easier.

<!--truncate-->

## Background

There are no new concepts introduced in this post. With that said, a lot of the work we do in this post will bring our app to life. Users will start to be able to login, logout and generally interact with the app.

## Walk Through

Before we do anything in this post I want to make a fairly significant refactor. I had originally labeled our menus as 'Container' because the app is contained by the menus. However, we are using container components which has led to the term Container being overloaded. I am going to relabel the menu Containers to Menus. I am not changing any behavior. However, as this post proceeds we will update these components.

I have changed the following:

- /components/UI/containers is now /components/UI/menus
- ResponsiveContainer is now ResponsiveMenu (folders, filenames and component names updated)
- DesktopContainer is now DesktopMenu (folders, filenames and component names updated)
- MobileContainer is now MobileMenu (folders, filenames and component names updated)

In my experience VS Code works best on refactors like this if you layout the new menu structure and move the files from the old folder to the new folder. VS Code will then ask if you want the imports updated, and you can say yes. You still have to edit the names in the components themselves if you want to reflect the new filenames. This isn't required, everything will work if you don't do this, but it makes everything more readable. With that out of the way, let's get started with some real updates.

In order to start making use of the authenticated user we need to expose the user from the store to our application. We will follow the pattern we have used previously by wrapping our App component in a container component that exposed the user. I'm simply going to expose the user from the store (I'm going to hang on to the mapDispatchToProps function but leave blank at the moment - I suspect we will need it soon).

```jsx title="AppContainer.jsx"
import { connect } from 'react-redux';

import App from '../../components/App/App';

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

const mapDispatchToProps = (dispatch) => ({});

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App);

export default AppContainer;
```

Now, we can replace our use of local state to determine if we have a logged in user, and instead, we will look to see if we have a user token in the store.

```jsx title="App.jsx (updated)"
...
  // const [userLoggedIn] = useState(false);
...
  if (user.token) {
...
```

With this change, I am going to get rid of App.test.jsx. The App component is rendering components (via react-router) that require access to the store. This means the App component will always need the store to do anything. I will move the testing of the App component to the AppContainer component and delete App.test.jsx.

```jsx title="AppContainer.text.jsx"
import React from 'react';
import { render } from 'react-testing-library';
import AppContainer from './AppContainer';
import Root from '../../components/Root/Root';

describe('<AppContainer />', () => {
  it('renders', () => {
    const { getByText } = render(
      <Root>
        <AppContainer />
      </Root>
    );
    expect(getByText('Login')).toBeInTheDocument();
  });
});
```

We can now replace App with AppContainer in index.js.

```js title="index.js (updated)"
...
import AppContainer from './containers/App/AppContainer';
...
ReactDOM.render(
  <Root>
    <AppContainer />
  </Root>,
  document.getElementById('root')
);
...
```

There is a bonus to how we have structured our routes in that once we successfully login we are taken directly to the products page inside the application. This happens because the properties page is our default route when logged in, and the login page is no longer part of our routes.

I am going to make a quick refactor to our routes. As it stands, when the user logs in they see the properties page. This is our landing page, and this is what we want. However, we have not updated the displayed route, that is, the user is on route '/' (if you look at the url you will see this, to be completely accurate the user is on whatever route they used to access the app, '/' is most likely). Our routes and menus work together which means our Properties menu item does not get highlighted unless we are on route '/properties'. We will update this by simply redirecting the user to route '/properties' if they have not accessed a route that matches one of our defined routes.

```jsx title="App.jsx (updated)"
...
          <Route path={routes.PROPERTIES} component={Properties} />
          <Redirect to={routes.PROPERTIES} />
...
```

We are now able to login to the app and we land on the correct route and the menu also looks correct. This feels like the right time to start adding to our menus. I want to add three things:

1. Confirm that we know who the user is. This helps the user understand they are logged in.
2. A settings page where the user can see more about their account and maybe change it.
3. The ability to logout.

Let's start with how we to tell the user that we know they are logged in. At the moment the only thing we are capturing on login (or register) is a userId and a token. We could also capture the user's email address and reflect this back to them when they login. I'm simply going to add the user's email address to the authUser object we are adding to the store after the user has successfully logged in or registered.

```js title="actions/auth.js (updated)"
...
    dispatch(
      authSuccess({
        userId: authUser.uid,
        token,
        email: user.email
      })
    );
...
```

Let's create a user account page where we can show the user their email address and let them reset their password. Before we work on the component we have some work to do to expose the resetPassword to the store. Unlike forgotPassword which was fire and forget, we do want to execute resetPassword via the store so we can update the UI accordingly.

```js title="actions/auth.js (updated)"
import {
  login,
  register,
  getToken,
  logout as fbLogout,
  resetPassword as fbResetPassword
} from '../../firebase/auth/auth';
...
export const AUTH_RESETPASSWORD = 'AUTH_RESETPASSWORD';
...
const authResetPassword = () => {
  return {
    type: AUTH_RESETPASSWORD
  };
};
...
export const resetPassword = (newPassword) => async (dispatch) => {
  dispatch(authStart());
  try {
    await fbResetPassword(newPassword);
    dispatch(authResetPassword());
  } catch (err) {
    dispatch(authFail(err.message));
  }
};
...
```

We will a corresponding update to the auth reducer.

```js title="reducers/auth.js (updated)"
import {
  AUTH_START,
  AUTH_SUCCESS,
  AUTH_FAIL,
  AUTH_LOGOUT,
  AUTH_RESETPASSWORD
} from '../actions/auth';
...
const successNoUpdate = (state, action) => ({
  ...state,
  error: '',
  loading: false
});
...
    case AUTH_RESETPASSWORD: {
      return successNoUpdate(state, action);
    }
...
```

I'm going to spare you the testing updates but both the action creator and reducers tests have been updated to test these new capabilities (you can see those updates in the code).

Next, we can create a very simple form where a user can enter an updated password. This may look like a lot of code, but it would be a lot more without the benefit of Formik. You could make an argument that Formik is overkill for entering a single value but it is a pattern we know well, it handles forms brilliantly, we continue to get the benefit of the integration with Yup (in this case are enforcing a minimum password of 6 characters - this comes from Google Firebase), the extra effort is minimal, etc, etc.

```jsx title="ResetPasswordForm.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Label } from 'semantic-ui-react';
import { Formik } from 'formik';
import * as Yup from 'yup';

import * as errors from '../../../shared/constants/errors';

export default function ResetPasswordForm({ show, sendResetPassword }) {
  return (
    <Formik
      initialValues={{ newPassword: '' }}
      validationSchema={Yup.object().shape({
        newPassword: Yup.string().required(errors.REQ).min(6, errors.PASSMIN),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);
        sendResetPassword(values.newPassword);
        show(false);
        setSubmitting(false);
      }}
    >
      {({
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        isValid,
        isSubmitting,
      }) => (
        <>
          <Form onSubmit={handleSubmit} data-testid='resetpassword-form'>
            <Form.Field error={errors.newPassword && touched.newPassword}>
              <input
                type='password'
                name='newPassword'
                data-testid='newPasswordInput'
                placeholder='New password'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
              />
              {errors.newPassword && touched.newPassword ? (
                <Label pointing>{errors.newPassword}</Label>
              ) : null}
            </Form.Field>

            <Button
              data-testid='submit'
              type='submit'
              size='small'
              primary
              disabled={!isValid || isSubmitting}
            >
              Update
            </Button>
            <Button
              data-testid='cancel'
              type='button'
              size='small'
              secondary
              onClick={() => show(false)}
            >
              Cancel
            </Button>
          </Form>
        </>
      )}
    </Formik>
  );
}

ResetPasswordForm.propTypes = {
  show: PropTypes.func,
  sendResetPassword: PropTypes.func.isRequired,
};
```

We will create a simple account page that will show the user's email address and show ResetPasswordForm. Notice we have implemented a tiny bit of login to show the form on the Account page, we could have chosen to display in a modal or handle some other way. Once again we are leveraging the new useState hook from React, and again, using useState has allowed us to continue to use a functional component. In fact, as of writing this post we have yet to write a class component in this application.

```jsx title="Account.jsx"
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Container, Button, Dimmer, Loader, Message } from 'semantic-ui-react';

import ResetPasswordForm from '../../auth/ResetPassword/ResetPasswordForm';

export default function Account({ user, loading, error, boundResetPassword }) {
  const [showReset, setShowReset] = useState(false);

  return (
    <Container text>
      <Dimmer active={loading}>
        <Loader />
      </Dimmer>
      <h2>User Settings</h2>
      <p>
        <strong>Email: </strong>
        {user.email}
      </p>
      <Button
        data-testid='show'
        disabled={showReset}
        type='button'
        onClick={() => setShowReset(true)}
      >
        Reset Password
      </Button>
      {showReset && (
        <>
          <br />
          <br />
          <ResetPasswordForm
            show={setShowReset}
            sendResetPassword={boundResetPassword}
          />
        </>
      )}
      {error && <Message error>{error}</Message>}
    </Container>
  );
}

Account.propTypes = {
  user: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  boundResetPassword: PropTypes.func.isRequired,
};
```

In order to get access to the store with the user's email address, and the ability to call resetPassword we need to wrap the Account component in a container component.

```jsx title="AccountContainer.jsx"
import { connect } from 'react-redux';

import Account from '../../../components/user/Account/Account';
import { resetPassword } from '../../../shared/redux/actions/auth';

const mapStateToProps = (state) => ({
  user: state.auth.user,
  error: state.auth.error,
  loading: state.auth.loading,
});

const mapDispatchToProps = (dispatch) => ({
  boundResetPassword: (newPassword) => dispatch(resetPassword(newPassword)),
});

const AccountContainer = connect(mapStateToProps, mapDispatchToProps)(Account);

export default AccountContainer;
```

Let's create some simple tests to verify the Account component is rendered correctly both when contained and not. We have a challenge verifying resetPassword has been executed correctly. I'm going to backlog that for the time being. We test that easily using the app but it is more difficult with automated tests.

```jsx title="Account.test.jsx"
import React from 'react';
import { render } from 'react-testing-library';

import Account from './Account';

describe('<Account />', () => {
  it('renders', async () => {
    const email = 'auser@example.com';
    const { getByText } = render(
      <Account
        user={{ userId: '123', token: 'abc', email: email }}
        loading={false}
        error=''
        boundResetPassword={() => {}}
      />
    );

    expect(getByText('User Settings')).toBeInTheDocument();
    expect(getByText(email)).toBeInTheDocument();
  });
});
```

```jsx title="AccountContainer.test.jsx"
import React from 'react';
import { render, fireEvent, wait } from 'react-testing-library';
import { MemoryRouter } from 'react-router-dom';

import AccountContainer from './AccountContainer';
import Root from '../../../components/Root/Root';

describe('<AccountContainer />', () => {
  it('renders and prepares form for submission', async () => {
    const { getByTestId } = render(
      <Root>
        <MemoryRouter initialEntries={['/register']}>
          <AccountContainer />
        </MemoryRouter>
      </Root>
    );

    // need to show form
    const showButton = getByTestId('show');
    expect(showButton).toHaveAttribute('type', 'button');
    fireEvent.click(showButton);

    // form now available
    await wait(() => {
      expect(getByTestId('resetpassword-form')).toHaveFormValues({
        newPassword: '',
      });
      expect(getByTestId('submit')).toBeDisabled();
    });

    // update form
    fireEvent.change(getByTestId('newPasswordInput'), {
      target: { value: 'password' },
    });

    // verify
    await wait(() => {
      expect(getByTestId('submit')).not.toBeDisabled();
      expect(getByTestId('resetpassword-form')).toHaveFormValues({
        newPassword: 'password',
      });
    });
  });
});
```

We need to create a route for the account page and expose it to logged in users.

```js title="routes.js (updates)"
...
export const ACCOUNT = '/account';
...
```

Once again we will use the container component and lazy load it (following patterns we have discussed previously).

```jsx title="App.jsx (updates)"
...
const AccountContainer = lazy(() =>
  import('../../containers/user/Account/AccountContainer')
);
...
        <Switch>
          {userIsAdmin && <Route path={routes.ADMIN} component={Admin} />}
          <Route path={routes.ACCOUNT} component={AccountContainer } />
          <Route path={routes.PROPERTIES} component={Properties} />
          <Redirect to={routes.PROPERTIES} />
        </Switch>
...
```

We want to show something about the user in the menu and we want to be able to initiate a Logout from the menu. Instead of creating a container component for both menus I will create a single container component for ResponsiveMenu and let it pass down props from the store.

```jsx title="ResponsiveMenuContainer.jsx"
import { connect } from 'react-redux';

import ResponsiveMenu from '../../../../components/UI/menus/ResponsiveMenu/ResponsiveMenu';
import { logout } from '../../../../shared/redux/actions/auth';

const mapStateToProps = (state) => ({
  user: state.auth.user
});

const mapDispatchToProps = (dispatch) => ({
  boundLogout: () => dispatch(logout())
});

const ResponsiveMenuContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ResponsiveMenu);

export default ResponsiveMenuContainer;

ReponsiveMenu.jsx

import React from 'react';
import PropTypes from 'prop-types';

import DesktopMenu from '../DesktopMenu/DesktopMenu';
import MobileMenu from '../MobileMenu/MobileMenu';

export default function ResponsiveMenu({
  children,
  userIsAdmin = false,
  user,
  boundLogout
}) {
  return (
    <>
      <DesktopMenu userIsAdmin={userIsAdmin} user={user} logout={boundLogout}>
        {children}
      </DesktopMenu>
      <MobileMenu userIsAdmin={userIsAdmin} user={user} logout={boundLogout}>
        {children}
      </MobileMenu>
    </>
  );
}

ResponsiveMenu.propTypes = {
  children: PropTypes.element.isRequired,
  userIsAdmin: PropTypes.bool,
  user: PropTypes.object.isRequired,
  boundLogout: PropTypes.func.isRequired
};
```

```jsx title="DesktopMenu.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Responsive, Segment, Menu, Container, Icon } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import AppHeader from '../../headers/AppHeader/AppHeader';
import * as routes from '../../../../shared/constants/routes';

export default function DesktopMenu({
  children,
  userIsAdmin = false,
  user,
  logout,
}) {
  return (
    <Responsive minWidth={Responsive.onlyTablet.minWidth}>
      <Segment
        inverted
        textAlign='center'
        vertical
        style={{ padding: '1em 0em' }}
      >
        <AppHeader />
        <Container>
          <Menu inverted size='large'>
            <Menu.Item name='properties' as={NavLink} to={routes.PROPERTIES}>
              Properties
            </Menu.Item>
            {userIsAdmin && (
              <Menu.Item name='admin' as={NavLink} to={routes.ADMIN}>
                Admin
              </Menu.Item>
            )}
            <Menu.Menu position='right'>
              <Menu.Item>Hello {user.email}</Menu.Item>
              <Menu.Item name='account' as={NavLink} to={routes.ACCOUNT}>
                <Icon name='setting' />
                Settings
              </Menu.Item>
              <Menu.Item onClick={logout}>
                <Icon name='log out' />
                Logout
              </Menu.Item>
            </Menu.Menu>
          </Menu>
        </Container>
      </Segment>
      {children}
    </Responsive>
  );
}

DesktopMenu.propTypes = {
  children: PropTypes.element.isRequired,
  userIsAdmin: PropTypes.bool,
  user: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired,
};
```

```jsx title="MobileMenu.jsx (updates)"
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Responsive,
  Sidebar,
  Menu,
  Segment,
  Icon,
  Container,
} from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import AppHeader from '../../headers/AppHeader/AppHeader';
import * as routes from '../../../../shared/constants/routes';

export default function MobileMenu({
  children,
  userIsAdmin = false,
  user,
  logout,
}) {
  const [sidebarOpened, setSidebarOpened] = useState(false);
  return (
    <Responsive maxWidth={Responsive.onlyMobile.maxWidth}>
      <Sidebar.Pushable>
        <Sidebar
          as={Menu}
          animation='overlay'
          inverted
          vertical
          visible={sidebarOpened}
        >
          <Menu.Item>Hello {user.email}</Menu.Item>
          <Menu.Item
            name='properties'
            as={NavLink}
            to={routes.PROPERTIES}
            onClick={() => setSidebarOpened(false)}
          >
            Properties
          </Menu.Item>
          {userIsAdmin && (
            <Menu.Item
              name='admin'
              as={NavLink}
              to={routes.ADMIN}
              onClick={() => setSidebarOpened(false)}
            >
              Admin
            </Menu.Item>
          )}
          <Menu.Item
            name='settings'
            as={NavLink}
            to={routes.ACCOUNT}
            onClick={() => setSidebarOpened(false)}
          >
            Settings
          </Menu.Item>
          <Menu.Item name='logout' onClick={logout}>
            Log out
          </Menu.Item>
        </Sidebar>
        <Sidebar.Pusher
          dimmed={sidebarOpened}
          onClick={() => (sidebarOpened ? setSidebarOpened(false) : null)}
          style={{ minHeight: '100vh' }}
        >
          <Segment
            inverted
            textAlign='center'
            vertical
            style={{ minHeight: '100px', padding: '1em 0em' }}
          >
            <AppHeader mobile />
            <Container>
              <Menu inverted pointing secondary size='large'>
                <Menu.Item onClick={() => setSidebarOpened(!sidebarOpened)}>
                  <Icon name='sidebar' />
                </Menu.Item>
              </Menu>
            </Container>
          </Segment>
          {children}
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    </Responsive>
  );
}

MobileMenu.propTypes = {
  children: PropTypes.element.isRequired,
  userIsAdmin: PropTypes.bool,
  user: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired,
};
```

I had to do some refactoring in the auth reducer tests. When I changed error in the auth store to be an empty string from null I broke all (or most) of the tests. I updated this.

Another quick refactor was to update the Suspense fallback in the App component to use the Semantic UI React Loader, instead of the div that we were previously using. This just makes the UI transitions (when loading a component that hadn't previously been loaded) a little smoother.

## Next

That ended up being a much longer post than I was anticipating. However, we have done a lot to make our app aware of users. There is a very annoying problem with our app as it stands - any attempts to use the address bar, or anything that causes a refresh flushes the state and logs us out. Let's address that in the next post.

## Code

<https://github.com/peterdyer7/media-library/tree/18.UserAuthenticated>
