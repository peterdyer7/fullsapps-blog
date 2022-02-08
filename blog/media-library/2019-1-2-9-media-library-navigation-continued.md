---
slug: 9-media-library-navigation-continued
title: 9. Media Library - Navigation Continued
authors: peter
tags: [React Router, Semantic UI React, useState]
---

We will continue from where we left off in the last post. We setup some basic navigation. In this post we will explore how to adjust navigation based on who is logged in - a regular user or and administrator.

Our menus will only be seen once a user has logged in. This is, if a user is not logged in they will have access to the login, register and forgot password screens and nothing else. We will create two different sets of routes depending on whether a user is logged in, and, if logged in, we will wrap our routes in a container that holds our top level navigation.

<!--truncate-->

## Walk Through

First, let's use local state to indicate whether or not a user is logged in. We will adjust this when we've added authentication and we have an actual user. Notice that we are using useState again. I am leaving out the "set" function for the moment because I don't have anywhere to call it.

If the user is not logged in they will be able to access the login, register and forgotpassword pages (routes). If they try to access anything else they are returned to the login page. If the user is logged in they will be able to access the properties and admin pages (routes). If the user tries to access anything else they are returned to the properties page (this is starting point for our application). If you run code and adjust the value for userLoggedIn you will see how the application changes. Also, note that the menu (container) we created in the previous post is only rendered when logged in.

```jsx title="Update #1 App.jsx"
...
function App() {
  const [userLoggedIn] = useState(false);

  let availableRoutes = (
    <Switch>
      <Route path={routes.REGISTER} component={Register} />
      <Route path={routes.FORGOTPASSWORD} component={ForgotPassword} />
      <Route component={Login} />
    </Switch>
  );
  if (userLoggedIn) {
    availableRoutes = (
      <ResponsiveContainer>
        <Switch>
           <Route path={routes.ADMIN} component={Admin} />
          <Route component={Properties} />
        </Switch>
      </ResponsiveContainer>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowserRouter>{availableRoutes}</BrowserRouter>
    </Suspense>
  );
}
...
```

Second, and similarly, let's add local state to indicate whether a user is an admin or not. Again, we use useState and again I am dropping the "set" function for the time being.

The only real change here is that we are wrapping the Admin route in a check to see if the user is indeed an admin. Note that you do have to be logged in for this admin check to be relevant.

```jsx title="Update #2 App.jsx"
...
function App() {
  const [userLoggedIn] = useState(true);
  const [userIsAdmin] = useState(false);

  let availableRoutes = (
    <Switch>
      <Route path={routes.REGISTER} component={Register} />
      <Route path={routes.FORGOTPASSWORD} component={ForgotPassword} />
      <Route component={Login} />
    </Switch>
  );
  if (userLoggedIn) {
    availableRoutes = (
      <ResponsiveContainer>
        <Switch>
          {userIsAdmin && <Route path={routes.ADMIN} component={Admin} />}
          <Route component={Properties} />
        </Switch>
      </ResponsiveContainer>
    );
  }
...
```

If you are playing along at home you have noticed one big issue with this strategy. We are still rendering the Admin menu item (in both the mobile and desktop containers), even though the route is not available. Somehow we need to make the menus aware of whether or not to render the Admin route. There are probably three decent ways to address this.

1. We could pass down a prop to both desktop and mobile containers.
2. We could use the new/updated Context API, set the admin flag in the App component and pull it off in the menu components.
3. Same as previous, but use Redux.

I like the idea of option 2, I was thinking about using the Context API in this application but I have decided against it. The reason I am not going to use the Context API is that I am going to use Redux for a couple important reasons that we will talk about when we get to it. So, I am electing to go with option 1. I like this option because it effectively ties the menu and the routes together. Also, we are passing the prop down a couple levels but it doesn't feel like we are going too far.

```jsx title="Updated App.jsx (final update)"
...
function App() {
  const [userLoggedIn] = useState(true);
  const [userIsAdmin] = useState(false);

  let availableRoutes = (
    <Switch>
      <Route path={routes.REGISTER} component={Register} />
      <Route path={routes.FORGOTPASSWORD} component={ForgotPassword} />
      <Route component={Login} />
    </Switch>
  );
  if (userLoggedIn) {
    availableRoutes = (
      <ResponsiveContainer>
        <Switch>
          {userIsAdmin && <Route path={routes.ADMIN} component={Admin} />}
          <Route component={Properties} />
        </Switch>
      </ResponsiveContainer>
    );
  }
...
```

You can see the prop passed down and through ResponsiveContainer to DesktopContainer and MobileContainer where it is used to render (or not) the Admin menu item. Note that I am setting the value to false by default in case something ever happened and the prop was not passed.

```jsx title="Updated ResponsiveContainer.jsx"
...
const ResponsiveContainer = ({ children, userIsAdmin = false }) => (
  <>
    <DesktopContainer userIsAdmin={userIsAdmin}>{children}</DesktopContainer>
    <MobileContainer userIsAdmin={userIsAdmin}>{children}</MobileContainer>
  </>
);
...
```

```jsx title="Updated DesktopContainer.jsx"
...
export default function DesktopContainer({ children, userIsAdmin = false }) {
...
            {userIsAdmin && (
              <Menu.Item name="admin" as={NavLink} to={routes.ADMIN}>
                Admin
              </Menu.Item>
            )}
...
```

```jsx title="Updated MobileContainer.jsx"
...
export default function MobileContainer({ children, userIsAdmin = false }) {
...
          {userIsAdmin && (
            <Menu.Item
              name="admin"
              as={NavLink}
              to={routes.ADMIN}
              onClick={() => setSidebarOpened(false)}
            >
              Admin
            </Menu.Item>
          )}
...
```

## Next

In the next few posts it will be time to create pages for login, registration, etc and wire them to the back-end.

## Code

<https://github.com/peterdyer7/media-library/tree/9.NavigationContinued>
