---
slug: 31-media-library-getting-started-with-images
title: 31. Media Library - Getting Started With Images
authors: peter
tags: [Cloud Firestore, Redux]
---

At this point we can finally start to think about loading images to the system. However, before we start uploading images we need to put the pieces in place to store data relating to images.

<!--truncate-->

## Background

In this post we are going to add images to Redux following the same patterns we have seen with objects such as properties and settings.

## Walk Through

We know this pattern well at this point, so, I am going to jump right in. We are going to create our images data layer and expose it via the Redux store.

Let's start by creating our images data layer. This is all stuff we have seen before. Note that we are associating images to properties and storing the association on the image itself.

```js title="firebase/db/images.js"
import { db } from '../firebase';

export const setImage = async (image) => {
  try {
    return await db.collection('images').doc(image.id).set(image);
  } catch (err) {
    throw err;
  }
};

export const deleteImage = async (id) => {
  try {
    await db.collection('images').doc(id).delete();
    return;
  } catch (err) {
    throw err;
  }
};

export const fetchImage = async (imageId) => {
  try {
    const getDoc = await db.collection('images').doc(imageId).get();
    if (getDoc.exists) {
      return getDoc.data();
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

export const fetchImagesForProperty = async (propertyId) => {
  try {
    let images = [];
    const snapshots = await db
      .collection('images')
      .where('properties', 'array-contains', propertyId)
      .get();
    snapshots.forEach((doc) => {
      images.push(doc.data());
    });
    return images;
  } catch (err) {
    throw err;
  }
};
```

```js title="firebase/db/images.test.js"
import {
  setImage,
  deleteImage,
  fetchImage,
  fetchImagesForProperty,
} from './images';
import { login, logout } from '../auth/auth';
import { fbUser } from '../firebase';

describe('settings.js (Firebase Firestore)', () => {
  beforeAll(async () => {
    await login(fbUser.email, fbUser.password);
  });

  afterAll(async () => {
    await logout();
  });

  it('calls setImage, fetchImage, fetchImagesForProperty and deleteImage successfully', async () => {
    const image = {
      id: 'testimage123',
      active: false,
      status: 'loading',
      name: 'imageFilename.jpg',
      lastModifiedDate: '2019-1-1T12:00:00.001Z',
      size: 1024,
      type: 'image/jepg',
      caption: 'caption',
      primaryCategory: 'primaryCategory',
      secondaryCategory: 'secondaryCategoroy',
      tags: ['tag1', 'tag2'],
      properties: ['notarealproperty'],
    };
    try {
      await setImage(image);
      let fetchedImage = await fetchImage(image.id);
      expect(fetchedImage).toMatchObject(image);
      let fetchedImagesForProperty = await fetchImagesForProperty(
        image.properties[0]
      );
      expect(fetchedImagesForProperty[0]).toMatchObject(image);
      await deleteImage(image.id);
      const deletedImage = await fetchImage(image.id);
      expect(deletedImage).toBeFalsy();
    } catch (err) {
      expect(err).toBeFalsy(); // should not make it here
    }
  });

  it('calls setImage and fails when no image is provided', async () => {
    const image = {};
    try {
      await setImage(image);
      expect(true).toBeFalsy(); // should not make it here
    } catch (err) {
      expect(err).toBeTruthy(); // should always fail
    }
  });

  it('calls fetchImage and returns null if image is not found', async () => {
    try {
      const fetchedImage = await fetchImage('999');
      expect(fetchedImage).toBeNull();
    } catch (err) {
      expect(err).toBeFalsy(); // should not make it here
    }
  });

  it('calls fetchImage and fails if no id is provided', async () => {
    try {
      const fetchedImage = await fetchImage();
      expect(fetchedImage).toBeTruthy(); // should not make it here
    } catch (err) {
      expect(err).toBeTruthy(); // should always fail
    }
  });

  it('calls fetchImagesForProperty and fails if property is not found', async () => {
    try {
      const fetchedImages = await fetchImagesForProperty('999');
      expect(fetchedImages).toBeTruthy();
    } catch (err) {
      expect(err).toBeTruthy(); // should not make it here
    }
  });

  it('calls fetchImagesForProperty and fails if no property is provided', async () => {
    try {
      const fetchedImages = await fetchImagesForProperty();
      expect(fetchedImages).toBeTruthy(); // should not make it here
    } catch (err) {
      expect(err).toBeTruthy(); // should always fail
    }
  });

  it('calls deleteImage and does not throw an error if no such image exists', async () => {
    try {
      const deletededImage = await deleteImage('999');
      expect(deletededImage).toBeFalsy();
    } catch (err) {
      expect(err).toBeFalsy(); // should not make it here
    }
  });

  it('calls deleteImage and fails if no id is provided', async () => {
    try {
      const deletededImage = await deleteImage();
      expect(deletededImage).toBeTruthy(); // should not make it here
    } catch (err) {
      expect(err).toBeTruthy(); // should always fail
    }
  });
});
```

