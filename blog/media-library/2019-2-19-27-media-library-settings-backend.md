---
slug: 27-media-library-settings-backend
title: 27. Media Library - Settings Back-end
authors: peter
tags: [Cloud Firestore, Redux]
---

This post is going to feel like a bit of a repeat of #25 where we added the back-end to support the administration of Properties. In this case we are going to add the back-end support for Settings. We will use settings when we manage individual properties, specifically, the settings we want to manage will be applied to the images loaded to the Media Library.

<!--truncate-->

## Background

We want to be able to apply metadata to the images loaded to Media Library. This will help us find and filter images when we are looking for them. Some metadata will be structured and that is what we want to manage in this post. As much as possible we want to keep the management of settings generic. That is, if someone wants to add a new settings with a list of values they should be able to leverage the pieces we put in place in this post, and it should not require additional code to be written.

To get started we are going to support three settings for images: primaryCategory, secondaryCategory and tags. We will manage all three settings in a single document (that way we only have one document to retrieve to get all three settings).

## Walk Through

Let's jump right in. We are following patterns we have followed before. At this point all of this should look familiar. Let's start by wiring up the bits required to communicate with the database. Notice that adding and removing items from an array in a document does require some specific calls that we have not used elsewhere - arrayUnion and arrayRemove (they are discussed here: <https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array>). Also, notice that they require access to the firebase library itself. We are now exporting that from our Firebase config file (the file I cannot check-in because it contains environment data). Lastly, notice that we are passing in the document we want to work with and the list we want from that document. This is what allows us to keep this capability generic and should help us eliminate to the need for additional code to add future settings.

```js title="settings.js"
import { db, firebase } from '../firebase';

export const fetchSettingsByType = async (doc) => {
  try {
    const getDoc = await db.collection('settings').doc(doc).get();
    if (!getDoc.exists) {
      return null;
    } else {
      return getDoc.data();
    }
  } catch (err) {
    throw err;
  }
};

export const addListItem = async (doc, list, item) => {
  try {
    const imageMetadataRef = db.collection('settings').doc(doc);
    await imageMetadataRef.update({
      [list]: firebase.firestore.FieldValue.arrayUnion(item),
    });
  } catch (err) {
    throw err;
  }
};

export const removeListItem = async (doc, list, item) => {
  try {
    const imageMetadataRef = db.collection('settings').doc(doc);
    await imageMetadataRef.update({
      [list]: firebase.firestore.FieldValue.arrayRemove(item),
    });
  } catch (err) {
    throw err;
  }
};
```

We will write some simple tests to confirm this works for the settings we want to support.

```js title="settings.test.js"
import { fetchSettingsByType, addListItem, removeListItem } from './settings';
import { login, logout } from '../auth/auth';
import { fbUser } from '../firebase';

describe('settings.js (Firebase Firestore)', () => {
  beforeAll(async () => {
    await login(fbUser.email, fbUser.password);
  });

  afterAll(async () => {
    await logout();
  });

  it('calls fetchSettings for imageMetadata correctly', async () => {
    const settings = await fetchSettingsByType('imageMetadata');

    expect(settings.primaryCategory).toBeTruthy();
    expect(settings.secondaryCategory).toBeTruthy();
    expect(settings.tags).toBeTruthy();
  });

  it('calls addListItem, removeListItem for imageMetadata correctly', async () => {
    try {
      const item = 'newitem';
      const doc = 'imageMetadata';
      await addListItem(doc, 'primaryCategory', item);
      await addListItem(doc, 'secondaryCategory', item);
      await addListItem(doc, 'tags', item);

      let settings = await fetchSettingsByType(doc);
      expect(settings.primaryCategory).toContain(item);
      expect(settings.secondaryCategory).toContain(item);
      expect(settings.tags).toContain(item);

      await removeListItem(doc, 'primaryCategory', item);
      await removeListItem(doc, 'secondaryCategory', item);
      await removeListItem(doc, 'tags', item);

      settings = await fetchSettingsByType(doc);
      expect(settings.primaryCategory).not.toContain(item);
      expect(settings.secondaryCategory).not.toContain(item);
      expect(settings.tags).not.toContain(item);
    } catch (err) {
      expect(err).toBeFalsy(); // should not reach this
    }
  });
});
```

