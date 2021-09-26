---
slug: 11-media-library-forms
title: 11. Media Library - Forms
authors: peter
tags: [Formik, Yup, useState, Semantic UI React Confirm, Semantic UI React Form]
---

In this post we will finally start bringing our application to life. We will create a handful of the pages that our application will use. I want to create (update) the user registration, login and forgot password pages. You may recall that those are all of the pages that can be accessed without logging in to our application.

A key part of what we will create in this post will leverage a library called Formik. I am a big fan of Formik, it reduces a tremendous amount of the boilerplate required by forms. Using libraries like Formik is a cornerstone to my development philosophy - don't be precious about code, if there is a good library available that will save time, use it. Formik can be integrated with another library called Yup which provides field level validation.

<!--truncate-->

## Background

Anyone who has implemented an html form from scratch knows that it is fairly straightforward but that you can end up writing a lot of code to make sure a user has filled in all required fields, to validate fields, ideally to prevent submission of a form until it is valid, etc, etc. This is where Formik and Yup come into play, together they reduce a lot of boilerplate.

We will use the render props pattern with Formik but we will not use the additional "helper" components (Form, Field, etc) so that we can instead maintain control over the form and use components from Semantic UI React.

[Formik](https://jaredpalmer.com/formik)

[Yup](https://github.com/jquense/yup)

## Walk Through

Let's start by installing Formik and Yup. (By the way, if you are following along, you will notice a lot of npm warnings. This is a result of the various alpha/beta/pre-release libraries we are including at this time. We would always resolve this before deploying anything to production.)

```bash
npm install --save formik yup
```

Next, let's tell the app that our user is not logged in. This will make it possible to see the pages we will work on. We can change this in the App component. After making this change I recommend you start the app so that you can see the changes you make in real-time.

```jsx title="App.jsx"
...
  const [userLoggedIn] = useState(false);
...
```

Let's create the login page. The page will be two things - the page itself with style and layout, and, the form where a user will enter their information and login to the app. You might recall that we have already created the Login page (we will be updating it here).

```jsx title="Login.jsx"
...
   <div
      style={{
        height: '100vh',
        overflowX: 'hidden',
        backgroundColor: BACKGROUND_COLOR
      }}
    >
      <Grid style={{ height: '100%' }} stackable verticalAlign="middle">
        <Grid.Row>
          <Grid.Column
            style={{ maxWidth: 450 }}
            floated="right"
            width={5}
            textAlign="center"
            verticalAlign="middle"
          >
            <Grid.Row>
              <LoginHeader />
            </Grid.Row>
            <Grid.Row>
              <Segment textAlign="left">
                <LoginForm />
                <Message warning>
                  <Message.List>
                    <Message.Item>
                      New to us?
                      {'  '}
                      <Link to={routes.REGISTER}>Register here</Link>
                    </Message.Item>
                    <Message.Item>
                      Forgot your password?
                      {'  '}
                      <Link to={routes.FORGOTPASSWORD}>Reset</Link>
                    </Message.Item>
                  </Message.List>
                </Message>
              </Segment>
            </Grid.Row>
          </Grid.Column>
          <Grid.Column floated="left" width={8} only="tablet computer">
            <Image
              alt={COMPANY_NAME}
              bordered
              rounded
              size="huge"
              src={image}
              centered
              style={{ minWidth: '600px' }}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
...
```

Things worth noting:

- There is no real secret to the styling used here, I used trial and error until I arrived at something that seemed reasonable (and I continue to err on the side of less style - this can always be adjusted later).
  - We are using inline style for simplicity (something we should probably revisit before production release).
  - We have added a simple background color to offset the white form.
  - We are using a grid to layout the page.
  - We have added an image to the login page for some visual candy. Remember that this is essentially our home page.
  - The page itself looks good at desktop and mobile sizes. Notice that the image is hidden at mobile sizes (to de-clutter the screen).
- We've repeated some patterns we have used previously. We have added more company specific constants that let us capture company specific values in a central location. You may notice that I've even added a constant that contains JSX code. We will use this when rendering the Terms and Conditions from the RegisterForm.
- We have also created a header for the page. I'm using a different header from the one we used "inside" the app to allow us to change the headers without breaking things. The Login Header will differ from the heaader used on the Register and ForgotPassword pages (reflected the different page layouts).
- We've added some links to help us find the Register and ForgotPassword pages.
- The LoginForm is simply rendered as a typical component (because that is what it is).

LoginForm is a combination of Formik (with a little Yup) and the Form (and children) component from Semantic UI React.

```jsx title="LoginForm.jsx"
import React from 'react';
import { Form, Button, Input, Label, Icon } from 'semantic-ui-react';
import { Formik } from 'formik';
import * as Yup from 'yup';

import * as errors from '../../../shared/constants/errors';

export default function LoginForm() {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email(errors.EMAILVALID).required(errors.REQ),
        password: Yup.string().required(errors.REQ),
      })}
      onSubmit={async (values, { setSubmitting, setTouched }) => {
        setSubmitting(true);
        console.log(values);
        setTouched({ email: false, password: false });
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
        <Form size='large' onSubmit={handleSubmit}>
          <Form.Field error={errors.email && touched.email}>
            <Input fluid iconPosition='left' placeholder='Email address'>
              <Icon name='user' />
              <input
                type='text'
                name='email'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
              />
            </Input>
            {errors.email && touched.email ? (
              <Label pointing>{errors.email}</Label>
            ) : null}
          </Form.Field>
          <Form.Field error={errors.password && touched.password}>
            <Input fluid iconPosition='left' placeholder='Password'>
              <Icon name='lock' />
              <input
                type='password'
                name='password'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.password}
              />
            </Input>
            {errors.password && touched.password && (
              <Label pointing>{errors.password}</Label>
            )}
          </Form.Field>
          <Button
            type='submit'
            fluid
            size='large'
            primary
            disabled={!isValid || isSubmitting}
          >
            Login
          </Button>
        </Form>
      )}
    </Formik>
  );
}
```

Things worth noting:

- I can't overstate how much boilerplate using Formik has eliminated. Formik is really easy to work with, just follow the documentation (which is good).
- You don't have to use Yup with Formik but I like it. Yup is also easy to work with (the documentation isn't as good as Formik but it isn't bad). I like using Yup in general because I have used Yup in a server application with Node. Anytime I can leverage a library on both front and back end it becomes a very valuable tool in my toolkit.
- I've created another file with constants, this time with error messages. In this case, the error messages relate to what we are displaying if required fields are missing, or are invalid.
  - If you enter an invalid email address, or don't enter one at all you should see a decent error message.
- The entire form must be valid before we display to submit button (in this case the Login button).
- We aren't doing anything with the submit at the moment, besides logging to the console. This will change when we wire up our auth back-end.

The Register (and RegisterForm) and ForgotPassword (and ForgotPasswordForm) components follow the same patterns as the Login (and LoginForm) component. To save on screen real-estate I will leave them off this page. You can review the code to see the specifics. A couple things to note if you do review them:

- The styles vary slightly.
- RegisterForm is taking advantage of the Confirm Addon from Semantic UI React. It is any easy way to render a confirmation modal.
  - Also, we are continuing to use next generation React capabilities. RegisterForm is using useState to manage the state of the Confirm dialog (where it is shown or not). This saves us from having to create a class component and we can stick with a functional component, which is what we are using with other components through the app.
  - Lastly, I'm taking advantage of the setFieldValue from Formik to programmatically set a form value.
- ForgotPassword is a more basic component than our Login and Register components and it differs in another key way that we will explore in a future post.

```jsx title="RegisterForm.jsx"
...
  const [termsConfirmOpen, setTermsConfirmOpen] = useState(false);
...
            <Confirm
              open={termsConfirmOpen}
              cancelButton="Disagree"
              confirmButton="Agree"
              onCancel={() => {
                setFieldValue('agree', false);
                setTermsConfirmOpen(false);
              }}
              onConfirm={() => {
                setFieldValue('agree', true);
                setTermsConfirmOpen(false);
              }}
              content={TERMS}
              size="large"
            />
...
```

## Next

We now have our key authentication pages created to work with our auth library. Now we need to think about wiring the front-end to the back-end. We are also due to catch-up on testing.

## Code

<https://github.com/peterdyer7/media-library/tree/11.Forms>
