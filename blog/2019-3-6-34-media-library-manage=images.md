---
slug: 34-media-library-manage=images
title: 34. Media Library - Manage Images
authors: peter
tags: [timestamp conversion]
---

In this post we will create the ability to manage an image - update the metadata or delete the image.

<!--truncate-->

## Background

There are no new concepts introduced in this post we are continuing to follow the patterns we have seen throughout the application.

## Walk Through

Let's start with something a little bit new. I want to display a bunch of the metadata we have stored for an image. Some of our important metadata is stored as Timestamps in Cloud Firestore. I want to create a really simple utility function that will convert the timestamp to a date that is much more human readable. I'm going to store this utility under our shared folder. If we had other utility functions we could store them similarly. Also, I am keeping the filename generic as we might end up with different datetime conversion functions.

```js title="shared/utils/datetime.js"
export const convertTimestampToDate = (timestamp) => {
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
};
```

We are going to need a bunch of things from the store to support managing an image. So, let's create a container version of our component to get what we need.

```jsx title="AdminPropertyImageContainer.jsx"
import { connect } from 'react-redux';

import AdminPropertyImage from '../../../../components/admin/AdminProperty/AdminPropertyImage/AdminPropertyImage';
import {
  imageFetch,
  imageUpdate,
  imageDelete,
} from '../../../../shared/redux/actions/images';
import { fetchSettings } from '../../../../shared/redux/actions/settings';

const mapStateToProps = (state, ownProps) => ({
  image: state.images.images.filter(
    (image) => image.id === ownProps.match.params.imageId
  )[0],
  loadingImages: state.images.loading,
  errorImages: state.images.error,
  settings: state.settings.settings,
  loadingSettings: state.settings.loading,
  errorSettings: state.settings.error,
});

const mapDispatchToProps = (dispatch) => ({
  boundImageFetch: (imageId) => dispatch(imageFetch(imageId)),
  boundImageUpdate: (image) => dispatch(imageUpdate(image)),
  boundSettingsFetch: (type) => dispatch(fetchSettings(type)),
  boundImageDelete: (image) => dispatch(imageDelete(image)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AdminPropertyImage);
```

Before we update the main component I want to create a helper component that will display read-only metadata that we want to show a user but not let them edit. This is an extremely straightforward component. Note that we are calling the utility function we created above to convert a timestamp to a more human readable date.

```jsx title="ReadOnlyMetadatat.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Header, List } from 'semantic-ui-react';

import { convertTimestampToDate } from '../../../../../shared/utils/datetime';

export default function ReadOnlyMetadata({ image }) {
  return (
    <>
      <Header content='Read-only metadata' size='medium' />
      <List>
        <List.Item>
          <List.Header>ID</List.Header>
          {image.id}
        </List.Item>
        <List.Item>
          <List.Header>File name</List.Header>
          {image.name}
        </List.Item>
        <List.Item>
          <List.Header>URL</List.Header>
          {image.url}
        </List.Item>
        <List.Item>
          <List.Header>Size (bytes)</List.Header>
          {image.size}
        </List.Item>
        <List.Item>
          <List.Header>Type</List.Header>
          {image.type}
        </List.Item>
        <List.Item>
          <List.Header>Uploaded</List.Header>
          {convertTimestampToDate(image.uploaded)}
        </List.Item>
      </List>
    </>
  );
}

ReadOnlyMetadata.propTypes = {
  image: PropTypes.object.isRequired,
};
```

Now we can go ahead and pull together our AdminPropertyImage component.

Note that in addition to the read-only metadata component we are using the UploadImageForm to allow us to update existing data. I mentioned that we were going to do this in the last post. This is a pattern I like to follow when I can - leverage the same form for create and update (minimize duplication of code). I had to make a couple very minor adjustments to the prop-types we set previously to make this work.

