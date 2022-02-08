---
slug: 25-media-library-admin-properties-backend
title: 25. Media Library - Admin Properties Back-end
authors: peter
tags: [Cloud Firestore, Redux]
---

In this post we will continue where we left off in the previous post. We will add the required back-end pieces to manage properties.

<!--truncate-->

## Background

Managing properties is a key part of our application. We need to be able to create, retrieve, update and delete properties. We will store properties in our database (Cloud Firestore) and also cache them in Redux (so we are not constantly fetching them over the network).

## Walk Through

I am going to install a new library to generate IDs for the project. I have chosen cuid. We didn't have to concern ourselves with user IDs because Firebase Authentication had already created them for us. I prefer the pattern of generating my own IDs to having the back-end generate them. I have found that this simplifies data reading and writing.

```bash
npm install --save cuid
```

Let's start by creating our properties data layer. We will follow similar patterns to what we followed with users. We will support the following actions: createProperty, updateProperty, deleteProperty, fetchProperty and fetchProperties.

```js title="firebase/db/properties.js"
import { db } from '../firebase';

export const createProperty = async (property) => {
  // check if property exists before creating it
  try {
    const res = await db
      .collection('properties')
      .where('name', '==', property.name)
      .get();
    if (res.empty) {
      return await db.collection('properties').doc(property.id).set(property);
    } else {
      throw new Error('Property already exists!');
    }
  } catch (err) {
    throw err;
  }
};

export const updateProperty = async (property) => {
  try {
    return await db.collection('properties').doc(property.id).update(property);
  } catch (err) {
    throw err;
  }
};

export const deleteProperty = async (id) => {
  try {
    return await db.collection('properties').doc(id).delete();
  } catch (err) {
    throw err;
  }
};

export const fetchProperty = async (id) => {
  try {
    const getDoc = await db.collection('properties').doc(id).get();
    if (getDoc.exists) {
      return getDoc.data();
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

export const fetchProperties = async () => {
  try {
    let properties = [];
    const snapshots = await db.collection('properties').get();
    snapshots.forEach((doc) => {
      properties.push(doc.data());
    });
    return properties;
  } catch (err) {
    throw err;
  }
};
```

```js title="firebase/db/properties.test.js"
import {
  createProperty,
  updateProperty,
  deleteProperty,
  fetchProperty,
  fetchProperties,
} from './properties';
import { login, logout } from '../auth/auth';
import { fbUser } from '../firebase';

describe('settings.js (Firebase Firestore)', () => {
  beforeAll(async () => {
    await login(fbUser.email, fbUser.password);
  });

  afterAll(async () => {
    await logout();
  });

  it('calls createProperty, updateProperty, fetchProperty and deleteProperty successfully', async () => {
    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };
    try {
      await createProperty(property);
      let fetchedProperty = await fetchProperty(property.id);
      expect(fetchedProperty).toMatchObject(property);
      await updateProperty({ id: property.id, name: 'properttest987' });
      fetchedProperty = await fetchProperty(property.id);
      expect(fetchedProperty).not.toMatchObject(property);
      await deleteProperty(property.id);
      const deletedProperty = await fetchProperty(property.id);
      expect(deletedProperty).toBeFalsy();
    } catch (err) {
      expect(err).toBeFalsy(); // should not make it here
    }
  });

  it('calls createProperty and fails when no property is provided', async () => {
    const property = {};
    try {
      await createProperty(property);
      expect(true).toBeFalsy(); // should not make it here
    } catch (err) {
      expect(err).toBeTruthy(); // should always fail
    }
  });

  it('calls fetchProperty and returns null if property is not found', async () => {
    try {
      const fetchedProperty = await fetchProperty('999');
      expect(fetchedProperty).toBeNull();
    } catch (err) {
      expect(err).toBeFalsy(); // should not make it here
    }
  });

  it('calls fetchProperty and fails if no id is provided', async () => {
    try {
      const fetchedProperty = await fetchProperty();
      expect(fetchedProperty).toBeTruthy(); // should not make it here
    } catch (err) {
      expect(err).toBeTruthy(); // should always fail
    }
  });

  it('calls deleteProperty and does not throw an error if no such property exists', async () => {
    try {
      const deletededProperty = await deleteProperty('999');
      expect(deletededProperty).toBeFalsy();
    } catch (err) {
      expect(err).toBeFalsy(); // should not make it here
    }
  });

  it('calls deleteProperty and fails if no id is provided', async () => {
    try {
      const deletededProperty = await deleteProperty();
      expect(deletededProperty).toBeTruthy(); // should not make it here
    } catch (err) {
      expect(err).toBeTruthy(); // should always fail
    }
  });

  it('calls fetchProperties adds a new property calls fetchProperties again then deletes the property', async () => {
    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };
    try {
      const fetchedProperties = await fetchProperties();
      const temp = fetchedProperties.length + 1;
      expect(temp).toBeTruthy();
      await createProperty(property);
      const refetchedProperties = await fetchProperties();
      expect(refetchedProperties.length).toBe(temp);
      await deleteProperty(property.id);
      const deletedProperty = await fetchProperty(property.id);
      expect(deletedProperty).toBeFalsy();
    } catch (err) {
      expect(err).toBeFalsy(); // should not make it here
    }
  });
});
```

