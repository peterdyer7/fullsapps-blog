---
slug: 7-media-library-testing-revisited
title: 7. Media Library - Testing Revisited
authors: peter
tags: [react-testing-library]
---

## Intro

If you are joining this blog series on this post you should review the previous post. In fact, you likely will need to review the whole series for any of these posts to make sense.

In post 4 (Testing) we established a testing strategy for our app that leveraged Enzyme. In post 6 (Lazy Loading) we decided to upgrade to React 16.7 (alpha) to take advantage of (and to experiment with) some of the new features of React. This broken out tests, per https://github.com/airbnb/enzyme/issues/1917. As a result, we decided to move away from Enzyme and move to react-testing-library.

<!--truncate-->

## Background on react-testing-library

react-testing-library was created because the author (Kent C. Dodds) was frustrated with Enzyme and believed it encouraged too much focus on implementation details. As a result, react-testing-library focuses on testing the DOM (that gets rendered from components) and not components directly.

react-testing-library is not a test runner, so we will continue to use Jest (which was included when we bootstrapped the app using Create React App, and was part of our previous Enzyme strategy). Also, I will use jest-dom to simplify assertions (similar to how I used jest-enzyme previously).

## Walk Through

I have added react-testing-library to our app (along with jest-dom) per the instructions in the Create React App User Guide (<https://facebook.github.io/create-react-app/docs/running-tests#option-2-react-testing-library>) also outlined in the react-testing-library docs (<https://github.com/kentcdodds/react-testing-library>). For reference, the jest-dom docs can be found here: <https://github.com/gnapse/jest-dom>. I also uninstalled our previous testing bits: enzyme, enzyme-adapter-react-16, react-test-renderer and jest-enzyme.

To use react-testing-library we can render our component and use the functions returned (in this case I will use getByText) to evaluate the DOM.

```jsx title="Updated App.test.jsx"
import React from 'react';
import { render } from 'react-testing-library';
import App from './App';

describe('<App />', () => {
  it('renders', () => {
    const { getByText } = render(<App />);
    expect(getByText('Login')).toBeInTheDocument();
  });
});
```

The test passes because the DOM rendered in our test looks like this:

```html
<body>
  <div>
    <div>Login</div>
  </div>
</body>
```

I will leave at that for now. As our app progresses we will write more tests and get to know react-testing-library better.

## Next

We will finally setup Navigation next.

## Code

<https://github.com/peterdyer7/media-library/tree/6%267.LazyLoadingTestingRedux>