Now that we have the data layer created (and working) we can add Redux action creators and reducers.

```js title="redux/actions/images.js"
import cuid from 'cuid';

import {
  setImage,
  deleteImage,
  fetchImage,
  fetchImagesForProperty,
} from '../../firebase/db/images';

export const IMAGE_UPLOAD_START = 'IMAGE_UPLOAD_START';
export const IMAGE_UPLOAD_SUCCESS = 'IMAGE_UPLOAD_SUCCESS';
export const IMAGE_UPLOAD_FAIL = 'IMAGE_UPLOAD_FAIL';

export const IMAGE_UPDATE_START = 'IMAGE_UPDATE_START';
export const IMAGE_UPDATE_SUCCESS = 'IMAGE_UPDATE_SUCCESS';
export const IMAGE_UPDATE_FAIL = 'IMAGE_UPDATE_FAIL';

export const IMAGE_DELETE_START = 'IMAGE_DELETE_START';
export const IMAGE_DELETE_SUCCESS = 'IMAGE_DELETE_SUCCESS';
export const IMAGE_DELETE_FAIL = 'IMAGE_DELETE_FAIL';

export const IMAGES_FETCH_START = 'IMAGES_FETCH_START';
export const IMAGES_FETCH_SUCCESS = 'IMAGES_FETCH_SUCCESS';
export const IMAGES_FETCH_FAIL = 'IMAGES_FETCH_FAIL';

export const IMAGE_FETCH_START = 'IMAGE_FETCH_START';
export const IMAGE_FETCH_SUCCESS = 'IMAGE_FETCH_SUCCESS';
export const IMAGE_FETCH_FAIL = 'IMAGE_FETCH_FAIL';

const imageUploadStart = (image) => ({
  type: IMAGE_UPLOAD_START,
  image,
});

const imageUploadSuccess = (image) => ({
  type: IMAGE_UPLOAD_SUCCESS,
  image,
});

const imageUploadFail = (image) => ({
  type: IMAGE_UPLOAD_FAIL,
  image,
});

export const imageUpload =
  (propertyId, imageId, imageFile, metadata) => async (dispatch) => {
    let image = {
      id: imageId ? imageId : cuid(),
      active: false,
      status: 'loading',
      name: imageFile.name,
      lastModifiedDate: imageFile.lastModifiedDate,
      size: imageFile.size,
      type: imageFile.type,
      ...metadata,
      properties: [propertyId],
    };
    dispatch(imageUploadStart(image));
    try {
      await setImage(image);
      dispatch(imageUploadSuccess(image));
    } catch (err) {
      image = {
        ...image,
        status: err.message,
      };
      dispatch(imageUploadFail(image));
    }
  };

const imageUpdateStart = (image) => ({
  type: IMAGE_UPDATE_START,
  image,
});

const imageUpdateSuccess = (image) => ({
  type: IMAGE_UPDATE_SUCCESS,
  image,
});

const imageUpdateFail = (image) => ({
  type: IMAGE_UPDATE_FAIL,
  image,
});

export const imageUpdate = (image) => async (dispatch) => {
  dispatch(imageUpdateStart(image));
  try {
    await setImage(image);
    dispatch(imageUpdateSuccess(image));
  } catch (err) {
    dispatch(imageUpdateFail(image));
  }
};

const imageDeleteStart = (image) => ({
  type: IMAGE_DELETE_START,
  image,
});

const imageDeleteSuccess = (image) => ({
  type: IMAGE_DELETE_SUCCESS,
  image,
});

const imageDeleteFail = (image) => ({
  type: IMAGE_DELETE_FAIL,
  image,
});

export const imageDelete = (imageToDelete) => async (dispatch) => {
  let image = {
    ...imageToDelete,
    active: false,
    status: 'deleting',
  };
  dispatch(imageDeleteStart(image));
  try {
    // delete database entries
    await deleteImage(image.id);
    image = { ...image, status: 'deleted' };
    dispatch(imageDeleteSuccess(image));
  } catch (err) {
    dispatch(imageDeleteFail(image));
  }
};

const imagesFetchStart = () => ({
  type: IMAGES_FETCH_START,
});

const imagesFetchSuccess = (images) => ({
  type: IMAGES_FETCH_SUCCESS,
  images,
});

const imagesFetchFail = (error) => ({
  type: IMAGES_FETCH_FAIL,
  error,
});

export const imagesPropertyFetch = (propertyId) => async (dispatch) => {
  dispatch(imagesFetchStart());
  try {
    const images = await fetchImagesForProperty(propertyId);
    dispatch(imagesFetchSuccess(images));
  } catch (err) {
    dispatch(imagesFetchFail(err.message));
  }
};

const imageFetchStart = () => ({
  type: IMAGE_FETCH_START,
});

const imageFetchSuccess = (image) => ({
  type: IMAGE_FETCH_SUCCESS,
  image,
});

const imageFetchFail = (error) => ({
  type: IMAGE_FETCH_FAIL,
  error,
});

export const imageFetch = (imageId) => async (dispatch) => {
  dispatch(imageFetchStart());
  try {
    const image = await fetchImage(imageId);
    dispatch(imageFetchSuccess(image));
  } catch (err) {
    dispatch(imageFetchFail(err.message));
  }
};
```

