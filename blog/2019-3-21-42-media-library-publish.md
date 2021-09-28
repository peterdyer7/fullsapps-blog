---
slug: 42-media-library-publish
title: 42. Media Library - Publish
authors: peter
tags: [Firebase Hosting]
---

It feels like this blog series has been going on forever, maybe because it has. We finally reached our goal of having something worth showing users in the last post. We can now turn our attention to getting the application published somewhere users can access it.

<!--truncate-->

## Background

Not surprisingly we will leverage Firebase Hosting to host our application. This in one of the most straightforward operations related to our application.

## Walk Through

I am going to start by creating a production build of our application.

```bash
npm run build
```

There are some good bits in the create-react-app documentation about installing and using serve. This is a good way to test your production build before you push it to a live server.

See: <https://facebook.github.io/create-react-app/docs/deployment>.

The steps to deploy to Firebase Hosting are also discussed on that same page. Below are the steps we are using and the answers to the Firebase questions.

```bash
npm install -g firebase-tools
firebase login
firebase init
Are you ready to proceed? Yes
Which Firebase CLI features... Hosting
Select a default Firebase project for this directory: select your media-library project (this will be skipped after you do it once)
What do you want to use as your public directory? build
Configure as a single-page app (rewrite all urls to /index.html)? Yes
File build/index.html already exists. Overwrite? No
```

The result should be a url. In fact, you will get two urls. One links to the project in the Firebase Console. The more important url is the one that is the application itself.

My url is: <https://ml-dev-18bc4.firebaseapp.com/>

Your are welcome to register as a new user and try the application.

If you are interested in seeing the admin side of the application send me an email (pete@fullsapps.com) and I will make you an admin.

## Next

Let's wrap up in the next post with a quick postmortem and discussion about what could be done next with the application.

## Code

https://github.com/peterdyer7/media-library
