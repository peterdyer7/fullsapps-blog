---
slug: 10-media-library-authentication
title: 10. Media Library - Authentication
authors: peter
tags: [Google Firebase, Firebase Authentication, serverless]
---

I mentioned previously that we will be leveraging Google Firebase to provide the back-end for our application. In this post we set ourselves up to use Firebase and we will get started wiring up Firebase Authentication.

<!--truncate-->

## Background

It is hard for me to imagine you have found this post without already knowing something about Google Firebase. I don't want to bore you with a bunch of words that repeat what you can learn from the Firebase website. I thought it might be worth talking briefly talking about my experience with Firebase and what I like and dislike.

First and foremost, I am a believer in backend-as-a-service or server-less development. That is, I prefer to leverage services, like those provided by Google Firebase, to construct a back-end as opposed to building back-end servers. This means I can primarily focus my efforts on the application and not worry about how the back-end is constructed. For me, there are two primary benefits - time savings and expertise. I save time not building back-end servers but more significantly, I don't have to spend any time maintaining back-end servers. There is someone else making sure back-end servers are secured and patched appropriately.

There are many opposed to backend-as-a-service or server-less computing. The primary objections are lack of control, lack of team support, and maybe some concerns over cost. If you chose to hand over your back-end to a service like Firebase you do have to follow their model. You cannot do whatever you want, or even what you think might be best. When using a back-end service you will likely have a team sharing an environment. This isn't great for development as one developer's work can effect another's. Also, the cost model for services is that you pay for what you consume. This means there tends not to be an upper bounds on what a service will cost. In some projects this can be a significant concern.

Every project is different and has different requirements. Backend-as-a-service might make sense in one application and not in another. I am a proponent for getting started using a service if it helps the team get moving, and potentially get an application into users hands more quickly.

What I really like about Firebase, in particular, is the simplicity. Firebase does a really good job at exposing just the options you need to build your application. They favor simplicity (or convention) over exposing every possible option which would slow development down. This probably means sometimes having to make compromises over how to construct the application, but in my experience this shouldn't be a big concern.

There are a couple things that give me some pause around Firebase but they don't feel like significant issues. First, Firebase is heavily tilted towards mobile apps, as opposed to web apps,. Second, React is not a focus for Firebase. Some other services provide some goodies focused on React.

I have spent time working with both Google Firebase and AWS Amplify. I'm not sure calling them direct competitors is accurate. Google Firebase is a "platform" built specifically for developers, and it differs from Google Cloud. Whereas, AWS Amplify, is a "tool chain" for building your app on AWS services (more comparable to Google Cloud, than Google Firebase). With that said, both Firebase and Amplify and focused on the same thing - backend-as-a-service (server-less). I would decribe Firebase as being easier to use, easier to get started with, also it is more integrated. Amplify (or more accurately the services backed by Amplify) provides more options but is "harder" to use. Amplify does provide some specific goodies for React.

For this project, I wanted an easy to use back-end that got our project moving and that's what Google Firebase provides really well.

[Google Firebase](https://firebase.google.com/)

## Firebase Authentication

Let's talk briefly about some choices we will make with regard to using Firebase Authentication. First, and foremost, let's discuss the features that we will use by talking about the features we are not using:

- Not using pre-built UI - doesn't offer enough value to give up control over styling (that's perception - reality might be different)
- Not using 3rd party providers - not required at this point in the project, could be added later
- Not using any of the "profile" information - not required at this point in the project, could be added later

It is also important to note that this is not Authorization - who can do what. For the moment we will focus on Authentication - who can access the application. Will address Authorization in the future.

[Firebase Authentication](https://firebase.google.com/docs/auth/)

## Walk Through

To get started with Firebase we need a Firebase account. The free tier is fine for this project (for now). I have created two Firebase projects: ml-dev & ml-prod (Firebase adjusts the names for uniqueness), and have enabled Authentication for both. Having two projects lets me do whatever I want in development without impacting production.

To wire Firebase to our application we are going to install the SDK per: <https://firebase.google.com/docs/web/setup>. I am opting to install the SDK via NPM.

```bash
npm install --save firebase
```

I am creating a configuration file that will make use of the Firebase SDK. I cannot check this file in to Github because it contains my specific configuration information, but I have included the body of the file below (with slight changes to the values). I am pulling the config info directly out of Firebase (Authentication - look for "Web setup" in the top right).

```js title="firebase.js"
import firebase from 'firebase/app';
import 'firebase/auth';

// default to dev config
let config = {
  apiKey: 'abc',
  authDomain: 'ml-dev-aaa.firebaseapp.com',
  databaseURL: 'https://ml-dev-aaa.firebaseio.com',
  projectId: 'ml-dev-aaa',
  storageBucket: 'ml-dev-aaa.appspot.com',
  messagingSenderId: '123',
};
if (process.env.NODE_ENV === 'production') {
  config = {
    apiKey: 'xyz',
    authDomain: 'ml-prod-bbb.firebaseapp.com',
    databaseURL: 'https://ml-prod-bbb.firebaseio.com',
    projectId: 'ml-prod-bbb',
    storageBucket: 'ml-prod-bbb.appspot.com',
    messagingSenderId: '987',
  };
}

if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

const auth = firebase.auth();

export { auth };
```

Next, I am going to wrap the calls to Firebase Authentication with a thin wrapper. The idea here is that I could replace Firebase Authentication with something else in the future and ideally I would just have to re-write my wrapper and not my entire application. Here you can see the specific Firebase Authentication functions I anticipate using in our application.

```js title="auth.js"
import { auth } from '../firebase';

export const register = async (email, password) => {
  try {
    const res = await auth.createUserWithEmailAndPassword(email, password);
    return res.user;
  } catch (err) {
    throw err;
  }
};

export const login = async (email, password) => {
  try {
    const res = await auth.signInWithEmailAndPassword(email, password);
    return res.user;
  } catch (err) {
    throw err;
  }
};

export const logout = async () => await auth.signOut();

export const forgotPassword = async (email) =>
  await auth.sendPasswordResetEmail(email);

export const resetPassword = async (password) =>
  await auth.currentUser.updatePassword(password);

export const deleteUser = async () => await auth.currentUser.delete();

export const getToken = async () => await auth.currentUser.getIdToken(true);

export const getUser = () => {
  const user = auth.currentUser;
  return user;
};
```

Now, for something that might feel wasteful. I am going to write a full set of tests for this wrapper (and on to Firebase). It is generally not a recommended practice to test code that is being tested elsewhere. We know that Firebase is testing their SDK so we shouldn't have to. Also, these tests DO NOT mock Firebase, they register real users, login, logout, etc. If you run these tests frequently you could run into Firebase limits. However, there are some decent reasons to write these tests.

1. To work out how to call Firebase and to see what we get back we need something - this is that something.
2. To that end, if you are picking up my code you now have a way to confirm your configuration is correct.
   I have fallen victim to a 3rd party library failing or changing their interface unexpectedly. It is nice having something to confirm whether an issue is ours or with the 3rd party.

The test file is called auth.test.js. It's a bit long to post. You can find it in the same directory as the auth.js file.

## Next

We can start building the pages that will leverage the authentication we now have wired to our application.

## Code

<https://github.com/peterdyer7/media-library/tree/10.FirebaseAuthentication>
