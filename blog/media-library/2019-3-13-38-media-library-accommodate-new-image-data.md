---
slug: 38-media-library-accommodate-new-image-data
title: 38. Media Library - Accommodate New Image Data
authors: peter
tags: []
---

We have spent the past several posts working with Firebase Functions, in part to enhance images. We have added additional metadata and we are generating additional image sizes. In this post we can start to account for these changes.

<!--truncate-->

## Background

We are not introducing any new concepts in this post. We will continue to evolve what we have previously created.

## Walk Through

Now that we are generating new "small" and "thumb" versions of an image I want to be sure to delete them if a user deletes the image.

```js title="actions/images.js (updates)"
...
// delete file(s) from storage
    await deleteFile(image.id, image.name);
    if (image.repros.thumbnail) {
      await deleteFile(image.id, `thumb_${image.name}`);
    }
    if (image.repros.small) {
      await deleteFile(image.id, `small_${image.name}`);
    }
...
```

Similarly, we are generating additional metadata for each image. I want to be sure to remove that data when an image is deleted.

```js title="db/images.js (updates)"
...
export const deleteImage = async (id) => {
  try {
    await db
      .collection('labels')
      .doc(id)
      .delete();
    await db
      .collection('safeSearch')
      .doc(id)
      .delete();
    await db
      .collection('webDetection')
      .doc(id)
      .delete();
    await db
      .collection('exif')
      .doc(id)
      .delete();
    await db
      .collection('images')
      .doc(id)
      .delete();
    return;
  } catch (err) {
    throw err;
  }
};
...
```

Next, let's be sure to use the thumbnail we are generating if it is created (when first uploaded it won't exist yet). In the Admin section of our app on the ImagesList component we are displaying a very small image where the thumbnail is appropriate to show. We will use the "small" size in a future post.

```jsx title="ImagesList.jsx (updates)"
...
            <Image
              size="small"
              src={
                image.repros
                  ? image.repros.thumbnail
                    ? image.repros.thumbnail
                    : image.url
                  : image.url
              }
            />
...
```

Fetch the new data we are gathering

Display some of the new data on screen in the admin section as an indication that we have the data

We have a few different options for how to use the new image metadata we are generating. We might want to change how this behaves in the future, but for now I am going to add a new object to the store called "selectedImage". When we select an individual image I will load data to this object. This requires some adjustments to our images reducer.

```js title="reducer/images.js (updates)"
...
const INITIAL_STATE = {
  images: [],
  selectedImage: {},
  error: '',
  loading: false
};
...
const imagesFetchStart = (state, action) => ({
  ...state,
  error: '',
  loading: true
});
...
const imagesFetchSuccess = (state, action) => ({
  ...state,
  images: action.images,
  loading: false
});

const imageFetchStart = (state, action) => ({
  ...state,
  selectedImage: {},
  error: '',
  loading: true
});

const imageFetchSuccess = (state, action) => {
  return { ...state, selectedImage: action.image, loading: false };
};
...
    case IMAGES_FETCH_SUCCESS: {
      return imagesFetchSuccess(state, action);
    }
...
    case IMAGE_FETCH_SUCCESS: {
      return imageFetchSuccess(state, action);
    }
...
```

We will update our fetchImage database call to attach the new metadata.

```js title="db/images.js (updates)"
...
export const fetchImage = async (imageId) => {
  try {
    const imageDoc = await db
      .collection('images')
      .doc(imageId)
      .get();
    if (imageDoc.exists) {
      return addMetadata(imageDoc.data());
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

const addMetadata = async (image) => {
  const imageId = image.id;

  const labelsDoc = await db
    .collection('labels')
    .doc(imageId)
    .get();
  const safeSearchDoc = await db
    .collection('safeSearch')
    .doc(imageId)
    .get();
  const webDetectionDoc = await db
    .collection('webDetection')
    .doc(imageId)
    .get();
  const exifDoc = await db
    .collection('exif')
    .doc(imageId)
    .get();

  return {
    ...image,
    ...labelsDoc.data(),
    ...safeSearchDoc.data(),
    ...webDetectionDoc.data(),
    exif: exifDoc.data()
  };
};
...
```

We will adjust the AdminPropertyImageContainer to use the new selectedImage instead of an image from the images array in the store.

```jsx title="AdminPropertyImageContainer.jsx (updates)"
...
  image: state.images.selectedImage,
...
```

From there we can update AdminPropertyImage based on the new data we now have available. Before we update AdminPropertyImage let's create a couple new components to display some of our new data.

```jsx title="SafeSearch.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Header, Table } from 'semantic-ui-react';

export default function SafeSearch({ safeSearch }) {
  return (
    <>
      <Header content='Explicit content analysis' size='medium' />
      <Table compact unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Category</Table.HeaderCell>
            <Table.HeaderCell>Result</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row key='adult'>
            <Table.Cell>Adult</Table.Cell>
            <Table.Cell>{safeSearch.adult}</Table.Cell>
          </Table.Row>
          <Table.Row key='medical'>
            <Table.Cell>Medical</Table.Cell>
            <Table.Cell>{safeSearch.medical}</Table.Cell>
          </Table.Row>
          <Table.Row key='racy'>
            <Table.Cell>Racy</Table.Cell>
            <Table.Cell>{safeSearch.racy}</Table.Cell>
          </Table.Row>
          <Table.Row key='spoof'>
            <Table.Cell>Spoof</Table.Cell>
            <Table.Cell>{safeSearch.spoof}</Table.Cell>
          </Table.Row>
          <Table.Row key='violence'>
            <Table.Cell>Violence</Table.Cell>
            <Table.Cell>{safeSearch.violence}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </>
  );
}

SafeSearch.propTypes = {
  safeSearch: PropTypes.object.isRequired,
};
```

```jsx title="Labels.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Header, Table } from 'semantic-ui-react';

export default function Labels({ labels }) {
  return (
    <>
      <Header content='Lables detected' size='medium' />
      <Table compact unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Label</Table.HeaderCell>
            <Table.HeaderCell>Confidence</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {labels.map((label, index) => (
            <Table.Row key={index}>
              <Table.Cell>{label.description}</Table.Cell>
              <Table.Cell>{(label.score * 100).toFixed(2)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

Labels.propTypes = {
  labels: PropTypes.array.isRequired,
};
```

Finally, let's rearrange and update the AdminPropertyImage component with these new components.

```jsx title="AdminPropertyImage.jsx (updated)"
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
import SafeSearch from './SafeSearch/SafeSearch';
import Labels from './Labels/Labels';

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
    if (!loadingImages) {
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

  if (Object.keys(image).length === 0 || loadingImages || loadingSettings) {
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
            <Grid stackable padded columns={2}>
              <Grid.Row>
                <Grid.Column>
                  <Segment>
                    <Image src={image.url} />
                  </Segment>

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
                <Grid.Column>
                  <Segment>
                    <ReadOnlyMetadata image={image} />
                  </Segment>
                  <Segment>
                    <SafeSearch safeSearch={image.safeSearch} />
                  </Segment>
                  <Segment>
                    <Labels labels={image.labels} />
                  </Segment>
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

There is more we could do to display additional data but we will leave it here for now. It probably makes more sense for that to happen on the User side of the application.

## Next

This will end our work on the Admin side of the application for now. It is time to turn our attention to what users will see when they login to the application.

## Code

https://github.com/peterdyer7/media-library/tree/38.NewImageData
