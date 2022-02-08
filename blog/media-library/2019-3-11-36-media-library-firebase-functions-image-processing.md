---
slug: 36-media-library-firebase-functions-image-processing
title: 36. Media Library - Firebase Functions - Image Processing
authors: peter
tags: [Firebase Functions, Google Cloud Functions, Google Cloud Vision API]
---

We are going continue with Firebase Functions in this post. We will start to see the power of Functions and how we can take advantage of them.

<!--truncate-->

## Background

In our media-library application we let admins upload images. We want to use these images in various places throughout the application. However, we haven't placed any restrictions on the size of images that can be uploaded so there is potential that a user could load a very large image that could slow our application down if we loaded it when we wanted to display the image. The problem would be further exaggerated if we had pages displaying many images, all of which were very large.

However, we do want to let users download images and we would like them to receive the best image we have. So, what we would like to do is create a smaller copy (or maybe a couple different sizes) of any uploaded image to use in our application. If we so chose we could also make these copies available for download along with the full-size image in case users also want a smaller copy.,

Firebase functions supports this functionality. First, they provide the ability to trigger a function when something is added to Storage. You can see more about that here: <https://firebase.google.com/docs/storage/extend-with-functions>. Second, they provide samples that illustrate how to perform various image processing tasks using capability built-in to Functions. You can see more about that here: <https://github.com/firebase/functions-samples#image>.

We will also take advantage of this function to gather some additional metadata about the image that might be important to users. We will extract the exif metadata from the image. We will also leverage the [Google Cloud Vision API](https://cloud.google.com/vision/) to gather data for us. This a pattern I am a big fan of. For very little extra cost (a little extra development and potentially some additional cloud costs) we can access a bunch of data that might have a lot of value to our users.

## Walk Through

We will be using async/await in this post. If you chose to turn on eslint, be sure to update ecmaVersion to 8 (or 2017) in eslintrc.json.

Before we write any code we need to add some additional helper libraries (make sure you are in the functions directory before you run this).

```bash
npm install --save child-process-promise uuid-v4 @google-cloud/vision
```

The eslint rules added to our project have a rule to flag await inside loops. I'm going to change that into a warning. Await does function correctly inside traditional for .. of loops (that's why I am using them).

```json
    // Disallow await inside of loops
    "no-await-in-loop": 1,
```

Normally, I don't like to comment code very much. I find comments clutter code and they often can't be trusted. I would rather follow the code to see what it does. However, with the type of function we are creating here it can be difficult to step through the code so I am going to include some comments.

Let's create the function.

```js title="process-image.js"
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const vision = require('@google-cloud/vision');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
const uuid = require('uuid-v4');

exports = module.exports = functions.storage
  .object()
  .onFinalize(async (object) => {
    // gather source file info
    const filePath = object.name; // folder/file.jpg
    const fileName = path.basename(filePath); // file.jpg
    const fileDir = path.dirname(filePath); // folder - image ID in this application
    const contentType = object.contentType; // image/jpeg
    const metageneration = object.metageneration; // 1

    // exit if not an image
    if (!contentType.startsWith('image/')) {
      console.log(`${fileName} is not an image.`);
      return null;
    }

    // exit if this is not a new image to process
    if (!metageneration === 1) {
      console.log(`${fileName} is not a new image.`);
      return null;
    }

    const repros = [
      {
        name: 'thumbnail',
        prefix: 'thumb_',
        height: 200,
        width: 200,
        conversionType: '-thumbnail',
      },
      {
        name: 'small',
        prefix: 'small_',
        height: 400,
        width: 400,
        conversionType: '-resize',
      },
    ];

    // exit if image is a reproduction, that is, an image we previously created through this process
    for (const repro of repros) {
      if (fileName.startsWith(repro.prefix)) {
        console.log(`${fileName} is a reproduction.`);
        return null;
      }
    }

    // Cloud Storage
    const fileBucket = object.bucket; // project.appspot.com
    const bucket = admin.storage().bucket(fileBucket); // Bucket { ... }
    const sourceFile = bucket.file(filePath); // File { ... }

    // Cloud Vision
    const visionClient = new vision.ImageAnnotatorClient();
    const visionFile = `gs://${bucket.name}/${filePath}`;
    // labels
    const labelsResults = await visionClient.labelDetection(visionFile);
    // write labels to DB
    await db
      .collection('labels')
      .doc(fileDir)
      .set({ labels: labelsResults[0].labelAnnotations });
    // safeSearch
    const safeSearchResults = await visionClient.safeSearchDetection(
      visionFile
    );
    // write safeSearch to DB
    await db
      .collection('safeSearch')
      .doc(fileDir)
      .set({ safeSearch: safeSearchResults[0].safeSearchAnnotation });
    // webDetection
    const webDetectionResults = await visionClient.webDetection(visionFile);
    // write webDetection to DB
    await db
      .collection('webDetection')
      .doc(fileDir)
      .set({ webDetection: webDetectionResults[0].webDetection });

    // temporary local source file
    const tempSourceFilePath = path.join(os.tmpdir(), fileName); // /tmp/file.jpg
    // download source
    await sourceFile.download({ destination: tempSourceFilePath });

    // retrieve exif metadata
    const exifResult = await spawn(
      'identify',
      ['-verbose', tempSourceFilePath],
      { capture: ['stdout', 'stderr'] }
    );
    // Save exif metadata to database
    const exifMetadata = imageMagickOutputToObject(exifResult.stdout);
    await db.collection('exif').doc(fileDir).set(exifMetadata);

    // create a reproduction for each repro
    for (const repro of repros) {
      const reproFileName = `${repro.prefix}${fileName}`; // thumb_file.jpg
      const tempReproFilePath = path.join(os.tmpdir(), reproFileName); // /tmp/thumb_file.jpg
      // create repro
      await spawn(
        'convert',
        [
          tempSourceFilePath,
          repro.conversionType,
          `${repro.width}x${repro.height}>`,
          tempReproFilePath,
        ],
        { capture: ['stdout', 'stderr'] }
      );

      // repro file upload - need to set the options we want
      const reproFilePath = path.join(fileDir, reproFileName); // folder/thumb_file.jpg
      const token = uuid();
      const options = {
        destination: reproFilePath,
        uploadType: 'media',
        metadata: {
          contentType: contentType,
          metadata: {
            firebaseStorageDownloadTokens: token,
          },
        },
      };
      const res = await bucket.upload(tempReproFilePath, options);
      // contruct the download url and store it
      const reproUrl = `https://firebasestorage.googleapis.com/v0/b/${fileBucket}/o/${encodeURIComponent(
        res[0].name
      )}?alt=media&token=${
        res[0].metadata.metadata.firebaseStorageDownloadTokens
      }`;
      await db
        .collection('images')
        .doc(fileDir)
        .set({ repros: { [repro.name]: reproUrl } }, { merge: true });
      fs.unlinkSync(tempReproFilePath);
    }
    fs.unlinkSync(tempSourceFilePath);

    return console.log(`${fileName} processing complete, cleanup successful`);
  });

