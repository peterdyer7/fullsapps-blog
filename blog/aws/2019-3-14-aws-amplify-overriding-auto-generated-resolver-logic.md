---
slug: aws-amplify-overriding-auto-generated-resolver-logic
title: AWS Amplify - Overriding auto-generated resolver logic
authors: peter
tags: [AWS Amplify]
---

It has been about a month since AWS announced a number of really important enhancements to AWS Amplify (<https://aws.amazon.com/blogs/mobile/amplify-adds-support-for-multiple-environments-custom-resolvers-larger-data-models-and-iam-roles-including-mfa/>). Several of the enhancements are important to me and I want to highlight one of them.

<!--truncate-->

## Before We Start

In order to take advantage of these new features you need to be running a new version of the AWS Amplify CLI (the steps to upgrade are dead simple and are covered in the AWS post above). Be warned that if you haven't updated for a while things can break after you upgrade - DO NOT DO THIS IN PRODUCTION. If you do upgrade, you will be prompted to migrate your project, and quite a few changes will be made to your project.

I had not updated my Amplify CLI for a while and I ran into an issue with the new(ish) max-depth attribute you can set on your API. You can easily adjust the max-depth per: <https://aws-amplify.github.io/docs/cli/codegen#statement-depth>. The default is a depth of 2 which will cause issues with list queries that include connected types. I adjusted my max-depth to a more reasonable number and everything appears to be working.

## Scenario

One of the common scenarios I run into is that I want to set the status on an object that a user creates or updates. However, I do not want a user to set this status, instead, it will get set by another process. This status will then get used when querying objects of this type. Essentially, I want a read-only field from the perspective of the user (and the GUI).

For the purposes of Amplify I need to include the field in the type so that I can use it in queries. However, the Amplify codegen will expose this as an editable field in the object when it is created or updated. I can exclude it, or manage it in the GUI, but I can't prevent a nefarious user from figuring out they have the ability to adjust this field. This exposes some risk that an object could be put in an unintended state.

There are actually some fields used by Amplify that follow the pattern I am looking for. Under the covers Amplify adds createdAt and updatedAt fields to DynamoDB if you are using the Amplify @model directive. You can expose these fields on your types and use them in queries like any other field. Also, if you are using the @auth directive and using the Owner field you are doing something similar.

As of the Amplify release I mentioned at the top of this post we can accommodate functionality like this. We now have the ability to create custom resolvers and also override (replace) the auto-generated resolver logic. For what I want to do, copying, modifying and replacing the auto-generated resolver will suffice. There is a quick note in the Amplify docs that mention how to do this: <https://aws-amplify.github.io/docs/cli/graphql#overwrite-a-resolver-generated-by-the-graphql-transform>.

## Walk Through

Let's walk through the steps to leverage this in a little more detail than what the docs provide.

1. I have added a field called "active" (the name is not significant) as a Boolean (the type is not significant) to a type in my schema.graphql.
2. I am going to find the resolver(s) that is(are) being auto-generated for this type that I want to modify (in my case I am going to modify the create and update resolvers). You can find the auto-generated resolvers in your project in amplify/backend/api/client/build/resolvers. The naming convention is straight-forward.
3. I am copying the resolver(s) I want to modify and I am pasting it(them) to amplify/backend/api/client/resolvers.
4. I am modifying the copied resolver(s) to include the logic I want. In the case of a create resolver I am looking for the section of the resolver where the createdAt and updatedAt fields are added to the request. In the case of an update resolver I am looking for the section where the updateAt field is updated. Those feels like the right places to add my new logic, but you could add somewhere else if you prefer. I have a field called active that I want to set to false (a very simple and small change).
5. Run amplify push

```bash title="create resolver example"
...
## [Start] Prepare DynamoDB PutItem Request. **
$util.qr($context.args.input.put("createdAt", $util.time.nowISO8601()))
$util.qr($context.args.input.put("updatedAt", $util.time.nowISO8601()))
$util.qr($context.args.input.put("active", false))
...
```

```bash title="update resolver example"
...
## Automatically set the updatedAt timestamp. **
$util.qr($context.args.input.put("updatedAt", $util.time.nowISO8601()))
$util.qr($context.args.input.put("active", false))
...
```

That's it. I now have a field on a type that I can use in queries that I don't have to worry about getting set incorrectly by a user. There is one thing that I should be clear about; I'm not actually removing the field from the request, I am just ignoring the value that is being included in the request.

## Conclusion

In my view this is a really significant update to Amplify. One of the drawbacks to using Amplify was being forced into a box with regard to the capabilities of the auto-generated resolvers. Until now, our primary option for adding custom behavior was to write resolvers in Lambda. That's an okay option, but if you like 95% of what Amplify provides out-of-the-box and just want to make a small tweak (which can have a big impact) you now have that option.
