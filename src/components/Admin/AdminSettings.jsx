import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const LANGUAGE_OPTIONS = ['en', 'hi', 'es', 'fr', 'de'];
const TIMEZONE_OPTIONS = ['UTC', 'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London'];

const AdminSettings = () => {
    const [adminId, setAdminId] = useState('');

    const [settings, setSettings] = useState({
        id: null,
        site_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        maintenance_mode: false,
        allow_registration: true,
        default_language: 'en',
        timezone: 'UTC',
    });

    const [admin, setAdmin] = useState({
        full_name: '',
        email: '',
        phone: '',
        role: '',
        profile_img: null,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        initData();
    }, []);

    const initData = async () => {
        try {
            const storedAdminId = await AsyncStorage.getItem('adminId');
            if (!storedAdminId) {
                setErrorMsg('Admin ID not found. Please login again.');
                setLoading(false);
                return;
            }

            setAdminId(storedAdminId);
            await Promise.all([fetchSettings(), fetchAdminProfile(storedAdminId)]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${baseUrl}/get-settings/`);
            setSettings((prev) => ({ ...prev, ...response.data }));
        } catch (error) {
            setErrorMsg('Failed to load system settings.');
        }
    };

    const fetchAdminProfile = async (id) => {
        try {
            const response = await axios.get(`${baseUrl}/admin-user/${id}/`);
            setAdmin({
                ...response.data,
                profile_img: response.data.profile_img || null,
            });
        } catch (error) {
            setErrorMsg('Failed to load profile. Please refresh and try again.');
        }
    };

    const pickProfileImage = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['image/*'],
            multiple: false,
            copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const file = result.assets?.[0];
        if (!file) return;
        setAdmin((prev) => ({
            ...prev,
            profile_img: {
                uri: file.uri,
                name: file.name || 'profile.jpg',
                type: file.mimeType || 'image/jpeg',
            },
        }));
    };

    const updateSettingsField = (name, value) => {
        setSettings((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const updateAdminField = (name, value) => {
        setAdmin((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const updatePasswordField = (name, value) => {
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmitSettings = async () => {
        if (!settings.id) {
            setErrorMsg('Settings record not found.');
            return;
        }
        setSaving(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await axios.put(`${baseUrl}/system-settings/${settings.id}/`, settings);
            setSuccessMsg('Settings saved successfully!');
        } catch (error) {
            setErrorMsg('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleProfileSubmit = async () => {
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        if (!admin.full_name?.trim()) {
            setErrorMsg('Full Name is required');
            setSaving(false);
            return;
        }

        if (!admin.email?.trim()) {
            setErrorMsg('Email is required');
            setSaving(false);
            return;
        }

        const formData = new FormData();
        formData.append('full_name', admin.full_name.trim());
        formData.append('email', admin.email.trim());
        formData.append('phone', admin.phone ? admin.phone.trim() : '');

        if (admin.profile_img && typeof admin.profile_img === 'object' && admin.profile_img.uri) {
            formData.append('profile_img', admin.profile_img);
        }

        try {
            const response = await axios.put(`${baseUrl}/admin-user/${adminId}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data?.profile_img) {
                setAdmin((prev) => ({ ...prev, profile_img: response.data.profile_img }));
            }

            await AsyncStorage.setItem('adminName', admin.full_name.trim());
            setSuccessMsg('Profile updated successfully!');
        } catch (error) {
            if (error.response?.data) {
                const errorData = error.response.data;
                const errorMessage = Object.entries(errorData)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
                setErrorMsg(`Failed to update profile:\n${errorMessage}`);
            } else {
                setErrorMsg('Failed to update profile. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async () => {
        setErrorMsg('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMsg('New passwords do not match!');
            return;
        }

        if ((passwordData.newPassword || '').length < 6) {
            setErrorMsg('Password must be at least 6 characters long!');
            return;
        }

        setSaving(true);
        const formData = new FormData();
        formData.append('password', passwordData.newPassword);

        try {
            await axios.post(`${baseUrl}/admin/change-password/${adminId}/`, formData);
            setSuccessMsg('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setErrorMsg('Failed to change password. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingWrapper}>
                <LoadingSpinner size="lg" text="Loading settings..." />
            </View>
        );
    }

    const profileImageUri =
        typeof admin.profile_img === 'string' ? admin.profile_img : admin.profile_img?.uri || null;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerWrap}>
                    <Text style={styles.title}>Settings & Profile</Text>
                    <Text style={styles.subtitle}>Manage your profile information and system preferences.</Text>
                </View>

                {successMsg ? (
                    <AlertCard type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
                ) : null}
                {errorMsg ? <AlertCard type="error" message={errorMsg} onClose={() => setErrorMsg('')} /> : null}

                <SectionCard title="My Profile">
                    <View style={styles.avatarWrap}>
                        {profileImageUri ? (
                            <Image source={{ uri: profileImageUri }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarPlaceholderText}>👤</Text>
                            </View>
                        )}
                        <Text style={styles.profileName}>{admin.full_name || 'Admin'}</Text>
                        <Text style={styles.profileEmail}>{admin.email || '-'}</Text>
                        <Text style={styles.profileRole}>{(admin.role || 'admin').replace('_', ' ').toUpperCase()}</Text>
                    </View>

                    <Field label="Full Name">
                        <TextInput style={styles.input} value={admin.full_name || ''} onChangeText={(v) => updateAdminField('full_name', v)} />
                    </Field>
                    <Field label="Email">
                        <TextInput
                            style={styles.input}
                            value={admin.email || ''}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={(v) => updateAdminField('email', v)}
                        />
                    </Field>
                    <Field label="Phone">
                        <TextInput style={styles.input} value={admin.phone || ''} onChangeText={(v) => updateAdminField('phone', v)} />
                    </Field>
                    <Field label="Role">
                        <TextInput style={[styles.input, styles.disabledInput]} editable={false} value={(admin.role || '').replace('_', ' ').toUpperCase()} />
                    </Field>

                    <TouchableOpacity style={styles.secondaryBtn} onPress={pickProfileImage}>
                        <Text style={styles.secondaryBtnText}>Choose Profile Image</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleProfileSubmit} disabled={saving}>
                        <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Update Profile'}</Text>
                    </TouchableOpacity>
                </SectionCard>

                <SectionCard title="Change Password">
                    <Field label="Current Password">
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            value={passwordData.currentPassword}
                            onChangeText={(v) => updatePasswordField('currentPassword', v)}
                        />
                    </Field>
                    <Field label="New Password">
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            value={passwordData.newPassword}
                            onChangeText={(v) => updatePasswordField('newPassword', v)}
                        />
                    </Field>
                    <Field label="Confirm Password">
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            value={passwordData.confirmPassword}
                            onChangeText={(v) => updatePasswordField('confirmPassword', v)}
                        />
                    </Field>

                    <TouchableOpacity style={styles.primaryBtn} onPress={handlePasswordSubmit} disabled={saving}>
                        <Text style={styles.primaryBtnText}>{saving ? 'Updating...' : 'Update Password'}</Text>
                    </TouchableOpacity>
                </SectionCard>

                <Text style={styles.sectionTitle}>System Settings</Text>

                <SectionCard title="General Settings">
                    <Field label="Site Name">
                        <TextInput style={styles.input} value={settings.site_name || ''} onChangeText={(v) => updateSettingsField('site_name', v)} />
                    </Field>
                    <Field label="Contact Email">
                        <TextInput
                            style={styles.input}
                            value={settings.contact_email || ''}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={(v) => updateSettingsField('contact_email', v)}
                        />
                    </Field>
                    <Field label="Contact Phone">
                        <TextInput style={styles.input} value={settings.contact_phone || ''} onChangeText={(v) => updateSettingsField('contact_phone', v)} />
                    </Field>
                    <Field label="Address">
                        <TextInput style={styles.input} value={settings.address || ''} onChangeText={(v) => updateSettingsField('address', v)} />
                    </Field>
                </SectionCard>

                <SectionCard title="Localization">
                    <Field label="Default Language">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.optionsRow}>
                                {LANGUAGE_OPTIONS.map((lang) => (
                                    <OptionChip
                                        key={lang}
                                        label={lang.toUpperCase()}
                                        active={settings.default_language === lang}
                                        onPress={() => updateSettingsField('default_language', lang)}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </Field>
                    <Field label="Timezone">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.optionsRow}>
                                {TIMEZONE_OPTIONS.map((zone) => (
                                    <OptionChip
                                        key={zone}
                                        label={zone}
                                        active={settings.timezone === zone}
                                        onPress={() => updateSettingsField('timezone', zone)}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </Field>
                </SectionCard>

                <SectionCard title="System Options">
                    <View style={styles.switchRow}>
                        <View style={styles.switchTextWrap}>
                            <Text style={styles.switchTitle}>Maintenance Mode</Text>
                            <Text style={styles.switchHint}>When enabled, only admins can access the site.</Text>
                        </View>
                        <Switch
                            value={!!settings.maintenance_mode}
                            onValueChange={(v) => updateSettingsField('maintenance_mode', v)}
                        />
                    </View>

                    <View style={styles.switchRow}>
                        <View style={styles.switchTextWrap}>
                            <Text style={styles.switchTitle}>Allow Registration</Text>
                            <Text style={styles.switchHint}>Allow new users to register.</Text>
                        </View>
                        <Switch
                            value={!!settings.allow_registration}
                            onValueChange={(v) => updateSettingsField('allow_registration', v)}
                        />
                    </View>
                </SectionCard>

                <TouchableOpacity style={styles.primaryBtnLarge} onPress={handleSubmitSettings} disabled={saving}>
                    <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const SectionCard = ({ title, children }) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        {children}
    </View>
);

const Field = ({ label, children }) => (
    <View style={styles.fieldWrap}>
        <Text style={styles.label}>{label}</Text>
        {children}
    </View>
);

const OptionChip = ({ label, active, onPress }) => (
    <TouchableOpacity style={[styles.optionChip, active && styles.optionChipActive]} onPress={onPress}>
        <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{label}</Text>
    </TouchableOpacity>
);

const AlertCard = ({ type, message, onClose }) => {
    const isSuccess = type === 'success';
    return (
        <View style={[styles.alertCard, isSuccess ? styles.alertSuccess : styles.alertError]}>
            <Text style={[styles.alertText, isSuccess ? styles.alertTextSuccess : styles.alertTextError]}>{message}</Text>
            <TouchableOpacity onPress={onClose}>
                <Text style={styles.alertDismiss}>Dismiss</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 12, paddingBottom: 30 },
    loadingWrapper: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
    headerWrap: { marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#6b7280' },
    alertCard: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    alertSuccess: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
    alertError: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
    alertText: { fontSize: 12, flex: 1 },
    alertTextSuccess: { color: '#15803d' },
    alertTextError: { color: '#991b1b' },
    alertDismiss: { color: '#374151', fontSize: 12, fontWeight: '700' },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
    avatarWrap: { alignItems: 'center', marginBottom: 12 },
    avatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: '#dbeafe', marginBottom: 8 },
    avatarPlaceholder: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    avatarPlaceholderText: { fontSize: 42 },
    profileName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
    profileEmail: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
    profileRole: {
        backgroundColor: '#2563eb',
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
    },
    fieldWrap: { marginBottom: 10 },
    label: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        fontSize: 13,
        color: '#111827',
        backgroundColor: '#fff',
        paddingVertical: 9,
        paddingHorizontal: 10,
    },
    disabledInput: { backgroundColor: '#f9fafb', color: '#6b7280' },
    secondaryBtn: {
        borderWidth: 1,
        borderColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 9,
        paddingHorizontal: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    secondaryBtnText: { color: '#2563eb', fontSize: 12, fontWeight: '700' },
    primaryBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    primaryBtnLarge: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, marginTop: 2 },
    optionsRow: { flexDirection: 'row', gap: 8 },
    optionChip: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    optionChipActive: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
    optionChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
    optionChipTextActive: { color: '#1d4ed8' },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingVertical: 8,
    },
    switchTextWrap: { flex: 1 },
    switchTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
    switchHint: { fontSize: 12, color: '#6b7280' },
});

export default AdminSettings;
