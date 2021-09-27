---
slug: 29-media-library-more-testing
title: 29. Media Library - More Testing
authors: peter
tags: [react-testing-library]
---

We have written a lot of code in past few posts. I want to add tests and also I want to see if there are opportunities to standardize the way we approach testing of the different "things" we are creating.

<!--truncate-->

## Background

I started thinking that it might really benefit our application to think about testing more holistically. Throughout this project we have written tests that largely cover our application. However, we have done so in a sort of ad-hoc manor. We've written a lot of code at this point and it might really be helpful to think about testing more systematically. Some of what I discuss below has been discussed in previous posts. This post also provides an opportunity to collect all of our disparate thoughts on testing.

I want to start by breaking down the different "things" (that's a technical term) we are creating in our application. These are rough categories for the code we create.

"Things":

- Standard components - may or may not take props, has GUI, no notion of global state, may or may not have local state
- Form components - slight variant of Standard component, implements a form leveraging Formik and Yup, accepts submit action as prop
- Container components - no props, no GUI, retrieves state from Redux store and wraps a Standard component (providing global state as props to Standard components)
- Routing components - implements routes and often corresponding navigation
- Wrapper components - typically these wire in something that needs to wrap other components as children, examples: redux or react-router
- Action creators - Redux action creators
- Reducers - Redux reducers
- API - provides back-end functionality

Now let's discuss, at a very high-level, what we would want to test for each of these "things".

- Standard components
  - Renders as expected
  - Adjusting props results in correct render behavior
  - Adjusting component behavior results in correct render behavior
- Form components
  - Form renders correctly
  - Form validation works as expected
  - A valid form can be submitted
- Container components
  - Wrapped component is rendered
  - Provided state works as expected
    - This is a good place for an end-to-end test
- Routing components
  - Renders as expected
  - Routes are rendered
- Wrapper components
  - I don't have a good answer for this
- Action creators
  - Calling action creators results in the expected actions being called
    - Only calling externally exposed actions creators, but validating correct actions result
    - Not testing internal action creators
- Reducers
  - Validate a given action achieves an expected state - given a known state and an action I get an expected state
    - Also, as part of this testing, I like to validate that I am not mutating state
- API
  - Everyone will tell you that you should not be testing external work product because it is tested by the 3rd party - I TOTALLY DISAGREE. I have been burned by some of the biggest software companies in the world changing an interface without advanced notice. I always write tests to confirm an API works the way I expect it to work. You can burn a ton of cycles chasing a bug that is actually the result of an external change. The absolute worst case scenario is when you don't know if something is failing because of something you changed or something a 3rd party changed. Most of the time you have to write some sample code the first time you use an API to validate how it works, why not hang on to that code and put it in a test(s).
  - With that diatribe out of the way. I want to create a simple set of tests that validate my use of external libraries - when I give this, I get that.

I am intentionally not using the terms "unit test" or "integration test", etc. I'm not opposed to those terms/ideas, I just don't think of an application in those terms. My philosophy is very much aligned with that of react-testing-library - "The more your tests resemble the way your software is used, the more confidence they can give you.". I am focused on building a level of confidence that the application works as expected. I will sometimes write tests that would be considered unit tests and I will sometimes write tests that would be considered integration tests - I don't discriminate.

## Walk Through

I have made a lot of changes to testing in this code branch. I don't think it would be worthwhile showing everything here. I do want to speak-to some of the updates that reflect how we have applied the methodology discussed above.

Let's start by talking about Login. Previously, we had a test for the Login component and the LoginContainer component. We did not have a test for the LoginForm component. We were applying tests to the Login component that were better off in a LoginForm test. If you look now you will see a LoginForm test that covers form validation and ensure the form can be submitted. The Login component simply validates that it renders correctly, including showing the login form. The LoginContainer component includes an end-to-end test to ensure users can login.

In the past we had an App component that provided routing but was also the component where we wrapped our application with react-router. In order to provide more flexible for testing I am separating those concerns. I have created a new AppRouting component that can be tested independently of the App component which is now strictly a wrapper component.

One of the other motivations for circling back on testing was the release of React 16.8. This release resulted in a warning with one of our tests. The warning points to: https://reactjs.org/docs/test-utils.html#act. As a result, I updated react-testing-library which I initially thought should address the warning. The issue was in the Account component. I haven't confirmed it but I believe the issue might be related to using a nested component, in this case the ResetPasswordForm. I using Hooks which might explain the issue. With all of that said, I updated our testing strategy per our discussion above and I am no longer reaching into a nested component as I was before. I have written a specific set of tests for the ResetPasswordForm component instead of calling it from the Account component tests. That has cleared up the issue for now. I may revisit this in the future.

I have also added jest config to package.json so that I can exclude things from the coverage report that I never plan on testing directly. For now this includes index.js and serverWorker.js.

I've also added a lot of tests for the new components we have added in the past few posts. These tests even caught a couple issues that have been addressed. I still have some work to do to get better test coverage in our recently created components. I will continue to work on that.

With those updates our coverage has improved to:

- Statements - 85.21%
- Branches - 47.65%
- Functions - 77.78%
- Lines - 84.25%

## Next

With settings in place we can turn our attention to managing individual properties.

## Code

<https://github.com/peterdyer7/media-library/tree/29.TestingCont>
