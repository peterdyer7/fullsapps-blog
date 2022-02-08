---
slug: 3-media-library-ui-framework-semantic
title: 3. Media Library - UI Framework - Semantic UI (React)
authors: peter
tags: [Semantic UI React]
---

## Application Requirements

We have some basic requirements when it comes to styling our application.

1. The application must be responsive. Our goal is to provide a usable experience on both mobile and desktop. There is no requirement (or need), at this time, for dedicated mobile apps.
2. The application is somewhat utilitarian. The look and feel of the application needs to support a good user experience but in and of itself will not attract users to the application.
3. It is not required that our application have a unique or independent look and feel. In fact, because of the utilitarian nature of our application, it will likely aid users if we follow patterns they are already familiar with in other applications.

The look and feel of our application, and even the usability, may need to change in time. So, we will make choices that focus on moving quickly, and adjust in the future if required.

<!--truncate-->

## Choices

In my experience user interface is a part of any project that has the biggest chance of slowing the project down. You can invest an endless amount of time styling a web application. It is not a coincidence, that user interface (styling in particular) is also one of the areas where we can get a lot of outside help. In fact, for React, there have to be more than a dozen well supported styling frameworks.

A few of frameworks that I have spent at least some amount of time using or evaluating include:

- Semantic UI React - <https://react.semantic-ui.com/> (based on Semantic UI - <https://semantic-ui.com/>
- Material-UI - <https://material-ui.com/> (based on Google's Material Design - <https://material.io/design/>)
- Ant Design - <https://ant.design/docs/react/introduce>
- Reactstrap - <https://reactstrap.github.io/> (based on Bootrap - <https://getbootstrap.com/>)

There are many others available. The key to each of the above frameworks is that they provide deep integration with React; which I find speeds up development. Also, you shouldn't dismiss the value in these being "opinionated" frameworks. That is, they have made most (potentially all) of your styling choices. If you have ever seen designers and a development team work from scratch you know the amount of effort involved in getting to a final design.

For this application there were a few things that helped steer me towards Semantic UI React.

- I like the clean, straight-forward look and feel of Semantic UI. I have used Semantic UI a couple times now and I have only run into one issue (that I can recall).
- For the users of this particular application I felt the more "traditional" look and feel of Semantic UI versus Material Design made sense.
- I found that Reactstrap came up short on a couple features. The supported options for Tables was a little light. Also, the icon support in Reactstrap was a little light. With a little work I could have worked past these issues but with everything else being equal, I try to pick the fastest path.
- I ran into a couple support issues with Ant Design. They were addressed quickly but it left me feeling that the Ant Design framework might not be as mature as the other frameworks. Also, the documentation has some gaps.

To be fair I believe Material-UI and Ant Design are more popular than Semantic UI React. They probably would have been fine choices and I expect to use one of them, if not both, on future projects.

Picking any of the noted frameworks, or any of the others available, represent a giant head-start for styling an application and unless your project requires unique look and feel I am strongly in favor of picking an existing framework as a starting point.

To play devils advocate for a minute, there is an interesting case to be made that the deep integration provided by these frameworks is undesirable. It does increase the switching cost of moving from one solution to another. For that reason, this is one area where I would recommend you slow down and really evaluate what is important to your project. You want to pick a framework that addresses the requirements of your project and that you will stick with for the life of the project (or at least until you have the budget/time to do a major overhaul).

## Walk Through

The only thing I want to do in this post, as far as coding goes, is to get Semantic UI React setup. We are going to install both the components and the css.

```bash
npm install --save semantic-ui-react semantic-ui-css
```

With that installed. I add the minified css to the imports in index.js.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import App from './App';
import * as serviceWorker from './serviceWorker'
...
```

I also make some edits to index.css to remove some duplicate styling that I will be provided by Semantic UI.

We will see the Semantic UI components throughout the application as we begin to build it. It is worth noting that the Semantic UI React docs are fantastic <https://react.semantic-ui.com/>.

## Next

Once again, I probably under-delivered on getting moving with some meaningful code, but we will get there. In the next post I may disappoint once more as I plan to focus on testing and getting the bits we will need for testing setup.

## Code

<https://github.com/peterdyer7/media-library/tree/3.UIFramework>