```js title="redux/actions/images.test.js"
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { fbUser } from '../../firebase/firebase';
import {
  authenticate,
  logout,
  AUTH_START,
  AUTH_SUCCESS,
  AUTH_LOGOUT,
} from './auth';
import {
  imageUpload,
  imageUpdate,
  imageDelete,
  imagesPropertyFetch,
  imageFetch,
  IMAGE_UPLOAD_START,
  IMAGE_UPLOAD_SUCCESS,
  IMAGE_UPLOAD_FAIL,
  IMAGE_UPDATE_START,
  IMAGE_UPDATE_SUCCESS,
  IMAGE_UPDATE_FAIL,
  IMAGE_DELETE_START,
  IMAGE_DELETE_SUCCESS,
  IMAGE_DELETE_FAIL,
  IMAGES_FETCH_START,
  IMAGES_FETCH_SUCCESS,
  IMAGES_FETCH_FAIL,
  IMAGE_FETCH_START,
  IMAGE_FETCH_SUCCESS,
  IMAGE_FETCH_FAIL,
} from './images';

describe('images actions (async)', () => {
  let middlewares;
  let mockStore;
  let initialState;
  let store;
  beforeAll(() => {
    middlewares = [thunk];
    mockStore = configureStore(middlewares);
  });

  beforeEach(() => {
    initialState = {};
    store = mockStore(initialState);
  });

  it('dispatchs imageUpload and fails when not logged in', async () => {
    const propertyId = 'testProperty';
    const imageId = 'testImage';
    const imageFile = {
      name: 'imageFilename.jpg',
      lastModifiedDate: '2019-1-1T12:00:00.001Z',
      size: 1024,
      type: 'image/jepg',
    };
    const imageMetadata = {
      caption: 'caption',
      primaryCategory: 'primaryCategory',
      secondaryCategory: 'secondaryCategoroy',
      tags: ['tag1', 'tag2'],
    };

    await store.dispatch(
      imageUpload(propertyId, imageId, imageFile, imageMetadata)
    );
    let actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: IMAGE_UPLOAD_START });
    expect(actions[1]).toMatchObject({ type: IMAGE_UPLOAD_FAIL });
  });

  it('dispatchs imageUpload, imageFetch, imageUpdate and imageDelete successfully', async () => {
    const user = {
      email: fbUser.email,
      password: fbUser.password,
    };
    await store.dispatch(authenticate(user, true));
    let actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_SUCCESS });

    const propertyId = 'testProperty';
    const imageId = 'testImage';
    const imageFile = {
      name: 'imageFilename.jpg',
      lastModifiedDate: '2019-1-1T12:00:00.001Z',
      size: 1024,
      type: 'image/jepg',
    };
    const imageMetadata = {
      caption: 'caption',
      primaryCategory: 'primaryCategory',
      secondaryCategory: 'secondaryCategoroy',
      tags: ['tag1', 'tag2'],
    };

    await store.dispatch(
      imageUpload(propertyId, imageId, imageFile, imageMetadata)
    );
    actions = store.getActions();
    expect(actions).toHaveLength(4);
    expect(actions[2]).toMatchObject({ type: IMAGE_UPLOAD_START });
    expect(actions[3]).toMatchObject({ type: IMAGE_UPLOAD_SUCCESS });

    await store.dispatch(imageFetch(imageId));
    actions = store.getActions();
    expect(actions).toHaveLength(6);
    expect(actions[4]).toMatchObject({ type: IMAGE_FETCH_START });
    expect(actions[5]).toMatchObject({ type: IMAGE_FETCH_SUCCESS });

    await store.dispatch(
      imageUpdate({ id: imageId, ...imageFile, ...imageMetadata })
    );
    actions = store.getActions();
    expect(actions).toHaveLength(8);
    expect(actions[6]).toMatchObject({ type: IMAGE_UPDATE_START });
    expect(actions[7]).toMatchObject({ type: IMAGE_UPDATE_SUCCESS });

    await store.dispatch(
      imageDelete({ id: imageId, ...imageFile, ...imageMetadata })
    );
    actions = store.getActions();
    expect(actions).toHaveLength(10);
    expect(actions[8]).toMatchObject({ type: IMAGE_DELETE_START });
    expect(actions[9]).toMatchObject({ type: IMAGE_DELETE_SUCCESS });
  });

  it('dispatchs imageFetch, imageUpdate, imageDelete and fails with no ID', async () => {
    const user = {
      email: fbUser.email,
      password: fbUser.password,
    };
    await store.dispatch(authenticate(user, true));
    let actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_SUCCESS });

    await store.dispatch(imageFetch());
    actions = store.getActions();
    expect(actions).toHaveLength(4);
    expect(actions[2]).toMatchObject({ type: IMAGE_FETCH_START });
    expect(actions[3]).toMatchObject({ type: IMAGE_FETCH_FAIL });

    await store.dispatch(imageUpdate());
    actions = store.getActions();
    expect(actions).toHaveLength(6);
    expect(actions[4]).toMatchObject({ type: IMAGE_UPDATE_START });
    expect(actions[5]).toMatchObject({ type: IMAGE_UPDATE_FAIL });

    await store.dispatch(imageDelete());
    actions = store.getActions();
    expect(actions).toHaveLength(8);
    expect(actions[6]).toMatchObject({ type: IMAGE_DELETE_START });
    expect(actions[7]).toMatchObject({ type: IMAGE_DELETE_FAIL });
  });

  it('dispatchs imagesPropertyFetch and fails when not logged in', async () => {
    await store.dispatch(logout());
    let actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: AUTH_LOGOUT });

    await store.dispatch(imagesPropertyFetch());
    actions = store.getActions();
    expect(actions).toHaveLength(3);
    expect(actions[1]).toMatchObject({ type: IMAGES_FETCH_START });
    expect(actions[2]).toMatchObject({ type: IMAGES_FETCH_FAIL });
  });
});
```

