---
slug: 0-media-library-introduction
title: 0. Media Library - Introduction
authors: peter
tags: [Firebase, Lean Software Development, React]
---

This blog series captures the creation of a new web application. The general idea of the blog series is to discuss a specific set of technologies and a particular pattern for developing a new web application. The series is not meant as a training piece on any particular technology but instead will focus on how a particular tech stack can be used to build a modern web application.

<!--truncate-->

We will attempt to focus on a new high-level topic every post. I will not be reproducing every-line of code in this blog. I will make all code available via Github. Instead, we will use this blog to discuss the day-to-day choices a developer needs to make and the particular choices we are making.

## Philosophy

We are going to roughly apply the principals of lean software development to this project. This means we are going to:

- Be agile
- Iterate
- Get moving (and keep moving)
- Err on the side of moving quickly
- Expect to refactor
- Produce usable code as early and as often as possible
- Make decisions as we go
- Be modular
- Defer commitment as long as possible

We are not going to be precious about the code we write. If there is a good library available we will use it (instead of building it).

The application we create will be a prototype application. We will take shortcuts when required, and we leave features in the backlog. We will try to minimize this. For the most part this will be used as a tactic to avoid repetition in building our application.

## The Application

Our application will be a tool for anyone managing properties, specifically for anyone involved in marketing properties. This could include someone involved in marketing one or more hotels or rental properties (short or long term). Typically, if you are involved in marketing a property you need the ability to share marketing assets with marketing agencies working on campaigns, travel agencies (online or otherwise) trying to attract customers, reporters or bloggers writing about a property, co-workers working on some aspect of marketing a property, etc. The marketing assets being shared often include photos, logos, videos, written content (pdfs), etc. The tool we build will be a repository for these marketing assets. From this point forward I will refer to it as the Media Library.

We will keep the design fairly light and remain agile with regard to the look and feel.

The Media Library needs to work on both mobile and desktop browser.

The Media Library needs to be easy to use. The users will not be highly technical and they are not going to be using this tool 24x7. They need to be able to get in, do what they need to and get out. They may not use the tool again for a month.

We will favor simple and opinionated user interface over something flexible and feature rich.

## The Technology

There are two foundation technologies that we will use to build the Media Library.

### 1. React

Our UI will be written in React. In fact, our entire application will be written in Javascript. Our application will largely be a Single Page Application (if this term still exists). That is, the vast majority of the application will run client side in the user's browser.

We've chosen React for a key reason; React has a very strong community. This fits in perfectly with some of the philosophy we discussed above. React will help us move quickly because we will find excellent third party libraries that we will be able to leverage and the framework itself is extremely well documented.

We are going to use the most modern parts of both JavaScript and React, including a number of bits that are currently in alpha.

### 2. Firebase

Firebase will be our back-end. Firebase is a back-end-as-a-service (or BaaS). That is, much (in our case all) of the back-end bits we would have traditionally coded on a server will be constructed in various forms in Firebase. We will get authentication, database, storage, hosting, and even some server side functions from Firebase.

Firebase fits in perfectly with the philosophy we discussed above. It will help us get moving and get to shareable code as early (and as often) as possible.

## Next

Let's end the intro blog at that. In the next post we will start to pull together some technology.
