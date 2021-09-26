---
slug: 22-media-library-authorization-firestore-security-rules
title: 22. Media Library - Authorization - Firestore Security Rules
authors: peter
tags:
  [
    authorization,
    Cloud Firestore Security Rules,
    custom claims,
    Firebase Authentication,
    Firebase Functions,
    serverless,
  ]
---

In the last Media Library post (#21) we addressed client-side authorization. That is, we established how the front-end renders the app based on who the user is, or better said, what the user's role is. You can think of this as a courtesy to prevent the user from doing things they should (will) not be allowed to do. We still need to implement code on the server that similarly controls what the user can do and what data they have access to. This will save naive users from getting into trouble, but also will prevent malicious users from doing things we don't want them to do.

In this post we address the server side of authorization. It might sound strange to say we need to address server side authorization in a serverless application but in fact, authorization, introduces a somewhat unique challenge to serverless applications (like the one we are building).

<!--truncate-->

## Background

In a traditional application with back-end servers and a back-end application tier we would write authorization into our server side code. However, in a serverless world (like that provided by Google Firebase) we do not have access to the server and we cannot write authorization in the same way do in a traditional application. Of course, Firebase is well aware of this and exposes tools that we can use to implement server side authorization.

The first part of server side authorization in Firebase is Firebase Authentication. That is, our server knows that our user is authenticated and knows who the user is, because they authenticated the user.

The second part of server side authorization in our Firebase application is based on Cloud Firestore rules. I'm going to spend a bit more time on this topic than I have on others because I feel like this topic might not be that well understood and it is actually pretty straightforward and powerful if you invest the time in understanding it.

Cloud Firestore authorization is based on rules. In the Firebase Console, if you select Database (assuming you have previously setup a Cloud Firestore dataabase) the first tab is Data, the second tab is Rules. This is essentially where we will create and manage authorization for the back-end of our application.

Below are the some important things to know about rules and different examples of creating rules.

#### Rules rules (things to know about Rules)

- Rules do not cascade
- Rules are typically assigned to documents not collections. Think of it as rules applying to any document in a collection and not to the collection itself.
- ** is the recursive wildcard syntax. That is, it is a special wildcard that will match anything in the rest of the path including documents in subcollections. You can see this in action when you first setup your database ( ... match /{document=**} ... )
- The first rule applies if conflicting rules exist.
- Rules can be applied to 5 actions - get, list, create, delete, update.
  - Get and list are often combined as read rules
  - Create, delete and update are often combined as write rules
- Rules are typically built around 3 things
  - Request data
    - request (object)
    - auth (object) - information about signed in user
      - Examples of data that might be used in rules
        - request.auth != null (user is signed in)
        - request.auth.uid (user is a specific user)
        - request.auth.token.email
        - request.auth.token.email_verified
      - resource (object)
        - data (object)
          - Examples of data that might be used in rules
            - request.resource.data.specific (specific data included in the request)
              - or
            - request.resource.data["specific "]
  - Target documents
    - resource (object) - same structure as the request resource object
  - Some other document
    - Typically retrieved via
      - exists()
      - get()
- Rules are combined with && (and) and || (or)
- Query (list) rules do not look at each returned value to determine what subset of data should be returned based on security. Rules only make a judgement on whether the query could return data that a user should not have access to and if they likely should not, the whole query will fail. You can address this by matching your query constraints to your security rules. For example, if you want only data owned by a particular user you can include the owner in both the query and your security rules.
- The recommended approach for access control list (ACL) type security is to maintain a private data sub-document on a document which defines who has what role on that document, and then to write a rule that checks that the auth user is defined in the subdocument with the appropriate role. I have included an example of this below. As it stands, we have no plans to implement this type of rule in our application (as always, that could change).
- One approach to global roles is to use global auth claims. To accomplish this we need to add an additional attribute to the auth user. See example below. We will apply this pattern in our application. There are some other restrictions to global auth claims that I am going to ignore for the time being because they should not apply to our application.
- You can create functions to include in rules to reduce code redundancy. Functions are also useful for logically grouping related rules, and giving them a friendly name.
- Rules can take up to a minute to apply and several minutes to propagate out. Keep this in mind when testing updated rules.
- Rules are typically used to enforce security but can also be useful in data validation and to enforce query limits.

#### Example rules

- Let anyone read a document
  - allow read: if true;
    - or
  - allow read;
- Prevent anyone from modifying a document
  - allow write: if false;
- Let anyone who is logged in read or write a document
  - allow read, write: if request.auth.uid != null;
- Let a specific user read a document
  - allow read: if request.auth.uid == "1234567890";
- Let anyone with a verified google email address read a document
  - allow read: if request.auth.token.email.matches('.\*google[.]com$') && request.auth.token.email_verified;
- Data validation (or shape of data)
  - When being created
    - This should really be addressed on the front-end (these really don't qualify under the term "security rules", think of this as more server side "data validation rules")
      - allow create: if request.resource.data.specificNumber is a number;
      - allow create: if request.resource.data.specifcNumber >= 1;
      - allow create: if request.resource.data.specificString is a string;
      - allow create: if request.resource.data.specificString.size() > 2;
  - When being updated
    - Check the data to be updated against the data we currently have (again, this should be prevented on the front-end but might be a worthwhile extra check if data should really be immutable'ish, this could be important in a data versioning scenario where you want to be sure the version of the data being updated, or deleted, is the latest version).
      - allow update: if request.resource.data.specificNumber == resource.data.specificNumber
        - This rule only allows the (entire) update if this piece of data has not be changed
  - When being read
    - The data has to be in a specific state to be read, would often be combined with ownership (or no one would be able to read the data)
      - allow read: if resource.data.state == "published" || resource.data.commenterID == request.auth.uid;
- Document ownership
  - Validate ID of data creator
    - Make sure the ID included in the request document is the person trying to write the data) - note this is using the request resource object (resource included in the request).
      - allow create: if request.resource.data.commenterID == request.auth.uid;
  - Validate ID of data updater
    - Must be the person who originally wrote the data, or at a minimum their ID was added to the document - note this is using the resource object (the existing resource, not the request resource)
      - allow update: resource.data.commenterID === request.auth.uid
  - Combining ownership and state
    - This is the same example from the validate data section above (the read example), validate ID of reader if data is not in the appropriate state for other users
      - allow read: if resource.data.state == "published" || resource.data.commenterID == request.auth.uid;
- Chaining two rules together
  - allow create: if request.resource.data.specificNumber is a number && request.resource.data.specifcNumber >= 1;

ACL type permissions example

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /sensitiveDocuments/{sensitiveDocumentID} {

   allow update: if get(/databases/$(database)/documents/sensitiveDocuments/$(sensitiveDocumentID)/private_data/private).data.roles[request.auth.uid] in ["editor", "owner"]

    }
  }
}
```

#### Global auth claims example

- We need to write a custom attribute to the auth user. This can be done via the Firebase Admin SDK
  - admin.auth().setCustomUserClaims(uid, { admin: true })
    - or for a different global role
  - admin.auth().setCustomUserClaims(uid, { moderator: true })
- You we can use this claim in security rules, example:
  - allow read, write: if request.auth.token.admin == true;
- Incorporating this into the overall rule set, it might look something like:

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{everythingInMyDatabase=**} {
      allow read, write: if request.auth.token.admin == true;
    }

    match /senstiveDocuments/{sensitiveDocumentID} {
      allow read, write: if request.auth.token.moderator == true;
...
```

