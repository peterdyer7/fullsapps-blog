---
slug: 4-media-library-testing-jest-and-enzyme
title: 4. Media Library - Testing - Jest and Enzyme
authors: peter
tags: [Enzyme, Jest, jest-enzyme]
---

## IMPORTANT!

I am going to replace the testing framework outlined in this post in a subsequent post (7. Media Library). The information outlined here is still relevant. The part that gets replaced is Enzyme (and its dependencies). You may want to skip the Walk Through, or if you prefer you can follow the Walk Through and we will eventually uninstall the Enzyme bits. The reason for this change is explained in subsequent posts.

## Choices

I am going to assume we all agree on the merits of testing. My goal is 100% automated test coverage with any project. We will probably take a few shortcuts in this project and not test everything (or, at least not test everything as deeply as we may want). In keeping with our "move quickly" philosophy the tests will probably remain light until something indicates further investment in testing is warranted. For example, if a bug is reported, I will often fix the bug and try to write a test that would have uncovered the bug.

<!--truncate-->

I may test a few things that most people would not. For example, I am going to create a thin wrapper around the back-end SDK we will be using. This wrapper will effectively be my API to the back-end. I am creating the wrapper so that if I were to replace my back-end all of my code changes are to the wrapper. You would not normally test an API in your application, you would assume the API provider has done this for you. However, in this case our applications is both the front-end and the API so we need to test it. With that said our API will largely pass through SDK functions that are well tested. My secondary motivation for testing the API is to reason out the interface to SDK. This will also give us a layer of protection from the SDK provider changing their interface.

What I expecct to test:

- Components
- Our internal API (back-end wrapper)
- Redux action creators
- Redux reducers

As far as testing tools are concerned I am sticking with the traditional React combo of Jest (JavaScript test runner) and Enzyme (React testing utility). Jest is installed by default by Create React App. In many places (API and Redux testing) we will Jest without Enzyme. I know some people are not a fan of Enzyme but I have not invested the time in identifying a better solution. Our old friend, the Create React App User Guide, lays out the recommended approach to installing Enzyme (and its required dependencies). I do take advantage of the additional jest-enzyme library to make my assertions a little bit less verbose.

In a previous post I intentionally didn't say much about the folder structure of my code. There were two reasons for that. One, it seems to be an area of a lot of divided opinion. Two, I don't feel strongly about it and each team needs to decide for themselves what works for them. So, how does this relate to testing? We do need to make a decision about how to name tests and where to store them. This is another area where opinions will vary, and the team will need to make a decision. The tests in this project will all have .test. added to the name of the file being tested. For components tests will exist along side the component (as you will see in coming posts I put each component in its own folder). For non-component tests I will create a \_\_tests\_\_ folder to contain test files. You have a lot of freedom to name things what you want but note that Jest, by default, has expected naming conventions (that you can modify).

## Walk Through

Let's get our testing framework setup.

```bash
npm install --save-dev enzyme enzyme-adapter-react-16 react-test-renderer jest-enzyme
```

Create src/setupTest.js.

```js title="src/setupTest.js"
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import 'jest-enzyme';

configure({ adapter: new Adapter() });
```

I prefer to run tests with the verbose option turned on so that I can see individual test results. You can add that to the test script in package.json.

```json title="package.json"
...
"test": "react-scripts test --verbose",
...
```

Let's create a quick initial test to make sure everything is working. I will test our App.jsx component with App.test.jsx (also, I've deleted App.test.js).

```jsx title="App.test.jsx"
import React from 'react';
import { mount } from 'enzyme';

import App from './App';

describe('<App />', () => {
  it('renders and contains 1 <div>', () => {
    const wrapper = mount(<App />);
    expect(wrapper).toContainExactlyOneMatchingElement('div');
  });
});
```

Then we just run npm test and confirm the results look good.

```bash
npm test
```

## Next

In the next post I plan to add React-Router and setup navigation.

## Code

<https://github.com/peterdyer7/media-library/tree/4.Testing>