We will manage settings via the store. Let's create the required action creators.

```js title="redux/actions/settings.js"
import {
  fetchSettingsByType,
  addListItem,
  removeListItem,
} from '../../firebase/db/settings';

export const FETCH_SETTINGS_START = 'FETCH_SETTINGS_START';
export const FETCH_SETTINGS_SUCCESS = 'FETCH_SETTINGS_SUCCESS';
export const FETCH_SETTINGS_FAIL = 'FETCH_SETTINGS_FAIL';
export const ADD_SETTING_START = 'ADD_SETTING_START';
export const ADD_SETTING_SUCCESS = 'ADD_SETTING_SUCCESS';
export const ADD_SETTING_FAIL = 'ADD_SETTING_FAIL';
export const REMOVE_SETTING_START = 'REMOVE_SETTING_START';
export const REMOVE_SETTING_SUCCESS = 'REMOVE_SETTING_SUCCESS';
export const REMOVE_SETTING_FAIL = 'REMOVE_SETTING_FAIL';

const fetchSettingsStart = () => ({
  type: FETCH_SETTINGS_START,
});

const fetchSettingsSuccess = (settings) => ({
  type: FETCH_SETTINGS_SUCCESS,
  settings,
});

const fetchSettingsFail = (error) => ({
  type: FETCH_SETTINGS_FAIL,
  error,
});

export const fetchSettings = (type) => async (dispatch) => {
  dispatch(fetchSettingsStart());
  try {
    const settings = await fetchSettingsByType(type);
    dispatch(fetchSettingsSuccess(settings));
  } catch (err) {
    dispatch(fetchSettingsFail(err.message));
  }
};

const addSettingStart = () => ({
  type: ADD_SETTING_START,
});

const addSettingSuccess = (setting) => ({
  type: ADD_SETTING_SUCCESS,
  setting,
});

const addSettingFail = (error) => ({
  type: ADD_SETTING_FAIL,
  error,
});

export const addSetting = (type, list, item) => async (dispatch) => {
  dispatch(addSettingStart());
  try {
    await addListItem(type, list, item);
    dispatch(addSettingSuccess({ list, item }));
  } catch (err) {
    dispatch(addSettingFail(err.message));
  }
};

const removeSettingStart = () => ({
  type: REMOVE_SETTING_START,
});

const removeSettingSuccess = (setting) => ({
  type: REMOVE_SETTING_SUCCESS,
  setting,
});

const removeSettingFail = (error) => ({
  type: REMOVE_SETTING_FAIL,
  error,
});

export const removeSetting = (type, list, item) => async (dispatch) => {
  dispatch(removeSettingStart());
  try {
    await removeListItem(type, list, item);
    dispatch(removeSettingSuccess({ list, item }));
  } catch (err) {
    dispatch(removeSettingFail(err.message));
  }
};
```

