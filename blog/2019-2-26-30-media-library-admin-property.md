---
slug: 30-media-library-admin-property
title: 30. Media Library - Admin Property
authors: peter
tags: [React Router, Redux]
---

We previously created a landing page to administer or manage a property but we have left it blank to this point. In this post we will work on this page.

<!--truncate-->

## Background

In this post we are going to follow patterns that we have used before. We will go another layer deeper into inception (that's a movie reference that probably dates me) by adding another layer of nested menus and routing. We will also prepare for the creation of an image object that will be stored in global state. Again, we are using Redux as a cache to prevent constant round trips to the back-end to get data.

## Walk Through

If you are running the app, you can click on the Manage button in the Admin Properties list and you will see a unique component being rendered by React Router. You can confirm this by inspected the URL in the address bar. I am going to start by turning this into a bit of a landing page that separates the property details and the images we will eventually upload for the property.

Let's start by creating placeholder components for Property Details and Property Images and for an individual Property Image.

```jsx title="AdminPropertyDetails.jsx"
import React from 'react';

export default function AdminPropertyDetails() {
  return <>Admin Property Details</>;
}

AdminPropertyImages.jsx
import React from 'react';

export default function AdminPropertyImages() {
  return <>Admin Property Images</>;
}

AdminPropertyImage.jsx
import React from 'react';

export default function AdminPropertyImage() {
  return <>Admin Property Image</>;
}
```

In order to access these pages we need to update our list of routes (I'm also taking advantage of this update to change some of the routes we had created previously to be more human readable).

```js title="routes.js (updates)"
...
export const ADMINPROPERTIES = '/properties';
export const ADMINPROPERTY = '/properties/:propertyId';
export const ADMINSETTINGS = '/settings';
export const ADMINPROPERTYDETAILS = '/details';
export const ADMINPROPERTYIMAGES = '/images';
export const ADMINPROPERTYIMAGE = '/images/:imageId';
```

We will need to retrieve state for our Admin Property component, so, I am going to create a container as we have done before to retrieve the appropriate state and state manipulation functions.

```jsx title="AdminPropertyContainer.jsx"
import { connect } from 'react-redux';

import AdminProperty from '../../../../components/admin/AdminProperty/AdminProperty';
import { propertyFetch } from '../../../../shared/redux/actions/properties';

const mapStateToProps = (state, ownProps) => ({
  property: state.properties.properties.filter(
    (property) => property.id === ownProps.match.params.propertyId
  )[0],
  loading: state.properties.loading,
  error: state.properties.error,
});

const mapDispatchToProps = (dispatch) => ({
  boundPropertyFetch: (id) => dispatch(propertyFetch(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AdminProperty);
```

With that done we can create our Admin Property component. This follows a very similar to pattern to what we followed with the Admin component. Since we are now effectively rendering a property on top of the list of properties (that's not really what is happening but that is how it will appear to users) I am going to add a button that can navigate us back to the list of properties.

The one other point worth noting is that I am allowing a property to be passed in, but if it is not I am fetching the property. This will allow us to share links from the application and the application will still work. This means the app doesn't depend on being in a particular state - it puts the app in the state it expects. We use this pattern throughout the rest of the application as it makes sense.

```jsx title="AdminProperty.jsx (updated)"
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Header, Dimmer, Loader, Menu } from 'semantic-ui-react';
import { Link, NavLink, Switch, Route, Redirect } from 'react-router-dom';

import AdminPropertyDetails from './AdminPropertyDetails/AdminPropertyDetails';
import AdminPropertyImages from './AdminPropertyImages/AdminPropertyImages';
import AdminPropertyImage from './AdminPropertyImage/AdminPropertyImage';
import * as routes from '../../../shared/constants/routes';

export default function AdminProperty({
  error,
  loading,
  property,
  match,
  boundPropertyFetch,
}) {
  useEffect(() => {
    if (!property) {
      boundPropertyFetch(match.params.propertyId);
    }
  }, []);

  if (error) {
    return <>Error! {error}</>;
  }

  if (loading) {
    return (
      <>
        <Dimmer active={loading}>
          <Loader />
        </Dimmer>
      </>
    );
  }

  return (
    <>
      <Button
        content='All Properties'
        icon='left arrow'
        labelPosition='left'
        as={Link}
        to={'/admin'}
      />
      {property && (
        <Header as='h3' textAlign='center'>
          {property.name}
        </Header>
      )}
      <Menu pointing secondary>
        <Menu.Item
          name='Details'
          as={NavLink}
          to={match.url + routes.ADMINPROPERTYDETAILS}
        />
        <Menu.Item
          name='Images'
          as={NavLink}
          to={match.url + routes.ADMINPROPERTYIMAGES}
        />
      </Menu>
      <Switch>
        <Route
          path={match.url + routes.ADMINPROPERTYDETAILS}
          render={() => <AdminPropertyDetails property={property} />}
        />
        <Route
          path={match.url + routes.ADMINPROPERTYIMAGES}
          exact
          render={() => (
            <AdminPropertyImages propertyId={match.params.propertyId} />
          )}
        />
        <Route
          path={routes.ADMIN + routes.ADMINPROPERTY + routes.ADMINPROPERTYIMAGE}
          component={AdminPropertyImage}
        />
        <Redirect to={match.url + routes.ADMINPROPERTYDETAILS} />
      </Switch>
    </>
  );
}

AdminProperty.propTypes = {
  error: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  property: PropTypes.object,
  match: PropTypes.object.isRequired,
  boundPropertyFetch: PropTypes.func.isRequired,
};
```

To put it all together we need to replace the rendering of the stateless AdminProperty component for the stateful container version.

```jsx title="Admin.jsx (updated)"
...
//import AdminProperty from '../AdminProperty/AdminProperty';
import AdminPropertyContainer from '../../../containers/admin/AdminProperties/AdminProperty/AdminPropertyContainer';
..
          <Route
            path={match.path + routes.ADMINPROPERTY}
            component={AdminPropertyContainer}
          />
...
```

Before we wrap up this post, let's update the AdminPropertyDetails component to list what we know about the property.

```jsx title="AdminPropertyDetails.jsx (updated)"
import React from 'react';
import PropTypes from 'prop-types';
import { Table, Icon } from 'semantic-ui-react';

export default function AdminPropertyDetails({ property }) {
  return (
    <>
      <Table definition compact>
        <Table.Body>
          <Table.Row>
            <Table.Cell collapsing>Name</Table.Cell>
            <Table.Cell>{property.name}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Brand</Table.Cell>
            <Table.Cell>{property.brand}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Region</Table.Cell>
            <Table.Cell>{property.region}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Active</Table.Cell>
            <Table.Cell>
              {property.active ? (
                <Icon name='dot circle outline' />
              ) : (
                <Icon name='circle outline' />
              )}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Address line 1</Table.Cell>
            <Table.Cell>{property.address1}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Address line 2</Table.Cell>
            <Table.Cell>{property.address2}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>City</Table.Cell>
            <Table.Cell>{property.city}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>State/Province</Table.Cell>
            <Table.Cell>{property.state}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Country</Table.Cell>
            <Table.Cell>{property.country}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Zip/Postal Code</Table.Cell>
            <Table.Cell>{property.postalCode}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Latitude</Table.Cell>
            <Table.Cell>{property.latitude}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Longitude</Table.Cell>
            <Table.Cell>{property.longitude}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Contact person</Table.Cell>
            <Table.Cell>{property.contactPerson}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Contact phone number</Table.Cell>
            <Table.Cell>{property.contactPhone}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </>
  );
}

AdminPropertyDetails.propTypes = {
  property: PropTypes.object,
};
```

## Next

We will start to turn our attention to working with images on properties.

## Code

<https://github.com/peterdyer7/media-library/tree/30.AdminProperty>
