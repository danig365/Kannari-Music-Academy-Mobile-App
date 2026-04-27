import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { API_BASE, ENDPOINTS } from '../api/endpoints'
import Header from './Header'

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const ParentLogin = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { setRole } = useAuth()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState(route.params?.email || '')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const isTablet = width >= 768
  const isSmall = width < 360

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const pid = await AsyncStorage.getItem('parentId')
      const status = await AsyncStorage.getItem('parentLoginStatus')
      if (pid && status === 'true') {
        setRole('parent')
      }
    } catch (err) {
      console.log(err)
    }
  }

  const requestCode = async () => {
    const errors = {}
    if (!email.trim()) errors.email = 'Please enter your email'
    else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError(errors.email)
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE}${ENDPOINTS.PARENT_LOGIN_REQUEST}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()

      if (response.ok && data.bool !== false) {
        setStep('verify')
        setMessage(data.message || 'Verification code sent to your email')
      } else {
        setError(data.error || data.message || 'No parent account found with this email')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.log(err)
    }
    setLoading(false)
  }

  const verifyCode = async () => {
    const errors = {}
    if (!verificationCode.trim()) errors.code = 'Please enter the code'
    else if (verificationCode.trim().length < 6) errors.code = 'Code must be 6 digits'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError(errors.code)
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE}${ENDPOINTS.PARENT_LOGIN_VERIFY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: verificationCode.trim(),
        }),
      })
      const data = await response.json()

      if (response.ok && data.bool !== false) {
        await AsyncStorage.setItem('parentId', String(data.parent_id))
        await AsyncStorage.setItem('parentName', data.parent_name || data.name || 'Parent')
        await AsyncStorage.setItem('parentLoginStatus', 'true')
        setRole('parent')
      } else {
        setError(data.error || data.message || 'Invalid or expired code')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.log(err)
    }
    setLoading(false)
  }

  const handleSubmit = () => {
    if (step === 'email') requestCode()
    else verifyCode()
  }

  return (
    <View style={styles.screen}>
      <Header />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 72 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            !isTablet && styles.scrollContentMobile,
            { paddingBottom: 28 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Logo Area */}
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>👨‍👩‍👧</Text>
            </View>
            <Text style={[styles.logoTitle, !isTablet && styles.logoTitleMobile, isSmall && styles.logoTitleSmall]}>Parent Portal</Text>
            <Text style={styles.logoSubtitle}>Kannari Music Academy</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, !isTablet && styles.cardMobile]}>
            <Text style={[styles.cardTitle, !isTablet && styles.cardTitleMobile]}>
              {step === 'email' ? 'Sign In' : 'Enter Verification Code'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {step === 'email'
                ? 'Enter the email associated with your parent account'
                : `We sent a code to ${email}`}
            </Text>

            {/* Error Message */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Success Message */}
            {message && !error && (
              <View style={styles.messageBox}>
                <Text style={styles.messageIcon}>✓</Text>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            )}

            {/* Form Fields */}
            {step === 'email' ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    fieldErrors.email && styles.inputError,
                  ]}
                  placeholder="parent@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    setFieldErrors({})
                  }}
                  keyboardType="email-address"
                  editable={!loading}
                  autoFocus
                />
                {fieldErrors.email && (
                  <Text style={styles.fieldError}>{fieldErrors.email}</Text>
                )}
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.codeInput,
                    fieldErrors.code && styles.inputError,
                  ]}
                  placeholder="------"
                  value={verificationCode}
                  onChangeText={(text) => {
                    setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6))
                    setFieldErrors({})
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  autoFocus
                />
                {fieldErrors.code && (
                  <Text style={styles.fieldError}>{fieldErrors.code}</Text>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setStep('email')
                    setError('')
                    setMessage('')
                    setVerificationCode('')
                  }}
                  disabled={loading}
                >
                  <Text style={styles.tryAgainButton}>
                    Didn't receive it? Try again
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.submitButtonText}>Please wait...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {step === 'email'
                    ? 'Send Verification Code'
                    : 'Verify & Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footerContainer, !isTablet && styles.footerContainerMobile]}>
            <Text style={styles.footerIcon}>🛡️</Text>
            <Text style={styles.footerText}>
              All messages are monitored for child safety
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  scrollContentMobile: {
    paddingHorizontal: 16,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 32,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  logoTitleMobile: {
    fontSize: 20,
  },
  logoTitleSmall: {
    fontSize: 18,
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  cardMobile: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardTitleMobile: {
    fontSize: 16,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    flex: 1,
  },
  messageBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  messageText: {
    fontSize: 13,
    color: '#16a34a',
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  codeInput: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
  },
  fieldError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  tryAgainButton: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  submitButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerContainerMobile: {
    marginTop: 12,
  },
  footerIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

export default ParentLogin
