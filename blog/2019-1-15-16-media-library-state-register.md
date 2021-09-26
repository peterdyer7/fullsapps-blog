---
slug: 16-media-library-state-register
title: 16. Media Library - State - Register
authors: peter
tags: [react-testing-library, Redux]
---

In this post we will continue to integrate our application with the Redux store by wiring our registration process to the store.

<!--truncate-->

## Background

We won't introduce any new ideas in this post. We will continue to apply the patterns we applied in post 14 (State: Login) where we wired our login process to the state.

## Walk Through

We will get the benefit of the legwork we did in post 14 where created a Root component that gives us access to the store and pulls in our auth reducer, the same reducer we will use in the register components. We wrapped our application with the Root component and can now leverage the Redux store throughout our application.

We will start by creating a container component that will wrap our register component (this should look very familiar).

```jsx title="RegisterContainer.jsx"
import { connect } from 'react-redux';

import Register from '../../../components/auth/Register/Register';
import { authenticate } from '../../../shared/redux/actions/auth';

const mapStateToProps = (state) => ({
  user: state.auth.user,
  error: state.auth.error,
  loading: state.auth.loading,
});

const mapDispatchToProps = (dispatch) => ({
  boundAuthenticate: (user) => dispatch(authenticate(user, false)),
});

const RegisterContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Register);

export default RegisterContainer;
```

We will similarly refactor the Register component. Notice that I am now defining prop-types.

```jsx title="Register.jsx (updates)"
...
import PropTypes from 'prop-types';
...
export default function Register({ error, loading, boundAuthenticate, user }) {
...
      <Dimmer active={loading}>
        <Loader />
      </Dimmer>
...
                <RegisterForm sendAuth={boundAuthenticate} />
                {error && <Message error>{error}</Message>}
...
      <span data-testid="userId" style={{ visibility: 'hidden' }}>
        {user && user.userId}
      </span>
    </div>
  );
}
...
Register.propTypes = {
  error: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired,
  boundAuthenticate: PropTypes.func.isRequired
};
```

Similarly, I will refactor RegisterForm.jsx.

```jsx title="RegisterForm.jsx (updates)"
...
import PropTypes from 'prop-types';
...
export default function RegisterForm({ sendAuth }) {
...
      onSubmit={async (values, { setSubmitting, setTouched }) => {
        setSubmitting(true);
        sendAuth({ email: values.email, password: values.password });
        setTouched({ email: false });
        setSubmitting(false);
      }}
...
RegisterForm.propTypes = {
  sendAuth: PropTypes.func.isRequired
};
```

We now need to swap out our Register component for our RegisterContainer component.

```jsx title="App.jsx (updates)"
...
// const Register = lazy(() => import('../auth/Register/Register'));
const RegisterContainer = lazy(() =>
  import('../../containers/auth/Register/RegisterContainer')
);
...
      <Route path={routes.REGISTER} component={RegisterContainer} />
...
```

We can follow a similar pattern to test RegisterContainer as we did with LoginContainer. We will follow a test we created for the Register component but in this case, we will submit it and attempt to register a new user.

```jsx title="RegisterContainer.test.jsx"
import React from 'react';
import { render, fireEvent, wait } from 'react-testing-library';
import { MemoryRouter } from 'react-router-dom';

import RegisterContainer from './RegisterContainer';
import Root from '../../../components/Root/Root';
import { COMPANY_LABEL } from '../../../shared/constants/company';
import { deleteUser } from '../../../shared/firebase/auth/auth';

describe('<RegisterContainer />', () => {
  it('renders and submits registration successfully', async () => {
    jest.setTimeout(20000);

    const { getByTestId, getByText } = render(
      <Root>
        <MemoryRouter initialEntries={['/register']}>
          <RegisterContainer />
        </MemoryRouter>
      </Root>
    );

    expect(getByText(COMPANY_LABEL)).toBeInTheDocument();

    expect(getByTestId('register-form')).toHaveFormValues({
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      password1: '',
      password2: '',
      agree: false,
    });

    const button = getByTestId('submit');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).not.toHaveAttribute('type', 'button');

    const firstName = getByTestId('firstNameInput');
    const validFirstName = 'firsty';
    const lastName = getByTestId('lastNameInput');
    const validLastName = 'lasty';
    const company = getByTestId('companyInput');
    const validCompany = 'company';
    const email = getByTestId('emailInput');
    const validEmail = 'newregister@example.com';
    const password1 = getByTestId('password1Input');
    const password2 = getByTestId('password2Input');
    const validPassword = 'password';
    const agree = getByTestId('agreeInput');

    // update form
    fireEvent.change(firstName, { target: { value: validFirstName } });
    fireEvent.change(lastName, { target: { value: validLastName } });
    fireEvent.change(company, { target: { value: validCompany } });
    fireEvent.change(email, { target: { value: validEmail } });
    fireEvent.change(password1, { target: { value: validPassword } });
    fireEvent.change(password2, { target: { value: validPassword } });
    fireEvent.click(agree);

    // verify and submit
    await wait(() => {
      expect(button).not.toBeDisabled();
      expect(getByTestId('register-form')).toHaveFormValues({
        firstName: validFirstName,
        lastName: validLastName,
        company: validCompany,
        email: validEmail,
        password1: validPassword,
        agree: true,
      });
      fireEvent.click(button);
    });

    // submit registration
    await wait(() => {
      expect(getByTestId('userId').textContent).toBeTruthy();
    });

    // cleanup
    await deleteUser();
  });
});
```

If you followed along closely in post 12 I mentioned a timing/async issue with testing the Register component. That came into play when testing RegisterContainer. It turns out that right way to update a checkbox when using react-testing-library is to fireEvent.click and not fireEvent.change (like we use when updating text inputs, see <https://github.com/kentcdodds/react-testing-library/commit/595abe6ee4e22532bc75238c94df8074935bf991>). I updated Register.test.jsx accordingly and this sorted out the timing issue.

```jsx title="Register.test.jsx (updates)"
...
    fireEvent.click(agree);
...
    await wait(() => expect(button).not.toBeDisabled());
...
```

## Next

In the next post we will address forgot password.

## Code

<https://github.com/peterdyer7/media-library/tree/16.StateRegister>
