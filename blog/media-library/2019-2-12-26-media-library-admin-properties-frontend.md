---
slug: 26-media-library-admin-properties-frontend
title: 26. Media Library - Admin Properties Front-end
authors: peter
tags: [Formik, useEffect, useState]
---

In this post we will begin wiring up the ability to manage properties in our GUI.

<!--truncate-->

## Background

Managing properties is a key part of our application. We need to be able to create, retrieve, update and delete properties. We will store properties in our database (Cloud Firestore) and also cache them in Redux (so we are not constantly fetching them over the network).

## Walk Through

We updated our version of React recently but we are still using the alpha release that gives us access to use Hooks. The production release is now available so I am going to start with updating react and react-dom to the latest production release. This is a good time to do this as we will be using Hooks, specifically useState and useEffect, throughout our code in this post.

```bash
npm install react@latest react-dom@latest
```

We previously created a landing page to manage (or administer) properties. With our back-end in place we can start to build out our admin properties GUI. I'm going to start by wrapping our AdminProperties component in a container to get access to the properties state that we are now exposing via Redux. We have used this same container pattern elsewhere in our application.

```jsx title="AdminPropertiesContainer.jsx"
import { connect } from 'react-redux';

import AdminProperties from '../../../components/admin/AdminProperites/AdminProperties';
import {
  propertiesFetch,
  propertyCreate,
  propertyClearMsgs,
  propertyDelete,
} from '../../../shared/redux/actions/properties';

const mapStateToProps = (state) => ({
  properties: state.properties.properties,
  loading: state.properties.loading,
  error: state.properties.error,
  success: state.properties.success,
});

const mapDispatchToProps = (dispatch) => ({
  boundPropertiesFetch: () => dispatch(propertiesFetch()),
  boundPropertyCreate: (property) => dispatch(propertyCreate(property)),
  boundPropertyClearMsgs: () => dispatch(propertyClearMsgs()),
  boundPropertyDelete: (id) => dispatch(propertyDelete(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AdminProperties);
```

We can now swap out the AdminProperties component we are rendering for the container version.

```jsx title="Admin.jsx (updated)"
...
//import AdminProperties from '../AdminProperites/AdminProperties';
import AdminPropertiesContainer from '../../../containers/admin/AdminProperties/AdminPropertiesContainer';
...
        <Switch>
          <Route
            path={match.path + routes.ADMINPROPERTIES}
            exact
            component={AdminPropertiesContainer}
          />
...
```

Accordingly, this means we need to update our Admin test to include state. We do that by wrapping our components in the Root component that provides access to the state in our application.

```jsx title="Admin.test.jsx (updated)"
...

import Root from '../../Root/Root';
...
      <Root>
        <MemoryRouter>
          <Admin
            match={{
              isExact: false,
              params: {},
              path: '/admin',
              url: '/admin'
            }}
          />
        </MemoryRouter>
      </Root>
...
```

Now that we have a landing page with access to properties state I'm going to create the ability to add a new property. There are many ways we could accomplish this. I have decided to go with creating a form on a modal dialog. The form and dialog will work very similar to the other forms we have created (login, register, etc). We will create a form leveraging Formik (and Yup) and that form will be part of a component, which in this case is a modal dialog. One controversial decision I am making is to leave the modal on screen and report back the status of the create. This lets the user add multiple properties consecutively if they wish.

Let's start by creating the form. Note that I am keeping the validation light at this point. This is the type of thing we can adjust as we engage users to find out what is important to them. Although the form is a bit longer than some of the others that we have created we are following the same patterns.

