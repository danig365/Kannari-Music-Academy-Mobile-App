import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import axios from 'axios'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../context/AuthContext'
import Header from '../Header'

import { API_BASE, ENDPOINTS } from '../../api/endpoints'
import { validateLoginForm, FieldError } from '../../utils/formValidation'

const baseUrl = API_BASE

const TeacherLogin = () => {
  const navigation = useNavigation()
  const { setRole } = useAuth()
  const { width } = useWindowDimensions()

  const [teacherLoginStatus, setTeacherLoginStatus] = useState(null)
  const [teacherLoginData, setTeacherLoginData] = useState({
    email: '',
    password: ''
  })

  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const isTablet = width >= 768
  const isSmall = width < 360

  useEffect(() => {
    const loadLoginStatus = async () => {
      const status = await AsyncStorage.getItem('teacherLoginStatus')
      setTeacherLoginStatus(status)
    }
    loadLoginStatus()
  }, [])

  useEffect(() => {
    if (teacherLoginStatus === 'true') {
      setRole('teacher')
    }
  }, [teacherLoginStatus, setRole])

  const getTeacherLoginErrorMessage = (rawMessage) => {
    const message = (rawMessage || '').toLowerCase()

    if (message.includes('pending admin approval') || message.includes('admin approval')) {
      return 'Login failed: your teacher account is pending admin approval.'
    }
    if (message.includes('verify your email')) {
      return 'Login failed: please verify your email first.'
    }
    return rawMessage || 'Login failed. Please try again.'
  }

  const handleChange = (name, value) => {
    setTeacherLoginData({
      ...teacherLoginData,
      [name]: value
    })
  }

  const submitForm = async () => {
    if (loading) return

    const errors = validateLoginForm(teacherLoginData)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setErrorMsg('')
    setLoading(true)

    try {
      const formBody = `email=${encodeURIComponent(teacherLoginData.email)}&password=${encodeURIComponent(teacherLoginData.password)}`
      const res = await axios.post(baseUrl + ENDPOINTS.TEACHER_LOGIN, formBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      if (res.data.bool === true) {
        await AsyncStorage.setItem('teacherLoginStatus', 'true')
        await AsyncStorage.setItem('teacherId', String(res.data.teacher_id || ''))
        await AsyncStorage.setItem('teacherName', String(res.data.teacher_name || ''))
        await AsyncStorage.setItem('teacherEmail', String(res.data.teacher_email || ''))
        await AsyncStorage.setItem('teacherQualification', String(res.data.teacher_qualification || ''))
        await AsyncStorage.setItem('teacherMobile', String(res.data.teacher_mobile || ''))
        await AsyncStorage.setItem('teacherProfileImg', String(res.data.teacher_profile_img || ''))
        setRole('teacher')
      } else {
        const message = getTeacherLoginErrorMessage(res.data?.message || 'Please enter valid login details.')
        setErrorMsg(message)
        Alert.alert('Login Error', message)
      }
    } catch (error) {
      const message = getTeacherLoginErrorMessage(error?.response?.data?.message || error?.message)
      setErrorMsg(message)
      Alert.alert('Login Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.container, !isTablet && styles.containerMobile]}>
          <View style={styles.contentWrap}>
            <View style={[styles.headerSection, !isTablet && styles.headerSectionMobile]}>
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>📘</Text>
                <Text style={styles.badgeText}>Welcome back, Teacher</Text>
              </View>
              <Text style={[styles.pageTitle, !isTablet && styles.pageTitleMobile, isSmall && styles.pageTitleSmall]}>
                Sign In to Your Account
              </Text>
              <Text style={styles.pageSubtitle}>Continue your teaching journey</Text>
            </View>

            <View style={styles.cardWrap}>
              <View style={[styles.card, !isTablet && styles.cardMobile]}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={[styles.backLink, !isTablet && styles.backLinkMobile]}>
                  <Text style={styles.backLinkText}>← Back to home</Text>
                </TouchableOpacity>

                <View style={[styles.cardHeaderRow, !isTablet && styles.cardHeaderRowMobile]}>
                  <View style={styles.headerIconBox}>
                    <Text style={styles.headerIconText}>📘</Text>
                  </View>
                  <View style={styles.headerTextWrap}>
                    <Text style={[styles.cardTitle, !isTablet && styles.cardTitleMobile]}>Teacher Sign In</Text>
                    <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>
                  </View>
                </View>

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠ {errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.formFields}>
                  <View>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('email', text)}
                      value={teacherLoginData.email}
                      placeholder="instructor@kannari.com"
                      style={[styles.input, fieldErrors.email ? styles.inputError : styles.inputNormal]}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <FieldError error={fieldErrors.email} />
                  </View>

                  <View>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('password', text)}
                      value={teacherLoginData.password}
                      placeholder="Enter your password"
                      style={[styles.input, fieldErrors.password ? styles.inputError : styles.inputNormal]}
                      secureTextEntry
                    />
                    <FieldError error={fieldErrors.password} />
                    <View style={styles.forgotWrap}>
                      <TouchableOpacity onPress={() => navigation.navigate('TeacherForgotPassword')}>
                        <Text style={styles.forgotLink}>Forgot password?</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={submitForm}
                    disabled={loading}
                    style={[styles.submitBtn, loading ? styles.submitBtnDisabled : null]}
                  >
                    {loading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text style={styles.submitBtnText}>Logging in...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitBtnText}>Sign In →</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity onPress={() => navigation.navigate('TeacherRegister')} style={styles.signUpBtn}>
                    <Text style={styles.signUpBtnText}>Don't have an account? Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    backgroundColor: '#f5f7fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerMobile: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 1200,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerSectionMobile: {
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeIcon: {
    fontSize: 14,
    color: '#1976d2',
  },
  badgeText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  pageTitleMobile: {
    fontSize: 28,
  },
  pageTitleSmall: {
    fontSize: 24,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
    textAlign: 'center',
  },
  cardWrap: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMobile: {
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  backLink: {
    marginBottom: 32,
  },
  backLinkMobile: {
    marginBottom: 20,
  },
  backLinkText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  cardHeaderRowMobile: {
    gap: 12,
    marginBottom: 22,
  },
  headerIconBox: {
    width: 56,
    height: 56,
    backgroundColor: '#667eea',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 28,
    color: '#ffffff',
  },
  headerTextWrap: {
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardTitleMobile: {
    fontSize: 21,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '500',
  },
  formFields: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderRadius: 8,
    color: '#1a1a1a',
    borderWidth: 1,
  },
  inputNormal: {
    borderColor: '#e5e7eb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  forgotWrap: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  forgotLink: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '500',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#667eea',
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
    opacity: 1,
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  signUpBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderColor: '#667eea',
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpBtnText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
})

export default TeacherLogin
