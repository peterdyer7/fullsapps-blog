---
slug: 40-media-library-property-with-map-for-users
title: 40. Media Library - Property, with map, for Users
authors: peter
tags: [Leaflet, React Router, React-Leaflet]
---

In the last post we created a property list from which users can select a property. In this post we continue by creating the property components/pages.

<!--truncate-->

## Background

There is one new concept I want to introduce in this post. When we display property details I want to display a map with the location of the property. I've decided to use Leaflet, and the React helper library React-Leaflet. In my opinion Leaflet is the best open-source option for displaying the map we want.

<https://react-leaflet.js.org/>
<https://leafletjs.com/>

## Walk Through

Let's start by create the property container to pull in the bits of the store we will need. We want a specific property, its images and the settings. Notice that we are using ownProps to leverage the property ID from the url to filter on a specific property.

```jsx title="PropertyContainer.jsx"
import { connect } from 'react-redux';

import Property from '../../../../components/user/Properties/Property/Property';
import { propertyFetch } from '../../../../shared/redux/actions/properties';
import { imagesPropertyFetch } from '../../../../shared/redux/actions/images';
import { fetchSettings } from '../../../../shared/redux/actions/settings';

const mapStateToProps = (state, ownProps) => ({
  property: state.properties.properties.filter(
    (property) => property.id === ownProps.match.params.propertyId
  )[0],
  propertyLoading: state.properties.loading,
  propertyError: state.properties.error,
  images: state.images.images.filter(
    (image) =>
      image.properties.includes(ownProps.match.params.propertyId) &&
      image.active
  ),
  imagesLoading: state.images.loading,
  iamgesError: state.images.error,
  settings: state.settings.settings,
});
const mapDispatchToProps = (dispatch) => ({
  boundPropertyFetch: (id) => dispatch(propertyFetch(id)),
  boundImagesPropertyFetch: (id) => dispatch(imagesPropertyFetch(id)),
  boundSettingsFetch: (type) => dispatch(fetchSettings(type)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Property);
```

We will now replace the Property component rendered by react-router to leverage our new container component.

```jsx title="AppRouting.jsx (updates)"
...
//const Property = lazy(() => import('../../user/Properties/Property/Property'));
const PropertyContainer = lazy(() =>
  import('../../../containers/user/Properties/Property/PropertyContainer')
);
...
            <Route path={routes.PROPERTY} component={PropertyContainer} />

...
```

We will turn our current placeholder property component into a landing page from which various property related components are rendered via react-router. We will start by creating some new routes.

```js title="routes.js (updates)"
...
export const IMAGES = '/images';
export const IMAGE = '/images/:imageId';
export const DETAILS = '/details';
...
```

Then we can create some placeholder components for the new components we will render from the Property component.

```jsx title="Detail.jsx"
import React from 'react';

export default function Detail() {
  return <>Property Detail</>;
}

Images.jsx
import React from 'react';

export default function Images() {
  return <>Property Images</>;
}
```

```jsx title="Image.jsx"
import React from 'react';

export default function Image() {
  return <>Property Image</>;
}
```

Now we can update the Property component itself.

