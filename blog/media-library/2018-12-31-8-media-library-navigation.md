---
slug: 8-media-library-navigation
title: 8. Media Library - Navigation
authors: peter
tags: [React Hooks, React Router, Semantic UI React, useState]
---

In this post we will start to put together our navigation strategy for the application. We will use various components from Semantic UI React to drive navigation, primarily menus, in coordination with React Router.

Semantic UI React Menu - <https://react.semantic-ui.com/collections/menu/>

<!--truncate-->

## Requirements

We do have some navigation requirements.

1. Our app will have explicit navigation (menus) to get to the various parts of the application.
2. Our navigation needs to reflect the overarching requirement that our application be responsive.
3. Navigation needs to reflect our authorization model and not present access to parts of the application that should be inaccessible based on a user's role..

## Navigation

We will leverage the Menu component from Semantic UI React extensively for on-screen navigation (with behavior driven by React Router). We will take inspiration (and a lot of code) from a layout sample provided by Semantic UI React.

<https://react.semantic-ui.com/layouts/homepage> - provides an excellent starting point for creating menus that work on both desktop and mobile devices. This fits right into our philosophy about not being precious about code, using what is available and moving quickly.

## Walk Through

I am going to create a UI folder inside the components folder for UI components. Following the Semantic UI React sample I referenced above I am going to create two containers. These containers will effectively wrap the application. We will create one container for desktop and one for mobile. Only one container will ever be seen, based on a media query. The containers are called DesktopContainer and a MobileContainer (each in there own folders), and I will create a single ResponsiveContainer where both Desktop and Mobile containers are referenced (that will let me add a single container to my App). The containers themselves render a menu and the appropriate route as a child inside the container (the code should make this clear).

```jsx title="DesktopContainer.jsx"
import React from 'react';
import { Responsive, Segment, Menu, Container } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import AppHeader from '../../headers/AppHeader/AppHeader';
import * as routes from '../../../../shared/constants/routes';

export default function DesktopContainer({ children }) {
  return (
    <Responsive minWidth={Responsive.onlyTablet.minWidth}>
      <Segment
        inverted
        textAlign='center'
        vertical
        style={{ padding: '1em 0em' }}
      >
        <AppHeader />
        <Menu inverted pointing secondary size='large'>
          <Container>
            <Menu.Item name='properties' as={NavLink} to={routes.PROPERTIES}>
              Properties
            </Menu.Item>
            <Menu.Item name='admin' as={NavLink} to={routes.ADMIN}>
              Admin
            </Menu.Item>
          </Container>
        </Menu>
      </Segment>
      {children}
    </Responsive>
  );
}
```

Worth noting:

