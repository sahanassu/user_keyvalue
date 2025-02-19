import React, { useState, useEffect } from 'react';
import { Button, Space, message } from 'antd';
import axios from 'axios';
import PreferencesDrawer from './PreferencesDrawer';
import PreferencesList from './PreferencesList';

const UserPreferences = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [keyValues, setKeyValues] = useState([{ key: '', value: '', keyError: '', valueError: '' }]);
  const [isEditing, setIsEditing] = useState(false);
  const [deletedKeys, setDeletedKeys] = useState([]);
  const userId = '667a6424b2de1ef3a5653b0f';

  useEffect(() => {
    fetchUserPreferences();
  }, [userId]);

  const fetchUserPreferences = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/userPrefs/get/${userId}`);
      setUserPreferences(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const showDrawer = (edit = false) => {
    if (edit && userPreferences) {
      setKeyValues(userPreferences.preferences.keyValues.map(kv => ({ key: kv.key, value: kv.value, keyError: '', valueError: '' })));
      setIsEditing(true);
    } else {
      setKeyValues([{ key: '', value: '', keyError: '', valueError: '' }]);
      setIsEditing(false);
    }
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setKeyValues([{ key: '', value: '', keyError: '', valueError: '' }]);
    setDeletedKeys([]);
  };

  const handleAddKeyValue = () => {
    setKeyValues([...keyValues, { key: '', value: '', keyError: '', valueError: '' }]);
  };

  const handleChangeKeyValue = (index, field, value) => {
    const updatedKeyValues = [...keyValues];
    updatedKeyValues[index][field] = value;
    setKeyValues(updatedKeyValues);
    validateKeyValues();
  };

  const handleDeleteKeyValue = (index) => {
    const updatedKeyValues = [...keyValues];
    const deletedKey = updatedKeyValues[index].key;
    setDeletedKeys([...deletedKeys, deletedKey]);
    updatedKeyValues.splice(index, 1);
    setKeyValues(updatedKeyValues);
  };

  const validateKeyValues = () => {
    const keyCount = {};
    const updatedKeyValues = [...keyValues];
    let valid = true;

    // Count occurrences of each key
    updatedKeyValues.forEach(({ key }) => {
      if (key) {
        keyCount[key] = (keyCount[key] || 0) + 1;
      }
    });

    // Validate keys and values, mark duplicates
    for (let i = 0; i < updatedKeyValues.length; i++) {
      const { key, value } = updatedKeyValues[i];
      if (!key) {
        updatedKeyValues[i].keyError = 'Key is required';
        valid = false;
      } else if (keyCount[key] > 1) {
        updatedKeyValues[i].keyError = 'Duplicate key found';
        valid = false;
      } else {
        updatedKeyValues[i].keyError = '';
      }

      if (!value) {
        updatedKeyValues[i].valueError = 'Value is required';
        valid = false;
      } else {
        updatedKeyValues[i].valueError = '';
      }
    }

    setKeyValues(updatedKeyValues);
    return valid;
  };

  const handleSavePreferences = async () => {
    if (!validateKeyValues()) return;

    try {
      const response = await axios.post(`http://localhost:3000/userPrefs/add/${userId}/preferences`, { keyValues });
      message.success('Preferences saved successfully!');
      setUserPreferences(response.data); // Update state with new data
      closeDrawer(); // Close the drawer after saving
    } catch (error) {
      console.error('Error saving preferences:', error);
      message.error('Failed to save preferences.');
    }
  };

  const handleUpdatePreferences = async () => {
    if (!validateKeyValues()) return;

    const updates = keyValues.map(({ key, value }) => ({ key, value }));

    // Delete preferences marked for deletion
    for (let key of deletedKeys) {
      try {
        await axios.delete(`http://localhost:3000/userPrefs/delete/${userId}/preferences/${key}`);
      } catch (error) {
        console.error('Error deleting preference:', error);
        message.error('Failed to delete preference.');
        return;
      }
    }

    try {
      const response = await axios.patch(`http://localhost:3000/userPrefs/update/${userId}`, { preferences: { keyValues: updates } });
      message.success('Preferences updated successfully!');
      setUserPreferences(response.data); // Update state with new data
      closeDrawer();
    } catch (error) {
      console.error('Error updating preferences:', error);
      message.error('Failed to update preferences.');
    }
  };

  return (
    <div>
      {userPreferences && (
        <div style={{ marginLeft: 16, marginTop: 19 }}>
          <h2>User's Preferences</h2>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button type="primary" onClick={() => showDrawer(false)}>
                Add Preferences
              </Button>
              <Button type="primary" onClick={() => showDrawer(true)} disabled={!userPreferences}>
                Edit Preferences
              </Button>
            </Space>
          </div>
          <PreferencesList preferences={userPreferences.preferences.keyValues} />
        </div>
      )}

      <PreferencesDrawer
        drawerVisible={drawerVisible}
        closeDrawer={closeDrawer}
        keyValues={keyValues}
        setKeyValues={setKeyValues}
        handleAddKeyValue={handleAddKeyValue}
        handleChangeKeyValue={handleChangeKeyValue}
        handleDeleteKeyValue={handleDeleteKeyValue}
        isEditing={isEditing}
        handleSavePreferences={handleSavePreferences}
        handleUpdatePreferences={handleUpdatePreferences}
      />
    </div>
  );
};

export default UserPreferences;
