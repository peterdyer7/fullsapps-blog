---
slug: 41-media-library-property-with-map-for-users
title: 41. Media Library - Property, with map, for Users
authors: peter
tags: [react-select, useEffect]
---

In this post we will finally get to the key part of the application - letting users select and download images.

<!--truncate-->

## Background

For the most part this post is about pulling together a lot of the concepts we have applied elsewhere.

## Walk Through

Let's start by replacing our Images component placeholder with a component that will display all of the images for a selected property.

Before we create the component itself I want to create a helper component. I want to be able to let users filter the list of displayed images. We can use react-select to help. I'm going to create a generic component that uses react-select to allow us to generically identify a list for filtering.

```jsx title="MultiSettingSelect.jsx"
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

export default function MultiSettingSelect({
  values,
  label,
  id,
  handleChange,
}) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const temp = values.map((value) => ({ value: value, label: value }));
    setOptions(temp);
  }, []);

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <Select
        id={id}
        name={id}
        options={options}
        isMulti
        onChange={handleChange}
      />
    </>
  );
}

MultiSettingSelect.propTypes = {
  values: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
};
```

With that done we can create the Images component itself. There are some things worth noting in this component. First, we are leveraging cards from Semantic UI React. This is a simple way to group "like" data. Second, this is where we are using the "small" image we are creating whenever an image is uploaded. It would not make sense to download and display the fullsize image on a card.

Next, notice the use of useEffect. As we have throughout this project we are using it to load data when the component is loaded. However, we are also using it in a more sophisticated way to manage how our filters are applied. If a user changes any filters (adds to or removes) it triggers useEffect to run and update the list of displayed images.

```jsx title="Images.jsx"
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Image,
  Button,
  Segment,
  Header,
  Table,
  Grid,
  Dimmer,
  Loader,
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import MultiSettingSelect from '../../../../UI/selects/MultiSettingSelect/MultiSettingSelect';
import * as routes from '../../../../../shared/constants/routes';

export default function Images({
  images,
  loading,
  error,
  propertyId,
  settings,
  boundImagesPropertyFetch,
  boundSettingsFetch,
}) {
  const [filteredImages, setFilteredImages] = useState(images);
  const [primaryCategoryFilters, setPrimaryCategoryFilters] = useState([]);
  const [secondaryCategoryFilters, setSecondaryCategoryFilters] = useState([]);
  const [tagFilters, setTagFilters] = useState([]);

  useEffect(() => {
    // TODO: consider looking through the state to see what images exist
    boundImagesPropertyFetch(propertyId);

    if (Object.keys(settings).length === 0) {
      boundSettingsFetch('imageMetadata');
    }
  }, []);

  useEffect(() => {
    let tempImages = images;

    let temp = primaryCategoryFilters.map((v) => v.value);
    if (temp.length > 0) {
      tempImages = tempImages.filter((image) =>
        temp.includes(image.primaryCategory)
      );
    }

    temp = secondaryCategoryFilters.map((v) => v.value);
    if (temp.length > 0) {
      tempImages = tempImages.filter((image) =>
        temp.includes(image.secondaryCategory)
      );
    }

    temp = tagFilters.map((v) => v.value);
    if (temp.length > 0) {
      tempImages = tempImages.filter(
        (image) => image.tags && image.tags.some((r) => temp.includes(r))
      );
    }

    setFilteredImages(tempImages);
  }, [primaryCategoryFilters, secondaryCategoryFilters, tagFilters, images]);

  if (error) {
    return <>Error! {error}</>;
  }

  if (loading || Object.keys(settings).length === 0) {
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
      <Segment>
        <Header size='medium'>Filters</Header>
        <Grid columns={3}>
          <Grid.Row>
            <Grid.Column>
              <MultiSettingSelect
                values={settings.primaryCategory}
                label='Category'
                id='primaryCategory'
                handleChange={(values) => setPrimaryCategoryFilters(values)}
              />
            </Grid.Column>
            <Grid.Column>
              <MultiSettingSelect
                values={settings.secondaryCategory}
                label='Alt Category'
                id='secondaryCategory'
                handleChange={(values) => setSecondaryCategoryFilters(values)}
              />
            </Grid.Column>
            <Grid.Column>
              <MultiSettingSelect
                values={settings.tags}
                label='Tags'
                id='tags'
                handleChange={(values) => setTagFilters(values)}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
      <Card.Group centered>
        {filteredImages.map((image) => (
          <Card key={image.name}>
            <Image
              src={
                image.repros
                  ? image.repros.small
                    ? image.repros.small
                    : image.url
                  : image.url
              }
              style={{ maxHeight: 220, objectFit: 'cover' }}
            />
            <Card.Content>
              <Card.Header>{image.caption}</Card.Header>
              <Card.Description>
                <Table celled compact definition>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell collapsing>Category</Table.Cell>
                      <Table.Cell>{image.primaryCategory}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell collapsing>Alt Category</Table.Cell>
                      <Table.Cell>{image.secondaryCategory}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell collapsing>Tags</Table.Cell>
                      <Table.Cell>
                        {image.tags && image.tags.join(', ')}
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Card.Description>
            </Card.Content>
            <Card.Content extra>
              <Button
                basic
                as={Link}
                to={`${routes.PROPERTIES}/${propertyId}${routes.IMAGES}/${image.id}`}
              >
                Details
              </Button>
              <Button basic as='a' href={image.url} download>
                Download
              </Button>
            </Card.Content>
          </Card>
        ))}
      </Card.Group>
    </>
  );
}

Images.propTypes = {
  images: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  propertyId: PropTypes.string.isRequired,
  settings: PropTypes.object.isRequired,
  boundImagesPropertyFetch: PropTypes.func.isRequired,
  boundSettingsFetch: PropTypes.func.isRequired,
};
```

