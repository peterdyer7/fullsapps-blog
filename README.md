# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

```
$ GIT_USER=<Your GitHub username> USE_SSH=true yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

### Todo

- Create pages for different topics with dropdown list in navbar to access
- Create profile page with link in navbar
- Create projects page with link in navbar - display project highlights on a card, create a page for each project
  - Projects
    - Full stack development
    - REST API backend for karaoke mobile app - Dynamo, SNS, SQS, Cognito, Serverless, OpenAPI
- Create homepage
  - blog links
    - blog/archive
    - blog/tags
  - contact form
- Add search (do this last in case it indexes the site)
