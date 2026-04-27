import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'

import { API_BASE, ENDPOINTS } from '../../api/endpoints'
import { validateLoginForm, FieldError } from '../../utils/formValidation'
import Header from '../Header'

const baseUrl = API_BASE

const AdminLogin = () => {
    const navigation = useNavigation()
    const { setRole } = useAuth()
    const { width } = useWindowDimensions()
    const insets = useSafeAreaInsets()
    const [adminLoginStatus, setAdminLoginStatus] = useState(null)
    const [adminLoginData, setAdminLoginData] = useState({
        email: '',
        password: ''
    })
    const [errorMsg, setErrorMsg] = useState('')
    const [loading, setLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    const isTablet = width >= 768
    const isSmall = width < 360

    useEffect(() => {
        const loadStatus = async () => {
            const status = await AsyncStorage.getItem('adminLoginStatus')
            setAdminLoginStatus(status)
        }
        loadStatus()
    }, [])

    useEffect(() => {
        if (adminLoginStatus === 'true') {
            setRole('admin')
        }
    }, [adminLoginStatus])

    const handleChange = (name, value) => {
        setAdminLoginData({
            ...adminLoginData,
            [name]: value
        })
        setErrorMsg('')
    }

    const submitForm = async () => {
        const errors = validateLoginForm(adminLoginData)
        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) return

        setLoading(true)

        try {
            const formBody = `email=${encodeURIComponent(adminLoginData.email)}&password=${encodeURIComponent(adminLoginData.password)}`
            const response = await axios.post(`${baseUrl}${ENDPOINTS.ADMIN_LOGIN}`, formBody, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
            if (response.data.bool === true) {
                await AsyncStorage.setItem('adminLoginStatus', 'true')
                await AsyncStorage.setItem('adminId', String(response.data.admin_id || ''))
                await AsyncStorage.setItem('adminRole', String(response.data.role || ''))
                await AsyncStorage.setItem('adminName', String(response.data.name || ''))
                setRole('admin')
            } else {
                setErrorMsg('Invalid email or password')
                Alert.alert('Login Error', 'Invalid email or password')
            }
        } catch (error) {
            console.error('Login error:', error)
            setErrorMsg('Something went wrong. Please try again.')
            Alert.alert('Login Error', 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.screen}>
            <Header />

            <KeyboardAvoidingView
                style={styles.keyboardWrap}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 72 : 0}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 + insets.bottom }]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.container, !isTablet && styles.containerMobile]}>
                        <View style={styles.contentWrap}>
                        <View style={styles.headerSection}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeIcon}>🔒</Text>
                                <Text style={styles.badgeText}>Secure Admin Access</Text>
                            </View>
                            <Text style={[styles.pageTitle, !isTablet && styles.pageTitleMobile, isSmall && styles.pageTitleSmall]}>Admin Portal</Text>
                            <Text style={styles.pageSubtitle}>Access your administrative dashboard</Text>
                        </View>

                        <View style={styles.cardWrap}>
                            <View style={[styles.card, !isTablet && styles.cardMobile]}>
                                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backLink}>
                                    <Text style={styles.backLinkText}>← Back to home</Text>
                                </TouchableOpacity>

                                <View style={[styles.cardHeaderRow, !isTablet && styles.cardHeaderRowMobile]}>
                                    <View style={styles.headerIconBox}>
                                        <Text style={styles.headerIconText}>🔐</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.cardTitle}>Admin Sign In</Text>
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
                                            value={adminLoginData.email}
                                            placeholder="admin@kannari.com"
                                            style={[
                                                styles.input,
                                                fieldErrors.email ? styles.inputError : styles.inputNormal,
                                            ]}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                        <FieldError error={fieldErrors.email} />
                                    </View>

                                    <View>
                                        <Text style={styles.label}>Password</Text>
                                        <TextInput
                                            onChangeText={(text) => handleChange('password', text)}
                                            value={adminLoginData.password}
                                            placeholder="Enter your admin password"
                                            style={[
                                                styles.input,
                                                fieldErrors.password ? styles.inputError : styles.inputNormal,
                                            ]}
                                            secureTextEntry
                                        />
                                        <FieldError error={fieldErrors.password} />
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
                                </View>
                            </View>

                            <View style={[styles.securityNotice, !isTablet && styles.securityNoticeMobile]}>
                                <Text style={styles.securityIcon}>⚠️</Text>
                                <View style={styles.securityTextWrap}>
                                    <Text style={styles.securityTitle}>Authorized Access Only</Text>
                                    <Text style={styles.securityText}>
                                        This portal is restricted to authorized administrators. All login attempts are monitored and logged.
                                    </Text>
                                </View>
                            </View>
                        </View>
                        </View>
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
    keyboardWrap: {
        flex: 1,
    },
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
    containerMobile: {
        paddingVertical: 28,
        paddingHorizontal: 16,
    },
    contentWrap: {
        maxWidth: 1200,
        width: '100%',
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
        backgroundColor: '#fff3e0',
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeIcon: {
        fontSize: 14,
        color: '#e65100',
    },
    badgeText: {
        fontSize: 14,
        color: '#e65100',
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
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
    },
    cardHeaderRowMobile: {
        gap: 12,
        marginBottom: 24,
    },
    headerIconBox: {
        width: 56,
        height: 56,
        backgroundColor: '#ff6b6b',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIconText: {
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
    submitBtn: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: '#ff6b6b',
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
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
    securityNotice: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#fff9e6',
        borderWidth: 1,
        borderColor: '#ffe58f',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    securityNoticeMobile: {
        padding: 12,
        gap: 10,
    },
    securityIcon: {
        fontSize: 18,
        marginTop: 2,
    },
    securityTextWrap: {
        flex: 1,
    },
    securityTitle: {
        fontSize: 14,
        color: '#7c4a03',
        fontWeight: '500',
        marginBottom: 4,
    },
    securityText: {
        fontSize: 13,
        color: '#8c6e1f',
        lineHeight: 20,
    },
})

export default AdminLogin