#### Simulator

Note that in the Firebase Console on the Rules tab for the Database on the left there is a Simulator that you can use to verify the rules you have setup are working as expected. I saw something about the Simulator having some issues and I can confirm this. The big problem with the Simulator is that it doesn't construct a real request (hence the name Simulator). You are limited to simulating rules with the limited set of fields the Simulator provides.

For example, the Simulator doesn't handle custom claims because it doesn't know anything about them (in fact, the Simulator doesn't know anything about the requesting user). I have also had issues simulating rules that use the response object because I don't know how to build the response object. I have seen a screenshot of the Simulator that appears to expose the ability to create a simulation response object but my real life version of the Simulator does not have this.

#### Emulator

There is also an emulator that allows local testing of Cloud Firestore Security Rules (<https://firebase.google.com/docs/firestore/security/test-rules-emulator>). I haven't spent any serious time looking at it to date, but I may in a future post. It is not clear to me yet that this would actually resolve the issues I have with the Simulator and give me a lot of confidence that I have defined my rules correctly.

#### Testing

My takeaway with regard to both the Simulator and the Emulator is that you should be prepared to test your rules in your real application. This really reinforces the multi-environment approach we are taking by separating our development and production environments (you could have many more environments depending on the project). We can fully test our rules in development before deploying them to production.

#### Documentation

If you need to brush up on RegEx. I find this reference helpful - <https://www.rexegg.com/regex-quickstart.html>

Get started with Cloud Firestore Security Rules - <https://www.fullsapps.com/2019/01/14-media-library-state-login.html>

Good example of different rules - <https://firebase.google.com/docs/firestore/security/insecure-rules>

ACL style security discussed in detail - <https://firebase.google.com/docs/firestore/solutions/role-based-access>

## Walk Through

The good news is that global auth claims are relatively straightforward to create and are well documented - <https://firebase.google.com/docs/auth/admin/custom-claims>. The bad news is that they require the Admin SDK which is something that needs to run from a server. In my case, I use the Admin SDK in Firebase Functions. I blogged a bit about using Firebase Functions in a separate blog here - <https://peterdyer7.github.io/media-library-blog/firebase-functions/>. I have expanded my use of Firebase Functions to include an API but I haven't written about that yet. I plan to write about it in this series eventually.

For the time being, if you are following along, you have two choices. One, you can take the leap into creating a custom claim (maybe via Firebase Functions as I have, per the documentation linked above) or, two, you can implement the following rule. I am not using this rule but it should do basically the same thing as what I will be doing with a custom claim.

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=\*\*} {
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

The rest of this post assumes you managed to create a custom auth claim called admin and have assigned it to user. I prefer the custom claim because it gives me an attribute on the user I can leverage in my code, and I have in the Firebase Functions API I referenced earlier. More on this in a future post.

To create a rule that allows admins full control based on a custom claim you can apply the following. We can't verify this rule is working via the Simulator (at least I don't know how). However, you can easily verify this rule by logging into our application with an admin and a non-admin. The admin can use the app as expected. The non-admin can't even login. This makes sense because our login process tries to retrieve data about the user from the users collection in the database.

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=\*\*} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

