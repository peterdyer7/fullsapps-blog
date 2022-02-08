---
slug: 24-media-library-admin-portal
title: 24. Media Library - Admin Portal
authors: peter
tags: [React Router, match]
---

To this point we have built a lot of boilerplate code. That is, what we have built is code that really isn't specific to our application, it is code required by any application. We've built authentication and authorization, we've build our navigation, etc. Now we will start to work on the features that define this specific application.

<!--truncate-->

## Background

Counter-intuitively we are going to work on our application from the back moving forward. That is, we are going to start with the "admin" side of the application. Most projects probably would not move in this direction. We would often workout the "user" side of the application before knowing what we need on the admin side to support users. However, in this case I have a decent idea what the user side of the application will look like and what we need to support.

Working on the admin side of the application also has the added benefit that we won't have to mock a bunch of data or functionality that we would later need to replace. By working on admin side first we can establish from the start what our real patterns will be and work towards them without needed to mock and replace later. Just remember, that this is a risky proposition if you don't fully understand how users will use your application.

If you have been following this series you may have lost site on what we are building. At the end of this project we will have a media library that lets someone managing properties display images of their properties. The media library is then a tool they can use when working with their internal marketing department, media agencies, bloggers, other websites, etc - anyone that might want to know/see more about the properties they are managing. This means that the Admin side of our application needs to support things like adding properties with descriptive information and uploading images with descriptive information. That's what we will work on in this post.

We are going to create an admin "portal". That is, we want to support doing a number of admin "things" so we need to add some navigation to support those "things". We will create a sub (nested) menu (with routing) using React Router in a very similar pattern to what we have used already in our application. We will be using some capabilities in React Router that we have not used previously. As always, the patterns we will follow and the capabilities are using are well documented in the React Router documentation.

<https://reacttraining.com/react-router/web/guides/quick-start/example-nested-routing>
<https://reacttraining.com/react-router/web/api/match>

## Walk Through

I will update the Admin component with a new "admin" menu with routing. I am also creating a few placeholder components that we will fill-in with more detail shortly.

```jsx title="Admin.jsx (updated)"
import React from 'react';
import PropTypes from 'prop-types';
import { Container, Menu } from 'semantic-ui-react';
import { Switch, Route, NavLink, Redirect } from 'react-router-dom';

import * as routes from '../../../shared/constants/routes';
import AdminProperties from '../AdminProperites/AdminProperties';
import AdminProperty from '../AdminProperty/AdminProperty';
import AdminSettings from '../AdminSettings/AdminSettings';

export default function Admin({ match }) {
  return (
    <>
      <br />
      <Container>
        <Menu pointing secondary>
          <Menu.Item
            name='Properties'
            as={NavLink}
            to={match.url + routes.ADMINPROPERTIES}
          />
          <Menu.Item
            name='Settings'
            as={NavLink}
            to={match.url + routes.ADMINSETTINGS}
          />
        </Menu>
        <Switch>
          <Route
            path={match.path + routes.ADMINPROPERTIES}
            exact
            component={AdminProperties}
          />
          <Route
            path={match.path + routes.ADMINPROPERTY}
            component={AdminProperty}
          />
          <Route
            path={match.path + routes.ADMINSETTINGS}
            component={AdminSettings}
          />
          <Redirect to={match.path + routes.ADMINPROPERTIES} />
        </Switch>
      </Container>
    </>
  );
}

Admin.propTypes = {
  match: PropTypes.object.isRequired,
};
```

AdminProperties.jsx, AdminProperty.jsx and AdminSettings.jsx are all just placeholder components at the moment.

```jsx title="AdminProperties.jsx"
import React from 'react';

export default function AdminProperties() {
  return <div>Admin Properties</div>;
}
```

A few things worth noting:

- I am not lazy loading the admin components. My tiny bit of experimenting indicates they are encapsulated in the lazy loading for the Admin component itself. I may revisit this in the future.
- If you experiment with this be sure to use a user that has admin access (see the previous post on authorization).
- Remember to use NavLink and not Link to have your menus be automatically updated.
- Notice the use of the match props from React Router (link to the documentation above). Keep in mind that any component (like the Admin component) rendered by React Router has access to a number of props that can be very helpful (match is only one).
- At the moment, AdminProperty.jsx is only available by editing the url in the address bar - we will be changing this shortly.

I have updated Admin.test.jsx accordingly (but still running a simple test):

```jsx title="Admin.test.jsx"
import React from 'react';
import { render } from 'react-testing-library';
import { MemoryRouter } from 'react-router-dom';

import Admin from './Admin';

describe('<Admin />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MemoryRouter>
        <Admin
          match={{ isExact: false, params: {}, path: '/admin', url: '/admin' }}
        />
      </MemoryRouter>
    );

    expect(getByText('Properties')).toBeInTheDocument();
  });
});
```

## Next

We have created a starting point for our admin portal. In the posts that follow we will build out the functionality for the admin portal.

## Code

<https://github.com/peterdyer7/media-library/tree/24.AdminPortal>