```js title="redux/reducers/images.js"
import {
  IMAGE_UPLOAD_START,
  IMAGE_UPLOAD_SUCCESS,
  IMAGE_UPLOAD_FAIL,
  IMAGE_UPDATE_START,
  IMAGE_UPDATE_SUCCESS,
  IMAGE_UPDATE_FAIL,
  IMAGE_DELETE_START,
  IMAGE_DELETE_SUCCESS,
  IMAGE_DELETE_FAIL,
  IMAGES_FETCH_START,
  IMAGES_FETCH_SUCCESS,
  IMAGES_FETCH_FAIL,
  IMAGE_FETCH_START,
  IMAGE_FETCH_SUCCESS,
  IMAGE_FETCH_FAIL,
} from '../actions/images';

const INITIAL_STATE = {
  images: [],
  error: '',
  loading: false,
};

const imageAdd = (state, action) => {
  const images = [action.image, ...state.images];
  return { ...state, images };
};

const imageUpdate = (state, action) => {
  const images = state.images.map((image) => {
    if (image.id !== action.image.id) {
      return image;
    } else {
      return action.image;
    }
  });
  return { ...state, images };
};

const imageDelete = (state, action) => {
  const images = state.images.filter((image) => image.id !== action.image.id);
  return { ...state, images };
};

const fetchStart = (state, action) => ({
  ...state,
  error: '',
  loading: true,
});

const fetchFail = (state, action) => ({
  ...state,
  error: action.error,
  loading: false,
});

const imagesFetchSuccess = (state, action) => ({
  ...state,
  images: action.images,
  loading: false,
});

const imageFetchSuccess = (state, action) => {
  const images = [...state.images, action.image];
  return { ...state, images, loading: false };
};

export const images = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case IMAGE_UPLOAD_START: {
      return imageAdd(state, action);
    }
    case IMAGE_UPLOAD_SUCCESS: {
      return imageUpdate(state, action);
    }
    case IMAGE_UPLOAD_FAIL: {
      return imageUpdate(state, action);
    }
    case IMAGE_UPDATE_START: {
      return imageUpdate(state, action);
    }
    case IMAGE_UPDATE_SUCCESS: {
      return imageUpdate(state, action);
    }
    case IMAGE_UPDATE_FAIL: {
      return imageUpdate(state, action);
    }
    case IMAGE_DELETE_START: {
      return imageUpdate(state, action);
    }
    case IMAGE_DELETE_SUCCESS: {
      return imageDelete(state, action);
    }
    case IMAGE_DELETE_FAIL: {
      return imageUpdate(state, action);
    }
    case IMAGES_FETCH_START: {
      return fetchStart(state, action);
    }
    case IMAGES_FETCH_SUCCESS: {
      return imagesFetchSuccess(state, action);
    }
    case IMAGES_FETCH_FAIL: {
      return fetchFail(state, action);
    }
    case IMAGE_FETCH_START: {
      return fetchStart(state, action);
    }
    case IMAGE_FETCH_SUCCESS: {
      return imageFetchSuccess(state, action);
    }
    case IMAGE_FETCH_FAIL: {
      return fetchFail(state, action);
    }
    default:
      return state;
  }
};

export default images;
```

