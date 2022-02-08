---
slug: 39-media-library-properties-for-users
title: 39. Media Library - Properties for Users
authors: peter
tags: []
---

We have done quite a lot of work to this point but we have yet to reach our most critical milestone - when we can turn over the application to a standard user to try the application and give us feedback. In this post we will finally start to add some GUI for the User (as opposed to the Admin, for whom we've added quite a bit of functionality).

<!--truncate-->

## Background

There are no new concepts in this post. We will be working primarily on something I refer to as the Users side of the application. When I say that, I'm attempting to distinguish between how a standard user will use the application as opposed to an admin user. We will be focusing on the Properties component/page which has been a placeholder up to this point. We'll be following a lot of the same patterns we developed when creating the Admin side of the application.

## Walk Through

We already have a Properties component, but it doesn't do anything except display a label. In order to do something with the Properties component we will first need to provide access to the store. As we have done in many other places in the application I am going to do this by creating a simple container component.

```jsx title="PropertiesContainer.jsx"
import { connect } from 'react-redux';

import Properties from '../../../components/user/Properties/Properties';
import { propertiesFetch } from '../../../shared/redux/actions/properties';

const mapStateToProps = (state) => ({
  properties: state.properties.properties,
  loading: state.properties.loading,
  error: state.properties.error,
  success: state.properties.success,
});

const mapDispatchToProps = (dispatch) => ({
  boundPropertiesFetch: () => dispatch(propertiesFetch()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Properties);
```

We can now change the component being rendered by react-router to the container version of the Properties component.

```jsx title="AppRouting.jsx (updates)"
...
//const Properties = lazy(() => import('../../user/Properties/Properties'));
const PropertiesContainer = lazy(() =>
  import('../../../containers/user/Properties/ProperitesContainer')
);
...
            <Route path={routes.PROPERTIES} component={PropertiesContainer} />
...
```

If you have been following along closely you may remember that when we implemented authorization we limited what non-admin users could do (or more accurately what they could do with data in Firestore). In order for users to access properties I need to update the authorization rules (remember that these updates are made in the Firebase Console in Database, which in our case is Cloud Firestore, on the Rules tab). We will let any user that logins in successfully get and list properties (but not create, update or delete properties).

```title="authorization rules (updates)"
...
    match /properties/{document=**} {
      allow get, list: if request.auth.uid != null;
    }
...
```

Let's create a component that displays a list of Properties and let's us select one. Our Properties list should be sortable. I am going to follow the example provided by Semantic UI React and they leverage lodash for sorting, so I will as well. We haven't installed lodash yet so I will do that first.

```bash
npm install --save lodash
```

```jsx title="PropertiesList.jsx"
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from 'semantic-ui-react';
import _ from 'lodash';

import * as routes from '../../../../shared/constants/routes';

export default function PropertyList({ properties, history }) {
  const [column, setColumn] = useState(null);
  const [data, setData] = useState(properties);
  const [direction, setDirection] = useState(null);

  function handleSort(clickedColumn) {
    if (column !== clickedColumn) {
      setColumn(clickedColumn);
      setData(_.sortBy(data, [clickedColumn]));
      setDirection('ascending');
    } else {
      setData(data.reverse());
      setDirection(direction === 'ascending' ? 'descending' : 'ascending');
    }
  }

  return (
    <>
      <br />
      <Table sortable celled compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              sorted={column === 'name' ? direction : null}
              onClick={() => handleSort('name')}
            >
              Property
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'country' ? direction : null}
              onClick={() => handleSort('country')}
            >
              Country
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'region' ? direction : null}
              onClick={() => handleSort('region')}
            >
              Region
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'brand' ? direction : null}
              onClick={() => handleSort('brand')}
            >
              Brand
            </Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {_.map(data, ({ id, name, country, region, brand }) => (
            <Table.Row key={id}>
              <Table.Cell>{name}</Table.Cell>
              <Table.Cell>{country}</Table.Cell>
              <Table.Cell>{region}</Table.Cell>
              <Table.Cell>{brand}</Table.Cell>
              <Table.Cell>
                <Button
                  basic
                  compact
                  onClick={() => history.push(`${routes.PROPERTIES}/${id}`)}
                >
                  View
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <br />
    </>
  );
}

PropertyList.propTypes = {
  properties: PropTypes.array.isRequired,
  history: PropTypes.object,
};
```

Now that we have the ability to select a property we can, and should, implement a placeholder page for the selected property. This page won't work very well but it will confirm everything is working.

```jsx title="Property.jsx"
import React from 'react';

export default function Property() {
  return <>Property</>;
}
```

We need to add a route that will render the Property component. Also, we need to adjust the properties routing to resolve the properties route only if an exact match is provided. That is, any navigation to /properties/:propertyId should render the Property component, only /properties should render the Properties component.

```js title="routes.js"
...
export const PROPERTY = '/properties/:propertyId';
...
```

```jsx title="AppRouting.jsx"
...
const Property = lazy(() => import('../../user/Properties/Property/Property'));
...
            <Route
              path={routes.PROPERTIES}
              exact
              component={PropertiesContainer}
            />
            <Route path={routes.PROPERTY} component={Property} />
...
```

## Next

In the next post we will work on the Property component.

## Code

https://github.com/peterdyer7/media-library/tree/Properties
