---
slug: 12-media-library-testing
title: 12. Media Library - Testing
authors: peter
tags: [Jest, jest-dom, react-testing-library]
---

Back in Part 7 we blew away our initial testing strategy and decided to move forward with react-testing-library (and jest-dom). In part 10 we wrote tests to confirm our auth library works as expected where we leveraged Jest directly as we were not testing any parts of React. In this post we will start to create tests for the React components we built in the previous post where we created the login, register and forgot password pages in our application.

<!--truncate-->

## Background

If you haven't read Part 7 of this series you should do so now. That's where we discussed why we are using react-testing-library.

As I mentioned previously, I haven't used react-testing-library previously so this post is a bit of a working session. If you want to know more about react-testing-library these are the resources I found to be most helpful:

- <https://github.com/kentcdodds/react-testing-library> - The library itself, an example and links to further examples.
- <https://blog.kentcdodds.com/introducing-the-react-testing-library-e3a274307e65> - A good introduction to react-testing-library from the author (Kent).
- <https://testing-library.com/> - Documentation. Note that react-testing-library is a super-set (builds on top of) dom-testing-library (the primary subject of the documentation).
- <https://github.com/gnapse/jest-dom> - A good companion library for react-testing-library with custom jest matchers to inspect the DOM. The examples here are very helpful.
- <https://react-testing-examples.com/> - More examples.

## Walk Through

I'm going to start by testing the Login page. I'm going to start with a very simple tests and build up from there.

For our first test I'm simply going to look for the text we are rendering in the header. The first thing to note is that we are using Link from react-router-dom in the Login component so react-router-dom expects the component to be wrapped in a Router. We are leveraging MemoryRouter to satisfy this requirement. Beyond that I'm looking for the text we are rendering in the header using getByText from react-testing-library and the toBeInTheDocument matcher from jest-dom.

```jsx title="Login.test.jsx (first test)"
...
  it('renders and contains header', () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );
    expect(getByText(COMPANY_LABEL)).toBeInTheDocument();
  });
...
```

Next, I want to see if our LoginForm inputs are being rendered. I'm going to take advantage of the getByTestId function from react-testing-library. To use that I have to add a new attribute to the form inputs themselves.

```jsx title="Login.test.jsx (second test)"
...
  it('renders and contains form fields', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(getByTestId('emailInput')).toBeInTheDocument();
    expect(getByTestId('passwordInput')).toBeInTheDocument();
  });
...
```

```jsx title="Updated LoginForm.jsx (new attribute)"
...
              <input
                type="text"
                name="email"
                data-testid="emailInput"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
              />
...
```

Next, I want to make sure the submit button is being rendered properly, and is disabled by default.

```jsx title="Login.test.jsx (third test)"
...
  it('renders and contains submit button, initially disabled', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    const button = getByTestId('submit');

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).not.toHaveAttribute('type', 'button');
  });
...
```

Next, I want to validate the form values. There is a nice matcher from jest-dom that makes this easy - toHaveFormValues. Notice also, that I'm continuing to use the data-testid attribute on other objects, in this case the form, so that I can leverage getByTestId to access them.

```jsx title="Login.test.jsx (fourth test)"
...
  it('renders and contains form, initially empty', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(getByTestId('login-form')).toHaveFormValues({
      email: '',
      password: ''
    });
  });
...
```

Next, I want to validate that when I change form values the submit button is enabled and disabled appropriately.

```jsx title="Login.test.jsx (fifth test)"
...
  it('renders and inputs must be valid to enable submit', async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    const email = getByTestId('emailInput');
    const validEmail = 'tester@example.com';
    const invalidEmail = 'tester';

    const password = getByTestId('passwordInput');
    const validPassword = 'password';
    const invalidPassword = '';

    // email and password initially empty, submit disable
    expect(getByTestId('login-form')).toHaveFormValues({
      email: '',
      password: ''
    });
    expect(getByTestId('submit')).toBeDisabled();

    // update to valid email and password, submit enabled
    fireEvent.change(email, { target: { value: validEmail } });
    fireEvent.change(password, { target: { value: validPassword } });

    await wait(() => expect(getByTestId('submit')).not.toBeDisabled());
    expect(getByTestId('login-form')).toHaveFormValues({
      email: validEmail,
      password: validPassword
    });

    // update to an invalid email, submit disabled
    fireEvent.change(email, { target: { value: invalidEmail } });
    await wait(() => expect(getByTestId('submit')).toBeDisabled());
    expect(getByTestId('login-form')).toHaveFormValues({
      email: invalidEmail,
      password: validPassword
    });

    // update to an invalid password, submit disabled
    fireEvent.change(email, { target: { value: validEmail } });
    fireEvent.change(password, { target: { value: invalidPassword } });
    await wait(() => expect(getByTestId('submit')).toBeDisabled());
    expect(getByTestId('login-form')).toHaveFormValues({
      email: validEmail,
      password: invalidPassword
    });
  });
...
```

I'm going to stop the testing at that. I will apply the same pattern to the register and forgot password pages. You can review them in the code. With those pages I will skip the easy tests and move right to a final test that should cover everything. Notice that I am not testing the actual submission at this time because we really are not doing anything with the submission yet. We will revisit this in the future.

You may have noticed I made some additional changes to the Form Fields. I ran into issues using the Semantic UI React shorthand, so I retreated to native elements.

From this:

```jsx
<Form.Input
  label='Last name'
  type='text'
  name='lastName'
  data-testid='lastNameInput'
  placeholder='Last name'
  onChange={handleChange}
  onBlur={handleBlur}
  value={values.lastName}
/>
```

To this:

```jsx
<label>Last name</label>
<input
  type="text"
  name="lastName"
  data-testid="lastNameInput"
  placeholder="Last name"
  onChange={handleChange}
  onBlur={handleBlur}
  value={values.lastName}
/>
```

There are two outstanding issues that I am going to leave in the backlog to address at a future time. First, I'm not testing the individual field validation. Second, there is a timing/async issue in the Register test that I'm not willing to troubleshoot at this time. Everything works, however, I can't explain why I don't need to wait after setting all of the values on the form to check that the submit button is available. I expect it has to do with firing so many events.

I wanted to add one last thing. Sometimes it is helpful to console.log when you are working out tests. I struggled with getting log output to show up. I found this thread - https://github.com/facebook/jest/issues/2441 - apparently this is a common issue with Jest. Setting verbose to false worked for me. However, I do like running tests with verbose on so I have been changing the verbose flag depending on what I am doing.

```json title="package.json (set verbose false for logs to show)"
...
"test": "react-scripts test --verbose=false"
...
```

## Next

We are now looking okay with regard to testing, time to get back to the business of wiring the front-end and back-end.

## Code

<https://github.com/peterdyer7/media-library/tree/12.TestingCatchup>
