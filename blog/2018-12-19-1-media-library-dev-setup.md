---
slug: 1-media-library-dev-setup
title: 1. Media Library - Dev Setup
authors: peter
tags: [Javascript, Typescript, Visual Studio Code]
---

## Intro

I am going to be using Visual Studio Code as my code editor. This seems like the most popular choice these days and I have been using it for quite a while and like it. I am a bit of a dinosaur and still run Windows. If you do use Visual Studio Code on Windows, make sure you always Run as Administrator - it will reduce the number of weird errors you get. I am going to walk through my particular setup in more detail below.

I am going to be using Git/Github as my repository and for code sharing. For writing public code I don't think there is really another choice (to be clear, there are other choices but Github is the defacto standard). Although, I like Github a lot, I actually use Azure DevOps (recently rebranded from Visual Studio Team Services) on private projects and like it a lot for small teams too. I have also worked with GitLab but I found it a bit needlessly complex. Any of the commercial offerings from folks like Atlassian would work great, but would be overkill (both in terms of features and cost) for what we are doing here.

<!--truncate-->

The Github link for this project is: <https://github.com/peterdyer7/media-library>.

## Visual Studio Code Setup

I don't do anything unique with Visual Studio Code but there are a handful of extensions that I like to use.

- Debugger for Chrome
- ESLint
- Prettier
- TODO Highlight
- Code Spell Check

This is a pretty small list compared with some. I'm not a big fan of the "code snippet" extensions.

In the next post I will spend some time going through my ESLint and Prettier settings. I consider these must haves for any project. I'm embarrassed to say I have spent a lot of wasted time trying to get to a setup I can live with.

TODO Highlight is an excellent tool to help make sure you don't forget something. Whenever I know I need to come back to an unfinished area I make it with a TODO and TODO Highlight makes sure I don't miss it. The extension also supports other keywords and is flexible so you can your own keywords.

Code Spell Check is simply a spell check extension. I first installed it because I was writing blog posts in markdown in Visual Studio Code and I wanted a spell checker. I then found it actually helped me find misspelled variables (saving some troubleshooting time) so I kept it.

I did use the Jest extension for a little while. I liked the idea of real-time'ish feedback on what tests are failing but in practice I found it created a lot of noise and I wasn't using it as much as I expected. I believe it was also responsible for some strange behavior in Visual Studio Code itself so I ended up getting rid of it.

## A Word on Types

I am at a bit of a weird place with Types. I believe in the benefits of type checking. Like a lot of developers I started in highly structured languages and the idea of a language (Javascript) that did not have types seemed like a major problem. I gradually bought into the benefits of Javascript; primarily because of its ability to be used on both the front-end and back-end. I eventually relented on my design for a strongly typed language.

When I started using React and I was introduced to PropTypes I breathed a sigh of relieve. PropTypes soothed my desire for a strongly typed language. I had previously used Angular with Typescript and when I became aware that their was a strong Typescript community within the greater React community I was very excited. I started using Typescript for both front-end work in React and for back-end work in Node.

I do really like Typescript and prefer it to Javascript but I do find it slows me down. In particular, if I am doing something for the first time I find that Typescript increases the learning curve, primarily because of the extra time required to manage types. I know there are lots of ROI models written that show the extra time required to use Typescript upfront pays off against the time troubleshooting hidden type bugs but it really goes against my philosophy of getting moving as quickly as possible.

With this project I really want to use (no pun intended) the new Hooks being introduced in React 16.7 and I want to move quickly - so Typescript is out for this project. You might think I would fallback to using PropTypes. Maybe I should, but I am not going to. While I like (or liked) the idea of PropTypes I am going to leave them behind too. There are three reasons for this. One, I don't think that PropTypes have saved me a tremendous amount of time troubleshooting in the past. Two, there is little academic benefit to using PropTypes as I expect to go back to Typescript after this project. Three, apply my Typescript logic - I want to get moving and I am worried that PropTypes will slow me down (although the amount is likely trivial and this reasoning might not be valid I am going to apply my philosophy of err'ing on the side of speed if a better, obvious answer does not emerge).

## Next

Okay, we have gas and oil in the car. Time to hit the road. In the next post we will be coding.
