import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator, useWindowDimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'

import { API_BASE, ENDPOINTS } from '../../api/endpoints'
import { validateStudentRegisterForm, FieldError } from '../../utils/formValidation'
import Header from '../Header'

const baseUrl = API_BASE

const Register = () => {
    const navigation = useNavigation()
    const { width } = useWindowDimensions()

    const isTablet = width >= 768
    const isSmall = width < 360

    const [studentData,setStudentData]=useState({
        'fullname':'',
        'email':'',
        'password':'',
        'username':'',
        'date_of_birth':'',
        'interseted_categories':'',
        'parent_email':'',
        'parent_name':'',
        'status':''
    })
    const [loading, setLoading] = useState(false)
    const [isMinor, setIsMinor] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    const handleChange=(name, value)=>{
        setStudentData({
            ...studentData,
            [name]: value
        })

        if (name === 'date_of_birth' && value) {
            const dob = new Date(value)
            const today = new Date()
            let age = today.getFullYear() - dob.getFullYear()
            const monthDiff = today.getMonth() - dob.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--
            }
            setIsMinor(age < 18)
        } else if (name === 'date_of_birth' && !value) {
            setIsMinor(false)
        }
    }

    const submitForm=async()=>{
      if (loading) return

      const errors = validateStudentRegisterForm({
        fullname: studentData.fullname,
        email: studentData.email,
        password: studentData.password,
        username: studentData.username,
        date_of_birth: studentData.date_of_birth,
        parent_email: studentData.parent_email,
        isMinor
      })
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) {
        Alert.alert('Validation', 'Please fix the errors below')
        return
      }

        const studentFormData=new FormData()
        studentFormData.append('fullname',studentData.fullname)
        studentFormData.append('email',studentData.email)
        studentFormData.append('password',studentData.password)
        studentFormData.append('username',studentData.username)
        if(studentData.date_of_birth) {
            studentFormData.append('date_of_birth',studentData.date_of_birth)
        }
        studentFormData.append('interseted_categories',studentData.interseted_categories)
        if(isMinor && studentData.parent_email.trim()) {
            studentFormData.append('parent_email', studentData.parent_email.trim())
        }
        if(isMinor && studentData.parent_name.trim()) {
            studentFormData.append('parent_name', studentData.parent_name.trim())
        }

      setLoading(true)
        try{
          const response = await axios.post(baseUrl + ENDPOINTS.STUDENT_REGISTER,studentFormData)
          setStudentData({
            'fullname':'',
            'email':'',
            'password':'',
            'username':'',
            'date_of_birth':'',
            'interseted_categories':'',
            'parent_email':'',
            'parent_name':'',
            'status':'success'
          })
          if(response.status==200 || response.status==201){
            const isMinorReg = response.data?.parent_required === true
            Alert.alert(
              'Registration Successful',
              isMinorReg
                ? 'Registered! A consent email has been sent to your parent/guardian.'
                : 'Registered! Please verify your email.'
            )
          }
          let tID = setTimeout(function () {
            navigation.navigate('StudentLogin')
            clearTimeout(tID)
          }, 2500)
        }catch(error){
            console.log(error)
        setStudentData((prev)=>({ ...prev, 'status':'error' }))
      } finally {
        setLoading(false)
        }
    }

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
                    <Text style={styles.headerIcon}>👤</Text>
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Student Registration</Text>
                    <Text style={styles.cardSubtitle}>Complete your profile to continue</Text>
                  </View>
                </View>

                {studentData.status === 'success' && (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>✓ Registered Successfully</Text>
                  </View>
                )}
                {studentData.status === 'error' && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠ Something wrong happened</Text>
                  </View>
                )}

                <View style={styles.formFields}>
                  <View>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('fullname', text)}
                      value={studentData.fullname}
                      placeholder="e.g., Maya Chen, Alex Patel"
                      style={[styles.input, fieldErrors.fullname ? styles.inputError : styles.inputNormal]}
                    />
                    <FieldError error={fieldErrors.fullname} />
                  </View>

                  <View>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('email', text)}
                      value={studentData.email}
                      placeholder="your.email@kannari.com"
                      style={[styles.input, fieldErrors.email ? styles.inputError : styles.inputNormal]}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <FieldError error={fieldErrors.email} />
                  </View>

                  <View>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('username', text)}
                      value={studentData.username}
                      placeholder="e.g., harmonymaster, melodylover"
                      style={[styles.input, fieldErrors.username ? styles.inputError : styles.inputNormal]}
                      autoCapitalize="none"
                    />
                    <FieldError error={fieldErrors.username} />
                  </View>

                  <View>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('password', text)}
                      value={studentData.password}
                      placeholder="Create a strong password (min. 8 characters)"
                      style={[styles.input, fieldErrors.password ? styles.inputError : styles.inputNormal]}
                      secureTextEntry
                    />
                    <FieldError error={fieldErrors.password} />
                  </View>

                  <View>
                    <Text style={styles.label}>Date of Birth</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('date_of_birth', text)}
                      value={studentData.date_of_birth}
                      placeholder="YYYY-MM-DD"
                      style={[styles.input, fieldErrors.date_of_birth ? styles.inputError : styles.inputNormal]}
                    />
                    <FieldError error={fieldErrors.date_of_birth} />
                    <Text style={styles.helperText}>
                      Required for child safety compliance. Students under 18 need parental consent for certain features.
                    </Text>
                  </View>

                  {isMinor && (
                    <>
                      <View style={styles.minorNotice}>
                        <View style={styles.minorIconCircle}>
                          <Text style={styles.minorIcon}>!</Text>
                        </View>
                        <View style={styles.minorNoticeTextWrap}>
                          <Text style={styles.minorTitle}>Under 18 — Parent/Guardian Required</Text>
                          <Text style={styles.minorDescription}>
                            Since you are under 18, a parent or guardian email is required. They will receive a verification email and must approve your account before you can access messaging and live session features.
                          </Text>
                        </View>
                      </View>

                      <View>
                        <Text style={styles.label}>Parent/Guardian Name <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput
                          onChangeText={(text) => handleChange('parent_name', text)}
                          value={studentData.parent_name}
                          placeholder="e.g., Sarah Chen"
                          style={[styles.input, styles.inputNormal]}
                        />
                      </View>

                      <View>
                        <Text style={styles.label}>Parent/Guardian Email <Text style={styles.required}>*</Text></Text>
                        <TextInput
                          onChangeText={(text) => handleChange('parent_email', text)}
                          value={studentData.parent_email}
                          placeholder="parent@email.com"
                          style={[
                            styles.input,
                            styles.parentEmailInput,
                            fieldErrors.parent_email ? styles.inputError : (studentData.parent_email.trim() ? styles.inputNormal : styles.inputWarning),
                          ]}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                        <FieldError error={fieldErrors.parent_email} />
                        <Text style={styles.parentHelp}>
                          Your parent/guardian will receive a consent email to verify and approve your account.
                        </Text>
                      </View>
                    </>
                  )}

                  <View>
                    <Text style={styles.label}>Interests</Text>
                    <TextInput
                      onChangeText={(text) => handleChange('interseted_categories', text)}
                      value={studentData.interseted_categories}
                      placeholder="e.g., Piano, Violin, Vocals, Jazz, Classical, Music Composition, Folk"
                      style={[styles.input, styles.textArea]}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    <Text style={styles.helperText}>Eg: Piano, Violin, Vocals, Jazz, Classical etc.,</Text>
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
                    onPress={() => navigation.navigate('StudentLogin')}
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
  inputWarning: {
    borderColor: '#fbbf24',
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
  },
  minorNotice: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  minorIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minorIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  minorNoticeTextWrap: {
    flex: 1,
  },
  minorTitle: {
    marginBottom: 4,
    fontWeight: '600',
    color: '#92400e',
    fontSize: 14,
  },
  minorDescription: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 20,
  },
  optional: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  required: {
    color: '#dc2626',
    fontWeight: '600',
  },
  parentEmailInput: {
    backgroundColor: '#fffbeb',
  },
  parentHelp: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 6,
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

export default Register
