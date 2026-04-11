import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import * as DocumentPicker from 'expo-document-picker'

import { API_BASE_URL } from '../../config';
import { validateTeacherProfileForm } from '../../utils/formValidation';

const baseUrl = API_BASE_URL;

const TeacherProfileSetting = () => {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});
    const [teacherId, setTeacherId] = useState(null)
    const [teacherLoginStatus, setTeacherLoginStatus] = useState(null)

    const [teacherData,setTeacherData]=useState({
        'full_name':'',
        'email':'',
        'qualification':'',
        'mobile_no':'',
        'skills':'',
        'profile_img':'',
        'p_img':'',
        'status':'',
        'face_url':'',
        'insta_url':'',
        'twit_url':'',
        'web_url':'',
        'you_url':'',
    });

    const [verificationData, setVerificationData] = useState(null);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [verificationForm, setVerificationForm] = useState({
      document_type: 'government_id',
      id_document: null,
      provider_name: '',
      reference_number: '',
      confirmation_email: '',
      evidence_file: null,
      signature_text: ''
    });

    useEffect(() => {
      const bootstrap = async () => {
        try {
          const id = await AsyncStorage.getItem('teacherId')
          const status = await AsyncStorage.getItem('teacherLoginStatus')
          setTeacherId(id)
          setTeacherLoginStatus(status)
        } catch (error) {
          console.log(error)
        }
      }

      bootstrap()
    }, [])

    useEffect(() => {
      if (teacherLoginStatus !== null && teacherLoginStatus !== 'true') {
        navigation.navigate('TeacherLogin')
      }
    }, [teacherLoginStatus, navigation])

    useEffect(()=>{
      if (!teacherId) return

      try{
          axios.get(baseUrl+'/teacher/'+teacherId)
          .then((res)=>{
              setTeacherData({
              full_name:res.data.full_name,
              email:res.data.email,
              qualification:res.data.qualification,
              mobile_no:res.data.mobile_no,
              skills:res.data.skills,
              profile_img:res.data.profile_img,
              p_img:'',
              face_url:res.data.face_url || '',
              insta_url:res.data.insta_url || '',
              twit_url:res.data.twit_url || '',
              web_url:res.data.web_url || '',
              you_url:res.data.you_url || '',
            });
            setLoading(false);
          })
          .catch((error) => {
              console.log(error);
              setLoading(false);
          });
      }catch(error){
          console.log(error);
          setLoading(false);
      }
    },[teacherId]);

    const fetchVerificationStatus = async () => {
      if (!teacherId) return;
      setVerificationLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/teacher/${teacherId}/verification/status/`);
        setVerificationData(res.data?.verification || null);
      } catch (error) {
        console.log('Error fetching verification status:', error);
      } finally {
        setVerificationLoading(false);
      }
    };

    useEffect(() => {
      if (!teacherId) return
      fetchVerificationStatus();
    }, [teacherId]);

    const handleChange=(name, value)=>{
      setTeacherData({
          ...teacherData,
          [name]:value
      });
    }

    const pickAnyFile = async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: true,
      })
      if (result.canceled) return null
      const file = result.assets?.[0]
      if (!file) return null
      return {
        uri: file.uri,
        name: file.name || 'file',
        type: file.mimeType || 'application/octet-stream',
      }
    }

    const pickImageFile = async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        multiple: false,
        copyToCacheDirectory: true,
      })
      if (result.canceled) return null
      const file = result.assets?.[0]
      if (!file) return null
      return {
        uri: file.uri,
        name: file.name || 'image.jpg',
        type: file.mimeType || 'image/jpeg',
      }
    }

    const submitForm=()=>{
        const errors = validateTeacherProfileForm({
            full_name: teacherData.full_name,
            email: teacherData.email
        });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            Alert.alert('Warning', 'Please fix the errors below')
            return;
        }

        const teacherFormData=new FormData();
        teacherFormData.append('full_name',teacherData.full_name || '')
        teacherFormData.append('email',teacherData.email || '')
        teacherFormData.append('qualification',teacherData.qualification || '')
        teacherFormData.append('mobile_no',teacherData.mobile_no || '')
        teacherFormData.append('skills',teacherData.skills || '')
        teacherFormData.append('face_url',teacherData.face_url || '')
        teacherFormData.append('insta_url',teacherData.insta_url || '')
        teacherFormData.append('twit_url',teacherData.twit_url || '')
        teacherFormData.append('web_url',teacherData.web_url || '')
        teacherFormData.append('you_url',teacherData.you_url || '')

        if(teacherData.p_img && teacherData.p_img !== ''){
            teacherFormData.append('profile_img', teacherData.p_img);
        }

        try{
            axios.put(baseUrl+'/teacher/'+teacherId+'/',teacherFormData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            }).then(async(response)=>{
                if(response.status===200){
                    if(response.data.profile_img){
                        await AsyncStorage.setItem('teacherProfileImg', response.data.profile_img);
                    }
                    Alert.alert('Success', 'Profile Updated Successfully')
                }
            })
        }catch(error){
            console.log(error);
            setTeacherData({'status':'error'})
        }
    }

    const startVerification = async () => {
      try {
        const res = await axios.post(`${baseUrl}/teacher/${teacherId}/verification/start/`);
        Alert.alert('Success', res.data?.message || 'Verification started')
        fetchVerificationStatus();
      } catch (error) {
        Alert.alert('Failed', error.response?.data?.message || 'Unable to start verification.')
      }
    };

    const uploadIdDocument = async () => {
      if (!verificationForm.id_document) {
        Alert.alert('Warning', 'Please select an ID document file.')
        return;
      }
      try {
        const formData = new FormData();
        formData.append('document_type', verificationForm.document_type);
        formData.append('id_document', verificationForm.id_document);
        const res = await axios.post(`${baseUrl}/teacher/${teacherId}/verification/upload-id/`, formData);
        Alert.alert('Success', res.data?.message || 'ID submitted')
        setVerificationForm(prev => ({ ...prev, id_document: null }));
        fetchVerificationStatus();
      } catch (error) {
        Alert.alert('Failed to upload ID', error.response?.data?.message || 'Please try again.')
      }
    };

    const submitBackgroundCheck = async () => {
      try {
        const formData = new FormData();
        formData.append('provider_name', verificationForm.provider_name || '');
        formData.append('reference_number', verificationForm.reference_number || '');
        formData.append('confirmation_email', verificationForm.confirmation_email || '');
        if (verificationForm.evidence_file) {
          formData.append('evidence_file', verificationForm.evidence_file);
        }
        const res = await axios.post(`${baseUrl}/teacher/${teacherId}/verification/background-check/`, formData);
        Alert.alert('Success', res.data?.message || 'Background details submitted')
        fetchVerificationStatus();
      } catch (error) {
        Alert.alert('Failed to submit background check', error.response?.data?.message || 'Please try again.')
      }
    };

    const signAgreement = async (agreementType) => {
      const signatureText = (verificationForm.signature_text || '').trim();
      if (!signatureText) {
        Alert.alert('Warning', 'Please enter signature text first.')
        return;
      }
      try {
        const payload = new FormData();
        payload.append('agreement_type', agreementType);
        payload.append('signature_text', signatureText);
        const res = await axios.post(`${baseUrl}/teacher/${teacherId}/verification/sign-agreement/`, payload);
        Alert.alert('Success', res.data?.message || 'Agreement submitted')
        fetchVerificationStatus();
      } catch (error) {
        Alert.alert('Failed to sign agreement', error.response?.data?.message || 'Please try again.')
      }
    };

    if (loading) {
        return (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size='large' color='#667eea' />
            <Text style={styles.loaderText}>Loading profile settings...</Text>
          </View>
        )
    }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderIcon}>👤</Text>
          <Text style={styles.cardHeaderTitle}>Profile Settings</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.verifyBox}>
            <View style={styles.verifyHeaderRow}>
              <Text style={styles.verifyTitle}>Child Safety Verification</Text>
              <TouchableOpacity style={styles.outlineBtn} onPress={fetchVerificationStatus}>
                <Text style={styles.outlineBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {verificationLoading ? (
              <Text style={styles.verifyLoadingText}>Loading verification status...</Text>
            ) : (
              <>
                <View style={styles.verifyStatusActionsWrap}>
                  <View style={styles.badgeWrap}>
                    <Text style={styles.badge}>Overall: {verificationData?.overall_status || 'not_started'}</Text>
                    <Text style={styles.badge}>ID: {verificationData?.id_verification_status || 'pending'}</Text>
                    <Text style={styles.badge}>Background: {verificationData?.background_check_status || 'pending'}</Text>
                    <Text style={styles.badge}>Agreements: {verificationData?.agreement_status || 'pending'}</Text>
                    <Text style={styles.badge}>{verificationData?.can_teach_minors ? 'Can Teach Minors' : 'Minor Teaching Blocked'}</Text>
                  </View>

                  <TouchableOpacity style={styles.primarySmallBtn} onPress={startVerification}>
                    <Text style={styles.primarySmallBtnText}>Start / Re-submit Verification</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionSubheading}>ID Document</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={verificationForm.document_type}
                    onValueChange={(value) => setVerificationForm(prev => ({ ...prev, document_type: value }))}
                  >
                    <Picker.Item label='Government ID' value='government_id' />
                    <Picker.Item label='Passport' value='passport' />
                    <Picker.Item label='Driving License' value='driving_license' />
                  </Picker>
                </View>
                <TouchableOpacity
                  style={styles.filePickerBtn}
                  onPress={async () => {
                    const file = await pickAnyFile()
                    if (file) setVerificationForm(prev => ({ ...prev, id_document: file }))
                  }}
                >
                  <Text style={styles.filePickerText}>{verificationForm.id_document?.name || 'Upload ID Document'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineBtn} onPress={uploadIdDocument}>
                  <Text style={styles.outlineBtnText}>Submit ID for Review</Text>
                </TouchableOpacity>

                <Text style={styles.sectionSubheading}>Background Check</Text>
                <TextInput
                  style={styles.input}
                  placeholder='Background Provider'
                  value={verificationForm.provider_name}
                  onChangeText={(text) => setVerificationForm(prev => ({ ...prev, provider_name: text }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder='Reference Number'
                  value={verificationForm.reference_number}
                  onChangeText={(text) => setVerificationForm(prev => ({ ...prev, reference_number: text }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder='Confirmation Email'
                  keyboardType='email-address'
                  value={verificationForm.confirmation_email}
                  onChangeText={(text) => setVerificationForm(prev => ({ ...prev, confirmation_email: text }))}
                />
                <TouchableOpacity
                  style={styles.filePickerBtn}
                  onPress={async () => {
                    const file = await pickAnyFile()
                    if (file) setVerificationForm(prev => ({ ...prev, evidence_file: file }))
                  }}
                >
                  <Text style={styles.filePickerText}>{verificationForm.evidence_file?.name || 'Background Evidence (optional)'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineBtn} onPress={submitBackgroundCheck}>
                  <Text style={styles.outlineBtnText}>Submit Background Check</Text>
                </TouchableOpacity>

                <Text style={styles.sectionSubheading}>Agreements</Text>
                <TextInput
                  style={styles.input}
                  placeholder='Type your full name as signature'
                  value={verificationForm.signature_text}
                  onChangeText={(text) => setVerificationForm(prev => ({ ...prev, signature_text: text }))}
                />
                <View style={styles.agreementBtnsWrap}>
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => signAgreement('child_safety')}>
                    <Text style={styles.outlineBtnText}>Sign Child Safety</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => signAgreement('code_of_conduct')}>
                    <Text style={styles.outlineBtnText}>Sign Code of Conduct</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => signAgreement('background_check_consent')}>
                    <Text style={styles.outlineBtnText}>Sign Background Consent</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <Text style={styles.sectionTitle}>Profile Information</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={teacherData.full_name}
            onChangeText={(text) => handleChange('full_name', text)}
            style={[styles.input, fieldErrors.full_name ? styles.inputError : null]}
          />
          {!!fieldErrors.full_name && <Text style={styles.errorLabel}>{fieldErrors.full_name}</Text>}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={teacherData.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType='email-address'
            style={[styles.input, fieldErrors.email ? styles.inputError : null]}
          />
          {!!fieldErrors.email && <Text style={styles.errorLabel}>{fieldErrors.email}</Text>}

          <Text style={styles.label}>Profile Image</Text>
          <TouchableOpacity
            style={styles.filePickerBtn}
            onPress={async () => {
              const file = await pickImageFile()
              if (file) {
                setTeacherData({
                  ...teacherData,
                  p_img: file,
                })
              }
            }}
          >
            <Text style={styles.filePickerText}>{teacherData.p_img?.name || 'Choose profile image'}</Text>
          </TouchableOpacity>
          {!!teacherData.profile_img && (
            <View style={styles.profilePreviewRow}>
              <Image source={{ uri: teacherData.profile_img }} style={styles.profileImage} />
              <Text style={styles.profilePreviewText}>Current Profile Image</Text>
            </View>
          )}

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            value={teacherData.mobile_no}
            onChangeText={(text) => handleChange('mobile_no', text)}
            keyboardType='phone-pad'
            style={styles.input}
          />

          <Text style={styles.label}>Skills</Text>
          <TextInput
            value={teacherData.skills}
            onChangeText={(text) => handleChange('skills', text)}
            placeholder='List your professional skills...'
            style={[styles.input, styles.textArea]}
            multiline={true}
          />

          <Text style={styles.label}>Qualification</Text>
          <TextInput
            value={teacherData.qualification}
            onChangeText={(text) => handleChange('qualification', text)}
            placeholder='List your qualifications and certifications...'
            style={[styles.input, styles.textArea]}
            multiline={true}
          />

          <Text style={styles.sectionTitle}>Social Accounts</Text>

          <Text style={styles.label}>Facebook Link</Text>
          <TextInput value={teacherData.face_url} onChangeText={(text) => handleChange('face_url', text)} placeholder='https://facebook.com/your-profile' style={styles.input} />

          <Text style={styles.label}>Instagram Link</Text>
          <TextInput value={teacherData.insta_url} onChangeText={(text) => handleChange('insta_url', text)} placeholder='https://instagram.com/your-profile' style={styles.input} />

          <Text style={styles.label}>Twitter Link</Text>
          <TextInput value={teacherData.twit_url} onChangeText={(text) => handleChange('twit_url', text)} placeholder='https://twitter.com/your-profile' style={styles.input} />

          <Text style={styles.label}>Website Link</Text>
          <TextInput value={teacherData.web_url} onChangeText={(text) => handleChange('web_url', text)} placeholder='https://your-website.com' style={styles.input} />

          <Text style={styles.label}>YouTube Link</Text>
          <TextInput value={teacherData.you_url} onChangeText={(text) => handleChange('you_url', text)} placeholder='https://youtube.com/your-channel' style={styles.input} />

          <View style={styles.actionButtonsWrap}>
            <TouchableOpacity onPress={submitForm} style={styles.updateBtn}>
              <Text style={styles.updateBtnText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  loaderWrap: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#667eea',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderIcon: {
    fontSize: 24,
    color: '#fff',
  },
  cardHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    padding: 20,
  },
  verifyBox: {
    marginBottom: 28,
    padding: 16,
    borderWidth: 2,
    borderColor: '#f5f7fa',
    borderRadius: 12,
    backgroundColor: '#fafbff',
  },
  verifyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
    flexWrap: 'wrap',
  },
  verifyTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  verifyLoadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  verifyStatusActionsWrap: {
    marginBottom: 10,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    color: '#374151',
    fontSize: 12,
    overflow: 'hidden',
    marginRight: 8,
    marginBottom: 8,
  },
  sectionSubheading: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  primarySmallBtn: {
    alignSelf: 'stretch',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
  primarySmallBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  outlineBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  outlineBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  agreementBtnsWrap: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#f5f7fa',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorLabel: {
    marginTop: 4,
    color: '#ef4444',
    fontSize: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  filePickerBtn: {
    marginTop: 6,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  filePickerText: {
    color: '#4b5563',
    fontSize: 14,
  },
  profilePreviewRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  profilePreviewText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  pickerWrap: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  actionButtonsWrap: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f5f7fa',
    flexDirection: 'row',
    gap: 12,
  },
  updateBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
    borderRadius: 12,
  },
  updateBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
})

export default TeacherProfileSetting
