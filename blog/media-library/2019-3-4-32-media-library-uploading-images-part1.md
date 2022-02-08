---
slug: 32-media-library-uploading-images-part1
title: 32. Media Library - Uploading Images, Part 1
authors: peter
tags: [Firebase Storage]
---

In this post we will start to put the pieces in place to manage and upload images in the GUI.

<!--truncate-->

## Background

We are going to wire up our back-end image storage using Firebase Storage. For the time being we will use a single bucket. You can see more about Firebase Storage here: <https://firebase.google.com/docs/storage/web/start>.

## Walk Through

Let's start by creating configuring Firebase Storage. In the Firebase console click on the Storage tab and verify storage has been initialized. The only other thing I want to do in the console is verify who can access Storage. Rules can be set following the same patterns as what we implemented for Cloud Firestore. The only thing we want to do is to limit access to only logged in users.

```title="Rules"
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

We configure access to Firebase Storage in our application via the same configuration file we have used for configuring Auth and Firestore (remember that I can't share this file in the code repo because it contains specific config). This is what the updates to the config file look like, the bucket is identified in the config object.

```js title="firebase/firebase.js"
...
import 'firebase/storage';
...
  firebase.initializeApp(config);
...
const storage = firebase.storage();
...
export { ..., storage, ... };
```

With that done, I am going to follow the same patterns we have followed with Auth and Firestore by creating a wrapper around the functionality we want to use from the Storage SDK (remember that is playing the role of an API). The only things we want to be able to do is to upload and delete an individual file.

There are a couple important things worth noting here. One, all files are created inside a folder named with their ID (that is, the ID we are using to store metadata in the database). This will help us avoid name collisions if files with the same filename are loaded. Two, we are setting the Content-Disposition header (see: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition>) on uploaded files. This will make it easier to download images - something we want users to be able to do. The last thing you might notice is that I am skipping testing at this point. It is a little tricky to create the File object so for now we will test via the GUI.

```js title="firebase/storage.js"
import { storage } from '../firebase';

export const uploadFile = async (id, file) => {
  try {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`${id}/${file.name}`);
    const metadata = {
      contentDisposition: `attachment; filename=${file.name}`,
    };
    const res = await fileRef.put(file, metadata);

    const url = await fileRef.getDownloadURL();
    return { ...res, url };
  } catch (err) {
    throw err;
  }
};

export const deleteFile = async (folder, file) => {
  try {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`${folder}/${file}`);
    const res = await fileRef.delete();
    return res;
  } catch (err) {
    throw err;
  }
};
```

Now that we have the functionality we want we need to incorporate it into the process for uploading and deleting images. We can do that in the action creators we created in the last post. This pattern should look familiar, it is very similar to how we managed users in Auth and DB.

Note that we are making sure file upload succeeds before we write the image to the database. If it does fail we are throwing a custom error (that we have stored in our errors file). On the delete I am skipping ahead a little bit, I know that we will be creating a thumbnail version of the image so I am preparing to delete it as well.

```js title="redux/actions/images.js (updated)"
...
import { uploadFile, deleteFile } from '../../firebase/storage/storage';
...
export const imageUpload = (propertyId, imageId, imageFile, metadata) => async (
  dispatch
) => {
  let image = {
    id: imageId ? imageId : cuid(),
    active: false,
    status: 'loading',
    name: imageFile.name,
    lastModifiedDate: imageFile.lastModifiedDate,
    size: imageFile.size,
    type: imageFile.type,
    ...metadata,
    properties: [propertyId]
  };
  dispatch(imageUploadStart(image));
  try {
    const res = await uploadFile(image.id, imageFile);
    if (res) {
      image = {
        ...image,
        active: true,
        status: 'loaded',
        uploaded: new Date(res.metadata.timeCreated),
        updated: new Date(res.metadata.updated),
        url: res.url
      };
      await setImage(image);
      dispatch(imageUploadSuccess(image));
    } else {
      throw new Error(errors.UPLOAD_FAILED);
    }
  } catch (err) {
    image = {
      ...image,
      status: err.message
    };
    dispatch(imageUploadFail(image));
  }
};
...
export const imageDelete = (imageToDelete) => async (dispatch) => {
  let image = {
    ...imageToDelete,
    active: false,
    status: 'deleting'
  };
  dispatch(imageDeleteStart(image));
  try {
    // delete file(s) from storage
    await deleteFile(image.id, image.name);
    if (image.thumbUrl) {
      await deleteFile(image.id, `thumb_${image.name}`);
    }
    // delete database entries
    await deleteImage(image.id);
    image = { ...image, status: 'deleted' };
    dispatch(imageDeleteSuccess(image));
  } catch (err) {
    dispatch(imageDeleteFail(image));
  }
};
```

Now, we need to make some choices about how to surface image uploading in the GUI. For that, we are going to divide the AdminPropertyImages component into two sections, each of which will contain a different component. One section will list all images for the property and one section will allow new images to be uploaded to the property.

I'm going to leave the image upload section for the next post but we can save ourselves some time by working on the image list now.

```jsx title="ImagesList.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { List, Button, Image, Loader } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import * as routes from '../../../../../shared/constants/routes';

export default function ImagesList({ images, propertyId }) {
  return (
    <List divided>
      {images.map((image) => (
        <List.Item key={image.id}>
          <List.Content floated='right'>
            <Button
              basic
              as={Link}
              to={`${routes.ADMIN}${routes.ADMINPROPERTIES}/${propertyId}${routes.ADMINPROPERTYIMAGES}/${image.id}`}
            >
              Edit
            </Button>
          </List.Content>
          {image.active ? (
            <Image size='small' src={image.thumbUrl ? image.thumbUrl : image.url} />
          ) : (
            <Loader active inline />
          )}
          <List.Content>
            <List.Item>
              <List.Header>Caption:</List.Header>
              {image.caption}
            </List.Item>
            <List.Item>
              <List.Header>Category:</List.Header>
              {image.primaryCategory}
            </List.Item>
            <List.Item>
              <List.Header>File name</List.Header>
              {image.name}
            </List.Item>
          </List.Content>
        </List.Item>
      ))}
    </List>
  );
}

ImagesList.propTypes = {
  images: PropTypes.array.isRequired,
  propertyId: PropTypes.string.isRequired,
};
```

To make use of the image list and to get ready for the image upload component we need to update AdminPropertyImages.

```jsx title="AdminPropertyImages.jsx (updated)"
import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Segment, Icon, Header } from 'semantic-ui-react';

import ImagesList from './ImagesList/ImagesList';

export default function AdminPropertyImages({ images = [], propertyId }) {
  return (
    <>
      <Grid stackable columns={2}>
        <Grid.Row>
          <Grid.Column width={10}>
            <Segment>
              <ImagesList images={images} propertyId={propertyId} />
            </Segment>
          </Grid.Column>
          <Grid.Column width={6}>
            <Segment>
              <Header size='small'>
                <Icon name='upload' size='huge' />
                Upload Image
              </Header>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <br />
    </>
  );
}

AdminPropertyImages.propTypes = {
  images: PropTypes.array,
  propertyId: PropTypes.string.isRequired,
};
```

## Next

That's it for this post. I am stopping just short of uploading images. We will cover that next post.

## Code

<https://github.com/peterdyer7/media-library/tree/32.ImageUploadPart1>