```jsx title="Property.jsx (updated)"
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Menu,
  Button,
  Header,
  Dimmer,
  Loader,
  Container,
} from 'semantic-ui-react';
import { Link, NavLink, Switch, Route, Redirect } from 'react-router-dom';

import Detail from './Detail/Detail';
import Images from './Images/Images';
import Image from './Image/Image';
import * as routes from '../../../../shared/constants/routes';

export default function Property({
  propertyError,
  propertyLoading,
  property,
  imagesError,
  imagesLoading,
  images,
  settings,
  match,
  boundPropertyFetch,
  boundImagesPropertyFetch,
  boundSettingsFetch,
}) {
  useEffect(() => {
    if (!property) {
      boundPropertyFetch(match.params.propertyId);
    }
    // TODO: consider looking through the state to see what images exist
    boundImagesPropertyFetch(match.params.propertyId);

    if (Object.keys(settings).length === 0) {
      boundSettingsFetch('imageMetadata');
    }
  }, []);

  if (propertyError) {
    return <>Error! {propertyError}</>;
  }

  if (imagesError) {
    return <>Error! {imagesError}</>;
  }

  if (!property || propertyLoading || imagesLoading) {
    return (
      <>
        <Dimmer active>
          <Loader />
        </Dimmer>
      </>
    );
  }

  return (
    <>
      <Container>
        <br />
        <Button
          content='All Properties'
          icon='left arrow'
          labelPosition='left'
          as={Link}
          to={routes.PROPERTIES}
        />
        <Header as='h3' textAlign='center'>
          {property.name}
        </Header>
        <Menu pointing secondary>
          <Menu.Item
            name='Images'
            as={NavLink}
            to={match.url + routes.IMAGES}
          />
          <Menu.Item
            name='Details'
            as={NavLink}
            to={match.url + routes.DETAILS}
          />
        </Menu>
        <Switch>
          <Route
            path={match.url + routes.IMAGES}
            exact
            render={() => (
              <Images
                images={images}
                settings={settings}
                propertyId={match.params.propertyId}
              />
            )}
          />
          <Route path={routes.PROPERTY + routes.IMAGE} component={Image} />
          <Route
            path={match.url + routes.DETAILS}
            render={() => <Detail property={property} />}
          />
          <Redirect to={match.url + routes.IMAGES} />
        </Switch>
      </Container>
    </>
  );
}

Property.propTypes = {
  match: PropTypes.object.isRequired,
  property: PropTypes.object,
  propertyError: PropTypes.string.isRequired,
  propertyLoading: PropTypes.bool.isRequired,
  imagesError: PropTypes.string,
  imagesLoading: PropTypes.bool.isRequired,
  images: PropTypes.array.isRequired,
  settings: PropTypes.object.isRequired,
  boundPropertyFetch: PropTypes.func.isRequired,
  boundImagesPropertyFetch: PropTypes.func.isRequired,
  boundSettingsFetch: PropTypes.func.isRequired,
};
```

Since we are not yet rendering anything everything will appear to work at this point. However, as we did in the previous post, we need to add to our authorization rules to allow users to read images and settings.

```title="authorization rules (updates)"
...
    match /images/{document=**} {
      allow get, list: if request.auth.uid != null;
    }
    match /settings/{document=**} {
      allow get, list: if request.auth.uid != null;
    }
...
```

Let's go one step further and implement the Details component. I want to display the map I discussed above in the Background section on the Details component. In order to create the map we need to install some new libraries.

```bash
npm install --save leaflet react-leaflet
```

To create the map itself I am following the leaflet documentation closely. I am going to use latitude and longitude to pinpoint the property on the map. As such, I am only going to display to the map if I have the latitude and longitude for the selected property.

```jsx title="PropertyMap.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function PropertyMap({ latitude, longitude }) {
  const position = [latitude, longitude];
  return (
    <Map center={position} zoom={13} style={{ width: '100%', height: '400px' }}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <Marker position={position}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </Map>
  );
}

PropertyMap.propTypes = {
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
};
```

Lastly, let's update the placeholder Detail component created above to display property details and the map.

```jsx title="Detail.jsx (updated)"
import React from 'react';
import PropTypes from 'prop-types';
import { Table, Grid, Icon } from 'semantic-ui-react';

import PropertyMap from '../PropertyMap/PropertyMap';

export default function Detail({ property }) {
  if (!property) {
    return <>No property selected.</>;
  }

  return (
    <Grid stackable columns={2}>
      <Grid.Column>
        <Table definition compact>
          <Table.Body>
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
      </Grid.Column>
      <Grid.Column>
        {property.latitude && property.longitude && (
          <PropertyMap
            latitude={property.latitude}
            longitude={property.longitude}
          />
        )}
      </Grid.Column>
    </Grid>
  );
}

Detail.propTypes = {
  property: PropTypes.object.isRequired,
};
```

## Next

In the next post we will turn our attention to displaying images for the selected property.

## Code

https://github.com/peterdyer7/media-library/tree/40.Property