```js title="redux/actions/settings.test.js"
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as settings from './settings';
import { login, logout } from '../../firebase/auth/auth';
import { fbUser } from '../../firebase/firebase';

describe('settings async actions - create and dispatch', () => {
  let middlewares;
  let mockStore;
  let initialState;
  let store;
  beforeAll(async () => {
    middlewares = [thunk];
    mockStore = configureStore(middlewares);
    await login(fbUser.email, fbUser.password);
  });

  afterAll(async () => {
    await logout();
  });

  beforeEach(() => {
    initialState = {};
    store = mockStore(initialState);
  });

  it('dispatchs fetchSettings action successfully', async () => {
    await store.dispatch(settings.fetchSettings('imageMetadata'));
    const actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: settings.FETCH_SETTINGS_START });
    expect(actions[1]).toMatchObject({ type: settings.FETCH_SETTINGS_SUCCESS });
  });

  it('dispatchs fetchSettings, addSetting, and removeSetting actions successfully', async () => {
    await store.dispatch(settings.fetchSettings('imageMetadata'));
    await store.dispatch(
      settings.addSetting('imageMetadata', 'tags', 'testing')
    );
    await store.dispatch(
      settings.removeSetting('imageMetadata', 'tags', 'testing')
    );

    const actions = store.getActions();
    expect(actions).toHaveLength(6);
    expect(actions[0]).toMatchObject({ type: settings.FETCH_SETTINGS_START });
    expect(actions[1]).toMatchObject({ type: settings.FETCH_SETTINGS_SUCCESS });
    expect(actions[2]).toMatchObject({ type: settings.ADD_SETTING_START });
    expect(actions[3]).toMatchObject({ type: settings.ADD_SETTING_SUCCESS });
    expect(actions[4]).toMatchObject({ type: settings.REMOVE_SETTING_START });
    expect(actions[5]).toMatchObject({ type: settings.REMOVE_SETTING_SUCCESS });
  });
});
```

We can now move on to the required reducers.

```js title="redux/reducers/settings.js"
import {
  FETCH_SETTINGS_START,
  FETCH_SETTINGS_SUCCESS,
  FETCH_SETTINGS_FAIL,
  ADD_SETTING_START,
  ADD_SETTING_SUCCESS,
  ADD_SETTING_FAIL,
  REMOVE_SETTING_START,
  REMOVE_SETTING_SUCCESS,
  REMOVE_SETTING_FAIL,
} from '../actions/settings';

const INITIAL_STATE = {
  settings: {},
  error: '',
  loading: false,
};

const start = (state, action) => ({
  ...state,
  error: '',
  loading: false, // loading is never true - to prevent page reloads - not necessary / undesirable with settings
});

const fail = (state, action) => ({
  ...state,
  error: action.error,
  loading: false,
});

const fetchSetttingsSuccess = (state, action) => ({
  ...state,
  settings: action.settings,
  loading: false,
});

const addSetttingSuccess = (state, action) => {
  const list = state.settings[action.setting.list];
  const item = action.setting.item;
  let settings = state.settings;
  if (!list.includes(item)) {
    const updatedList = [...list, item];
    settings = { ...state.settings, [action.setting.list]: updatedList };
  }
  return {
    ...state,
    settings,
    loading: false,
  };
};

const removeSetttingSuccess = (state, action) => {
  const list = state.settings[action.setting.list];
  const item = action.setting.item;
  const updatedList = list.filter((i) => i !== item);
  const settings = { ...state.settings, [action.setting.list]: updatedList };
  return {
    ...state,
    settings,
    loading: false,
  };
};

const settings = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case FETCH_SETTINGS_START: {
      return start(state, action);
    }
    case FETCH_SETTINGS_SUCCESS: {
      return fetchSetttingsSuccess(state, action);
    }
    case FETCH_SETTINGS_FAIL: {
      return fail(state, action);
    }
    case ADD_SETTING_START: {
      return start(state, action);
    }
    case ADD_SETTING_SUCCESS: {
      return addSetttingSuccess(state, action);
    }
    case ADD_SETTING_FAIL: {
      return fail(state, action);
    }
    case REMOVE_SETTING_START: {
      return start(state, action);
    }
    case REMOVE_SETTING_SUCCESS: {
      return removeSetttingSuccess(state, action);
    }
    case REMOVE_SETTING_FAIL: {
      return fail(state, action);
    }
    default:
      return state;
  }
};

export default settings;
```

