---
slug: 6-media-library-lazy-loading
title: 6. Media Library - Lazy Loading
authors: peter
tags: [React.lazy React.Suspense]
---

## Intro

Lazy loading, or code splitting, is simply the practice of splitting an app into smaller chunks so that the whole app does not need to be loaded at once. We then only delivery chunks of code as the user requires them. This results in the app taking less time to load, which improves user experience.

Various techniques have been used in React to provide this capability. Most recently, in React 16.6, React added lazy and Suspense, which provide the most recent mechanism for code splitting.

<!--truncate-->

## Walk Through

In our app (in its current state) we always want to load the Login component. However, the user, if registered, is unlikely to use the Register component. Similarly, the ForgotPassword component will only be useful occasionally and the Admin component will only be useful to Administrators, so we don't want to load it for all users.

The process for setting up code splitting is outlined here: <https://reactjs.org/blog/2018/10/23/react-v-16-6.html>.

```jsx title="Updated App.jsx"
import React, { lazy, Suspense } from 'react';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import Login from '../auth/Login/Login';
import * as routes from '../../shared/constants/routes';

const Register = lazy(() => import('../auth/Register/Register'));
const ForgotPassword = lazy(() =>
  import('../auth/ForgotPassword/ForgotPassword')
);
const Admin = lazy(() => import('../admin/Admin/Admin'));
const Properties = lazy(() => import('../user/Properties/Properties'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowserRouter>
        <Switch>
          <Route path={routes.REGISTER} component={Register} />
          <Route path={routes.FORGOTPASSWORD} component={ForgotPassword} />
          <Route path={routes.PROPERTIES} component={Properties} />
          <Route path={routes.ADMIN} component={Admin} />
          <Route component={Login} />
        </Switch>
      </BrowserRouter>
    </Suspense>
  );
}

export default App;
```

If your timing on reading this is unlucky you will run into this bug <https://github.com/ReactTraining/react-router/issues/6420>. I have updated our app to use react-router 4.4.0-beta.6 to workaround the issue.

Now for a slightly more adventurous update. I am going to upgrade to React 16.7.0-alpha.2. In a previous post I mentioned we are building a prototype application. Part of the reason for that is that we want to experiment with some of the new features coming in React 16.7.

I would not upgrade to an alpha (or beta) build in a production application.

I'm upgrading React to take advantage of the new useEffect hook (we will use other hooks and other features of React 16.7 in future updates). Following this thread - <https://twitter.com/kentcdodds/status/1064760664940457984> - want to lazy load the Properties component but preload it when the user accesses the Login component. Anyone who successfully logs in will almost always start on the properties page. This requires a quick update to the Login component.

```jsx title="Updated Login.jsx"
import React, { useEffect } from 'react';

export default function Login() {
  useEffect(() => {
    import('../../user/Properties/Properties');
  }, []);
  return <div>Login</div>;
}
```

IMPORTANT!

To prove we are working in real time and I run tests, I ran into this issue <https://github.com/airbnb/enzyme/issues/1917>. This is not something I had anticipated when I started this series. I believe we are left with three choices

1. Stay on React 16.6, continue to use Enzyme
2. Move to React 16.7 and leave out testing (might be reasonable for a prototype application)
3. Move to React 16.7 and use a different testing framework

I am opting for option 3. There is another testing framework that is gaining popularity in the React community: react-testing-library (<https://github.com/kentcdodds/react-testing-library>). This has been on my list of tools to invest some time investigating. I guess as they say, there is no time like the present.

I am going to stop this post here and I will update our testing strategy in the next post.

## Next

We will change our testing strategy.

## Code

<https://github.com/peterdyer7/media-library/tree/6%267.LazyLoadingTestingRedux>
(note: this includes code discussed in the next post)
