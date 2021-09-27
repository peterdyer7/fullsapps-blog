---
slug: 28-media-library-settings-frontend
title: 28. Media Library - Settings Front-end
authors: peter
tags: [Redux, useEffect, useState]
---

In this post we will begin wiring up the ability to manage settings in our GUI.

<!--truncate-->

## Background

In the previous post we discussed a desire to keep settings functionality generic to allow additional settings to be added and managed without requiring any new code. In this post we will continue that theme with our construction of the setting GUI. With that said, the patterns applied to settings will be very similar to the patterns applied to properties.

## Walk Through

We previously created a landing page to manage (or administer) settings. With our back-end in place we can start to build out our admin settings GUI. I'm going to start by wrapping our AdminSettings component in a container to get access to the settings state that we are now exposing via the Redux store. We have used this same container pattern elsewhere in our application.

```jsx title="AdminSettingsContainer.jsx"
import { connect } from 'react-redux';

import AdminSettings from '../../../components/admin/AdminSettings/AdminSettings';
import {
  fetchSettings,
  addSetting,
  removeSetting,
} from '../../../shared/redux/actions/settings';

const mapStateToProps = (state) => ({
  settings: state.settings.settings,
  loading: state.settings.loading,
  error: state.settings.error,
});

const mapDispatchToProps = (dispatch) => ({
  boundSettingsFetch: (type) => dispatch(fetchSettings(type)),
  boundSettingAdd: (type, list, item) => dispatch(addSetting(type, list, item)),
  boundSettingRemove: (type, list, item) =>
    dispatch(removeSetting(type, list, item)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AdminSettings);
```

We can now swap out the AdminSettings component we are rendering for the container version.

```jsx title="Admin.jsx (updated)"
...
//import AdminSettings from '../AdminSettings/AdminSettings';
import AdminSettingsContainer from '../../../containers/admin/AdminSettings/AdminSettingsContainer';
...
          <Route
            path={match.path + routes.ADMINSETTINGS}
            component={AdminSettingsContainer}
          />
...
```

We need the ability to display a list of settings. You will notice that this is more than just a simple list. We are passing in props that let us taylor the list based on the setting. Some settings will allow new settings to be added or deleted or not updated at all. Our list handles this by not only accepting the props that determine what to display but also taken the functions to perform the updates as props.

```jsx title="SettingsList.jsx"
import React, { useState } from 'react';
import { Table, Button, Header, Confirm } from 'semantic-ui-react';

import AddSettingModal from '../AddSettingModal/AddSettingModal';

export default function SettingsList({
  settingLabel = '',
  setting,
  type,
  settings = [],
  allowAdd = false,
  allowDelete = false,
  addSetting,
  removeSetting,
}) {
  const [addSettingModalOpen, setAddSettingModalOpen] = useState(false);
  const [deleteSettingConfirmOpen, setDeleteSettingConfirmOpen] =
    useState(false);
  const [settingToDelete, setSettingToDelete] = useState('');

  return (
    <>
      <Header size='small'>{settingLabel}</Header>
      <Table compact unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Setting</Table.HeaderCell>
            {allowDelete && <Table.HeaderCell>Actions</Table.HeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {settings.map((setting) => (
            <Table.Row key={setting}>
              <Table.Cell>{setting}</Table.Cell>
              {allowDelete && (
                <Table.Cell>
                  <Button
                    id='deleteButton'
                    basic
                    compact
                    size='tiny'
                    onClick={() => {
                      setSettingToDelete(setting);
                      setDeleteSettingConfirmOpen(!deleteSettingConfirmOpen);
                    }}
                  >
                    Delete
                  </Button>
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer fullWidth>
          <Table.Row>
            <Table.HeaderCell colSpan='2'>
              {allowAdd && (
                <AddSettingModal
                  toggleModal={() =>
                    setAddSettingModalOpen(!addSettingModalOpen)
                  }
                  modalOpen={addSettingModalOpen}
                  settingLabel={settingLabel}
                  setting={setting}
                  type={type}
                  addSetting={addSetting}
                />
              )}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
      <Confirm
        open={deleteSettingConfirmOpen}
        content={`Are you sure you want to delete ${settingToDelete}?`}
        onCancel={() => setDeleteSettingConfirmOpen(false)}
        onConfirm={() => {
          removeSetting(type, setting, settingToDelete);
          setDeleteSettingConfirmOpen(false);
        }}
        size='mini'
      />
    </>
  );
}
```

