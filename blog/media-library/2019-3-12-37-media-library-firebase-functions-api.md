---
slug: 37-media-library-firebase-functions-api
title: 37. Media Library - Firebase Functions - API
authors: peter
tags: [Firebase Functions, REST API]
---

We are going continue and wrap-up our mini-series on using Firebase Functions in this post. We will put in place one of the most often used patterns for Firebase Functions and that is to expose a REST API.

<!--truncate-->

## Background

Firebase Functions provide an easy way to respond to http requests - we've seen that in other posts. If you want to develop a full REST API that is also very easy. Firebase Functions can expose an Express app, see - <https://firebase.google.com/docs/functions/http-events>.

I'm making an assumption that if you are reading this you understand REST APIs and also Node and Express. If you don't I recommend doing a little research in that area first. We won't be doing anything complicated but if you are not familiar it can be a bit tricky. There are tons of places on the Internet to learn more. If you want to see a super simple REST API written in Node using Express I have created one here: <https://github.com/fullsapps/simple-rest-api>.

There are two main things we want to do with our REST API:

1. I want to revisit our post on [authorization](/blog/22-media-library-authorization-firestore-security-rules). I talked about creating custom auth claims and I mentioned that they require the admin-sdk. We have access to the admin-sdk in Firebase Functions so I am going to create an API endpoint that will let me add the admin auth claim to a specified user (this is our way of creating admin users).
2. I also want to expose functionality through the API that lets me perform actions similar to the GUI. This will let me script the creation of data and will open the possibility to bulk loading data in the future.

You will want to have a REST client handy while working on the API. That is, you will want to be able to call the API as you expose functionality to ensure it is working as expected. There are a ton of REST clients available, you could use Curl, I'm going to use Postman.

The other thing you will need is to have the media-library application running. We could provide authorization to the API in a number of different ways. For example, we could build a system for using API keys. However, we can also follow the authorization model of the GUI. That is, we can leverage a token, and specifically, we can leverage the same token users are generating when they login to the application. Remember that we are storing the token in Local Storage (the Key is ml-token) in the browser (this allows us to keep a user logged in if they refresh the page or close and reopen the browser, etc). So, you can login and retrieve the token if/when you need it. This is what I am going to use in the API. I will be including the token as a header in requests, Authorization = Bearer thetokengoeshere... . The other header I am including in all requests is, Content-Type = application/json (this makes parsing data in requests easier).

## Walk Through

We need to install a couple libraries that will allow us to create our API (remember you need to be in the functions folder).

```bash
npm install --save express cors
```

I am going to make some edits to index.js to support the creation of our new API. I am going to add a file called api.js where we will be creating our API. I'm also going to init the firebase application from index.js because firebase gets cranky if we try to initialize it in multiple places.

```js title="index.js (updated)"
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'mediaLibraryFunction') {
  exports.mediaLibraryFunction = require('./media-library-function');
}

if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'processImage') {
  exports.processImage = require('./process-image');
}

if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'api') {
  exports.api = require('./api');
}
```

Let's start by creating a super simple API shell with a very simple first endpoint.

```js title="api.js"
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/:id', (req, res) => {
  try {
    res.status(200).json({ data: { id: req.params.id } });
  } catch (err) {
    console.log('[GET /:id]', err.message);
    res.sendStatus(500);
  }
});

exports = module.exports = functions.https.onRequest(app);
```

Now if you serve the API locally (npm run serve which is executing firebase serve --only functions) you can test the result. You should be able to execute a GET request to the new API endpoint (provided in the console, ends with /api) with /:id (that just means include anything as an id). The API should return the id you provided.

With that working I am going to add an endpoint that let's me set the admin auth claim for a user. You could execute this as a GET or even a PUT would be reasonable, however, I am using POST. I am simply posting the user's ID ({ "uid": "notarealid123" }) to the /claim endpoint.