```jsx title="CreatePropertyForm.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Label, Checkbox } from 'semantic-ui-react';
import { Formik } from 'formik';
import * as Yup from 'yup';

import * as errorMsgs from '../../../../shared/constants/errors';

export default function CreatePropertyForm({ propertyCreate }) {
  return (
    <Formik
      initialValues={{
        name: '',
        brand: '',
        region: '',
        active: false,
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        latitude: '',
        longitude: '',
        contactPerson: '',
        contactPhone: '',
      }}
      validationSchema={Yup.object().shape({
        name: Yup.string().required(errorMsgs.REQ),
        country: Yup.string().required(errorMsgs.REQ),
      })}
      onSubmit={(values, { props, setSubmitting, resetForm }) => {
        setSubmitting(true);
        propertyCreate({
          name: values.name,
          brand: values.brand,
          region: values.region,
          active: values.active,
          address1: values.address1,
          address2: values.address2,
          city: values.city,
          state: values.state,
          country: values.country,
          postalCode: values.postalCode,
          latitude: values.latitude,
          longitude: values.longitude,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
        });
      }}
    >
      {({
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        isValid,
        isSubmitting,
      }) => (
        <Form size='large' onSubmit={handleSubmit}>
          <Form.Group widths='equal'>
            <Form.Field error={errors.name && touched.name}>
              <Form.Input
                label='Name'
                type='text'
                name='name'
                placeholder='Name'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.name}
              />
              {errors.name && touched.name ? (
                <Label pointing>{errors.name}</Label>
              ) : null}
            </Form.Field>
            <Form.Field error={errors.agree && touched.agree}>
              <br />
              <Checkbox
                label='Active'
                id='active'
                onChange={handleChange}
                onBlur={handleBlur}
                checked={values.active}
              />
              {errors.active && touched.active ? (
                <>
                  <br />
                  <Label pointing>{errors.active}</Label>
                </>
              ) : null}
            </Form.Field>
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Field error={errors.brand && touched.brand}>
              <Form.Input
                label='Brand'
                type='text'
                name='brand'
                placeholder='Brand'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.brand}
              />
              {errors.brand && touched.brand ? (
                <Label pointing>{errors.brand}</Label>
              ) : null}
            </Form.Field>
            <Form.Field error={errors.region && touched.region}>
              <Form.Input
                label='Region'
                type='text'
                name='region'
                placeholder='Region'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.company}
              />
              {errors.region && touched.region ? (
                <Label pointing>{errors.region}</Label>
              ) : null}
            </Form.Field>
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Field error={errors.address1 && touched.address1}>
              <Form.Input
                label='Address Line 1'
                type='text'
                name='address1'
                placeholder='Address Line 1'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.address1}
              />
              {errors.address1 && touched.address1 ? (
                <Label pointing>{errors.address1}</Label>
              ) : null}
            </Form.Field>
            <Form.Field error={errors.address2 && touched.address2}>
              <Form.Input
                label='Address Line 2'
                type='text'
                name='address2'
                placeholder='Address Line 2'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.address2}
              />
              {errors.address2 && touched.address2 ? (
                <Label pointing>{errors.address2}</Label>
              ) : null}
            </Form.Field>
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Field error={errors.city && touched.city}>
              <Form.Input
                label='City'
                type='text'
                name='city'
                placeholder='City'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.city}
              />
              {errors.city && touched.city ? (
                <Label pointing>{errors.city}</Label>
              ) : null}
            </Form.Field>
            <Form.Field error={errors.state && touched.state}>
              <Form.Input
                label='State/Province'
                type='text'
                name='state'
                placeholder='State/Province'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.state}
              />
              {errors.state && touched.state ? (
                <Label pointing>{errors.state}</Label>
              ) : null}
            </Form.Field>
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Field error={errors.country && touched.country}>
              <Form.Input
                label='Country'
                type='text'
                name='country'
                placeholder='Country'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.country}
              />
              {errors.country && touched.country ? (
                <Label pointing>{errors.country}</Label>
              ) : null}
            </Form.Field>
            <Form.Field error={errors.postalCode && touched.postalCode}>
              <Form.Input
                label='Zip/Postal Code'
                type='text'
                name='postalCode'
                placeholder='Zip/Postal Code'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.postalCode}
              />
              {errors.postalCode && touched.postalCode ? (
                <Label pointing>{errors.postalCode}</Label>
              ) : null}
            </Form.Field>
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Field error={errors.latitude && touched.latitude}>
              <Form.Input
                label='Latitude'
                type='number'
                name='latitude'
                placeholder='Latitude'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.latitude}
              />
              {errors.latitude && touched.latitude ? (
                <Label pointing>{errors.latitude}</Label>
              ) : null}
            </Form.Field>
            <Form.Field error={errors.longitude && touched.longitude}>
              <Form.Input
                label='Longitude'
                type='number'
                name='longitude'
                placeholder='Longitude'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.longitude}
              />
              {errors.longitude && touched.longitude ? (
                <Label pointing>{errors.longitude}</Label>
              ) : null}
            </Form.Field>
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Field error={errors.contactPerson && touched.contactPerson}>
              <Form.Input
                label='Contact Person'
                type='text'
                name='contactPerson'
                placeholder='Contact Person'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.contactPerson}
              />
              {errors.contactPerson && touched.contactPerson ? (
                <Label pointing>{errors.contactPerson}</Label>
              ) : null}
            </Form.Field>
            <Form.Field error={errors.contactPhone && touched.contactPhone}>
              <Form.Input
                label='Contact Phone Number'
                type='text'
                name='contactPhone'
                placeholder='Contact Phone Number'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.contactPhone}
              />
              {errors.contactPhone && touched.contactPhone ? (
                <Label pointing>{errors.contactPhone}</Label>
              ) : null}
            </Form.Field>
          </Form.Group>
          <Button
            type='submit'
            fluid
            size='large'
            primary
            disabled={!isValid || isSubmitting}
          >
            Create Property
          </Button>
        </Form>
      )}
    </Formik>
  );
}

CreatePropertyForm.propTypes = {
  propertyCreate: PropTypes.func.isRequired,
};
```

Then we can create the modal where we display the form. Most of the important details of the modal are passed in as props.

