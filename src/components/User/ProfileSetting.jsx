import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { useNavigation } from '@react-navigation/native';
import ChangePassword from './ChangePassword';
import LoadingSpinner from '../shared/LoadingSpinner';
import { API_BASE_URL } from '../../config';
import { validateStudentProfileForm, FieldError } from '../../utils/formValidation';

const baseUrl = API_BASE_URL;

const RELATIONSHIPS = ['mother', 'father', 'guardian', 'other'];

const ProfileSetting = () => {
    const navigation = useNavigation();
    const navigateToStudentLogin = () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
            parentNav.navigate('Auth', { screen: 'StudentLogin' });
            return;
        }
        navigation.navigate('StudentLogin');
    };

    const [studentId, setStudentId] = useState(null);
    const [studentLoginStatus, setStudentLoginStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});

    const [studentData, setStudentData] = useState({
        fullname: '',
        email: '',
        username: '',
        interseted_categories: '',
        date_of_birth: '',
        profile_img: '',
        p_img: null,
    });

    const [parentLinkForm, setParentLinkForm] = useState({
        parent_fullname: '',
        parent_email: '',
        parent_mobile_no: '',
        relationship: 'guardian',
        authorization_mode: 'pre_authorized',
    });

    const [consentStatus, setConsentStatus] = useState(null);
    const [consentLoading, setConsentLoading] = useState(false);
    const [resendingEmail, setResendingEmail] = useState(false);
    const [editingParent, setEditingParent] = useState(false);

    useEffect(() => {
        const loadAuthData = async () => {
            try {
                const storedStudentId = await AsyncStorage.getItem('studentId');
                const storedLoginStatus = await AsyncStorage.getItem('studentLoginStatus');
                setStudentId(storedStudentId);
                setStudentLoginStatus(storedLoginStatus);
            } catch (error) {
                console.log('Error loading auth data:', error);
                setLoading(false);
            }
        };

        loadAuthData();
    }, []);

    useEffect(() => {
        if (studentLoginStatus === null) return;
        if (studentLoginStatus !== 'true') {
            navigateToStudentLogin();
        }
    }, [studentLoginStatus]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!studentId || studentLoginStatus !== 'true') {
                if (studentLoginStatus !== null) setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`${baseUrl}/student/${studentId}`);
                setStudentData((prev) => ({
                    ...prev,
                    fullname: res.data?.fullname || '',
                    email: res.data?.email || '',
                    username: res.data?.username || '',
                    interseted_categories: res.data?.interseted_categories || '',
                    date_of_birth: res.data?.date_of_birth || '',
                    profile_img: res.data?.profile_img || '',
                    p_img: null,
                }));
            } catch (error) {
                console.log('Error fetching profile:', error);
            }
            setLoading(false);
        };

        fetchProfile();
    }, [studentId, studentLoginStatus]);

    const fetchConsentStatus = async (id = studentId) => {
        if (!id) return;

        setConsentLoading(true);
        try {
            const res = await axios.get(`${baseUrl}/student/${id}/parent/status/`);
            if (res.data?.bool) {
                setConsentStatus(res.data);
                if (res.data.has_link) {
                    setParentLinkForm((prev) => ({
                        ...prev,
                        parent_fullname: res.data.parent_name || '',
                        parent_email: res.data.parent_email || '',
                        relationship: res.data.relationship || 'guardian',
                    }));
                }
            } else {
                setConsentStatus(null);
            }
        } catch {
            setConsentStatus(null);
        } finally {
            setConsentLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) {
            fetchConsentStatus(studentId);
        }
    }, [studentId]);

    const updateStudentField = (field, value) => {
        setStudentData((prev) => ({ ...prev, [field]: value }));
    };

    const updateParentField = (field, value) => {
        setParentLinkForm((prev) => ({ ...prev, [field]: value }));
    };

    const pickProfileImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission Required', 'Please allow media access to pick a profile image.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.length) return;
            const asset = result.assets[0];
            const filename = asset.fileName || `profile-${Date.now()}.jpg`;

            updateStudentField('p_img', {
                uri: asset.uri,
                name: filename,
                type: asset.mimeType || 'image/jpeg',
            });
        } catch (error) {
            console.log('Error picking image:', error);
            Alert.alert('Failed', 'Could not select image.');
        }
    };

    const submitForm = async () => {
        const errors = validateStudentProfileForm({
            fullname: studentData.fullname,
            email: studentData.email,
        });

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            Alert.alert('Validation', 'Please fix the errors below.');
            return;
        }

        if (!studentId) return;

        const studentFormData = new FormData();
        studentFormData.append('fullname', studentData.fullname || '');
        studentFormData.append('email', studentData.email || '');
        studentFormData.append('username', studentData.username || '');
        studentFormData.append('interseted_categories', studentData.interseted_categories || '');
        studentFormData.append('date_of_birth', studentData.date_of_birth || '');

        if (studentData.p_img?.uri) {
            studentFormData.append('profile_img', studentData.p_img);
        }

        try {
            const response = await axios.put(`${baseUrl}/student/${studentId}/`, studentFormData, {
                headers: { 'content-type': 'multipart/form-data' },
            });

            if (response.status === 200) {
                Alert.alert('Success', 'Profile updated successfully.');
                setStudentData((prev) => ({
                    ...prev,
                    profile_img: response.data?.profile_img || prev.profile_img,
                    p_img: null,
                }));
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Failed', 'Could not update profile.');
        }
    };

    const submitParentLinkRequest = async () => {
        if (!studentId) return;

        try {
            const payload = new FormData();
            payload.append('parent_fullname', parentLinkForm.parent_fullname || '');
            payload.append('parent_email', parentLinkForm.parent_email || '');
            payload.append('parent_mobile_no', parentLinkForm.parent_mobile_no || '');
            payload.append('relationship', parentLinkForm.relationship || 'guardian');
            payload.append('authorization_mode', parentLinkForm.authorization_mode || 'pre_authorized');

            const response = await axios.post(`${baseUrl}/student/${studentId}/parent/request-link/`, payload);
            if (response.data?.bool) {
                Alert.alert(
                    'Consent Email Sent!',
                    response.data?.email_sent
                        ? 'A consent request email has been sent to your parent/guardian. They must approve before you can join live sessions.'
                        : response.data?.message || 'Parent link requested. Ask your parent to check their email.'
                );
                fetchConsentStatus();
            }
        } catch (error) {
            Alert.alert('Request Failed', error.response?.data?.message || 'Could not submit parent link request.');
        }
    };

    const resendConsentEmail = async () => {
        if (!studentId) return;

        setResendingEmail(true);
        try {
            const res = await axios.post(`${baseUrl}/student/${studentId}/parent/resend-email/`);
            Alert.alert(res.data?.bool ? 'Email Resent!' : 'Could not resend', res.data?.message || '');
        } catch (error) {
            Alert.alert('Failed', error.response?.data?.message || 'Could not resend consent email.');
        } finally {
            setResendingEmail(false);
        }
    };

    const getConsentStatusConfig = (status) => {
        if (status === 'approved') {
            return { backgroundColor: '#e8f5e9', borderColor: '#a5d6a7', icon: 'check-circle-fill', title: 'Parent Consent Approved' };
        }
        if (status === 'denied' || status === 'revoked') {
            return { backgroundColor: '#ffebee', borderColor: '#ef9a9a', icon: 'x-circle-fill', title: 'Parent Consent Denied' };
        }
        return { backgroundColor: '#fff8e1', borderColor: '#ffe082', icon: 'clock-fill', title: 'Awaiting Parent Approval' };
    };

    const shouldShowRequestForm =
        (!consentStatus ||
            !consentStatus.has_link ||
            consentStatus.link_status === 'denied' ||
            consentStatus.link_status === 'revoked' ||
            (consentStatus.link_status === 'pending' && editingParent)) &&
        !consentLoading &&
        (consentStatus?.link_status !== 'revoked' || editingParent) &&
        (consentStatus?.link_status !== 'denied' || editingParent);

    if (loading) {
        return (
            <LoadingSpinner size="lg" text="Loading your profile..." />
        );
    }

    if (studentLoginStatus !== 'true') {
        return null;
    }

    const profileImageUri = studentData.p_img?.uri || studentData.profile_img;

    return (

                <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
                    <View style={styles.headerWrap}>
                        <View style={styles.headerTitleRow}>
                            <Bootstrap name="person-badge" size={22} color="#3b82f6" />
                            <Text style={styles.headerTitle}>Profile Settings</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>Manage your personal information and preferences</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardTitleRow}>
                            <Bootstrap name="person-circle" size={18} color="#3b82f6" />
                            <Text style={styles.cardTitle}>Personal Information</Text>
                        </View>

                        <View style={styles.profileImageSection}>
                            <View style={styles.profileImageWrapper}>
                                {profileImageUri ? (
                                    <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                                ) : (
                                    <View style={styles.profileImagePlaceholder}>
                                        <Bootstrap name="person" size={44} color="#ffffff" />
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity style={styles.pickImageBtn} onPress={pickProfileImage}>
                                <Bootstrap name="image" size={14} color="#ffffff" />
                                <Text style={styles.pickImageBtnText}>Choose Image</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                value={studentData.fullname}
                                onChangeText={(value) => updateStudentField('fullname', value)}
                                style={[styles.input, fieldErrors.fullname && styles.inputError]}
                            />
                            <FieldError error={fieldErrors.fullname} />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={studentData.email}
                                onChangeText={(value) => updateStudentField('email', value)}
                                style={[styles.input, fieldErrors.email && styles.inputError]}
                            />
                            <FieldError error={fieldErrors.email} />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                autoCapitalize="none"
                                value={studentData.username}
                                onChangeText={(value) => updateStudentField('username', value)}
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Interested Genres</Text>
                            <TextInput
                                multiline
                                value={studentData.interseted_categories}
                                onChangeText={(value) => updateStudentField('interseted_categories', value)}
                                placeholder="Enter your favorite genres (comma separated)"
                                style={[styles.input, styles.textarea]}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
                            <TextInput
                                value={studentData.date_of_birth || ''}
                                onChangeText={(value) => updateStudentField('date_of_birth', value)}
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                            />
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={submitForm}>
                            <Bootstrap name="check-lg" size={14} color="#ffffff" />
                            <Text style={styles.submitBtnText}>Update Profile</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardTitleRow}>
                            <Bootstrap name="shield-lock" size={18} color="#3b82f6" />
                            <Text style={styles.cardTitle}>Parent Consent Setup (for minors)</Text>
                        </View>

                        <Text style={styles.infoText}>
                            If you are under 18, submit your parent/guardian details. They will receive an email to approve your live sessions.
                        </Text>

                        {consentLoading && (
                            <View style={styles.loadingStatusWrap}>
                                <ActivityIndicator size="small" color="#888" />
                                <Text style={styles.loadingStatusText}>Loading consent status...</Text>
                            </View>
                        )}

                        {consentStatus && consentStatus.has_link && !consentLoading && (
                            <View
                                style={[
                                    styles.statusCard,
                                    {
                                        backgroundColor: getConsentStatusConfig(consentStatus.link_status).backgroundColor,
                                        borderColor: getConsentStatusConfig(consentStatus.link_status).borderColor,
                                    },
                                ]}
                            >
                                <View style={styles.statusHeaderRow}>
                                    <Bootstrap
                                        name={getConsentStatusConfig(consentStatus.link_status).icon}
                                        size={18}
                                        color="#374151"
                                    />
                                    <Text style={styles.statusTitle}>{getConsentStatusConfig(consentStatus.link_status).title}</Text>
                                </View>

                                <View style={styles.statusDetailsWrap}>
                                    <Text style={styles.statusDetail}>Parent: {consentStatus.parent_name}</Text>
                                    <Text style={styles.statusDetail}>Email: {consentStatus.parent_email}</Text>
                                    <Text style={styles.statusDetail}>Relationship: {consentStatus.relationship}</Text>
                                    {!!consentStatus.live_sessions_status && (
                                        <Text style={styles.statusDetail}>Live Sessions: {consentStatus.live_sessions_status}</Text>
                                    )}
                                    {!!consentStatus.authorization_mode && (
                                        <Text style={styles.statusDetail}>
                                            Mode: {consentStatus.authorization_mode === 'pre_authorized' ? 'Pre-authorized' : 'Per-session approval'}
                                        </Text>
                                    )}
                                </View>

                                {consentStatus.link_status === 'pending' && (
                                    <View style={styles.statusActionsWrap}>
                                        <TouchableOpacity
                                            onPress={resendConsentEmail}
                                            disabled={resendingEmail}
                                            style={[styles.submitBtn, { backgroundColor: '#5c6bc0', flex: 1 }]}
                                        >
                                            {resendingEmail ? (
                                                <ActivityIndicator size="small" color="#ffffff" />
                                            ) : (
                                                <>
                                                    <Bootstrap name="envelope-arrow-up" size={13} color="#ffffff" />
                                                    <Text style={styles.submitBtnText}>Resend Consent Email</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => setEditingParent(!editingParent)}
                                            style={[styles.submitBtn, { backgroundColor: editingParent ? '#78909c' : '#ff8f00', flex: 1 }]}
                                        >
                                            <Bootstrap name={editingParent ? 'x-lg' : 'pencil-square'} size={13} color="#ffffff" />
                                            <Text style={styles.submitBtnText}>{editingParent ? 'Cancel Editing' : 'Edit Parent Details'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {(consentStatus.link_status === 'denied' || consentStatus.link_status === 'revoked') && (
                                    <View style={{ marginTop: 10 }}>
                                        <Text style={styles.deniedHint}>
                                            Your parent/guardian declined consent. You can update parent details and send a new consent request below.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setEditingParent(true)}
                                            style={[styles.submitBtn, { backgroundColor: '#e65100' }]}
                                        >
                                            <Bootstrap name="arrow-repeat" size={13} color="#ffffff" />
                                            <Text style={styles.submitBtnText}>Request Consent Again</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {shouldShowRequestForm && (
                            <>
                                {editingParent && (consentStatus?.link_status === 'pending' || consentStatus?.link_status === 'revoked') && (
                                    <View
                                        style={[
                                            styles.editHint,
                                            {
                                                backgroundColor: consentStatus?.link_status === 'revoked' ? '#fce4ec' : '#fff3e0',
                                                borderColor: consentStatus?.link_status === 'revoked' ? '#ef9a9a' : '#ffe0b2',
                                            },
                                        ]}
                                    >
                                        <Text style={styles.editHintText}>
                                            {consentStatus?.link_status === 'revoked'
                                                ? 'Your previous consent request was denied. Update parent details if needed and submit to send a new consent email.'
                                                : 'Update your parent/guardian details below. A new consent email will be sent to the updated email address.'}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Parent/Guardian Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={parentLinkForm.parent_fullname}
                                        onChangeText={(value) => updateParentField('parent_fullname', value)}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Parent Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={parentLinkForm.parent_email}
                                        onChangeText={(value) => updateParentField('parent_email', value)}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Parent Mobile</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={parentLinkForm.parent_mobile_no}
                                        onChangeText={(value) => updateParentField('parent_mobile_no', value)}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Relationship</Text>
                                    <View style={styles.relationshipWrap}>
                                        {RELATIONSHIPS.map((rel) => (
                                            <TouchableOpacity
                                                key={rel}
                                                onPress={() => updateParentField('relationship', rel)}
                                                style={[
                                                    styles.relationshipChip,
                                                    parentLinkForm.relationship === rel && styles.relationshipChipActive,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.relationshipChipText,
                                                        parentLinkForm.relationship === rel && styles.relationshipChipTextActive,
                                                    ]}
                                                >
                                                    {rel.charAt(0).toUpperCase() + rel.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        submitParentLinkRequest();
                                        setEditingParent(false);
                                    }}
                                    style={styles.submitBtn}
                                >
                                    <Bootstrap name={editingParent ? 'arrow-repeat' : 'send-check'} size={13} color="#ffffff" />
                                    <Text style={styles.submitBtnText}>
                                        {editingParent ? 'Update & Resend Consent Email' : 'Send Consent Request to Parent'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    <View style={styles.card}>
                        <ChangePassword />
                    </View>
                </ScrollView>
    );
};

const styles = StyleSheet.create({
    pageWrap: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f0f9ff',
    },
    contentWrap: {
        flex: 1,
    },
    sidebarOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 999,
    },
    mobileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: '#dbeafe',
    },
    sidebarToggle: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59,130,246,0.08)',
        marginRight: 10,
    },
    logoMini: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563eb',
    },
    mainScroll: {
        flex: 1,
    },
    mainContent: {
        padding: 16,
        paddingBottom: 24,
        gap: 14,
    },
    headerWrap: {
        marginBottom: 2,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        color: '#1a1a1a',
        fontWeight: '800',
        fontSize: 28,
    },
    headerSubtitle: {
        marginTop: 6,
        color: '#6b7280',
        fontSize: 14,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.08)',
        padding: 16,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a1a',
        flex: 1,
    },
    profileImageSection: {
        alignItems: 'center',
        marginBottom: 14,
    },
    profileImageWrapper: {
        width: 120,
        height: 120,
        marginBottom: 10,
        borderRadius: 60,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        resizeMode: 'cover',
    },
    profileImagePlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
    },
    pickImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#06b6d4',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    pickImageBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 12,
    },
    label: {
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 6,
        fontSize: 14,
    },
    input: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.15)',
        borderRadius: 10,
        fontSize: 14,
        color: '#1f2937',
        backgroundColor: 'rgba(59, 130, 246, 0.02)',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    textarea: {
        minHeight: 90,
    },
    submitBtn: {
        width: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 44,
    },
    submitBtnText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
    infoText: {
        color: '#6b7280',
        fontSize: 14,
        marginBottom: 10,
    },
    loadingStatusWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    loadingStatusText: {
        color: '#888',
        fontSize: 14,
    },
    statusCard: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
    },
    statusHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statusTitle: {
        fontWeight: '700',
        color: '#1f2937',
        fontSize: 15,
        flex: 1,
    },
    statusDetailsWrap: {
        gap: 4,
    },
    statusDetail: {
        fontSize: 13,
        color: '#555',
    },
    statusActionsWrap: {
        marginTop: 10,
        flexDirection: 'row',
        gap: 8,
    },
    deniedHint: {
        fontSize: 13,
        color: '#c62828',
        marginBottom: 10,
    },
    editHint: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    editHintText: {
        fontSize: 13,
        color: '#b45309',
    },
    relationshipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    relationshipChip: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    relationshipChipActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    relationshipChipText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    relationshipChipTextActive: {
        color: '#1d4ed8',
    },
});

export default ProfileSetting;
