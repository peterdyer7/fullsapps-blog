---
slug: 5-media-library-routing-react-router
title: 5. Media Library - Routing - React Router
authors: peter
tags: [React Router]
---

## Intro

Our application is going to use React Router (<https://github.com/ReactTraining/react-router>). I think of React Router as the defacto standard for routing in React. It is currently at version 4 and is well used and respected by the React community.

The one other option I have looked at briefly is Reach Router (<https://github.com/reach/router>). To save time I am going to stick with React Router because I have some experience with it but Reach Router looks to have gained a bit of traction with key members of the React community and is another viable option.

<!--truncate-->

Additionally, the documentation for React Router is fantastic (for web) : <https://reacttraining.com/react-router/web/guides/quick-start>

##Requirements
We do have a few routing requirements.

1. We need a mechanism to prevent users who are not logged in from accessing the application.
2. We need a mechanism to separate user activities and administrator activities in the app. For the time being these will be the two roles we support - user and administrator.
3. We want links to be shareable. That is, one user should be able to send another user the page they are currently viewing and that second user should be able to access the link. If the second user is not logged in, they should be taken to the login page to login before being directed to the link.

## Pages (routes)

To get started our app will have some simple pages (routes):

- login (self-explanatory)
- register (self-explanatory)
- forgotpassword (self-explanatory)
- properties - This will be the jumping off point for users. They must be logged in to access this page. Users will see a list of properties for which they can view the available media.
- admin - This will be the jumping off point for administrators. Administrators (user with administrator role) will have the ability to create new properties, upload media, etc.

## Walk Through

Let's get React Router installed.

```bash
npm install --save react-router-dom
```

To setup our initial routes I'm going create a routes.js file (in shared/constants) and store my routes as constants (this gives me some flexibility to change the actual routes without having to change a bunch of code).

```js title="routes.js"
export const LOGIN = '/';
export const REGISTER = '/register';
export const FORGOTPASSWORD = '/forgotpassword';
export const PROPERTIES = '/properties';
export const ADMIN = '/admin';
```

I am going to create a very simple component for each of these routes. If you review the code (and you should because there are details I am leaving out) you will see that I'm starting to add some folder structure. I have mentioned before that I don't want to say too much about this because it is team preference. You can chose to follow me, disagree violently with me, whatever works for you.

I am going to create a components folder, and inside it an App folder for the App component (I have to update index.js to reflect the new location). I will place the auth related components (Login, Register, ForgotPassword) in an auth folder. I will place user related components in user folder and administrator related components in an admin folder.

Example of a simple component.

```jsx title="Login.tsx"
import React from 'react';

export default function Login() {
  return <div>Login</div>;
}
```

Following the React Router documentation I'm going to create a very simple configuration in App.jsx.

```jsx title="App.jsx"
import React from 'react';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import Register from '../auth/Register/Register';
import ForgotPassword from '../auth/ForgotPassword/ForgotPassword';
import Login from '../auth/Login/Login';
import Properties from '../user/Properties/Properties';
import Admin from '../admin/Admin/Admin';
import \* as routes from '../../shared/constants/routes';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path={routes.REGISTER} component={Register} />
        <Route path={routes.FORGOTPASSWORD} component={ForgotPassword} />
        <Route path={routes.PROPERTIES} component={Properties} />
        <Route path={routes.ADMIN} component={Admin} />
        <Route component={Login} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
```

If you start the app (npm start) and navigate to the various routes you should see the simple components we created. Note that I am using Switch (from React Router) to ensure only one route is rendered (the first one that matches), and anything that doesn't match results in the Login component being rendered.

This configuration will change quite a bit as the application evolves but this is a good starting point.

To wrap up the React Router config I'm going to update my App.test.jsx (see the code) and run it. At this point I'm not testing much other than the app is holding together.

```bash
npm test
```

## Next

In the next post we will add lazy loading before moving on to add navigation.

## Code

<https://github.com/peterdyer7/media-library/tree/5.Routing>
