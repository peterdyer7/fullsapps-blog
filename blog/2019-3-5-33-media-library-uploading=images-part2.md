---
slug: 33-media-library-uploading=images-part2
title: 33. Media Library - Uploading Images, Part 2
authors: peter
tags: [react-dropzone, react-select]
---

In this post we continue working on the pieces needed to manage and upload images in the GUI.

<!--truncate-->

## Background

We are going to use two new libraries in this post: react-dropzone and react-select.

To help us upload files we are going to use a library called react-dropzone. This library adapts dropzonejs (<https://www.dropzonejs.com/>) to be more easily consumed in React. You can read more about react-dropzone here: <https://react-dropzone.js.org/>.

We are also going to introduce react-select. This library is a very flexible component that aids in selecting items from a list. It supports multiple items and creation of new items. You can read more about react-select here: <https://react-select.com/home>.

These are both well respected and heavily used libraries. They fit our overall strategy to leverage the work of others where it makes sense.

## Walk Through

In order to use react-dropzone and react-select we need to add them to the project.

```bash
npm install react-dropzone react-select --save
```

We will leverage a form along with the uploaded image to make sure we collect the image metadata that we want when an image is uploaded. The form we create will expose the Settings we added to the project previously. We will leverage react-select to display the Settings. I'm going to create two components and two containers that allow us to display the Setting we want on our form.

The first component I am creating displays a simple select drop-down. It expects to be included on a Formik form and as a result manages the required props. Is it also passed the label to be displayed and the list of items to be displayed. This lets us keep the component somewhat generic. We will use this same component to display primary and secondary categories.

```jsx title="SimpleSettingSelect.jsx"
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { Form, Label } from 'semantic-ui-react';

// setting = 'primaryCategory'
export default function SimpleSettingSelect({
  value,
  error,
  touched,
  onChange,
  onBlur,
  setting,
  settingLabel,
  settingList,
}) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const opts = settingList.map((o) => ({ value: o, label: o }));
    setOptions(opts);
  }, []);

  const handleChange = (value) => {
    onChange(setting, value);
  };

  const handleBlur = () => {
    onBlur(setting, true);
  };

  return (
    <Form.Field>
      <label htmlFor={`${setting}Select`}>{settingLabel}</label>
      <Select
        id={`${setting}Select`}
        name={setting}
        options={options}
        onChange={handleChange}
        onBlur={handleBlur}
        value={value}
      />
      {!!error && touched && <Label pointing>{error}</Label>}
    </Form.Field>
  );
}

SimpleSettingSelect.propTypes = {
  value: PropTypes.object,
  error: PropTypes.string,
  touched: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  setting: PropTypes.string.isRequired,
  settingLabel: PropTypes.string.isRequired,
  settingList: PropTypes.array.isRequired,
};
```

We will create a container to wrap the select component to retrieve the list that we want to display from the store. Again, we are keeping it generic by retrieving the setting identified in the props passed to the component.

```jsx title="SimpleSettingSelectContainer.jsx"
import { connect } from 'react-redux';

import SimpleSettingSelect from '../../../../components/UI/forms/SimpleSettingSelect/SimpleSettingSelect';

const mapStateToProps = (state, ownProps) => ({
  settingList: state.settings.settings[ownProps.setting],
});

const SimpleSettingSelectContainer =
  connect(mapStateToProps)(SimpleSettingSelect);

export default SimpleSettingSelectContainer;
```

The second component I am creating takes advantage of some "advanced" capabilities of react-select (what they refer to as Createable). It allows us to select (and remove) more than one item and it handles adding new items. This functionality is specific to how we want to manage tags. That is, an image can have multiple tags and the user should be able to add to the available tags when they upload an image. You might also notice that we are leveraging our ability to addSettings to add a newly created tag to the database when it is added to the GUI. This is will help us when we want to query for specific tags in the future.

```jsx title="TagsSelect.jsx"
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CreatableSelect from 'react-select/lib/Creatable';
import { Form, Label } from 'semantic-ui-react';

export default function TagsSelect({
  tags,
  boundSettingAdd,
  onChange,
  onBlur,
  value,
  error,
  touched,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const opts = tags.map((o) => ({ value: o, label: o }));
    setOptions(opts);
  }, []);

  const handleChange = (value) => {
    onChange('tags', value);
  };

  const handleCreate = (inputValue) => {
    setIsLoading(true);
    const newOption = { value: inputValue, label: inputValue };
    setIsLoading(false);
    setOptions([...options, newOption]);

    if (value) {
      onChange('tags', [...value, newOption]);
    } else {
      onChange('tags', [newOption]);
    }
    boundSettingAdd('imageMetadata', 'tags', inputValue);
  };

  const handleBlur = () => {
    onBlur('tags', true);
  };

  return (
    <Form.Field>
      <label htmlFor='tagsInput'>Tags</label>
      <CreatableSelect
        id='tagsInput'
        options={options}
        isLoading={isLoading}
        isMulti
        onChange={handleChange}
        onCreateOption={handleCreate}
        onBlur={handleBlur}
        value={value}
      />
      {!!error && touched && <Label pointing>{error}</Label>}
    </Form.Field>
  );
}

TagsSelect.propTypes = {
  tags: PropTypes.array,
  boundSettingAdd: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  value: PropTypes.array,
  error: PropTypes.string,
  touched: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
};
```

Similar to above we have wrapped the component in a container to expose bits of the store (including the ability to add new tags to database as mentioned above).

```jsx title="SimpleSettingSelectContainer.jsx"
import { connect } from 'react-redux';

import TagsSelect from '../../../../components/UI/forms/TagsSelect/TagsSelect';
import { addSetting } from '../../../../shared/redux/actions/settings';

const mapStateToProps = (state) => ({
  tags: state.settings.settings.tags,
});

const mapDispatchToProps = (dispatch) => ({
  boundSettingAdd: (type, list, item) => dispatch(addSetting(type, list, item)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TagsSelect);
```

With those component created we can go ahead and create our form. As always, we are leveraging Formik. This form should look similar to the forms we have created previously. I am cheating a little bit and exposing a flag that will allow us to separate a new upload from an update. We won't do anything with the update capability in this post (that will happen in the next post).

```jsx title="UploadImageForm.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Label, List } from 'semantic-ui-react';
import { Formik } from 'formik';
import * as Yup from 'yup';

import SimpleSettingSelectContainer from '../../../../../containers/UI/forms/SimpleSettingSelect/SimpleSettingSelectContainer';
import TagsSelectContainer from '../../../../../containers/UI/forms/TagsSelect/TagsSelectContainer';
import * as errors from '../../../../../shared/constants/errors';

export default function UploadImageForm({
  isUpload,
  image,
  imageFile,
  propertyId,
  imageUpload,
  imageUpdate,
  handleReset,
}) {
  return (
    <Formik
      initialValues={{
        caption: image ? (image.caption ? image.caption : '') : '',
        primaryCategory: image
          ? image.primaryCategory
            ? { value: image.primaryCategory, label: image.primaryCategory }
            : null
          : null,
        secondaryCategory: image
          ? image.secondaryCategory
            ? {
                value: image.secondaryCategory,
                label: image.secondaryCategory,
              }
            : null
          : null,
        tags: image
          ? image.tags
            ? image.tags.map((t) => ({ value: t, label: t }))
            : null
          : null,
      }}
      validationSchema={Yup.object().shape({
        caption: Yup.string().required(errors.REQ),
        primaryCategory: Yup.mixed().required(errors.REQ),
      })}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setSubmitting(true);
        if (isUpload) {
          imageUpload(propertyId, imageFile, {
            caption: values.caption,
            primaryCategory: values.primaryCategory.value,
            secondaryCategory: values.secondaryCategory
              ? values.secondaryCategory.value
              : null,
            tags: values.tags ? values.tags.map((t) => t.value) : null,
          });
          handleReset();
          //resetForm();
        } else {
          imageUpdate({
            ...image,
            caption: values.caption,
            primaryCategory: values.primaryCategory.value,
            secondaryCategory: values.secondaryCategory
              ? values.secondaryCategory.value
              : null,
            tags: values.tags ? values.tags.map((t) => t.value) : null,
          });
        }
        setSubmitting(false);
      }}
    >
      {({
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        setFieldTouched,
        isValid,
        isSubmitting,
      }) => (
        <>
          {isUpload && (
            <List>
              <List.Item>
                <List.Header>File</List.Header>
                {imageFile.name}
              </List.Item>
            </List>
          )}
          <Form size='small' onSubmit={handleSubmit}>
            <Form.Field error={errors.caption && touched.caption}>
              <label>Caption</label>
              <input
                type='text'
                name='caption'
                placeholder='Caption'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.caption}
              />
              {!!errors.caption && touched.caption && (
                <Label pointing>{errors.caption}</Label>
              )}
            </Form.Field>
            <SimpleSettingSelectContainer
              value={values.primaryCategory}
              onChange={setFieldValue}
              onBlur={setFieldTouched}
              error={errors.primaryCategory}
              touched={touched.primaryCategory}
              setting='primaryCategory'
              settingLabel='Category'
            />
            <SimpleSettingSelectContainer
              value={values.secondaryCategory}
              onChange={setFieldValue}
              onBlur={setFieldTouched}
              error={errors.secondaryCategory}
              touched={touched.secondaryCategory}
              setting='secondaryCategory'
              settingLabel='Alternate Category'
            />
            <TagsSelectContainer
              onChange={setFieldValue}
              onBlur={setFieldTouched}
              value={values.tags}
              error={errors.tags}
              touched={touched.tags}
            />
            <Button
              type='submit'
              fluid
              size='large'
              primary
              disabled={!isValid || isSubmitting}
            >
              {isUpload ? <>Upload</> : <>Update</>}
            </Button>
          </Form>
        </>
      )}
    </Formik>
  );
}

UploadImageForm.propTypes = {
  isUpload: PropTypes.bool.isRequired,
  image: PropTypes.object,
  imageFile: PropTypes.object,
  propertyId: PropTypes.string.isRequired,
  imageUpload: PropTypes.func,
  imageUpdate: PropTypes.func,
  handleReset: PropTypes.func.isRequired,
};
```

With our form ready, we can put it somewhere. We will create a component to display Dropzone and our form. For Dropzone I am following the documentation pretty closely. I am using a tiny bit of incline style to create somewhere to drop a file. I am limiting file types to jpeg and png. I am only allowing one file to be uploaded (just to simplify the workflow). Our form is only displayed if Dropzone accepts the file.

```jsx title="UploadImage.jsx"
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import { Header, Message } from 'semantic-ui-react';
import UploadImageForm from './UploadImageForm';

export default function UploadImage({ propertyId, imageUpload }) {
  const [accepted, setAccepted] = useState([]);
  const [rejected, setRejected] = useState([]);

  const onDrop = (accepted, rejected) => {
    setAccepted(accepted);
    setRejected(rejected);
  };

  const handleReset = () => {
    setAccepted([]);
    setRejected([]);
  };

  return (
    <>
      <div className='dropzone'>
        <Dropzone
          accept='image/jpeg, image/png'
          disabled={false}
          multiple={false}
          onDrop={onDrop}
        >
          {({ getRootProps, getInputProps }) => (
            <div
              {...getRootProps()}
              style={{
                width: 200,
                height: 200,
                borderWidth: 2,
                borderColor: '#666',
                borderStyle: 'dashed',
                borderRadius: 5,
              }}
            >
              <input {...getInputProps()} />
              <Header
                size='medium'
                textAlign='center'
                style={{ paddingTop: '1em' }}
              >
                Drop image here, or click to select file to upload.
              </Header>
              <Header size='small' textAlign='center'>
                Only *.jpeg and *.png images will be accepted
              </Header>
            </div>
          )}
        </Dropzone>
      </div>

      {rejected[0] && (
        <Message error>{rejected[0].name} is not a supported file type</Message>
      )}

      {accepted[0] && (
        <UploadImageForm
          isUpload={true}
          imageFile={accepted[0]}
          propertyId={propertyId}
          imageUpload={imageUpload}
          handleReset={handleReset}
        />
      )}
    </>
  );
}

UploadImage.propTypes = {
  propertyId: PropTypes.string.isRequired,
  imageUpload: PropTypes.func.isRequired,
};
```

Now we need to update AdminPropertyImages to reflect to include our new UploadImage component. However, before we do that I want to wire up state to AdminPropertyImages by creating a container. We could do this in a number of places but this feels like a reasonable place to do it. We need to make sure all of the images for the selected property are loaded, we need to make sure settings are available to be used when adding an image and we need to be able to upload an image.

```jsx title="AdminPropertyImagesContainer.jsx"
import { connect } from 'react-redux';

import AdminPropertyImages from '../../../../../components/admin/AdminProperty/AdminPropertyImages/AdminPropertyImages';

import {
  imagesPropertyFetch,
  imageUpload,
} from '../../../../../shared/redux/actions/images';
import { fetchSettings } from '../../../../../shared/redux/actions/settings';

const mapStateToProps = (state, ownProps) => ({
  images: state.images.images.filter((image) =>
    image.properties.includes(ownProps.propertyId)
  ),
  loadingImages: state.images.loading,
  errorImages: state.images.error,
  settings: state.settings.settings,
  loadingSettings: state.settings.loading,
  errorSettings: state.settings.error,
});

const mapDispatchToProps = (dispatch) => ({
  boundImageUpload: (propertyId, image, metadata) =>
    dispatch(imageUpload(propertyId, image, metadata)),
  boundImagesPropertyFetch: (id) => dispatch(imagesPropertyFetch(id)),
  boundSettingsFetch: (type) => dispatch(fetchSettings(type)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminPropertyImages);
```

Now we can use these props and display the UploadImage component.

```jsx title="AdminPropertyImages.jsx (updated)"
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Grid, Segment, Icon, Header, Dimmer, Loader } from 'semantic-ui-react';

import ImagesList from './ImagesList/ImagesList';
import UploadImage from './UploadImage/UploadImage';

export default function AdminPropertyImages({
  propertyId,
  images,
  loadingImages,
  errorImages,
  settings,
  loadingSettings,
  errorSettings,
  boundImageUpload,
  boundImagesPropertyFetch,
  boundSettingsFetch,
}) {
  useEffect(() => {
    if (Object.keys(settings).length === 0) {
      boundSettingsFetch('imageMetadata');
    }
    // TODO: might be worth evaluating whether this data has already been loaded - save a trip to the back-end
    boundImagesPropertyFetch(propertyId);
  }, []);

  if (errorImages) {
    return <>Error! {errorImages}</>;
  }
  if (errorSettings) {
    return <>Error! {errorSettings}</>;
  }

  if (loadingImages || loadingSettings) {
    return (
      <>
        <Dimmer active>
          <Loader />
        </Dimmer>
      </>
    );
  }

  return (
    <>
      <Grid stackable columns={2}>
        <Grid.Row>
          <Grid.Column width={10}>
            <Segment>
              <ImagesList images={images} propertyId={propertyId} />
            </Segment>
          </Grid.Column>
          <Grid.Column width={6}>
            <Segment>
              <Header size='small'>
                <Icon name='upload' size='huge' />
                Upload Image
              </Header>
              <UploadImage
                propertyId={propertyId}
                imageUpload={boundImageUpload}
              />
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <br />
    </>
  );
}

AdminPropertyImages.propTypes = {
  propertyId: PropTypes.string.isRequired,
  images: PropTypes.array.isRequired,
  loadingImages: PropTypes.bool.isRequired,
  errorImages: PropTypes.string.isRequired,
  settings: PropTypes.object.isRequired,
  loadingSettings: PropTypes.bool.isRequired,
  errorSettings: PropTypes.string.isRequired,
  boundImageUpload: PropTypes.func.isRequired,
  boundImagesPropertyFetch: PropTypes.func.isRequired,
  boundSettingsFetch: PropTypes.func.isRequired,
};
```

There is one final step. We need to swap out the component version of AdminPropertyImages for the container version where it is rendered by react router.

```jsx title="AdminProperty.jsx (updated)"
...
//import AdminPropertyImages from './AdminPropertyImages/AdminPropertyImages';
import AdminPropertyImagesContainer from '../../../containers/admin/AdminProperties/AdminProperty/AdminPropertyImages/AdminPropertyImagesContainer';
...
        <Route
          path={match.url + routes.ADMINPROPERTYIMAGES}
          exact
          render={() => (
            <AdminPropertyImagesContainer
              propertyId={match.params.propertyId}
            />
          )}
        />
...
```

## Next

That was one of our more significant pieces of work. Next, we can add some bits to help us manage individual images.

## Code

<https://github.com/peterdyer7/media-library/tree/32.ImageUploadPart1>
(some branching issues, the code is loaded to the same branch as the previous post)