/**
 * Convert the output of ImageMagick `identify -verbose` command to a JavaScript Object.
 */
function imageMagickOutputToObject(output) {
  let previousLineIndent = 0;
  const lines = output.match(/[^\r\n]+/g);
  lines.shift(); // Remove First line
  lines.forEach((line, index) => {
    const currentIdent = line.search(/\S/);
    line = line.trim();
    if (line.endsWith(':')) {
      lines[index] = makeKeyFirebaseCompatible(`"${line.replace(':', '":{')}`);
    } else {
      const split = line.replace('"', '\\"').split(': ');
      split[0] = makeKeyFirebaseCompatible(split[0]);
      lines[index] = `"${split.join('":"')}",`;
    }
    if (currentIdent < previousLineIndent) {
      lines[index - 1] = lines[index - 1].substring(
        0,
        lines[index - 1].length - 1
      );
      lines[index] =
        new Array(1 + (previousLineIndent - currentIdent) / 2).join('}') +
        ',' +
        lines[index];
    }
    previousLineIndent = currentIdent;
  });
  output = lines.join('');
  output = '{' + output.substring(0, output.length - 1) + '}'; // remove trailing comma.
  output = JSON.parse(output);
  // console.log('Metadata extracted from image', output);
  return output;
}

/**
 * Makes sure the given string does not contain characters that can't be used as Firebase
 * Realtime Database keys such as '.' and replaces them by '*'.
 */
function makeKeyFirebaseCompatible(key) {
  return key.replace(/\./g, '*');
}
```

These are the key things worth noting in this function:

- ImageMagick is doing a lot of the heavy lifting. It is responsible for both the image reproduction (<https://imagemagick.org/Usage/resize/>) and the extraction of exif metadata (<https://imagemagick.org/script/identify.php>). We are creating and storing a thumbnail and small version of the uploaded image along side the source image in Firebase Storage. We are writing the exif metadata to the database.
- We do have to check that the image triggering the function is not one of the images we created. I have looked at a couple different ways to work around this issue but this seems to be the most reasonable. If you are using a "pay-as-you-go" plan in Firebase, and technically I am, you can setup different buckets. It might be reasonable to setup one bucket for uploaded images and another bucket for reproductions.
- Leveraging the Google Cloud Vision API does bring some changes to our application. This is the first place where we are noticeably stepping out of Google Firebase and into Google Cloud. In order to use the Google Cloud Vision API we need to enable it in the Google Cloud Console (<https://console.cloud.google.com/apis/api/vision.googleapis.com/overview?project=_>). We are going to the labelDetection, safeSearchDetection and webDetection from the Vision API, and we are writing all of the results to the database. There is one other thing I have done behind the scenes that you may want to consider. Using the Google Cloud Console you can add memory to your function (you cannot do this in the Firebase Console). Execution time for this function is aweful and on one execution I also noticed the function failed because it ran out of memory (this does not happen everytime).
- We are writing data directly to the DB (via the Firebase admin sdk). I don't like this practice, it would be better to leverage an API, especially if the same methods would be called in the GUI. At this point the back-end functions are different enough from something that I would do in the GUI that I am going to live with not creating an API helper.

I'm using the exact same methods to expose this via index.js and to deploy the function as what we followed in the previous post.

Note that firebase serve (wrapped by npm run serve) only supports running https functions locally. To see our storage triggered function in action we need to deploy it. In fact, we need a way to add an image for the function to be triggered. You could do that in a few different ways, but I'm going to use the media-library application itself and upload a new image.

Also, at some point we have to find uses for some of the data we are generating. I don't like to overbuild but generating this data is important at this point because it gives me something I share with users to start a dialog about the type of data they could have access to.

## Next

Let's stick with Functions for one more post and do two things - one, expose a way to create an admin auth claim and two, bulk update data in our project.

## Code

<https://github.com/peterdyer7/media-library-functions/tree/ImageProcessing>
