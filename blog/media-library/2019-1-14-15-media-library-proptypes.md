---
slug: 15-media-library-proptypes
title: 15. Media Library - PropTypes
authors: peter
tags: [prop-types, propTypes]
---

All the way back in post 1 (Dev setup) in this blog series I talked about types and I said I was not going to use prop-types. I've had a change or heart, when working on the previous post (State Login) I ran into an issue that would have been easily found had I been using prop-types. So, as an agile, pragmatic developer I always reserve the right to change me mind and I will be using prop-types going forward.

<!--truncate-->

## Background

prop-types simply provides a mechanism to define the type of props being used by a component. We will then get warning if the types being used don't match the definition. The argument for not using prop-types is to use a type safe language, like TypeScript. I've said my piece on that subject previously but basically I decided against TypeScript for this project to maximize speed and reduce friction around using the new React capabilities (primarily hooks).

My specific motivation to add prop-types to this project came when I forgot to swap out my Login component for my LoginContainer component. This meant I was trying to use props that didn't really exist. This would have been caught instantly if I was using prop-types.

## Walk Through

To start, I'm going to install prop-types.

```bash
npm install --save prop-types
```

Next, I'm adding a rule to my linter so that it let's me know when I've forgotten to use prop-types in a component.

```json title=".eslintrc"
...
"react/prop-types": [1]
...
```

Now, if I open Login.js my linter points out the points out the fact that I am missing prop validation. So, I am going to add it.

```jsx title="Login.jsx"
...
import PropTypes from 'prop-types';
...
Login.propTypes = {
  error: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired,
  boundAuthenticate: PropTypes.func.isRequired
};
...
```

Now, I need to include these props wherever I use the Login component (like in the tests).

```jsx title="Login.test.jsx"
...
        <Login
          error=""
          loading={false}
          user={{ userId: '', token: '' }}
          boundAuthenticate={() => {}}
        />
...
```

Similarly, I updated LoginForm.jsx to include prop-types.

When making these changes I ran into an issue that I have seen before. prop-types doesn't handle null values well (in my opinion). I changed our auth reducer to set error to an empty string instead of null.

There is one bit of cleanup I also took care of. I had named a couple of our recent components .js instead of .jsx,

## Next

The changes in this post where pretty simple. In the next couple of posts we will continue to wire our register and forgot password capabilities to the store.

## Code

<https://github.com/peterdyer7/media-library/tree/15.PropTypes>