Part of showing a list of settings is being able to add a new setting. We will create a modal dialog to handle that. Again, the actual function to perform the update has been passed in, and in fact, if you track it back you will find the function is coming from our container.

```jsx title="AddSettingModal.jsx"
import React, { useState } from 'react';
import { Modal, Button, Form } from 'semantic-ui-react';

export default function AddSettingModal({
  toggleModal,
  modalOpen,
  settingLabel,
}) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    const { value } = this.state;
    const { setting, type, addSetting, toggleModal } = this.props;
    e.preventDefault();
    addSetting(type, setting, value);
    toggleModal();
  };

  return (
    <Modal
      trigger={
        <Button
          id='addButton'
          floated='right'
          primary
          size='tiny'
          onClick={toggleModal}
        >
          Add Setting
        </Button>
      }
      open={modalOpen}
      onClose={toggleModal}
      size='mini'
    >
      <Modal.Header>{settingLabel} - Add Setting</Modal.Header>
      <Modal.Content>
        <Form onSubmit={handleSubmit} size='large'>
          <Form.Field inline>
            <label>Setting:</label>
            <input
              type='text'
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
            />
          </Form.Field>
          <Button primary content='Add' type='submit' />
          <Button secondary content='Cancel' onClick={toggleModal} />
        </Form>
      </Modal.Content>
    </Modal>
  );
}
```

It all comes together in the AdminSettings component. Here we are specifying the actual settings to display and what options are available for each of those settings. In our case primaryCategory is a list that cannot be edited (settings cannot be added or deleted), secondaryCategory is a list that can be added to but not deleted from and tags can both be added and deleted. All of these options are handled by the SettingsList component we created.

You might also not that we are doing a quick check to see if our settings object has been added to the state before we fetch settings (Object.keys(settings).length === 0). This prevents re-fetching every time the components mounts. It is slightly unsafe as we won't know if another user has updated settings but that is a trade-off I am willing to make to reduce the amount of re-fetching. This, like everything, could be adjusted if it became a problem. We could implement polling or even get into a more complex type of subscription behavior but our application does not warrant that at this time.

```jsx title="AdminSettings.jsx"
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Segment,
  Header,
  Dimmer,
  Loader,
  Grid,
  Divider,
} from 'semantic-ui-react';

import SettingsList from './SettingsList/SettingsList';

export default function AdminSettings({
  loading,
  error,
  settings,
  boundSettingsFetch,
  boundSettingAdd,
  boundSettingRemove,
}) {
  useEffect(() => {
    if (Object.keys(settings).length === 0) {
      boundSettingsFetch('imageMetadata');
    }
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
    <>
      <Segment>
        <Header size='medium' textAlign='center'>
          Image Metadata Settings
        </Header>
        <Divider />
        <Grid stackable columns={3}>
          <Grid.Column>
            <SettingsList
              settingLabel='Categories'
              type='imageMetadata'
              setting='primaryCategory'
              settings={settings.primaryCategory}
              allowDelete={false}
              allowAdd={false}
              addSetting={boundSettingAdd}
              removeSetting={boundSettingRemove}
            />
          </Grid.Column>
          <Grid.Column>
            <SettingsList
              settingLabel='Alternate Categories'
              type='imageMetadata'
              setting='secondaryCategory'
              settings={settings.secondaryCategory}
              allowDelete={false}
              allowAdd={true}
              addSetting={boundSettingAdd}
              removeSetting={boundSettingRemove}
            />
          </Grid.Column>
          <Grid.Column>
            <SettingsList
              settingLabel='Tags'
              type='imageMetadata'
              setting='tags'
              settings={settings.tags}
              allowDelete={true}
              allowAdd={true}
              addSetting={boundSettingAdd}
              removeSetting={boundSettingRemove}
            />
          </Grid.Column>
        </Grid>
      </Segment>
    </>
  );
}

AdminSettings.propTypes = {
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  settings: PropTypes.object.isRequired,
  boundSettingsFetch: PropTypes.func.isRequired,
  boundSettingAdd: PropTypes.func.isRequired,
  boundSettingRemove: PropTypes.func.isRequired,
};
```

All of that is working well. We can create and delete settings per the rules we have established for the different types of settings.

## Next

With that done I want to circle back on testing once again.

## Code

<https://github.com/peterdyer7/media-library/tree/28.SettingsFrontend>