```jsx title="CreatePropertyModal.jsx"
import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Message, Dimmer, Loader } from 'semantic-ui-react';

import CreatePropertyForm from './CreatePropertyForm';

export default function CreatePropertyModal({
  modalOpen,
  toggleModal,
  propertyCreate,
  loading,
  error,
  success,
}) {
  return (
    <Modal
      trigger={
        <Button type='button' primary onClick={toggleModal}>
          Create Property
        </Button>
      }
      open={modalOpen}
      onClose={toggleModal}
      closeIcon
    >
      <Dimmer active={loading} inverted>
        <Loader inverted />
      </Dimmer>
      <Modal.Header>Create Property</Modal.Header>
      <Modal.Content>
        <CreatePropertyForm propertyCreate={propertyCreate} />
        {success && <Message success>{success}</Message>}
        {error && <Message error>{error}</Message>}
      </Modal.Content>
    </Modal>
  );
}

CreatePropertyModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  toggleModal: PropTypes.func.isRequired,
  propertyCreate: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  success: PropTypes.string.isRequired,
};
```

Now that we can create properties let's create a component that shows all of the properties we are managing. We can incorporate a couple of actions into the list, namely the ability to delete a property and the ability to "manage" the property or bring up the individual property page. We previously set the stage for managing individual properties when we created the Admin routing. In this post we won't actually do anything with the property page, but we will shortly in a future post.

```jsx title="AdminPropertiesList.jsx (updated)"
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table, Button, Icon, Confirm } from 'semantic-ui-react';

import * as routes from '../../../../shared/constants/routes';

export default function AdminPropertiesList({
  properties,
  history,
  propertyDelete,
}) {
  const [selectedProperty, setSelectedProperty] = useState({
    id: '',
    name: '',
  });
  const [deletePropertyConfirmOpen, setDeletePropertyConfirmOpen] =
    useState(false);

  return (
    <>
      <Confirm
        open={deletePropertyConfirmOpen}
        content={`Are you sure you want to delete ${selectedProperty.name}?`}
        onCancel={() => setDeletePropertyConfirmOpen(false)}
        onConfirm={() => {
          propertyDelete(selectedProperty.id);
          setDeletePropertyConfirmOpen(false);
        }}
        size='mini'
      />
      <Table compact celled collapsing>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Property</Table.HeaderCell>
            <Table.HeaderCell>Active</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {properties.map((property) => (
            <Table.Row key={property.id}>
              <Table.Cell>{property.name}</Table.Cell>
              <Table.Cell>
                {property.active ? (
                  <Icon name='dot circle outline' />
                ) : (
                  <Icon name='circle outline' />
                )}
              </Table.Cell>
              <Table.Cell>
                <Button
                  basic
                  compact
                  onClick={() =>
                    history.push(
                      `${routes.ADMIN}${routes.ADMINPROPERTIES}/${property.id}`
                    )
                  }
                >
                  Manage
                </Button>
                <Button
                  basic
                  compact
                  onClick={() => {
                    setSelectedProperty({
                      id: property.id,
                      name: property.name,
                    });
                    setDeletePropertyConfirmOpen(true);
                  }}
                >
                  Delete
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

AdminPropertiesList.propTypes = {
  properties: PropTypes.array.isRequired,
  propertyDelete: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};
```

With all of that created we can update our AdminProperties component based on having access to new props coming from the container and these new components we have created.

```jsx title="AdminProperties.jsx (updated)"
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Container, Dimmer, Loader } from 'semantic-ui-react';

import AdminPropertiesList from './AdminPropertiesList/AdminPropertiesList';
import CreatePropertyModal from './CreateProperty/CreatePropertyModal';

export default function AdminProperties({
  properties,
  error,
  success,
  loading,
  boundPropertiesFetch,
  boundPropertyCreate,
  boundPropertyDelete,
  boundPropertyClearMsgs,
  history,
}) {
  const [createPropertyModalOpen, setCreatePropertyModalOpen] = useState(false);

  useEffect(() => {
    boundPropertiesFetch();
  }, []);

  if (error) {
    return <>Error! {error}</>;
  }

  if (loading) {
    return (
      <>
        <Dimmer active={loading}>
          <Loader />
        </Dimmer>
      </>
    );
  }

  return (
    <Container>
      <AdminPropertiesList
        properties={properties}
        propertyDelete={boundPropertyDelete}
        history={history}
      />
      <CreatePropertyModal
        modalOpen={createPropertyModalOpen}
        toggleModal={() => {
          setCreatePropertyModalOpen(!createPropertyModalOpen);
          boundPropertyClearMsgs();
        }}
        propertyCreate={boundPropertyCreate}
        loading={loading}
        error={error}
        success={success}
      />
      <br />
      <br />
    </Container>
  );
}

AdminProperties.propTypes = {
  properties: PropTypes.array.isRequired,
  error: PropTypes.string.isRequired,
  success: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  boundPropertiesFetch: PropTypes.func.isRequired,
  boundPropertyCreate: PropTypes.func.isRequired,
  boundPropertyDelete: PropTypes.func.isRequired,
  boundPropertyClearMsgs: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};
```

All of that is working well. We can create and delete properties and see them displayed in a list.

## Next

The admin side of our app is starting to take shape. Before we create the functionality to manage a property we can setup the Settings that will help us do so.

## Code

<https://github.com/peterdyer7/media-library/tree/26.AdminPropertiesFrontEnd>
