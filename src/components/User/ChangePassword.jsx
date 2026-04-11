import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const ChangePassword = () => {
  const navigation = useNavigation();
  const [studentId, setStudentId] = useState(null);
  const [studentLoginStatus, setStudentLoginStatus] = useState(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        const storedLoginStatus = await AsyncStorage.getItem('studentLoginStatus');
        setStudentId(storedStudentId);
        setStudentLoginStatus(storedLoginStatus);
      } catch (error) {
        console.log('Error loading auth data:', error);
      }
    };

    loadAuthData();
  }, []);

  useEffect(() => {
    if (studentLoginStatus === null) return;
    if (studentLoginStatus !== 'true') {
      navigation.navigate('/student/login');
    }
  }, [studentLoginStatus]);

  const submitForm = async () => {
    if (!password || password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (!studentId) return;

    const studentFormData = new FormData();
    studentFormData.append('password', password);

    try {
      const response = await axios.post(`${baseUrl}/student/change-password/${studentId}/`, studentFormData);

      if (response.status === 200) {
        Alert.alert('Success', 'Password updated successfully.', [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.removeItem('studentLoginStatus');
              navigation.navigate('/student/logout');
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Please try again.');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Could not update password.');
    }
  };

  return (
    <View>
      <View style={styles.headingRow}>
        <Bootstrap name="lock" size={18} color="#ef4444" />
        <Text style={styles.heading}>Change Password</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your new password"
          style={styles.input}
        />
      </View>

      <Text style={styles.helperText}>Password must be at least 8 characters long</Text>

      <TouchableOpacity style={styles.submitBtn} onPress={submitForm}>
        <Bootstrap name="check-lg" size={14} color="#ffffff" />
        <Text style={styles.submitBtnText}>Update Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2332',
  },
  formGroup: {
    marginBottom: 10,
  },
  label: {
    fontWeight: '500',
    color: '#1a2332',
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ChangePassword;