We will also create a corresponding container component.

```jsx title="ImagesContainer.jsx"
import { connect } from 'react-redux';

import Images from '../../../../../components/user/Properties/Property/Images/Images';
import { imagesPropertyFetch } from '../../../../../shared/redux/actions/images';
import { fetchSettings } from '../../../../../shared/redux/actions/settings';

const mapStateToProps = (state, ownProps) => ({
  images: state.images.images.filter(
    (image) => image.properties.includes(ownProps.propertyId) && image.active
  ),
  loading: state.images.loading,
  error: state.images.error,
  settings: state.settings.settings,
});
const mapDispatchToProps = (dispatch) => ({
  boundImagesPropertyFetch: (id) => dispatch(imagesPropertyFetch(id)),
  boundSettingsFetch: (type) => dispatch(fetchSettings(type)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Images);
```

Next, we can replace our Image component placeholder with a component that displays more information about a selected image. For the time being I am going to reuse some of the component we used on the AdminPropertyImage component.

There is one extremely frustrating issue with this component (at least troubleshooting it was tricky). In this component I am using the Image component from Semantic UI React. That creates a name conflict with the component itself. It is easy to workaround this by renaming the Semanic UI React component but until I recognized there was a name conflict I was seeing some very strange behavior.

```jsx title="Image.jsx"
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Segment,
  Button,
  Container,
  Dimmer,
  Loader,
  Image as SemanticImage,
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import ConfigurableMetadata from '../../../../UI/images/ConfigurableMetadata/ConfigurableMetadata';
import ReadOnlyMetadata from '../../../../UI/images/ReadOnlyMetadata/ReadOnlyMetadata';
import SafeSearch from '../../../../UI/images/SafeSearch/SafeSearch';
import Labels from '../../../../UI/images/Labels/Labels';
import * as routes from '../../../../../shared/constants/routes';

export default function Image({
  image,
  loading,
  error,
  boundImageFetch,
  match,
}) {
  useEffect(() => {
    if (!loading) {
      boundImageFetch(match.params.imageId);
    }
  }, []);

  if (error) {
    return <>Error! {error}</>;
  }

  if (loading || Object.keys(image).length === 0) {
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
        <Button
          content='All Images'
          icon='left arrow'
          labelPosition='left'
          as={Link}
          to={`${routes.PROPERTIES}/${match.params.propertyId}${routes.IMAGES}`}
        />
        <Grid stackable padded columns={2}>
          <Grid.Row>
            <Grid.Column>
              <Segment>
                <SemanticImage src={image.url} />
              </Segment>
              <Segment>
                <Button basic as='a' href={image.url} download>
                  Download
                </Button>
              </Segment>
              <Segment>
                <ConfigurableMetadata image={image} />
              </Segment>
              <Segment>
                <ReadOnlyMetadata image={image} />
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>
                <SafeSearch safeSearch={image.safeSearch} />
              </Segment>
              <Segment>
                <Labels labels={image.labels} />
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </>
  );
}

Image.propTypes = {
  image: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  boundImageFetch: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
};
```

