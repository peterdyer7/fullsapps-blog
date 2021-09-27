---
slug: 35-media-library-firebase-functions-getting-started
title: 35. Media Library - Firebase Functions - Getting Started
authors: peter
tags: [Firebase Functions]
---

We are going to go on a tiny detour here. To this point we have been working in our React application. In this post I want to create some back-end helper functions. To do that we are going to create a new nodejs project.

<!--truncate-->

## Background

This is pretty typical of a serverless application like the one we are building. Eventually, you find a need to run some server-side code. We will create our server-side code leveraging Firebase Functions and node.

To get everything for Firebase Function setup and working we will follow this: <https://firebase.google.com/docs/functions/get-started>.

## Walk Through

Let's start with installing firebase-tools and once installed run firebase login.

```bash
npm install -g firebase-tools
...
firebase login
```

With that done we can create our project. I have created new folder (the name is not important) where I can initialize the project.

```bash
firebase init functions
```

When this command runs be sure to choose the correct default Firebase project. The only non-default choice I am making is to include eslint (by default it is not added to the project).

I'm not totally in love with the project structure that gets created. I think essentially what is happening is that you end up with a node project inside a Firebase project. For me, the key takeaway is to be careful what directory you are in when you run commands.

I'm going to make one update before I try to run anything. I'm adding "engines": {"node": "8"} to my package.json file to get support for Node 8 (basically to get async/await).

With that done I am ready to run my first function. I am un-commenting the code (and deleting the stuff we don't need) in the index.js file that was provided by default and I'm changing the function name and response to be something specific to our project.

```js title="index.js (updated)"
const functions = require('firebase-functions');

exports.mediaLibraryFunction = functions.https.onRequest(
  (request, response) => {
    response.send('Hello from media-library-function!');
  }
);
```

I'm going to run locally before deploying to the cloud (note that I'm running these commands from the functions folder inside the project folder).

```bash
npm run serve
```

If that command executes successfully you can bring up the link provided in a browser or a rest client and confirm the expected response. With that working I am going to deploy the function to the cloud and verify it there.

```bash
npm run deploy
```

When the deployment completes you should get a message that indicates it was successful, along with a URL that will take you into the Firebase console. You can also see that deployment was successful by accessing the Functions page in the Firebase console. In very fine print, the console exposes the URL you can use to access the function. I'm going to copy the URL and access it the same way I did when running locally (because this is a simple GET request I am using the browser). You should get the same result as when you ran the function locally.

I want to make one other change to set us up for success in the next post. Eventually, we will create multiple functions and adding all of them to index.js will lead to a very busy file. I am going to move the function we created to a separate file and we will use index.js to reference the functions we create in other files. You could even include some additional folder structure but that is overkill for what I am looking for.

```js title="media-library-function.js"
const functions = require('firebase-functions');

exports = module.exports = functions.https.onRequest((request, response) => {
  response.send('Hello from media-library-function!');
});
```

```js title="index.js (updated)"
const functions = require('firebase-functions');

exports = module.exports = functions.https.onRequest((request, response) => {
  response.send('Hello from media-library-function!');
});
```

You should now be able to repeat the same pattern to run locally and remotely and see the same result as we saw above.

I am going to leave you with two things before we wrap up this post.
console.log (error, etc) is a very valuable tools when working with Firebase Functions. You can review the output on the Logs tab in the Firebase console - Functions page with deployed functions. Locally served function output to the console.
Google has provided a tremendous array of sample functions - <https://github.com/firebase/functions-samples>.

## Next

With that, we have a good foundation for creating functions. In the next post we will add some image processing.

## Code

<https://github.com/peterdyer7/media-library-functions>