```js title="api.js (auth claim endpoint/function)"
...
app.post('/claim', async (req, res) => {
  try {
    const claim = req.body;
    const uid = claim.uid;

    const res1 = await admin.auth().setCustomUserClaims(uid, { admin: true });

    res.status(200).json({ data: res1 });
  } catch (err) {
    console.log('[POST /claim]', err.message);
    res.sendStatus(500);
  }
});
...
```

Be sure to create at least one admin for yourself. We now have a giant security whole in our application in that anyone could post their user ID to the claim endpoint and make themselves an admin (but its not a big deal because we are still serving the API locally). We are going to close this security whole through the use of Express middleware. Middleware are functions that run automatically on a request that allow us to perform actions between the request and response. Middleware functions receive the request context and are perfect places to perform functions such as logging, or in our case, authorization. We check the token provided by the user and verify that they are logged in and that they have the admin auth claim (only admins will be allowed to use the API). If the auth check passes we let the user's request proceed, if it fails, we return an error. Note that we are console logging the token we are receiving. This is reasonable given the state of our project but this is probably something we would want to suppress in a busy production API. Be sure to re-serve the function for this update to be applied.

```js title="api.js (middleware function)"
...
const authenticate = async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer ')
  ) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token: ', decodedIdToken);
    if (decodedIdToken.admin === true) {
      req.user = decodedIdToken;
      next();
      return;
    } else {
      throw new Error('User not an admin');
    }
  } catch (e) {
    res.status(403).send('Unauthorized');
    return;
  }
};

app.use(authenticate);
...
```

If you execute the very simple GET request we executed previously (with an ID) you should get an Unauthorized - 403 Forbidden response until you provide a valid token for an admin user as described in the background section above. With the right token you should see the same response you saw previously from a successful GET request.

With that we can proceed to create all of the API endpoints and methods we want. I am creating the following:

- GET /users - retrieve a list of all users in Firebase Authentication for this project, notice that custom auth claims are returned - we can review who is an admin with this
- POST /users - will create a new user, expects the user to be provided in the body in the following format:

```json
{
  "email": "testuser@example.com",
  "company": "Company",
  "firstName": "Test",
  "lastName": "User",
  "terms": true,
  "role": "user",
  "password": "password"
}
```

- DELETE /users - deletes all users from Authentication and DB not identified in the code by name
- GET /properties - retrieves a list of all properties
- POST /properties - creates new properties from an array of properties, expecting the following format:

```json
[
  {
    "postalCode": "B0P 1T0",
    "region": "NA",
    "active": true,
    "latitude": 46.394803,
    "address2": "",
    "state": "NS",
    "name": "Fishing Camp",
    "contactPerson": "Peter",
    "id": "property1",
    "brand": "Rural",
    "address1": "123 Main",
    "city": "Margaree",
    "longitude": -60.973322,
    "country": "Canada",
    "contactPhone": "123-456-7899"
  },
...
]
```

- DELETE /properties - deletes all properties (very dangerous function)
- GET /properties/:id - retrieves a specific property by ID
- GET /settings - retrieves everything from the settings collection (in our case, to this point, this is imageMetadata)
- POST /settings - creates all settings, expecting the following format:

```json
{
  "tags": [
    "positive",
    "negative",
    "grand",
    "fountain",
    "bed",
    "bathroom",
    "sunny",
    "warm",
    "tech drawing",
    "selfie",
    "nice",
    "dark",
    "light",
    "day",
    "night",
    "morning"
  ],
  "secondaryCategory": ["Room view", "Pool Side", "Hallway", "Stairs", "Bathroom"],
  "primaryCategory": [
    "Exterior view",
    "Lobby view",
    "Pool view",
    "Restaurant",
    "Health club",
    "Guest room",
    "Suite",
    "Meeting room",
    "Ballroom",
    "Golf course",
    "Beach",
    "Spa",
    "Bar/Lounge",
    "Recreational facility",
    "Logo",
    "Basics",
    "Map",
    "Promotional",
    "Hot news",
    "Miscellaneous",
    "Guest room amenity",
    "Property amenity",
    "Business center"
  ]
}
```

