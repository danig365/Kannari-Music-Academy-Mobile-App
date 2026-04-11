import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { API_BASE, ENDPOINTS } from '../../api/endpoints'

const TeacherForgotPassword = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const token = route?.params?.token || null

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
  }, [])

  const requestReset = async () => {
    if (!email) {
      Alert.alert('Warning', 'Please enter your email')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('email', email)

    try {
      await axios.post(`${API_BASE}${ENDPOINTS.TEACHER_PASSWORD_RESET_REQ}`, formData)
      Alert.alert('Success', 'If your email exists, reset link sent')
      setEmail('')
    } catch (error) {
      Alert.alert('Error', 'Unable to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const submitNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Warning', 'Please fill all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Warning', 'Passwords do not match')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('token', token)
    formData.append('new_password', newPassword)

    try {
      const res = await axios.post(`${API_BASE}${ENDPOINTS.TEACHER_PASSWORD_RESET_CONF}`, formData)
      if (res.data.bool) {
        Alert.alert('Success', 'Password reset successful')
        setTimeout(() => {
          navigation.navigate('TeacherLogin')
        }, 1800)
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Invalid or expired reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.card}>
          <TouchableOpacity onPress={() => navigation.navigate('TeacherLogin')}>
            <Text style={styles.backLink}>← Back to login</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{token ? 'Set New Password' : 'Forgot Password'}</Text>
          <Text style={styles.subtitle}>
            {token ? 'Enter your new password below.' : 'Enter your registered email to receive a password reset link.'}
          </Text>

          {!token ? (
            <>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="teacher@kannari.com"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={requestReset}
                disabled={loading}
                style={[styles.button, loading ? styles.buttonDisabled : null]}
              >
                <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                style={styles.inputSmallGap}
                secureTextEntry
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                style={styles.input}
                secureTextEntry
              />
              <TouchableOpacity
                onPress={submitNewPassword}
                disabled={loading}
                style={[styles.button, loading ? styles.buttonDisabled : null]}
              >
                <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Reset Password'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    minHeight: '100%',
    backgroundColor: '#f5f7fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backLink: {
    color: '#6b7280',
    fontSize: 14,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    color: '#1a1a1a',
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
    color: '#1a1a1a',
  },
  inputSmallGap: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
    color: '#1a1a1a',
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
})

export default TeacherForgotPassword
