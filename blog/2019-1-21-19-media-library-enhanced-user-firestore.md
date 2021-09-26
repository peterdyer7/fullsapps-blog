---
slug: 19-media-library-enhanced-user-firestore
title: 19. Media Library - Enhanced User - Firestore
authors: peter
tags: [Firebase Authentication, Semantic UI Menu, useState]
---

During the registration process we are asking users to provide more than just an email address and a password. We are asking for their first and last name, their company. However, to this point we are throwing that information away. It would be good to store that information somewhere.

<!--truncate-->

## Background

Google Firebase exposes two NoSQL databases: Realtime Database and Cloud Firestore. Google doesn't present it this way but I am going to suggest Cloud Firestore is the successor to Realtime Database. Firestore is still in beta so it might not be right for a production application. However, as you know by now one of our goals with this application is leveraging next gen tech, not just what is fully released today. Our application will require somewhere to store data and Firestore is the logical location.

As always, Google has provided an excellent set of documentation to help us use Cloud Firestore - <https://firebase.google.com/docs/firestore/>.

## Walk Through

To get started with Firestore you need to enable it via the Firebase Console. For now you should allow anyone to read or write to the database - we will change this in the near furture.

To proceed with Firestore in out application we need to make some changes to our Firebase config. Keep in mind this is a file I cannot check into Github because of the sensitive data it contains, but I can show the relevant updates. There is some straightforward config for Firestore.

Also, I'm going to create a persistent Firebase user that I will include in this file (the email and password below are not real). The way Firebase works is that the actions you preform are carried out in the context of a particular user. In our case, a user will login to the application and anything they do on the Firebase back-end will be in the context of that user. That means that to run database tests we need a logged in user. This is the user I've created and will store in the config. In a larger team I would not want to do this. I would probably prefer to have the user running tests have an account and run the tests in their context.

```js title="firebase.js (updated)"
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

...

const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

const fbUser = { email: 'user@example.com', password: 'password' };

export { auth, db };
```

It was quite a few posts ago but we will follow similar patterns to those that we followed when we started using Firebase Authentication. We will create some functionality and test to ensure it works before attempting to wire it to the rest of our application.

We know we want to store some user information and that we will want to retrieve that information. Let's start with createUser, fetchUser and deleteUser functions using the db library we exported from the firebase config we edited above.

One implementation detail I recommend is to store your ID not just as the document ID but also to store it in the document itself. This comes in handy when using Firestore.

```js title="db/users.js"
import { db } from '../firebase';

export const createUser = async (user) => {
  try {
    await db.collection('users').doc(user.uid).set(user);
  } catch (err) {
    throw err;
  }
};

export const fetchUser = async (id) => {
  try {
    const getDoc = await db.collection('users').doc(id).get();
    if (getDoc) {
      return getDoc.data();
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

export const deleteUser = async (id) => {
  try {
    return await db.collection('users').doc(id).delete();
  } catch (err) {
    throw err;
  }
};
```

Next, let's test these functions to make sure they work as we expect.

```js title="db/users.test.js"
import { createUser, fetchUser, deleteUser } from './users';
import { login, logout } from '../auth/auth';
import { fbUser } from '../firebase';

describe('settings.js (Firebase Firestore)', () => {
  beforeAll(async () => {
    await login(fbUser.email, fbUser.password);
  });

  afterAll(async () => {
    await logout();
  });

  it('calls createUser, fetchUser and deleteUser successfully', async () => {
    const user = {
      userId: '123',
      email: 'auser@example.com',
      firstName: 'firsty',
      lastName: 'lasty',
      company: 'companyabc',
      agreeToTerms: true,
      role: 'user',
    };
    try {
      await createUser(user);
      const fetchedUser = await fetchUser(user.userId);
      expect(fetchedUser).toMatchObject(user);
      await deleteUser(user.userId);
      const deletedUser = await fetchUser(user.userId);
      expect(deletedUser).toBeFalsy();
    } catch (err) {
      expect(err).toBeFalsy(); // show not make it here
    }
  });
});
```

We now have the ability to store users in Firestore. Let's wire this into our application by updating the authenticate action. When we register a new user we should store the user and add their first name to the store so it can be used in the application. Similarly, when we login a user we should retrieve their first name from the database and add it to the store for use in the application. Note that if we are unsuccessful saving the user to Firestore we delete the user and throw an error.

```js title="actions/auth.js (updates)"
...
export const authenticate = (user, isLogin) => async (dispatch) => {
  dispatch(authStart());
  let authUser;
  let firstName;
  try {
    if (isLogin) {
      authUser = await login(user.email, user.password);
      const fetchedUser = await fetchUser(authUser.uid);
      firstName = fetchedUser.firstName;
    } else {
      authUser = await register(user.email, user.password);
      firstName = user.firstName;
      try {
        await createUser({
          uid: authUser.uid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          agreeToTerms: user.agree,
          role: 'user'
        });
      } catch (err) {
        await deleteUser();
        throw err;
      }
    }
    const token = await getToken();
    dispatch(
      authSuccess({
        uid: authUser.uid,
        token,
        email: user.email,
        firstName
      })
    );
  } catch (err) {
    dispatch(authFail(err.message));
  }
};
...
```

We need to make a small update to RegisterForm to now path down the additional form data that we will store.

```jsx title="RegisterForm.jsx (updates)"
...
        sendAuth({
          email: values.email,
          password: values.password1,
          firstName: values.firstName,
          lastName: values.lastName,
          company: values.company,
          agree: values.agree
        });
...
```

We should now update the RegisterContainer test to not just delete the user from Firebase Authentication but also from Firestore. Note that we've named both the auth and db related functions deleteUser. We can work past that by using 'as' to rename the functions in the context of this file.

```jsx title="RegisterContainer.test.jsx (updates)"
...
import { deleteUser as authDelete } from '../../../shared/firebase/auth/auth';
import { deleteUser as dbDelete } from '../../../shared/firebase/db/users';

...
    // cleanup
    await dbDelete(getByTestId('userId').textContent);
    await authDelete();
...
```

With firstName available in the store we can refactor the menus to display firstName instead of email.

```jsx title="DesktopMenu.jsx (updates)"
...
              <Menu.Item>Hello {user.firstName}</Menu.Item>
...
```

```jsx title="MobileMenu.jsx (updates)"
...
          <Menu.Item>Hello {user.firstName}</Menu.Item>
...
```

I carried out another quick refactor to change userId to uid. This makes the name consistent with Firebase Authentication.

## Next

There is a very annoying problem with our app as it stands - any attempts to use the address bar, or anything that causes a refresh flushes the state and logs out our user. Let's address that in the next post.

## Code

<https://github.com/peterdyer7/media-library/tree/19.Firestore>
