---
slug: 17-media-library-forgot-password
title: 17. Media Library - Forgot Password
authors: peter
tags: [Formik, setStatus]
---

In this post we will wire up our forgot password page. There is a key difference with the forgot password workflow - it does need, nor should it, have anything to do with out application state.

<!--truncate-->

## Background

Our forgot password workflow is fire and forget it. That is, from the forgot password page we will send off an email to the address provided by the user. It is up to the user to retrieve that email and proceed. As such, it doesn't really make sense for the page to have anything to do with our application state.

We are going to take advantage of the status object from Formik to pass along the result of calling our forgotPassword function exposed ultimately by Firebase.

## Walk Through

All of our updates are in one file. The primary update is to call forgotPassword in the onSubmit handler exposed by Formik. Notice how we update the status (using setStatus) to reflect the response we get when calling our back-end forgotPassword function. We then leverage the status we set to display the appropriate message back to the user.

```jsx title="ForgotPasswordForm.jsx (updated)"
import React from 'react';
import { Form, Button, Label, Message } from 'semantic-ui-react';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { forgotPassword } from '../../../shared/firebase/auth/auth';
import * as errors from '../../../shared/constants/errors';

export default function ForgotPasswordForm() {
  return (
    <Formik
      initialValues={{ email: '' }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email(errors.EMAILVALID).required(errors.REQ),
      })}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        setSubmitting(true);
        try {
          await forgotPassword(values.email);
          setStatus({ sent: true, success: true, message: 'Email sent' });
        } catch (err) {
          setStatus({ sent: true, success: false, message: err.message });
        }
        setSubmitting(false);
      }}
    >
      {({
        values,
        status,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        isValid,
        isSubmitting,
      }) => (
        <>
          <Form
            size='large'
            onSubmit={handleSubmit}
            data-testid='forgotpassword-form'
          >
            <Form.Field error={errors.email && touched.email}>
              <label>Email address</label>
              <input
                type='text'
                name='email'
                data-testid='emailInput'
                placeholder='Email address'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
              />
              {errors.email && touched.email ? (
                <Label pointing>{errors.email}</Label>
              ) : null}
            </Form.Field>

            <Button
              data-testid='submit'
              type='submit'
              fluid
              size='large'
              primary
              disabled={!isValid || isSubmitting}
            >
              Send Email
            </Button>
          </Form>
          {status && status.sent && (
            <Message success={status.success} error={!status.success}>
              {status.message}
            </Message>
          )}
        </>
      )}
    </Formik>
  );
}
```

We will create a test that validates the negative case (email doesn't exist). I will forgo the positive case as I do not have any easy way to confirm that the email was received. I can live with a test that calls the back-end and gets back a message that indicates the API was called correctly.

```jsx title="ForgotPassword.test.jsx (updates)"
...
  it('renders and submits successfully - failed case', async () => {
    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={['/forgotpassword']}>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(getByTestId('forgotpassword-form')).toHaveFormValues({
      email: ''
    });

    const button = getByTestId('submit');

    const email = getByTestId('emailInput');
    const validEmailDoesNotExist = 'tester1234567890@example.com';

    // inputs initially empty, submit disable
    expect(email.value).toBe('');
    expect(button).toBeDisabled();

    // update to valid inputs, submit enabled
    fireEvent.change(email, { target: { value: validEmailDoesNotExist } });
    expect(email.value).toBe(validEmailDoesNotExist);
    await wait(() => expect(button).not.toBeDisabled());

    // send update and check response
    fireEvent.click(button);
    await wait(() => {
      const expected =
        'There is no user record corresponding to this identifier. The user may have been deleted.';
      expect(getByTestId('message').textContent).toBe(expected);
    });
  });
...
```

I also made a small change to the wording on ForgotPassword.jsx to encourage the user to check their spam folder if they do not see the reset password email in their inbox.

This is going to wrap up a lot of our authentication work. We do have some work remaining in the app to react to a successful login (or register). If you are following along you may notice that I am passing through the error messages I am getting from the back-end. For example, in the case of forgot password I am letting the user know that we do not have a record of their email address being used. Most people would call this bad practice today and I do not disagree. We are opening a bit of an attack footprint by letting a user know what email addresses we do and do not have in our user database. If I was planning to deploy this project as is I might want to revisit this and not pass down so much information. However, for our purposes, with a prototype/learning application it makes sense to leave these details in. I suspect that I could also make a case for leaving these details in because of the relatively unsophisticated user we are targeting, at least until such time as we saw malicious intent. In fact, in this application we are asking users to login primarily because we want to follow their activity, not because we are protecting sensitive data.

## Next

We will look at how to make use of the fact that we now have a logged in user.

## Code

<https://github.com/peterdyer7/media-library/tree/17.ForgotPassword>
