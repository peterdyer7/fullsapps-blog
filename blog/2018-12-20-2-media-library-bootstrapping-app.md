---
slug: 2-media-library-bootstrapping-app
title: 2. Media Library - Bootstrapping the App - Create React App
authors: peter
tags: [Create React App, ESLint, Prettier]
---

## Code

<https://github.com/peterdyer7/media-library/tree/2.BootstrappingTheApp>

## Choices

I am using Create React App to bootstrap the application. The will be a few purists out there that frown on this but they need to get with the times. The purists would opt for more control, better "understandability", etc. At this point in time I can't imagine their are many people out there that don't believe Create React App is a solid way to bootstrap your React application. It provides a tremendous amount of value. It saves me from writing a ton of code. This is directly in line with my philosophy - if there is a good tool available that saves time, use it.

If you are using Create React App, I recommend you don't use it blindly and that you read (and follow) the user guide: <https://facebook.github.io/create-react-app/> . The guide is excellent and very useful. It provides some very useful direction for things like testing, styling, code formatting, etc.

## ESLint and Prettier

I hope no one has wrestled with ESLint and Prettier the way I have. They generally work but it always feels like they are at odds or they both are not working exactly as expected.

After some searching I found some threads that were helpful:

- <https://twitter.com/dan_abramov/status/818854569304293377>
- <https://twitter.com/dan_abramov/status/1036279035805028352>
  And then there is the Create React App User Guide which is always helpful:
- <https://facebook.github.io/create-react-app/docs/setting-up-your-editor#displaying-lint-output-in-the-editor>

I do not follow the Formatting Code Automatically approach in the User Guide. Instead, I opt to have Prettier reformat on every save.

After all this my conclusions were:

- Lean on Prettier for code formatting
- Continue to use ESLint for in editor highlighting, but find a way to make sure it is in step with Prettier, see eslint-config-prettier & eslint-plugin-prettier
- Use only "well supported" plugins in additional to these plugins

This means I am not using one of the popular style guides like Airbnb. I have used the Airbnb style guide for ESLint but I never got it working to the point where I was 100% satisfied and I suspect that is a not uncommon scenario. I believe you have to eject from Create React App to make it work 100% and I am not willing to do that. In any event I am happy with the solution I landed on.

## Walk Through

Let's walk through bootstrapping the app. First thing is creating the app.

```bash
npx create-react-app media-library
```

After we create the app we will open the created folder in Visual Studio Code. I'm going to cleanup some of the boilerplate provided by Create React App.

- Update the Readme to something more appropriate
- Delete
  - logo.svg
  - App.css
- Cleanup App.js

Let's get Prettier and ESLint working.

Let's walk through bootstrapping the app. First thing is creating the app.

```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

I am going to remove the eslintConfig from package.json and create .eslintrc at the root of the project with the following.

```json
{
  "extends": ["react-app", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "no-console": "warn"
  },
  "plugins": ["prettier"]
}
```

I am also going to create .prettierrc at the root of the project with the following. These settings are my personal preferences. This is the type of thing a team would discuss and agree too. A full list of available options can be found in the prettier docs: <https://prettier.io/docs/en/options.html>.

```json
{
  "singleQuote": true,
  "arrowParens": "always"
}
```

Reload Visual Studio Code (in Windows: Ctrl-Shift-P and type reload window) for the changes to take effect. If you want to confirm things are working correctly, stick a console.log somewhere (like App.js). It should get highlighted by ESLint, and if you put it at the line start and you have formatOnSave set to true you should see Prettier align it correctly when you save the file.

```
import React, { Component } from 'react';

class App extends Component {
  render() {
console.log('test');
    return <div>Media Library</div>;
  }
}

export default App;
```

After save...

```jsx
import React, { Component } from 'react';

class App extends Component {
  render() {
    console.log('test');
    return <div>Media Library</div>;
  }
}

export default App;
```

I'm going to do one more thing with ESLint and Prettier. I'm going to install eslint-plugin-react.

```bash
npm install --save-dev eslint-plugin-react
```

Then I will update .eslintrc. Again, the specific options are personal preference and should be established by the team. For a full list of options, see: <https://github.com/yannickcr/eslint-plugin-react>. I find that linting rules are rarely static, we will likely make changes as the project evolves.

```json
{
  "extends": ["react-app", "prettier", "prettier/react"],
  "rules": {
    "prettier/prettier": "error",
    "no-console": "warn",
    "react/no-access-state-in-setstate": [1, "always"],
    "react/destructuring-assignment": [1, "always"],
    "react/prefer-stateless-function": [1]
  },
  "plugins": ["prettier", "react"]
}
```

If you open App.js you see the prefer-stateless-function warning. The App.js component would be better re-written as a function.

## Last Things

I'm going to suggest one other change. I am going to rename App.js to App.jsx. This is purely optional but does signal to Visual Studio Code that we are working on a React Component and not just a plain JavaScript file.

Finally, one of the more controversial parts of the project - file structure. I'm not going to say much about this. It is team preference. I will be separating components and containers (components that maintain state). I will roughly follow the functional lines of the project. I will breakout shared files. You will see this as we get into the application.

I'm not going to say anything about Git and Github as we move through this project. I'm using the Git embedded in Visual Studio Code. I will create branches for each post. The Master branch will contain the latest code.

## Next

I think in the last post I said we would start coding in this post. It doesn't feel like what we did qualifies but we have set a solid foundation for writing decent code going forward. In the next post we will get our styling library setup.
