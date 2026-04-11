import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator, useWindowDimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { API_BASE, ENDPOINTS } from '../../api/endpoints'
import { validateTeacherRegisterForm, FieldError } from '../../utils/formValidation'
import Header from '../Header'

const baseUrl = API_BASE

const TeacherRegister = () => {
    const navigation = useNavigation()
    const { width } = useWindowDimensions()
    const [teacherLoginStatus, setTeacherLoginStatus] = useState(null)

    const isTablet = width >= 768
    const isSmall = width < 360

    useEffect(() => {
      const loadLoginStatus = async () => {
        const status = await AsyncStorage.getItem('teacherLoginStatus')
        setTeacherLoginStatus(status)
      }
      loadLoginStatus()
    }, [])

    const [teacherData,setTeacherData]=useState({
            'full_name':'',
            'email':'',
            'password':'',
            'qualification':'',
            'mobile_no':'',
            'skills':'',
            'status':''
    })
    const [loading, setLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    const handleChange=(name, value)=>{
        setTeacherData({
            ...teacherData,
            [name]:value
        })
    }

    const submitForm=async()=>{
      if (loading) return

      const errors = validateTeacherRegisterForm({
        full_name: teacherData.full_name,
        email: teacherData.email,
        password: teacherData.password,
        qualification: teacherData.qualification,
        mobile_no: teacherData.mobile_no
      })
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) {
        Alert.alert('Validation', 'Please fix the errors below')
        return
      }

        const teacherFormData=new FormData()
        teacherFormData.append('full_name',teacherData.full_name)
        teacherFormData.append('email',teacherData.email)
        teacherFormData.append('password',teacherData.password)
        teacherFormData.append('qualification',teacherData.qualification)
        teacherFormData.append('mobile_no',teacherData.mobile_no)
        teacherFormData.append('skills',teacherData.skills)

      setLoading(true)
      try{
        const response = await axios.post(baseUrl + ENDPOINTS.TEACHER_REGISTER,teacherFormData)
        setTeacherData({
          'full_name':'',
          'email':'',
          'password':'',
          'qualification':'',
          'mobile_no':'',
          'skills':'',
          'status':'success'
        })
        if(response.status==200 || response.status==201){
          Alert.alert('Success', 'Registered! Verify your email, then wait for admin approval before login.')
        }
        let tID = setTimeout(function () {
          navigation.navigate('TeacherLogin')
          clearTimeout(tID)
        }, 2800)
      }catch(error){
        setTeacherData((prev) => ({ ...prev, 'status':'error' }))
        Alert.alert('Error', error?.response?.data?.message || 'Registration failed. Please try again.')
      } finally {
        setLoading(false)
        }
    }

    useEffect(() => {
      if (teacherLoginStatus === 'true') {
        const parentNav = navigation.getParent()
        if (parentNav) {
          parentNav.reset({
            index: 0,
            routes: [{ name: 'TeacherApp' }],
          })
        } else {
          navigation.navigate('TeacherDashboard')
        }
      }
    }, [teacherLoginStatus, navigation])

 return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, !isTablet && styles.containerMobile]}>
          <View style={styles.mainWrap}>
            <View style={styles.headerSection}>
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>👥</Text>
                <Text style={styles.badgeText}>Join thousands of learners</Text>
              </View>
              <Text style={[styles.pageTitle, !isTablet && styles.pageTitleMobile, isSmall && styles.pageTitleSmall]}>Create Your Account</Text>
              <Text style={styles.pageSubtitle}>Start your learning journey today</Text>
            </View>

            <View style={styles.cardWrap}>
              <View style={[styles.card, !isTablet && styles.cardMobile]}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← Back to role selection</Text>
                </TouchableOpacity>

                <View style={[styles.headerRow, !isTablet && styles.headerRowMobile]}>
                  <View style={styles.headerIconBox}>
                    <Text style={styles.headerIcon}>📘</Text>
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Teacher Registration</Text>
                    <Text style={styles.cardSubtitle}>Complete your profile to continue</Text>
                  </View>
                </View>

                {teacherData.status === 'success' && (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>✓ Registered successfully. Verify your email, then wait for admin approval before logging in.</Text>
                  </View>
                )}
                {teacherData.status === 'error' && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠ Please fill all fields correctly</Text>
                  </View>
                )}

                <View style={styles.formFields}>
                  <View>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('full_name', text)}
                      value={teacherData.full_name}
                      placeholder="e.g., James Mitchell, Dr. Rajesh Kumar"
                      style={[styles.input, fieldErrors.full_name ? styles.inputError : styles.inputNormal]}
                    />
                    <FieldError error={fieldErrors.full_name} />
                  </View>

                  <View>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('email', text)}
                      value={teacherData.email}
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
                      value={teacherData.password}
                      placeholder="Create a secure password (min. 8 characters)"
                      style={[styles.input, fieldErrors.password ? styles.inputError : styles.inputNormal]}
                      secureTextEntry
                    />
                    <FieldError error={fieldErrors.password} />
                  </View>

                  <View>
                    <Text style={styles.label}>Qualifications</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('qualification', text)}
                      value={teacherData.qualification}
                      placeholder="e.g., B.Mus., M.A. in Music, Certified Piano Instructor"
                      style={[styles.input, fieldErrors.qualification ? styles.inputError : styles.inputNormal]}
                    />
                    <FieldError error={fieldErrors.qualification} />
                  </View>

                  <View>
                    <Text style={styles.label}>Mobile No</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('mobile_no', text)}
                      value={teacherData.mobile_no}
                      placeholder="e.g., +1 (555) 123-4567"
                      style={[styles.input, fieldErrors.mobile_no ? styles.inputError : styles.inputNormal]}
                      keyboardType="phone-pad"
                    />
                    <FieldError error={fieldErrors.mobile_no} />
                  </View>

                  <View>
                    <Text style={styles.label}>Skills</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('skills', text)}
                      value={teacherData.skills}
                      placeholder="Piano, Violin, Music Theory, Composition, Voice Training, etc."
                      style={[styles.input, styles.textArea]}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={submitForm}
                    disabled={loading}
                    style={[styles.submitBtn, loading ? styles.submitBtnDisabled : null]}
                  >
                    {loading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text style={styles.submitBtnText}>Registering...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitBtnText}>Complete Profile Setup →</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('TeacherLogin')}
                    style={styles.signInBtn}
                  >
                    <Text style={styles.signInBtnText}>Already have an account? Sign In</Text>
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
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    minHeight: '100%',
    backgroundColor: '#f5f7fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  containerMobile: {
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  mainWrap: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
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
    maxWidth: 580,
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
    padding: 24,
  },
  backLink: {
    marginBottom: 32,
  },
  backLinkText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  headerRowMobile: {
    gap: 12,
    marginBottom: 24,
  },
  headerIconBox: {
    width: 56,
    height: 56,
    backgroundColor: '#667eea',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 28,
    color: '#ffffff',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  successBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
    borderRadius: 8,
    marginBottom: 24,
  },
  successText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '500',
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
  textArea: {
    minHeight: 90,
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
  signInBtn: {
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
  signInBtnText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
})

export default TeacherRegister