Let's expand this rule to give users access to their own information. If we are going to allow users to self-register, which we are (at least for now), we need to give them the ability to create data in the users table. We need users to be able to retrieve their own information and not retrieve anyone else's information. Although we do not have a use case (yet) for a user updating their own information it probably makes sense to allow a user to update their own information. They should not be able to delete themselves, or anyone else. They should not be able to list or query for users.

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow create;
      allow get, update: if request.auth.uid == userId;
      allow list, delete: if false;
    }
    match /{document=\*\*} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

The Simulator is somewhat helpful in confirming this rule. If you select "Simulation type" of "get", "location" of "/users/123", turn on "authenticated", select the password provider and enter "Firebase UID" of "123" the rule should succeed. If you change the location to a different users document or you enter a different UID the rule will fail, but not if you change the Simulation type to create.

That's all we will talk about security for now but this will come up again. There are probably a couple issues with our current use of security, I can think of two at the moment. One, we don't have a sustainable process for making a user into an admin - that might be a good thing. Two, we don't have any data other than user data at the moment but as soon as we do we will need to update security to give users access to that data.

There is no code to be checked in with our application but I am going to create a file in the firebase directory where I can collect security rules that might useful. That way, if anything ever happened to my Firebase project I still have access to the rules I was using.

## Next

It feels like we are due to catch up on some testing we have ignored. We will do that in the next post.

## Code

<https://github.com/peterdyer7/media-library/tree/22.SecurityRules>
(there is actually no new code for the project, however, I have added the appropriate security rules to a text file and included it in the project so they get checked in somewhere)
