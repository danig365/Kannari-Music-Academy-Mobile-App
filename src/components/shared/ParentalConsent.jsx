import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRoute } from '@react-navigation/native'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const baseUrl = API_BASE_URL

const ParentalConsent = () => {
    const route = useRoute()
    const token = route.params?.token
    
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [consentData, setConsentData] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submitResult, setSubmitResult] = useState(null)

    // Form state
    const [authorizationMode, setAuthorizationMode] = useState('pre_authorized')
    const [parentSignature, setParentSignature] = useState('')
    const [denyReason, setDenyReason] = useState('')
    const [showDenyForm, setShowDenyForm] = useState(false)

    useEffect(() => {
        if (!token) {
            setError('No consent token provided. Please use the link from your email.')
            setLoading(false)
            return
        }

        axios.get(`${baseUrl}/parent/consent/verify/?token=${encodeURIComponent(token)}`)
            .then((res) => {
                if (res.data?.bool) {
                    setConsentData(res.data)
                } else {
                    setError(res.data?.message || 'Invalid consent link.')
                }
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Could not verify consent link. It may have expired.')
            })
            .finally(() => setLoading(false))
    }, [token])

    const handleApprove = async () => {
        if (!parentSignature.trim()) {
            Alert.alert('Signature Required', 'Please type your full name as a digital signature to approve.')
            return
        }
        setSubmitting(true)
        try {
            const res = await axios.post(`${baseUrl}/parent/consent/respond/`, {
                token,
                decision: 'approve',
                authorization_mode: authorizationMode,
                parent_signature: parentSignature.trim(),
            })
            setSubmitted(true)
            setSubmitResult({ success: true, message: res.data?.message || 'Consent approved successfully!' })
        } catch (err) {
            setSubmitResult({ success: false, message: err.response?.data?.message || 'Failed to submit. Please try again.' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeny = async () => {
        setSubmitting(true)
        try {
            const res = await axios.post(`${baseUrl}/parent/consent/respond/`, {
                token,
                decision: 'deny',
                deny_reason: denyReason.trim(),
            })
            setSubmitted(true)
            setSubmitResult({ success: true, message: res.data?.message || 'Your response has been recorded.' })
        } catch (err) {
            setSubmitResult({ success: false, message: err.response?.data?.message || 'Failed to submit. Please try again.' })
        } finally {
            setSubmitting(false)
        }
    }

    // ======== RENDER ========

    if (loading) {
        return (
            <View style={styles.pc_page}>
                <View style={styles.pc_container}>
                    <View style={styles.pc_loading}>
                        <ActivityIndicator size="large" color="#3f51b5" />
                        <Text style={styles.pc_loading_text}>Verifying your consent link...</Text>
                    </View>
                </View>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.pc_page}>
                <View style={styles.pc_container}>
                    <View style={styles.pc_card}>
                        <View style={styles.pc_error}>
                            <Text style={styles.pc_error_icon}>⚠️</Text>
                            <Text style={styles.pc_error_title}>Link Invalid or Expired</Text>
                            <Text style={styles.pc_error_message}>{error}</Text>
                            <Text style={styles.pc_error_small}>
                                If you need a new consent link, please ask your child to resend the request from their profile.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    if (submitted) {
        return (
            <View style={styles.pc_page}>
                <View style={styles.pc_container}>
                    <View style={styles.pc_card}>
                        <View style={[styles.pc_result, submitResult?.success ? styles.pc_result_success : styles.pc_result_error]}>
                            <Text style={[styles.pc_result_icon, submitResult?.success ? styles.pc_result_icon_success : styles.pc_result_icon_error]}>
                                {submitResult?.success ? '✓' : '✕'}
                            </Text>
                            <Text style={styles.pc_result_title}>
                                {submitResult?.success ? 'Response Recorded' : 'Something Went Wrong'}
                            </Text>
                            <Text style={styles.pc_result_message}>{submitResult?.message}</Text>
                            {submitResult?.success && (
                                <Text style={styles.pc_result_small}>You may close this page.</Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    const alreadyApproved = consentData?.link_status === 'approved' && consentData?.live_sessions_status === 'approved'

    return (
        <ScrollView style={styles.pc_page} contentContainerStyle={styles.pc_page_content}>
            <View style={styles.pc_container}>
                {/* Header / Branding */}
                <View style={styles.pc_brand}>
                    <Text style={styles.pc_brand_title}>Kannari Music Academy</Text>
                    <Text style={styles.pc_brand_sub}>Child Safety & Parental Consent</Text>
                </View>

                <View style={styles.pc_card}>
                    {/* Title */}
                    <View style={styles.pc_card_header}>
                        <Text style={styles.pc_card_header_icon}>🔒</Text>
                        <Text style={styles.pc_card_header_title}>Parental Consent Request</Text>
                    </View>

                    {/* Already approved message */}
                    {alreadyApproved && (
                        <View style={styles.pc_already_approved}>
                            <Text style={styles.pc_already_approved_icon}>✓</Text>
                            <View style={styles.pc_already_approved_content}>
                                <Text style={styles.pc_already_approved_title}>Already Approved</Text>
                                <Text style={styles.pc_already_approved_text}>
                                    You have already given consent for this child.
                                    {consentData.approved_at && ` (Approved: ${new Date(consentData.approved_at).toLocaleDateString()})`}
                                </Text>
                                <Text style={styles.pc_already_approved_small}>
                                    You can update your preferences below if needed.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Student Information */}
                    <View style={styles.pc_section}>
                        <View style={styles.pc_section_title}>
                            <Text style={styles.pc_section_title_icon}>👤</Text>
                            <Text style={styles.pc_section_title_text}>Your Child's Information</Text>
                        </View>
                        <View style={styles.pc_info_grid}>
                            <View style={styles.pc_info_item}>
                                <Text style={styles.pc_info_label}>Name</Text>
                                <Text style={styles.pc_info_value}>{consentData?.student_name}</Text>
                            </View>
                            <View style={styles.pc_info_item}>
                                <Text style={styles.pc_info_label}>Email</Text>
                                <Text style={styles.pc_info_value}>{consentData?.student_email}</Text>
                            </View>
                            {consentData?.student_dob && (
                                <View style={styles.pc_info_item}>
                                    <Text style={styles.pc_info_label}>Date of Birth</Text>
                                    <Text style={styles.pc_info_value}>{new Date(consentData.student_dob).toLocaleDateString()}</Text>
                                </View>
                            )}
                            <View style={styles.pc_info_item}>
                                <Text style={styles.pc_info_label}>Your Relationship</Text>
                                <Text style={styles.pc_info_value}>{consentData?.relationship?.charAt(0).toUpperCase() + consentData?.relationship?.slice(1)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* What you're consenting to */}
                    <View style={styles.pc_section}>
                        <View style={styles.pc_section_title}>
                            <Text style={styles.pc_section_title_icon}>ℹ️</Text>
                            <Text style={styles.pc_section_title_text}>What You're Consenting To</Text>
                        </View>
                        <View style={styles.pc_consent_items}>
                            <View style={styles.pc_consent_item}>
                                <Text style={styles.pc_consent_item_icon}>📹</Text>
                                <View style={styles.pc_consent_item_content}>
                                    <Text style={styles.pc_consent_item_title}>Live Video/Audio Sessions</Text>
                                    <Text style={styles.pc_consent_item_desc}>
                                        Your child will be able to join live one-on-one music lessons with their verified teacher via secure video call.
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.pc_consent_item}>
                                <Text style={styles.pc_consent_item_icon}>✓</Text>
                                <View style={styles.pc_consent_item_content}>
                                    <Text style={styles.pc_consent_item_title}>Teacher Verification Required</Text>
                                    <Text style={styles.pc_consent_item_desc}>
                                        All teachers must pass ID verification, background checks, and sign child safety agreements before they can teach minors.
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.pc_consent_item}>
                                <Text style={styles.pc_consent_item_icon}>⊙</Text>
                                <View style={styles.pc_consent_item_content}>
                                    <Text style={styles.pc_consent_item_title}>Session Safety Logging</Text>
                                    <Text style={styles.pc_consent_item_desc}>
                                        All sessions with minor students are logged for safety purposes. Recording may be enabled for safeguarding.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Authorization Mode Selection */}
                    <View style={styles.pc_section}>
                        <View style={styles.pc_section_title}>
                            <Text style={styles.pc_section_title_icon}>⚙️</Text>
                            <Text style={styles.pc_section_title_text}>Authorization Mode</Text>
                        </View>
                        <Text style={styles.pc_section_desc}>Choose how sessions are authorized for your child:</Text>
                        <View style={styles.pc_auth_options}>
                            <TouchableOpacity
                                style={[
                                    styles.pc_auth_option,
                                    authorizationMode === 'pre_authorized' && styles.pc_auth_selected,
                                ]}
                                onPress={() => setAuthorizationMode('pre_authorized')}
                            >
                                <View style={styles.pc_auth_option_radio}>
                                    <View
                                        style={[
                                            styles.pc_radio_outer,
                                            authorizationMode === 'pre_authorized' && styles.pc_radio_checked,
                                        ]}
                                    >
                                        {authorizationMode === 'pre_authorized' && <View style={styles.pc_radio_inner} />}
                                    </View>
                                </View>
                                <View style={styles.pc_auth_content}>
                                    <Text style={styles.pc_auth_content_icon}>✓✓</Text>
                                    <View style={styles.pc_auth_content_text}>
                                        <Text style={styles.pc_auth_content_title}>Pre-Authorized</Text>
                                        <Text style={styles.pc_auth_content_desc}>
                                            Your child can join all scheduled sessions without per-session approval. Recommended for regular lessons.
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.pc_auth_option,
                                    authorizationMode === 'per_session_login' && styles.pc_auth_selected,
                                ]}
                                onPress={() => setAuthorizationMode('per_session_login')}
                            >
                                <View style={styles.pc_auth_option_radio}>
                                    <View
                                        style={[
                                            styles.pc_radio_outer,
                                            authorizationMode === 'per_session_login' && styles.pc_radio_checked,
                                        ]}
                                    >
                                        {authorizationMode === 'per_session_login' && <View style={styles.pc_radio_inner} />}
                                    </View>
                                </View>
                                <View style={styles.pc_auth_content}>
                                    <Text style={styles.pc_auth_content_icon}>🔒</Text>
                                    <View style={styles.pc_auth_content_text}>
                                        <Text style={styles.pc_auth_content_title}>Per-Session Approval</Text>
                                        <Text style={styles.pc_auth_content_desc}>
                                            You must approve each session individually before your child can join. More restrictive.
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Approve */}
                    {!showDenyForm && (
                        <View style={[styles.pc_section, styles.pc_approve_section]}>
                            <View style={styles.pc_section_title}>
                                <Text style={styles.pc_section_title_icon}>✏️</Text>
                                <Text style={styles.pc_section_title_text}>Digital Signature</Text>
                            </View>
                            <Text style={styles.pc_section_desc}>
                                By typing your full name below and clicking "Approve", you confirm
                                that you are the parent/guardian of <Text style={{ fontWeight: '700' }}>{consentData?.student_name}</Text> and
                                consent to the terms described above.
                            </Text>
                            <View style={styles.pc_signature_box}>
                                <TextInput
                                    style={styles.pc_signature_input}
                                    placeholder="Type your full legal name here"
                                    value={parentSignature}
                                    onChangeText={setParentSignature}
                                    placeholderTextColor="#aaa"
                                />
                                <Text style={styles.pc_signature_hint}>This serves as your electronic signature.</Text>
                            </View>

                            <View style={styles.pc_actions}>
                                <TouchableOpacity
                                    style={[
                                        styles.pc_btn,
                                        styles.pc_btn_approve,
                                        (!parentSignature.trim() || submitting) && styles.pc_btn_disabled,
                                    ]}
                                    onPress={handleApprove}
                                    disabled={submitting || !parentSignature.trim()}
                                >
                                    {submitting ? (
                                        <>
                                            <ActivityIndicator size="small" color="#fff" />
                                            <Text style={styles.pc_btn_text}>Submitting...</Text>
                                        </>
                                    ) : (
                                        <Text style={styles.pc_btn_text}>✓ Approve Consent</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pc_btn, styles.pc_btn_deny_toggle]}
                                    onPress={() => setShowDenyForm(true)}
                                    disabled={submitting}
                                >
                                    <Text style={styles.pc_btn_deny_toggle_text}>I do not consent</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Deny Form */}
                    {showDenyForm && (
                        <View style={[styles.pc_section, styles.pc_deny_section]}>
                            <View style={styles.pc_section_title}>
                                <Text style={styles.pc_section_title_icon}>✕</Text>
                                <Text style={styles.pc_section_title_text}>Decline Consent</Text>
                            </View>
                            <Text style={styles.pc_section_desc}>
                                You are choosing to decline consent. Your child will not be able to join live sessions.
                            </Text>
                            <View style={styles.pc_deny_box}>
                                <Text style={styles.pc_deny_label}>Reason (optional):</Text>
                                <TextInput
                                    style={styles.pc_deny_textarea}
                                    placeholder="You may provide a reason..."
                                    value={denyReason}
                                    onChangeText={setDenyReason}
                                    multiline
                                    numberOfLines={3}
                                    placeholderTextColor="#aaa"
                                />
                            </View>
                            <View style={styles.pc_actions}>
                                <TouchableOpacity
                                    style={[
                                        styles.pc_btn,
                                        styles.pc_btn_deny,
                                        submitting && styles.pc_btn_disabled,
                                    ]}
                                    onPress={handleDeny}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <ActivityIndicator size="small" color="#fff" />
                                            <Text style={styles.pc_btn_text}>Submitting...</Text>
                                        </>
                                    ) : (
                                        <Text style={styles.pc_btn_text}>✕ Decline Consent</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pc_btn, styles.pc_btn_back]}
                                    onPress={() => setShowDenyForm(false)}
                                    disabled={submitting}
                                >
                                    <Text style={styles.pc_btn_back_text}>← Go Back</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Footer info */}
                    <View style={styles.pc_footer_info}>
                        <Text style={styles.pc_footer_info_icon}>🔒</Text>
                        <Text style={styles.pc_footer_info_text}>
                            This page is secured with a unique signed token. Your response is recorded
                            with a timestamp for legal compliance. If you have concerns, please contact us at
                            support@kannarimusicacademy.com.
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    pc_page: {
        flex: 1,
        backgroundColor: '#f0f4ff',
    },
    pc_page_content: {
        paddingVertical: 20,
        paddingHorizontal: 10,
        paddingBottom: 40,
    },
    pc_container: {
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
    },
    pc_brand: {
        alignItems: 'center',
        marginBottom: 24,
    },
    pc_brand_title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a237e',
        marginBottom: 4,
    },
    pc_brand_sub: {
        fontSize: 14,
        color: '#5c6bc0',
    },
    pc_card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 8,
        padding: 20,
    },
    pc_card_header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#e8eaf6',
    },
    pc_card_header_icon: {
        fontSize: 24,
    },
    pc_card_header_title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a237e',
    },
    pc_loading: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    pc_loading_text: {
        marginTop: 16,
        color: '#666',
    },
    pc_error: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    pc_error_icon: {
        fontSize: 40,
    },
    pc_error_title: {
        marginTop: 16,
        marginBottom: 12,
        color: '#c62828',
        fontSize: 18,
        fontWeight: '700',
    },
    pc_error_message: {
        color: '#555',
        textAlign: 'center',
        marginBottom: 12,
    },
    pc_error_small: {
        color: '#999',
        fontSize: 12,
        textAlign: 'center',
    },
    pc_result: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    pc_result_success: {
        backgroundColor: '#f1f8f2',
    },
    pc_result_error: {
        backgroundColor: '#fff5f5',
    },
    pc_result_icon: {
        fontSize: 48,
    },
    pc_result_icon_success: {
        color: '#2e7d32',
    },
    pc_result_icon_error: {
        color: '#c62828',
    },
    pc_result_title: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 18,
        fontWeight: '700',
    },
    pc_result_message: {
        color: '#555',
        textAlign: 'center',
        marginBottom: 12,
    },
    pc_result_small: {
        color: '#999',
        fontSize: 12,
    },
    pc_already_approved: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#e8f5e9',
        borderWidth: 1,
        borderColor: '#a5d6a7',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    pc_already_approved_icon: {
        fontSize: 20,
        marginTop: 2,
    },
    pc_already_approved_content: {
        flex: 1,
    },
    pc_already_approved_title: {
        fontWeight: '700',
        color: '#2e7d32',
        marginBottom: 2,
    },
    pc_already_approved_text: {
        color: '#555',
        fontSize: 13,
        marginBottom: 4,
    },
    pc_already_approved_small: {
        color: '#999',
        fontSize: 12,
    },
    pc_section: {
        marginBottom: 28,
    },
    pc_section_title: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    pc_section_title_icon: {
        fontSize: 18,
    },
    pc_section_title_text: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    pc_section_desc: {
        color: '#666',
        fontSize: 13,
        marginBottom: 12,
        lineHeight: 20,
    },
    pc_info_grid: {
        gap: 12,
    },
    pc_info_item: {
        backgroundColor: '#f5f7ff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    pc_info_label: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#888',
        marginBottom: 4,
    },
    pc_info_value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    pc_consent_items: {
        gap: 12,
    },
    pc_consent_item: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#fafbff',
        borderWidth: 1,
        borderColor: '#e8eaf6',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    pc_consent_item_icon: {
        fontSize: 20,
        marginTop: 4,
    },
    pc_consent_item_content: {
        flex: 1,
    },
    pc_consent_item_title: {
        fontWeight: '600',
        color: '#333',
        fontSize: 13,
        marginBottom: 4,
    },
    pc_consent_item_desc: {
        color: '#666',
        fontSize: 12,
        lineHeight: 18,
    },
    pc_auth_options: {
        gap: 12,
    },
    pc_auth_option: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#fafbff',
        borderWidth: 2,
        borderColor: '#e0e3f0',
        borderRadius: 12,
        padding: 12,
    },
    pc_auth_selected: {
        borderColor: '#3f51b5',
        backgroundColor: '#e8eaf6',
    },
    pc_auth_option_radio: {
        justifyContent: 'center',
    },
    pc_radio_outer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#c5cae9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pc_radio_checked: {
        borderColor: '#3f51b5',
    },
    pc_radio_inner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3f51b5',
    },
    pc_auth_content: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    pc_auth_content_icon: {
        fontSize: 16,
        marginTop: 2,
    },
    pc_auth_content_text: {
        flex: 1,
    },
    pc_auth_content_title: {
        fontWeight: '600',
        color: '#333',
        fontSize: 13,
        marginBottom: 2,
    },
    pc_auth_content_desc: {
        color: '#666',
        fontSize: 11,
        lineHeight: 16,
    },
    pc_approve_section: {
        backgroundColor: '#f1f8f2',
        borderWidth: 1,
        borderColor: '#c8e6c9',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    pc_deny_section: {
        backgroundColor: '#fff5f5',
        borderWidth: 1,
        borderColor: '#ffcdd2',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    pc_signature_box: {
        marginBottom: 16,
    },
    pc_signature_input: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 14,
        fontFamily: 'serif',
        borderWidth: 2,
        borderColor: '#c5cae9',
        borderRadius: 10,
        backgroundColor: '#fafbff',
        marginBottom: 6,
    },
    pc_signature_hint: {
        color: '#999',
        fontSize: 12,
    },
    pc_deny_box: {
        marginBottom: 12,
    },
    pc_deny_label: {
        fontWeight: '600',
        fontSize: 13,
        color: '#555',
        marginBottom: 8,
    },
    pc_deny_textarea: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        fontSize: 13,
        height: 80,
    },
    pc_actions: {
        gap: 12,
    },
    pc_btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    pc_btn_disabled: {
        opacity: 0.6,
    },
    pc_btn_text: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 4,
    },
    pc_btn_approve: {
        backgroundColor: '#2e7d32',
    },
    pc_btn_deny_toggle: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    pc_btn_deny_toggle_text: {
        color: '#999',
        fontWeight: '600',
        fontSize: 14,
    },
    pc_btn_deny: {
        backgroundColor: '#c62828',
    },
    pc_btn_back: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    pc_btn_back_text: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14,
    },
    pc_footer_info: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    pc_footer_info_icon: {
        fontSize: 16,
        marginTop: 2,
    },
    pc_footer_info_text: {
        color: '#999',
        fontSize: 11,
        lineHeight: 18,
        flex: 1,
    },
})

export default ParentalConsent