```js title="redux/reducers/images.test.js"
import deepFreeze from 'deep-freeze';

import { images } from './images';

describe('images reducer', () => {
  it('returns the initial state', () => {
    const stateBefore = undefined;
    const action = {};
    const stateAfter = {
      images: [],
      error: '',
      loading: false,
    };
    // deepFreeze(stateBefore); cannot deepFreeze undefined
    deepFreeze(stateAfter);
    expect(images(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles IMAGE_UPLOAD_START', () => {
    const image1 = {
      id: '123',
      active: false,
      status: 'loading',
      name: 'image123.jpg',
      properties: [],
    };
    let stateBefore = undefined;
    let action = { type: 'IMAGE_UPLOAD_START', image: image1 };
    let stateAfter = {
      images: [image1],
      error: '',
      loading: false,
    };
    // deepFreeze(stateBefore); cannot deepFreeze undefined
    deepFreeze(stateAfter);
    expect(images(stateBefore, action)).toEqual(stateAfter);

    const image2 = {
      id: '456',
      active: false,
      status: 'loading',
      name: 'image456.jpg',
      properties: [],
    };
    stateBefore = {
      images: [image1],
      error: '',
      loading: false,
    };
    action = { type: 'IMAGE_UPLOAD_START', image: image2 };
    stateAfter = {
      images: [image2, image1],
      error: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(images(stateBefore, action)).toEqual(stateAfter);
  });
});
```

We also need to update our Root component to include the new images reducer.

```jsx title="Root.jsx"
...
import images from '../../shared/redux/reducers/images';

const rootReducer = combineReducers({
  auth,
  properties,
  settings,
  images
});
...
```

## Next

Now that we have a foundation for loading images we can move on to the upload process.

## Code

<https://github.com/peterdyer7/media-library/tree/31.ImagesGettingStarted>