We will also create a corresponding container component.

```jsx title="ImageContainer.jsx"
import { connect } from 'react-redux';

import Image from '../../../../../components/user/Properties/Property/Image/Image';
import { imageFetch } from '../../../../../shared/redux/actions/images';

const mapStateToProps = (state) => ({
  image: state.images.selectedImage,
  loading: state.images.loading,
  error: state.images.error,
});

const mapDispatchToProps = (dispatch) => ({
  boundImageFetch: (imageId) => dispatch(imageFetch(imageId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Image);
```

I will update the Property component to render the container versions of Images and Image. Also, I want to refactor the Property component (and its container component). I was previously loading images and settings on this page. I am going to pass that responsibility down to the rendered components themselves (we did that above). This does a lot to simplify the Property component itself and it actually makes the rendered components (Images and Image) easier to reason about as well as they are getting the data they need from their own containers.

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
import ImagesContainer from '../../../../containers/user/Properties/Property/Images/ImagesContainer';
import ImageContainer from '../../../../containers/user/Properties/Property/Image/ImageContainer';
import * as routes from '../../../../shared/constants/routes';

export default function Property({
  property,
  error,
  loading,
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

  if (loading || !property) {
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
              <ImagesContainer propertyId={match.params.propertyId} />
            )}
          />
          <Route
            path={routes.PROPERTY + routes.IMAGE}
            component={ImageContainer}
            //render={() => <ImageContainer />}
          />
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
  error: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  boundPropertyFetch: PropTypes.func.isRequired,
};
```

```jsx title="PropertyContainer.jsx (updated)"
import { connect } from 'react-redux';

import Property from '../../../../components/user/Properties/Property/Property';
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

export default connect(mapStateToProps, mapDispatchToProps)(Property);
```

I will create a simple component to display our configuration metadata in a way that doesn't allow it to be edited. For now, we are limited standard users to view-only.

```jsx title="ConfigurableMetadata.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Header, List } from 'semantic-ui-react';

export default function ConfigurableMetadata({ image }) {
  return (
    <>
      <Header content='Configurable metadata' size='medium' />
      <List>
        <List.Item>
          <List.Header>Category</List.Header>
          {image.primaryCategory}
        </List.Item>
        <List.Item>
          <List.Header>Alt category</List.Header>
          {image.secondaryCategory ? image.secondaryCategory : <br />}
        </List.Item>
        <List.Item>
          <List.Header>Tags</List.Header>
          {image.tags ? image.tags.join(', ') : <br />}
        </List.Item>
      </List>
    </>
  );
}

ConfigurableMetadata.propTypes = {
  image: PropTypes.object.isRequired,
};
```

I have also done some refactoring to move components to more logical locations.

## Next

This is really the key place we have been driving to in this series of posts. We wanted to get to the point where we had a prototype application suitable for sharing with users to be able to engage with them and gather feedback. We will pause on creating any more code at this point and turn our attention to posting the application and capturing any information that might be helpful when we pick up coding in the future.

## Code

https://github.com/peterdyer7/media-library/tree/41.Images