- DELETE /settings - deletes all settings
- POST / images - creates images, expects the following format (can take a while to run):

```json
[
  {
    "fileName": "alcohol-architecture-bar-260922.jpg",
    "sourceFolder": "C:\\dev\\firebase\\functions\\functions\\api\\prop1",
    "id": "test11",
    "active": true,
    "caption": "Lobby Bar",
    "primaryCategory": "Bar/Lounge",
    "secondaryCategory": "",
    "tags": ["dark", "warm"],
    "properties": ["property1"],
    "size": 430710,
    "type": "image/jpeg",
    "status": "loaded"
  },
...
]
```

- GET /images/:id - retrieve a specific image by ID
- DELETE /images/:id - deletes a specific image (including all metadata) by ID
- GET /files - retrieves all files from the project's Firebase Storage bucket
- DELETE /files - deletes all files from the project's Storage bucket and deletes all image metadata (very dangerous function, and it can take a while to run)

There is one thing to keep in mind, the first Express endpoint that matches will be called. Be sure to move non-specific endpoints (like our simple GET id call from above) to the end so that they are only called if more specific endpoints do not match.

```js title="api.js (completed)"
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const uuid = require('uuid-v4');

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const authenticate = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token: ', decodedIdToken);
    if (decodedIdToken.admin === true) {
      req.user = decodedIdToken;
      next();
      return;
    } else {
      throw new Error('User not an admin');
    }
  } catch (e) {
    res.status(403).send('Unauthorized');
    return;
  }
};

app.use(authenticate);

app.post('/claim', async (req, res) => {
  try {
    const claim = req.body;
    const uid = claim.uid;

    const res1 = await admin.auth().setCustomUserClaims(uid, { admin: true });

    res.status(200).json({ data: res1 });
  } catch (err) {
    console.log('[POST /claim]', err.message);
    res.sendStatus(500);
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await admin.auth().listUsers();
    res.status(200).json({ data: users });
  } catch (err) {
    console.log('[GET /users]', err.message);
    res.sendStatus(500);
  }
});

app.post('/users', async (req, res) => {
  try {
    const user = req.body;
    const res1 = await admin.auth().createUser({ email: user.email, password: user.password });
    const res2 = await db.collection('users').doc(res1.uid).set({
      email: user.email,
      company: user.company,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      terms: user.terms,
      uid: res1.uid,
    });

    res.status(200).json({ data: user });
  } catch (err) {
    console.log('[POST /users]', err.message);
    res.sendStatus(500);
  }
});

app.delete('/users', async (req, res) => {
  try {
    // delete users from Firebase auth
    const { users } = await admin.auth().listUsers();
    for (let user of users) {
      if (user.email !== 'peter_dyer@hotmail.com') {
        await admin.auth().deleteUser(user.uid);
      }
    }
    // delete users from Firestore
    const querySnapshot = await db.collection('users').get();
    for (const doc of querySnapshot.docs) {
      if (doc.data().email !== 'peter_dyer@hotmail.com') {
        await db.collection('users').doc(doc.id).delete();
      }
    }
    res.status(200).end();
  } catch (err) {
    console.log('[DELETE /users]', err.message);
    res.sendStatus(500);
  }
});

app.get('/properties', async (req, res) => {
  try {
    const properties = {};
    const querySnapshot = await db.collection('properties').get();
    querySnapshot.forEach((doc) => {
      properties[doc.id] = doc.data();
    });
    res.status(200).json({ data: properties });
  } catch (err) {
    console.log('[GET /properties]', err.message);
    res.sendStatus(500);
  }
});

app.post('/properties', async (req, res) => {
  try {
    const properties = req.body;
    for (let property of properties) {
      await db.collection('properties').doc(property.id).set(property);
    }
    res.status(200).json({ data: properties });
  } catch (err) {
    console.log('[POST /properties]', err.message);
    res.sendStatus(500);
  }
});

app.delete('/properties', async (req, res) => {
  try {
    const querySnapshot = await db.collection('properties').get();
    for (const doc of querySnapshot.docs) {
      await db.collection('properties').doc(doc.id).delete();
    }
    res.status(200).end();
  } catch (err) {
    console.log('[DELETE /properties]', err.message);
    res.sendStatus(500);
  }
});

app.get('/properties/:id', async (req, res) => {
  try {
    let property = {};
    const doc = await db.collection('properties').doc(req.params.id).get();
    property = doc.data();
    res.status(200).json({ data: property });
  } catch (err) {
    console.log('[GET /properties/:id]', err.message);
    res.sendStatus(500);
  }
});

app.get('/settings', async (req, res) => {
  try {
    const settings = {};
    const querySnapshot = await db.collection('settings').get();
    querySnapshot.forEach((doc) => {
      settings[doc.id] = doc.data();
    });
    res.status(200).json({ data: settings });
  } catch (err) {
    console.log('[GET /settings]', err.message);
    res.sendStatus(500);
  }
});

app.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    await db.collection('settings').doc('imageMetadata').set(settings);
    res.status(200).json({ data: settings });
  } catch (err) {
    console.log('[POST /settings]', err.message);
    res.sendStatus(500);
  }
});

app.delete('/settings', async (req, res) => {
  try {
    await db.collection('settings').doc('imageMetadata').delete();
    res.status(200).end();
  } catch (err) {
    console.log('[DELETE /settings]', err.message);
    res.sendStatus(500);
  }
});

app.post('/images', async (req, res) => {
  try {
    const images = req.body;

    for (let image of images) {
      const token = uuid();
      const options = {
        destination: `${image.id}/${image.fileName}`,
        uploadType: 'media',
        metadata: {
          contentType: image.type,
          contentDisposition: `attachment; filename=${image.fileName}`,
          metadata: {
            firebaseStorageDownloadTokens: token,
          },
        },
      };
      const res1 = await admin.storage().bucket().upload(`${image.sourceFolder}\\${image.fileName}`, options);

      const fileBucket = 'ml-dev-18bc4.appspot.com';
      const url = `https://firebasestorage.googleapis.com/v0/b/${fileBucket}/o/${encodeURIComponent(
        res1[0].name
      )}?alt=media&token=${res1[0].metadata.metadata.firebaseStorageDownloadTokens}`;
      const dateNow = new Date();
      const res2 = await db.collection('images').doc(image.id).set({
        active: image.active,
        caption: image.caption,
        id: image.id,
        name: image.fileName,
        primaryCategory: image.primaryCategory,
        secondaryCategory: image.secondaryCategory,
        tags: image.tags,
        properties: image.properties,
        size: image.size,
        type: image.type,
        status: image.status,
        lastModifiedDate: dateNow,
        uploaded: dateNow,
        updated: dateNow,
        url,
      });
    }
    res.status(200).json({ data: images });
  } catch (err) {
    console.log('[POST /images]', err.message);
    res.sendStatus(500);
  }
});

app.get('/images', async (req, res) => {
  try {
    const images = {};
    const querySnapshot = await db.collection('images').get();
    querySnapshot.forEach((doc) => {
      images[doc.id] = doc.data();
    });
    res.status(200).json({ data: images });
  } catch (err) {
    console.log('[GET /images]', err.message);
    res.sendStatus(500);
  }
});

app.get('/images/:id', async (req, res) => {
  try {
    let image = {};
    const doc = await db.collection('images').doc(req.params.id).get();
    image = doc.data();
    res.status(200).json({ data: image });
  } catch (err) {
    console.log('[GET /images/:id]', err.message);
    res.sendStatus(500);
  }
});

app.delete('/images/:id', async (req, res) => {
  try {
    let image = {};
    const doc = await db.collection('images').doc(req.params.id).get();
    image = doc.data();

    // delete files from storage (if the file exists)
    try {
      await admin.storage().bucket().file(`${image.id}/thumb_${image.name}`).delete();
    } catch (e) {
      console.log(`${image.id}/thumb_${image.name} could not be deleted.`);
    }
    try {
      await admin.storage().bucket().file(`${image.id}/small_${image.name}`).delete();
    } catch (e) {
      console.log(`${image.id}/small_${image.name} could not be deleted.`);
    }
    try {
      await admin.storage().bucket().file(`${image.id}/${image.name}`).delete();
    } catch (e) {
      console.log(`${image.id}/${image.name} could not be deleted.`);
    }
    // delete image from Firestore
    await db.collection('images').doc(image.id).delete();
    // exif
    await db.collection('exif').doc(image.id).delete();
    // labels
    await db.collection('labels').doc(image.id).delete();
    // safeSearch
    await db.collection('safeSearch').doc(image.id).delete();
    // webDetection
    await db.collection('webDetection').doc(image.id).delete();
    res.status(200).end();
  } catch (err) {
    console.log('[GET /images/:id]', err.message);
    res.sendStatus(500);
  }
});

app.get('/files', async (req, res) => {
  try {
    const [files] = await admin.storage().bucket().getFiles();
    res.status(200).json({ data: files.map((file) => file.name) });
  } catch (err) {
    console.log('[GET /files]', err.message);
    res.sendStatus(500);
  }
});

app.delete('/files', async (req, res) => {
  try {
    // delete files from storage
    const [files] = await admin.storage().bucket().getFiles();
    for (let file of files) {
      await admin.storage().bucket().file(file.name).delete();
    }
    // delete images from Firestore
    let querySnapshot;
    // images
    querySnapshot = await db.collection('images').get();
    for (const doc of querySnapshot.docs) {
      await db.collection('images').doc(doc.id).delete();
    }
    // exif
    querySnapshot = await db.collection('exif').get();
    for (const doc of querySnapshot.docs) {
      await db.collection('exif').doc(doc.id).delete();
    }
    // labels
    querySnapshot = await db.collection('labels').get();
    for (const doc of querySnapshot.docs) {
      await db.collection('labels').doc(doc.id).delete();
    }
    // safeSearch
    querySnapshot = await db.collection('safeSearch').get();
    for (const doc of querySnapshot.docs) {
      await db.collection('safeSearch').doc(doc.id).delete();
    }
    // webDetection
    querySnapshot = await db.collection('webDetection').get();
    for (const doc of querySnapshot.docs) {
      await db.collection('webDetection').doc(doc.id).delete();
    }
    res.status(200).end();
  } catch (err) {
    console.log('[DELETE /files]', err.message);
    res.sendStatus(500);
  }
});

app.get('/:id', (req, res) => {
  try {
    res.status(200).json({ data: { id: req.params.id } });
  } catch (err) {
    console.log('[GET /:id]', err.message);
    res.sendStatus(500);
  }
});

exports = module.exports = functions.https.onRequest(app);
```

With the function completed and everything working as expected locally we can go ahead and deploy to the cloud.

```bash
npm run deploy
```

You will want to adjust the URL to the api in the cloud and run some sanity checks.

It is worth noting that the previous work we did to gather metadata for images and reproduce images in different sizes all works with the API. That's because our function is triggered by putting images in the storage bucket regardless if that is via the GUI or the API.

There are a couple functions that I am exposing via the API that help with getting the prototype working but might (are) not be something we would expose in the final app. Notably, I am referring to the delete functions which have the ability to wipe out a lot of data very quickly without any safeguards. In fact, as we are working on just a prototype at this point it would be reasonable to only serve the API locally but I have deployed it just to complete the loop.

## Next

That will wrap up our look at Firebase Functions for now. You can probably see that having this ability to execute server-side code is still really important in a serverless application. In the next few posts we will start to expose some of this new data we are generating.

## Code

<https://github.com/peterdyer7/media-library-functions/tree/API>
