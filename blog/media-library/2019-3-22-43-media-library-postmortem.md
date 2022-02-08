---
slug: 43-media-library-postmortem
title: 43. Media Library - Postmortem and What's Next
authors: peter
tags: [Firebase Hosting]
---

To wrap up our series on the media-library project I want to reflect on the positive and negative parts of the project with a view to doing things better in the future, and then discuss what features might make sense for the next iteration.

<!--truncate-->

## Positive

- Hooks - This entire application is written without using a single React Class Component. To say I am a fan of Hooks is an understatement. By not using Hooks I find my code is both easier to write and read.
- Render props - I am a fan of the render props pattern, although it does seem that custom Hooks may replace render props over time. I am not a fan of Higher Order Components (HOC). This entire application is written without creating a single HOC (but we do use a few).
- Firebase (the platform) - I really like Firebase as a platform. I don't remember having a problem with it throughout the entire development cycle. I appreciate the efforts to keep Firebase minimal and not bloat it with a bunch of rarely used features. In particular, Firestore and Functions are solid and much easier to use than the solutions provided by others.
- Semantic UI - I had some consternation about choosing Semantic UI React as the UI framework for this project. I was slightly worried it had a dated look and feel. However, I feel more than ever that it was the right chose. It is easy to use and it has tons of options to do almost everything you need.

## Negative

- Separation of back-end and front-end - Firebase could do more to help developers by drawing some separate between the back-end from the front-end of an application. Other platforms have embraced the concept of an API layer instead of making calls to the back-end directly. This separation provides the developer more options for how to run/deploy their application in the future. Firebase may see this as a bit of a risk but I expect not having this may end up being a bigger risk. With all that said, the ball is in the court of the developer to provide separation. In Media Library we did an okay job of this. I would explore other options for providing more meaningful separation.
- Separation of components and containers - There has been some discussion about this on Twitter and I have to say that I am lining up behind those who are in favor of not creating a separation between components and containers. I am still in favor of creating both "view" components and "container" components but I don't think there is much advantage to placing them in separate folder structures.
- Type safety - At the beginning of this project I made some statements about not wanting to be slowed down by using Typescript. Although I stand by those statements there are some places in this application that would benefit from type safety. To that end, we did add PropTypes to the application; something I said we wouldn't do at the start. The application is still small enough that this hasn't been a major source of problems but I expect the use of Typescript from the start would pay long-term benefits with regard to maintaining this project.

## Other

- Redux - I really like Redux but I recognize the reason it receives criticism. There is a tremendous amount of boilerplate required to use Redux. However, the developer tools continue to be a valuable tool in my toolkit. Also, I feel like my Redux testing strategy provides a high level of confidence in my use of state. It does seem that the React developer community is trending away from using Redux. There are other solutions like MobX that are popular. There is also the option of using useContext directly. At the start of this project I made the intentional choice to not use useContext primarily because I like Redux and I think the boilerplate overhead is more than overcome with the supportability offered by Redux. However, one never wants to be an island in the developer community, that is what leads to code that no one wants to work on or maintain. So, it seems that I must evolve. I expect leveraging local cache options that use useContext, like the Apollo Client, will be what I embrace going forward (I will miss you Redux).
- Testing - My view of testing React projects changed dramatically from the start to the end of this project. If you have been following along you know that I started by thinking I would use Enzyme and I ended up using React Testing Library (with Jest as a constant). In addition to choosing a different testing framework I also solidified my personal testing strategy. I now "categorize" my components and test them according to the type of tests that will provide the appropriate coverage for the "category".

## What's Next

This is a laundry list (and only a partial list) of features that might make sense in the next iteration of this application.

- Support for multiple languages.
- User administration.
- Approval workflow in the registration process.
- Support for other types of media - videos, 360s, documents.
- Support for a large number of properties (100s or 1000s).
- Global image search.
- Ability to more easily adjust branding.
- More testing.
- Remove an image from a property - currently you can only delete the image
  - When an image is added we add the property to the image but we do not do the reverse, that is, we don't add the image to the property so we need to lookup property images whenever we need them (this might make the system more efficient)
- We have hard-coded the reproductions we want generated when an image is uploaded. This would be a good candidate to be stored in the database and be configurable in the admin GUI.
- We are using ImageMagick to reproduce images. I believe Stream & Sharp hold some promise for faster processing (http://sharp.dimens.io/en/stable/api-resize/).
- Our caching is quite unsophisticated. Right now, we reload the list of images when a new property is selected. We could do more to persist previously fetched images but we would need to do more cache invalidation. Right now, we have a decent trade-off between providing some level caching and keeping caching simple.
- The URLs for the images we are managing are a little unwieldy. This doesn't break anything but it means they are a little tough to read. Some type of tinyUrl solution to shrink the URLs might not be a bad idea.
- For flexibility image metadata is being stored in separate collections from the image itself. This results in a lot more database activity than if the data was stored together in a single table. For now, flexibility is most important, however, this could change over time. It would be straightforward to re-architect this.
- There are a whole world of options open to using the Exif data we are gathering. It would be nice to expose a bit of it in the GUI.
- We are not doing anything to filter properties based on being active or not. This might be desirable and is easily adjusted. Admins might want access to all properties and only want to expose active properties to users.

## Final Words

This wraps up our media-library series. Please don't hesitate to reach out if you have questions about the project - pete@fullsapps.com.