- I've used the Responsive Addon from Semantic UI React (<https://react.semantic-ui.com/addons/responsive/>). I've also used it in MobileContainer. Effectively, I'm rendering DesktopContiner if the minimum width of the device is tablet min width (in Semantic UI this is 768px) and I'm rendering MobileContainer if the max width of the device is mobile max width (in Semantic UI this is 768px). You can see this in action if you drag the screen from larger than 768px to smaller or visa versa.
- I have used a tiny bit of component style (that is, I'm using the style prop). This is probably reasonable given the small amount of CSS we are using and have plans for at this point. However, this is not the recommended way of adjusting CSS on a React component. The right thing to do is probably to add a library to help us compose CSS. We may tackle that is a future post.
- I've outsourced the display of logo and text to a separate AppHeader component. Read more about this below.
- VERY IMPORTANT - Semantic UI React Menu.Item have an "as" prop that lets you set the element type to render. React Router has both a Link and NavLink component. You must use NavLink in order for Semantic UI React to know how to handle which menu is active.

```jsx title="MobileContainer.jsx"
import React, { useState } from 'react';
import {
  Responsive,
  Sidebar,
  Menu,
  Segment,
  Icon,
  Container,
} from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import AppHeader from '../../headers/AppHeader/AppHeader';
import * as routes from '../../../../shared/constants/routes';

export default function MobileContainer({ children }) {
  const [sidebarOpened, setSidebarOpened] = useState(false);
  return (
    <Responsive maxWidth={Responsive.onlyMobile.maxWidth}>
      <Sidebar.Pushable>
        <Sidebar
          as={Menu}
          animation='overlay'
          inverted
          vertical
          visible={sidebarOpened}
        >
          <Menu.Item
            name='properties'
            as={NavLink}
            to={routes.PROPERTIES}
            onClick={() => setSidebarOpened(false)}
          >
            Properties
          </Menu.Item>
          <Menu.Item
            name='admin'
            as={NavLink}
            to={routes.ADMIN}
            onClick={() => setSidebarOpened(false)}
          >
            Admin
          </Menu.Item>
        </Sidebar>
        <Sidebar.Pusher
          dimmed={sidebarOpened}
          onClick={() => (sidebarOpened ? setSidebarOpened(false) : null)}
          style={{ minHeight: '100vh' }}
        >
          <Segment
            inverted
            textAlign='center'
            vertical
            style={{ minHeight: '100px', padding: '1em 0em' }}
          >
            <AppHeader mobile />
            <Container>
              <Menu inverted pointing secondary size='large'>
                <Menu.Item onClick={() => setSidebarOpened(!sidebarOpened)}>
                  <Icon name='sidebar' />
                </Menu.Item>
              </Menu>
            </Container>
          </Segment>
          {children}
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    </Responsive>
  );
}
```

Worth noting:

- We are following the same patterns from DesktopContainer - using style, using NavLink, etc. The differences simply reflect the fact that we want to render a different looking menu for different devices.
- VERY IMPORTANT - I am using the useState hook in this component (https://reactjs.org/docs/hooks-state.html). We have access to this because of the updates we made in a previous post to use the 16.7-alpha release of React. THIS IS NOT RECOMMENDED FOR PRODUCTION USE. One of our goals in this application is exploring the new features of React and this is a very exciting new feature. In this component the use of the useState hook has allowed us to create a function component instead of a class component. This reduces some of the boilerplate we would have written previously. Also, function components tend to be less complex in general so we prefer them to class components and will always right a function component unless a feature of the component dictates the need for a class component (with the hooks release of React that be minimal).

## Headers

Our menu is actually slightly more than just a menu. It contains an important piece of application real-estate. We can use this real-estate to incorporate some branding. We will keep it light for now but we do want to give ourselves some flexibility. To that end, I will start to collect constants in file that we can easily change if we wanted to re-label the application, or change anything else that feels company specific. I've also created an assets folder where we can start to pull in the static assets (images, etc) that will be part of the application. Lastly, I will create a mobile prop that lets us identify whether the header is being displayed on the mobile (or desktop) menu. This lets adjust the styling accordingly.

```jsx title="AppHeader.jsx"
import React from 'react';
import { Container, Header, Image } from 'semantic-ui-react';
import { COMPANY_LABEL } from '../../../../shared/constants/company';
import logo from '../../../../assets/logo.png';

export default function AppHeader({ mobile }) {
  return (
    <Container text>
      <Header
        as='h1'
        inverted
        style={{
          fontSize: mobile ? '1em' : '2em',
          fontWeight: 'normal',
          marginBottom: 0,
          marginTop: mobile ? '0em' : '0em',
        }}
      >
        <Image src={logo} size='huge' /> {COMPANY_LABEL}
      </Header>
    </Container>
  );
}
```

```jsx title="Updated App.jsx"
...
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowserRouter>
        <ResponsiveContainer>
          <Switch>
            <Route path={routes.REGISTER} component={Register} />
            <Route path={routes.FORGOTPASSWORD} component={ForgotPassword} />
            <Route path={routes.PROPERTIES} component={Properties} />
            <Route path={routes.ADMIN} component={Admin} />
            <Route component={Login} />
          </Switch>
        </ResponsiveContainer>
      </BrowserRouter>
    </Suspense>
  );
}
...
```

Worth noting:

- Notice that Switch is now wrapped in the ResponsiveContainer component. This is the only change required to add menus (containers) to the application.

At this point you should be able to run the application. At desktop sizes you should see the desktop menu, at mobile sizes you should see the mobile menu. You will notice that the only routes I'm showing in the menus are Properties and Admin. We will talk more about this later.

## Notes

You may be wondering about the Admin route and who should have access to it. We will address this in a future post.

While I was doing some of the other styling-like tasks in this post I was reminded that I still needed to cleanup some of the boilerplate from Create React App. I added a new favion and updated index.html and manifest.json to reflect this change. I made some further changes to index.html and manifest.json to reflect the name of our application.

I want to make one last, quick comment on style. At this point in building the application I don't want to get bogged down thinking about style and color. In fact, these choices would likely be driven by a customer. So, at this point I am keeping things simple with a largely mono-chromatic application, using the Semantic UI defaults for things like primary and secondary button colors.

## Next

It feels like we've put some groundwork in place in this post but we have a lot of follow-up tasks to really get things working. In the next post we will continue with navigation and tackle a couple of our outstanding issues.

## Code

<https://github.com/peterdyer7/media-library/tree/8.Navigation>