```jsx title="AdminPropertyImage.jsx"
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Header,
  Dimmer,
  Loader,
  Container,
  Image,
  Grid,
  Segment,
  Confirm,
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import UploadImageForm from '../AdminPropertyImages/UploadImage/UploadImageForm';
import ReadOnlyMetadata from './ReadOnlyMetadata/ReadOnlyMetadata';
import * as routes from '../../../../shared/constants/routes';

export default function AdminPropertyImage({
  history,
  match,
  image,
  loadingImages,
  errorImages,
  boundImageFetch,
  boundImageUpdate,
  boundImageDelete,
  settings,
  loadingSettings,
  errorSettings,
  boundSettingsFetch,
}) {
  const [deleteImageConfirmOpen, setDeleteImageConfirmOpen] = useState(false);

  useEffect(() => {
    if (!image) {
      boundImageFetch(match.params.imageId);
    }

    if (Object.keys(settings).length === 0) {
      boundSettingsFetch('imageMetadata');
    }
  }, []);

  const handleConfirm = () => {
    boundImageDelete(image);
    setDeleteImageConfirmOpen(!deleteImageConfirmOpen);
    history.goBack();
  };

  if (errorImages) {
    return <>Error! {errorImages}</>;
  }
  if (errorSettings) {
    return <>Error! {errorSettings}</>;
  }

  if (loadingImages || loadingSettings) {
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
          to={`${routes.ADMIN}${routes.ADMINPROPERTIES}/${match.params.propertyId}${routes.ADMINPROPERTYIMAGES}`}
        />

        {image && (
          <>
            {/* <Header as="h3" textAlign="center">
                {image.name}
              </Header> */}
            <Grid stackable padded columns={2}>
              <Grid.Row>
                <Grid.Column>
                  <Segment>
                    <Image src={image.url} />
                  </Segment>
                  <Segment>
                    <ReadOnlyMetadata image={image} />
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <Header content='Configurable metadata' size='medium' />
                    <UploadImageForm
                      isUpload={false}
                      image={image}
                      imageUpdate={boundImageUpdate}
                    />
                  </Segment>
                  <Button
                    color='red'
                    id='deleteButton'
                    basic
                    compact
                    size='tiny'
                    onClick={() =>
                      setDeleteImageConfirmOpen(!deleteImageConfirmOpen)
                    }
                  >
                    Delete image?
                  </Button>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </>
        )}
      </Container>
      <Confirm
        open={deleteImageConfirmOpen}
        content={`Are you sure you want to delete this image?`}
        onCancel={() => setDeleteImageConfirmOpen(!deleteImageConfirmOpen)}
        onConfirm={handleConfirm}
        size='mini'
      />
    </>
  );
}

AdminPropertyImage.propTypes = {
  history: PropTypes.object,
  match: PropTypes.object.isRequired,
  image: PropTypes.object,
  loadingImages: PropTypes.bool,
  errorImages: PropTypes.string,
  boundImageFetch: PropTypes.func.isRequired,
  boundImageUpdate: PropTypes.func.isRequired,
  boundImageDelete: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  loadingSettings: PropTypes.bool,
  errorSettings: PropTypes.string,
  boundSettingsFetch: PropTypes.func.isRequired,
};
```

As always the last thing I need to do is swap out the non-container version of the component for the container version when the component gets rendered to have the state automatically attached. Note that we continue to follow a pattern that will allow links from our application to be shared and the application will work as expected.

```jsx title="AdminProperty.jsx (updates)"
...
//import AdminPropertyImage from './AdminPropertyImage/AdminPropertyImage';
import AdminPropertyImageContainer from '../../../containers/admin/AdminProperty/AdminPropertyImage/AdminPropertyImageContainer';
...
        />
        <Route
          path={routes.ADMIN + routes.ADMINPROPERTY + routes.ADMINPROPERTYIMAGE}
          component={AdminPropertyImageContainer}
        />
...
```

In this branch I also did a tiny bit of cleanup to move a folder back to the correct location.

## Next

It feels like we have been working on the admin side of this application for quite a while. Let's switch gears and attempt to add some value to the images we are loading.

## Code

<https://github.com/peterdyer7/media-library/tree/34.ManageImage>