Now that we have the data layer created (and working) we can add Redux action creators and reducers (I'm going to ignore updateProperty for the moment - I will revisit this when it is required).

```js title="redux/actions/properties.js"
import cuid from 'cuid';

import {
  createProperty,
  fetchProperties,
  deleteProperty,
  fetchProperty,
} from '../../firebase/db/properties';

export const PROPERTY_CLEAR_MSGS = 'PROPERTY_CLEAR_MSGS';

export const PROPERTY_CREATE_START = 'PROPERTY_CREATE_START';
export const PROPERTY_CREATE_SUCCESS = 'PROPERTY_CREATE_SUCCESS';
export const PROPERTY_CREATE_FAIL = 'PROPERTY_CREATE_FAIL';

export const PROPERTY_DELETE_START = 'PROPERTY_DELETE_START';
export const PROPERTY_DELETE_SUCCESS = 'PROPERTY_DELETE_SUCCESS';
export const PROPERTY_DELETE_FAIL = 'PROPERTY_DELETE_FAIL';

export const PROPERTIES_FETCH_START = 'PROPERTIES_FETCH_START';
export const PROPERTIES_FETCH_SUCCESS = 'PROPERTIES_FETCH_SUCCESS';
export const PROPERTIES_FETCH_FAIL = 'PROPERTIES_FETCH_FAIL';

export const PROPERTY_FETCH_START = 'PROPERTY_FETCH_START';
export const PROPERTY_FETCH_SUCCESS = 'PROPERTY_FETCH_SUCCESS';
export const PROPERTY_FETCH_FAIL = 'PROPERTY_FETCH_FAIL';

export const propertyClearMsgs = () => ({
  type: PROPERTY_CLEAR_MSGS,
});

const propertyCreateStart = () => ({
  type: PROPERTY_CREATE_START,
});

const propertyCreateSuccess = (property, success) => ({
  type: PROPERTY_CREATE_SUCCESS,
  property,
  success,
});

const propertyCreateFail = (error) => ({
  type: PROPERTY_CREATE_FAIL,
  error,
});

const propertyDeleteStart = () => ({
  type: PROPERTY_DELETE_START,
});

const propertyDeleteSuccess = (id) => ({
  type: PROPERTY_DELETE_SUCCESS,
  id,
});

const propertyDeleteFail = (error) => ({
  type: PROPERTY_DELETE_FAIL,
  error,
});

export const propertyCreate = (property) => async (dispatch) => {
  dispatch(propertyCreateStart());
  try {
    if (!property.id) {
      property.id = cuid();
    }
    await createProperty(property);
    dispatch(propertyCreateSuccess(property, 'Property created!'));
  } catch (err) {
    dispatch(propertyCreateFail(err.message));
  }
};

export const propertyDelete = (id) => async (dispatch) => {
  dispatch(propertyDeleteStart());
  try {
    await deleteProperty(id);
    dispatch(propertyDeleteSuccess(id));
  } catch (err) {
    dispatch(propertyDeleteFail(err.message));
  }
};

const propertiesFetchStart = () => ({
  type: PROPERTIES_FETCH_START,
});

const propertiesFetchSuccess = (properties) => ({
  type: PROPERTIES_FETCH_SUCCESS,
  properties,
});

const propertiesFetchFail = (error) => ({
  type: PROPERTIES_FETCH_FAIL,
  error,
});

export const propertiesFetch = () => async (dispatch) => {
  dispatch(propertiesFetchStart());
  try {
    const properties = await fetchProperties();
    dispatch(propertiesFetchSuccess(properties));
  } catch (err) {
    dispatch(propertiesFetchFail(err.message));
  }
};

const propertyFetchStart = () => ({
  type: PROPERTY_FETCH_START,
});

const propertyFetchSuccess = (property) => ({
  type: PROPERTY_FETCH_SUCCESS,
  property,
});

const propertyFetchFail = (error) => ({
  type: PROPERTY_FETCH_FAIL,
  error,
});

export const propertyFetch = (propertyId) => async (dispatch) => {
  dispatch(propertyFetchStart());
  try {
    const property = await fetchProperty(propertyId);
    dispatch(propertyFetchSuccess(property));
  } catch (err) {
    dispatch(propertyFetchFail(err.message));
  }
};
```

```js title="redux/actions/properties.test.js"
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
  propertyClearMsgs,
  propertyCreate,
  propertyDelete,
  propertyFetch,
  propertiesFetch,
  PROPERTY_CLEAR_MSGS,
  PROPERTY_CREATE_START,
  PROPERTY_CREATE_SUCCESS,
  PROPERTY_CREATE_FAIL,
  PROPERTY_DELETE_START,
  PROPERTY_DELETE_SUCCESS,
  PROPERTY_DELETE_FAIL,
  PROPERTY_FETCH_START,
  PROPERTY_FETCH_SUCCESS,
  PROPERTY_FETCH_FAIL,
  PROPERTIES_FETCH_START,
  PROPERTIES_FETCH_SUCCESS,
  PROPERTIES_FETCH_FAIL,
} from './properties';

describe('properties actions (async)', () => {
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

  it('dispatchs propertyClearMsgs', async () => {
    await store.dispatch(propertyClearMsgs());
    let actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: PROPERTY_CLEAR_MSGS });
  });

  it('dispatchs propertyCreate and fails when not logged in', async () => {
    const property = {
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };

    await store.dispatch(propertyCreate(property));
    let actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: PROPERTY_CREATE_START });
    expect(actions[1]).toMatchObject({ type: PROPERTY_CREATE_FAIL });
  });

  it('dispatchs propertyCreate, propertyFetch and propertyDelete successfully', async () => {
    const user = {
      email: fbUser.email,
      password: fbUser.password,
    };
    await store.dispatch(authenticate(user, true));
    let actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_SUCCESS });

    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };

    await store.dispatch(propertyCreate(property));
    actions = store.getActions();
    expect(actions).toHaveLength(4);
    expect(actions[2]).toMatchObject({ type: PROPERTY_CREATE_START });
    expect(actions[3]).toMatchObject({ type: PROPERTY_CREATE_SUCCESS });

    await store.dispatch(propertyFetch(property.id));
    actions = store.getActions();
    expect(actions).toHaveLength(6);
    expect(actions[4]).toMatchObject({ type: PROPERTY_FETCH_START });
    expect(actions[5]).toMatchObject({ type: PROPERTY_FETCH_SUCCESS });

    await store.dispatch(propertyDelete(property.id));
    actions = store.getActions();
    expect(actions).toHaveLength(8);
    expect(actions[6]).toMatchObject({ type: PROPERTY_DELETE_START });
    expect(actions[7]).toMatchObject({ type: PROPERTY_DELETE_SUCCESS });
  });

  it('dispatchs propertyFetch and fails with no ID', async () => {
    const user = {
      email: fbUser.email,
      password: fbUser.password,
    };
    await store.dispatch(authenticate(user, true));
    let actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_SUCCESS });

    await store.dispatch(propertyFetch());
    actions = store.getActions();
    expect(actions).toHaveLength(4);
    expect(actions[2]).toMatchObject({ type: PROPERTY_FETCH_START });
    expect(actions[3]).toMatchObject({ type: PROPERTY_FETCH_FAIL });

    await store.dispatch(propertyDelete());
    actions = store.getActions();
    expect(actions).toHaveLength(6);
    expect(actions[4]).toMatchObject({ type: PROPERTY_DELETE_START });
    expect(actions[5]).toMatchObject({ type: PROPERTY_DELETE_FAIL });
  });

  it('dispatchs propertiesFetch successfully', async () => {
    const user = {
      email: fbUser.email,
      password: fbUser.password,
    };
    await store.dispatch(authenticate(user, true));
    let actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: AUTH_START });
    expect(actions[1]).toMatchObject({ type: AUTH_SUCCESS });

    await store.dispatch(propertiesFetch());
    actions = store.getActions();
    expect(actions).toHaveLength(4);
    expect(actions[2]).toMatchObject({ type: PROPERTIES_FETCH_START });
    expect(actions[3]).toMatchObject({ type: PROPERTIES_FETCH_SUCCESS });
  });

  it('dispatchs propertiesFetch and fails when not logged in', async () => {
    await store.dispatch(logout());
    let actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: AUTH_LOGOUT });

    await store.dispatch(propertiesFetch());
    actions = store.getActions();
    expect(actions).toHaveLength(3);
    expect(actions[1]).toMatchObject({ type: PROPERTIES_FETCH_START });
    expect(actions[2]).toMatchObject({ type: PROPERTIES_FETCH_FAIL });
  });
});
```

```js title="redux/reducers/properties.js"
import {
  PROPERTY_CLEAR_MSGS,
  PROPERTY_CREATE_START,
  PROPERTY_CREATE_SUCCESS,
  PROPERTY_CREATE_FAIL,
  PROPERTY_DELETE_START,
  PROPERTY_DELETE_SUCCESS,
  PROPERTY_DELETE_FAIL,
  PROPERTIES_FETCH_START,
  PROPERTIES_FETCH_SUCCESS,
  PROPERTIES_FETCH_FAIL,
  PROPERTY_FETCH_START,
  PROPERTY_FETCH_SUCCESS,
  PROPERTY_FETCH_FAIL,
} from '../actions/properties';

const INITIAL_STATE = {
  properties: [],
  error: '',
  success: '',
  loading: false,
};

const propertyClearMsgs = (state, action) => ({
  ...state,
  error: '',
  success: '',
});

const propertyStart = (state, action) => ({
  ...state,
  error: '',
  success: '',
  loading: true,
});

const propertyFail = (state, action) => ({
  ...state,
  loading: false,
  success: '',
  error: action.error,
});

const propertyCreateSuccess = (state, action) => {
  const properties = [...state.properties, action.property];
  return {
    ...state,
    properties,
    loading: false,
    success: action.success,
    error: '',
  };
};

const propertyDeleteSuccess = (state, action) => {
  const properties = state.properties.filter((prop) => prop.id !== action.id);
  return {
    ...state,
    properties,
    loading: false,
    success: '',
    error: '',
  };
};

const propertiesFetchSuccess = (state, action) => ({
  ...state,
  loading: false,
  properties: action.properties,
});

const propertyFetchSuccess = (state, action) => {
  const properties = [...state.properties, action.property];
  return {
    ...state,
    properties,
    loading: false,
  };
};

const properties = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case PROPERTY_CLEAR_MSGS: {
      return propertyClearMsgs(state, action);
    }
    case PROPERTY_CREATE_START: {
      return propertyStart(state, action);
    }
    case PROPERTY_CREATE_SUCCESS: {
      return propertyCreateSuccess(state, action);
    }
    case PROPERTY_CREATE_FAIL: {
      return propertyFail(state, action);
    }
    case PROPERTY_DELETE_START: {
      return propertyStart(state, action);
    }
    case PROPERTY_DELETE_SUCCESS: {
      return propertyDeleteSuccess(state, action);
    }
    case PROPERTY_DELETE_FAIL: {
      return propertyFail(state, action);
    }
    case PROPERTIES_FETCH_START: {
      return propertyStart(state, action);
    }
    case PROPERTIES_FETCH_SUCCESS: {
      return propertiesFetchSuccess(state, action);
    }
    case PROPERTIES_FETCH_FAIL: {
      return propertyFail(state, action);
    }
    case PROPERTY_FETCH_START: {
      return propertyStart(state, action);
    }
    case PROPERTY_FETCH_SUCCESS: {
      return propertyFetchSuccess(state, action);
    }
    case PROPERTY_FETCH_FAIL: {
      return propertyFail(state, action);
    }
    default:
      return state;
  }
};

export default properties;
```

```js title="redux/reducers/properties.test.js"
import deepFreeze from 'deep-freeze';

import properties from './properties';

describe('properties reducer', () => {
  it('returns the initial state', () => {
    const stateBefore = undefined;
    const action = {};
    const stateAfter = {
      properties: [],
      error: '',
      success: '',
      loading: false,
    };
    // deepFreeze(stateBefore); cannot deepFreeze undefined
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_CLEAR_MSGS', () => {
    const action = { type: 'PROPERTY_CLEAR_MSGS' };
    const stateBefore = {
      properties: [],
      error: 'error',
      success: 'success',
      loading: false,
    };
    const stateAfter = {
      properties: [],
      error: '',
      success: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_CREATE_START', () => {
    const action = { type: 'PROPERTY_CREATE_START' };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: false,
    };
    const stateAfter = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_CREATE_SUCCESS', () => {
    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };
    const action = {
      type: 'PROPERTY_CREATE_SUCCESS',
      property,
      success: 'Property created!',
    };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    const stateAfter = {
      properties: [property],
      error: '',
      success: 'Property created!',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_CREATE_FAIL', () => {
    const action = { type: 'PROPERTY_CREATE_FAIL', error: 'Error!' };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    const stateAfter = {
      properties: [],
      error: 'Error!',
      success: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_DELETE_START', () => {
    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };
    const action = { type: 'PROPERTY_DELETE_START' };
    const stateBefore = {
      properties: [property],
      error: '',
      success: '',
      loading: false,
    };
    const stateAfter = {
      properties: [property],
      error: '',
      success: '',
      loading: true,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_DELETE_SUCCESS', () => {
    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };
    const action = {
      type: 'PROPERTY_DELETE_SUCCESS',
      id: property.id,
    };
    const stateBefore = {
      properties: [property],
      error: '',
      success: '',
      loading: true,
    };
    const stateAfter = {
      properties: [],
      error: '',
      success: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_DELETE_FAIL', () => {
    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };
    const action = { type: 'PROPERTY_DELETE_FAIL', error: 'Error!' };
    const stateBefore = {
      properties: [property],
      error: '',
      success: '',
      loading: true,
    };
    const stateAfter = {
      properties: [property],
      error: 'Error!',
      success: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_FETCH_START', () => {
    const action = { type: 'PROPERTY_FETCH_START' };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: false,
    };
    const stateAfter = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_FETCH_SUCCESS', () => {
    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };
    const action = {
      type: 'PROPERTY_FETCH_SUCCESS',
      property,
    };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    const stateAfter = {
      properties: [property],
      error: '',
      success: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTY_FETCH_FAIL', () => {
    const action = { type: 'PROPERTY_FETCH_FAIL', error: 'Error!' };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    const stateAfter = {
      properties: [],
      error: 'Error!',
      success: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTIES_FETCH_START', () => {
    const action = { type: 'PROPERTIES_FETCH_START' };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: false,
    };
    const stateAfter = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTIES_FETCH_SUCCESS', () => {
    const property = {
      id: 'propertytest123',
      name: 'propertytest123',
      active: true,
      brand: 'brand',
      region: 'region',
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postal',
      latitude: 'latitude',
      longitude: 'longitude',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
    };
    const action = {
      type: 'PROPERTIES_FETCH_SUCCESS',
      properties: [property],
    };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    const stateAfter = {
      properties: [property],
      error: '',
      success: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles PROPERTIES_FETCH_FAIL', () => {
    const action = { type: 'PROPERTIES_FETCH_FAIL', error: 'Error!' };
    const stateBefore = {
      properties: [],
      error: '',
      success: '',
      loading: true,
    };
    const stateAfter = {
      properties: [],
      error: 'Error!',
      success: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(properties(stateBefore, action)).toEqual(stateAfter);
  });
});
```

We also need to update our Root component to include the new properties reducer (and make use of the combineReducers function we setup many moons ago).

```jsx title="Root.jsx"
...
import auth from '../../shared/redux/reducers/auth';
import properties from '../../shared/redux/reducers/properties';

const rootReducer = combineReducers({
  auth,
  properties
});
...
```

## Next

That was a lot of code but it followed patterns we should be comfortable with at this point. In the next post we can start to build a front-end that leverages all of the back-end code we wrote in this post.

## Code

<https://github.com/peterdyer7/media-library/tree/25.AdminProperties>