```js title="redux/reducers/settings.test.js"
import deepFreeze from 'deep-freeze';

import settings from './settings';

describe('settings reducer', () => {
  it('returns the initial state', () => {
    const stateBefore = undefined;
    const action = {};
    const stateAfter = {
      settings: {},
      error: '',
      loading: false,
    };
    // deepFreeze(stateBefore); cannot deepFreeze undefined
    deepFreeze(stateAfter);
    expect(settings(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles FETCH_SETTINGS_START', () => {
    let stateBefore = undefined;
    const action = { type: 'FETCH_SETTINGS_START' };
    let stateAfter = {
      settings: {},
      error: '',
      loading: false,
    };
    // deepFreeze(stateBefore); cannot deepFreeze undefined
    deepFreeze(stateAfter);
    expect(settings(stateBefore, action)).toEqual(stateAfter);

    const sets = {
      primaryCategories: ['pc1', 'pc2'],
      secondaryCategories: ['sc10', 'sc11'],
      tags: ['tag100', 'tag101'],
    };
    stateBefore = {
      settings: sets,
      error: '',
      loading: false,
    };
    stateAfter = {
      settings: sets,
      error: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(settings(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles FETCH_SETTINGS_SUCCESS', () => {
    const sets1 = {
      primaryCategories: ['pc1', 'pc2'],
      secondaryCategories: ['sc10', 'sc11'],
      tags: ['tag100', 'tag101'],
    };
    let stateBefore = {
      settings: {},
      error: '',
      loading: true,
    };
    let action = { type: 'FETCH_SETTINGS_SUCCESS', settings: sets1 };
    let stateAfter = {
      settings: sets1,
      error: '',
      loading: false,
    };
    // deepFreeze(stateBefore); cannot deepFreeze undefined
    deepFreeze(stateAfter);
    expect(settings(stateBefore, action)).toEqual(stateAfter);

    const sets2 = {
      primaryCategories: ['pca', 'pcb'],
      secondaryCategories: ['scaa', 'scbb'],
      tags: ['tagaaa', 'tagbbb'],
    };
    stateBefore = {
      settings: sets1,
      error: '',
      loading: true,
    };
    action = { type: 'FETCH_SETTINGS_SUCCESS', settings: sets2 };
    stateAfter = {
      settings: sets2,
      error: '',
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(settings(stateBefore, action)).toEqual(stateAfter);
  });

  it('handles FETCH_SETTINGS_FAIL', () => {
    const error = 'Settings fail';
    let stateBefore = {
      settings: {},
      error,
      loading: true,
    };
    const action = { type: 'FETCH_SETTINGS_FAIL', error };
    let stateAfter = {
      settings: {},
      error,
      loading: false,
    };
    // deepFreeze(stateBefore); cannot deepFreeze undefined
    deepFreeze(stateAfter);
    expect(settings(stateBefore, action)).toEqual(stateAfter);

    const sets = {
      primaryCategories: ['pc1', 'pc2'],
      secondaryCategories: ['sc10', 'sc11'],
      tags: ['tag100', 'tag101'],
    };
    stateBefore = {
      settings: sets,
      error: '',
      loading: true,
    };
    stateAfter = {
      settings: sets,
      error: error,
      loading: false,
    };
    deepFreeze(stateBefore);
    deepFreeze(stateAfter);
    expect(settings(stateBefore, action)).toEqual(stateAfter);
  });
});
```

The last step is to combine the settings reducer with the other reducers.

```jsx title="Root.jsx (updated)"
...
import auth from '../../shared/redux/reducers/auth';
import properties from '../../shared/redux/reducers/properties';
import settings from '../../shared/redux/reducers/settings';

const rootReducer = combineReducers({
  auth,
  properties,
  settings
});
...
```

We will stop here. All tests are passing and inspection of the Redux dev tools shows the settings are added to the store.

## Next

We can move on to implement the front-end to allow settings to be managed in the admin portal.

## Code

<https://github.com/peterdyer7/media-library/tree/27.SettingsBackend>
