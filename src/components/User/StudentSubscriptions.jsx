import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    StyleSheet,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import LoadingSpinner from '../shared/LoadingSpinner';
import { API_BASE_URL, SITE_URL } from '../../config';
import {
    formatAccessLevel,
    getAccessLevelColor,
    clearSubscriptionCache,
} from '../../services/subscriptionService';

const baseUrl = API_BASE_URL;
const stripePublicKey =
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51QriK4FvQfkVZfKcMNu8LHUqNl4qZP2jFpYXGqCu5pQY9FmxNgVRUQ9q4rMxKPQqsGVuGrL4pGDSuTLNTNSs0006002mxKxbv';

const PaymentSheetForm = ({ plan, studentId, onSuccess, onCancel }) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    const createSubscription = async (planData, currentStudentId) => {
        const today = new Date();
        const endDate = new Date(today);

        if (planData.duration === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else if (planData.duration === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
        else if (planData.duration === 'semi_annual') endDate.setMonth(endDate.getMonth() + 6);
        else if (planData.duration === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);

        await axios.post(`${baseUrl}/subscriptions/`, {
            student: parseInt(currentStudentId, 10),
            plan: parseInt(planData.id, 10),
            start_date: today.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            price_paid: planData.final_price,
            is_paid: true,
            status: 'active',
            auto_renew: true,
            lessons_used_this_month: 0,
            courses_accessed: 0,
            lessons_accessed: 0,
            current_week_lessons: 0,
            last_reset_date: today.toISOString().split('T')[0],
        });
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Please enter your full name');
            return;
        }
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }
        if (!studentId) {
            setError('Student ID not found. Please log in again.');
            return;
        }
        if (!plan?.id || !plan?.final_price) {
            setError('Invalid plan information. Please try again.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const paymentData = {
                plan_id: parseInt(plan.id, 10),
                student_id: parseInt(studentId, 10),
                amount: Math.round(parseFloat(plan.final_price) * 100),
                email: email.trim(),
                name: name.trim(),
            };

            const response = await axios.post(`${baseUrl}/subscription/create-payment-intent/`, paymentData);
            const clientSecret = response?.data?.clientSecret;

            if (!clientSecret) {
                setError('Failed to initialize payment. Please try again.');
                setLoading(false);
                return;
            }

            const initResult = await initPaymentSheet({
                merchantDisplayName: 'Kannari Music Academy',
                paymentIntentClientSecret: clientSecret,
                defaultBillingDetails: {
                    name: name.trim(),
                    email: email.trim(),
                },
            });

            if (initResult.error) {
                setError(initResult.error.message || 'Unable to initialize payment sheet.');
                setLoading(false);
                return;
            }

            const presentResult = await presentPaymentSheet();
            if (presentResult.error) {
                if (presentResult.error.code !== 'Canceled') {
                    setError(presentResult.error.message || 'Payment failed.');
                }
                setLoading(false);
                return;
            }

            await createSubscription(plan, studentId);
            onSuccess();
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.paymentForm}>
            {!!error && (
                <View style={styles.errorAlert}>
                    <Bootstrap name="exclamation-circle" size={14} color="#b91c1c" />
                    <Text style={styles.errorAlertText}>{error}</Text>
                </View>
            )}

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="John Doe"
                    style={styles.input}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="john@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                />
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.payButton, loading ? styles.buttonDisabled : null]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            Pay ${parseFloat(plan.final_price || 0).toFixed(2)}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={loading}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const StudentSubscriptions = () => {
    const navigation = useNavigation();
    const [plans, setPlans] = useState([]);
    const [userSubscriptions, setUserSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [studentId, setStudentId] = useState(null);
    const [studentLoginStatus, setStudentLoginStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('plans');

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
            navigation.navigate('/student/login');
        }
    }, [studentLoginStatus]);

    const fetchData = async (id) => {
        try {
            setLoading(true);
            const [plansRes, subsRes] = await Promise.all([
                axios.get(`${baseUrl}/subscription-plans/`),
                axios.get(`${baseUrl}/subscriptions/?student_id=${id}`),
            ]);

            setPlans(plansRes.data?.results || plansRes.data || []);
            setUserSubscriptions(subsRes.data?.results || subsRes.data || []);
        } catch (error) {
            console.log('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentLoginStatus === 'true' && studentId) {
            fetchData(studentId);
        }
    }, [studentLoginStatus, studentId]);

    const isSubscribedToPlan = (planId) => {
        return userSubscriptions.some(
            (sub) =>
                String(sub.plan) === String(planId) &&
                (sub.status === 'active' || sub.status === 'pending')
        );
    };

    const handleSubscriptionSuccess = () => {
        clearSubscriptionCache();
        Alert.alert('Subscription Successful!', 'Your subscription is now active.', [
            {
                text: 'OK',
                onPress: () => {
                    setSelectedPlan(null);
                    if (studentId) {
                        fetchData(studentId);
                    }
                },
            },
        ]);
    };

    if (studentLoginStatus === null || loading) {
        return (
                    <View style={styles.loadingCenter}>
                        <LoadingSpinner size="lg" text="Loading subscriptions..." />
                    </View>
        );
    }

    if (studentLoginStatus !== 'true') {
        return null;
    }

    if (!studentId) {
        return (
                    <View style={styles.warningAlert}>
                        <Bootstrap name="exclamation-triangle" size={16} color="#92400e" />
                        <Text style={styles.warningText}>Please log in to subscribe to plans.</Text>
                    </View>
        );
    }

    return (
        <StripeProvider publishableKey={stripePublicKey}>
            <>

                    <ScrollView style={styles.contentWrapper} contentContainerStyle={styles.contentWrapperInner}>
                        <View style={styles.studentSubscriptions}>
                            <Text style={styles.subscriptionHeader}>Subscribe to Plans</Text>

                            <View style={styles.tabsRow}>
                                <TouchableOpacity
                                    style={[styles.tabButton, activeTab === 'plans' ? styles.tabButtonActive : null]}
                                    onPress={() => setActiveTab('plans')}
                                >
                                    <Text
                                        style={[
                                            styles.tabButtonText,
                                            activeTab === 'plans' ? styles.tabButtonTextActive : null,
                                        ]}
                                    >
                                        Available Plans
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.tabButton,
                                        activeTab === 'my-subscriptions' ? styles.tabButtonActive : null,
                                    ]}
                                    onPress={() => setActiveTab('my-subscriptions')}
                                >
                                    <Text
                                        style={[
                                            styles.tabButtonText,
                                            activeTab === 'my-subscriptions' ? styles.tabButtonTextActive : null,
                                        ]}
                                    >
                                        My Subscriptions
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {activeTab === 'plans' ? (
                                <View style={styles.plansGrid}>
                                    {plans.map((plan) => {
                                        const accessLevel = plan.access_level || 0;
                                        const levelColor = getAccessLevelColor(accessLevel);
                                        const subscribed = isSubscribedToPlan(plan.id);

                                        return (
                                            <View key={plan.id} style={styles.planCard}>
                                                <View style={styles.planBadgeCol}>
                                                    <View style={[styles.accessBadge, { backgroundColor: levelColor }]}>
                                                        <Text style={styles.accessBadgeText}>
                                                            {formatAccessLevel(accessLevel)}
                                                        </Text>
                                                    </View>
                                                    {subscribed && (
                                                        <View style={styles.subscribedBadge}>
                                                            <Text style={styles.subscribedBadgeText}>SUBSCRIBED</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <Text style={styles.planTitle}>{plan.name}</Text>
                                                <Text style={styles.planDescription}>{plan.description}</Text>

                                                <View style={styles.planPriceWrap}>
                                                    <Text style={styles.priceMain}>${plan.final_price}</Text>
                                                    <Text style={styles.priceDuration}>/ {plan.duration}</Text>
                                                    {!!plan.discount_price && (
                                                        <Text style={styles.priceDiscount}>Was ${plan.price}</Text>
                                                    )}
                                                </View>

                                                <View style={styles.planFeatures}>
                                                    <Text style={styles.featureText}>• Max {plan.max_courses} Courses</Text>
                                                    <Text style={styles.featureText}>• Max {plan.max_lessons} Lessons</Text>
                                                    {!!plan.lessons_per_week && (
                                                        <Text style={styles.featureText}>
                                                            • {plan.lessons_per_week} Lessons/Week
                                                        </Text>
                                                    )}
                                                    {!!plan.can_download && (
                                                        <Text style={styles.featureText}>• Download Content</Text>
                                                    )}
                                                    {!!plan.can_access_live_sessions && (
                                                        <Text style={styles.featureText}>
                                                            • Live Sessions
                                                            {plan.max_live_sessions_per_month > 0
                                                                ? ` (${plan.max_live_sessions_per_month}/mo)`
                                                                : ''}
                                                        </Text>
                                                    )}
                                                    {!!plan.priority_support && (
                                                        <Text style={styles.featureText}>• Priority Support</Text>
                                                    )}
                                                    {Array.isArray(plan.features_list)
                                                        ? plan.features_list.map((feature, idx) => (
                                                              <Text key={idx} style={styles.featureText}>
                                                                  • {feature}
                                                              </Text>
                                                          ))
                                                        : null}
                                                </View>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.subscribeButton,
                                                        subscribed ? styles.subscribeButtonDisabled : null,
                                                    ]}
                                                    onPress={() => setSelectedPlan(plan)}
                                                    disabled={subscribed}
                                                >
                                                    <Text style={styles.subscribeButtonText}>
                                                        {subscribed ? 'Already Subscribed' : 'Subscribe Now'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : userSubscriptions.length === 0 ? (
                                <View style={styles.infoAlert}>
                                    <Text style={styles.infoAlertText}>
                                        You don't have any active subscriptions yet. Browse our plans and
                                        subscribe to get started!
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.subscriptionsList}>
                                    {userSubscriptions.map((sub) => {
                                        const accessLevel = sub.plan_details?.access_level || 0;
                                        const levelColor = getAccessLevelColor(accessLevel);
                                        const isExpiringSoon = sub.days_remaining && sub.days_remaining <= 7;

                                        return (
                                            <View key={sub.id} style={styles.subscriptionCard}>
                                                <View style={[styles.subscriptionTop, { backgroundColor: levelColor }]}>
                                                    <View>
                                                        <Text style={styles.subscriptionTopBadge}>
                                                            {formatAccessLevel(accessLevel)} Access
                                                        </Text>
                                                        <Text style={styles.subscriptionTitle}>
                                                            {sub.plan_details?.name || 'Plan'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statusBadgeLight}>
                                                        <Text style={styles.statusBadgeLightText}>
                                                            {String(sub.status || '').toUpperCase()}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.subscriptionBody}>
                                                    {isExpiringSoon && sub.status === 'active' && (
                                                        <View style={styles.expiringBox}>
                                                            <Text style={styles.expiringText}>
                                                                Expiring in {sub.days_remaining} days - renew now.
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {!!sub.assigned_teacher_details && (
                                                        <View style={styles.assignedTeacherBox}>
                                                            <View style={styles.teacherAvatar}>
                                                                {sub.assigned_teacher_details.profile_img ? (
                                                                    <Image
                                                                        source={{
                                                                            uri: sub.assigned_teacher_details.profile_img.startsWith(
                                                                                'http'
                                                                            )
                                                                                ? sub.assigned_teacher_details.profile_img
                                                                                : `${SITE_URL}${sub.assigned_teacher_details.profile_img}`,
                                                                        }}
                                                                        style={styles.teacherAvatarImage}
                                                                    />
                                                                ) : (
                                                                    <Bootstrap
                                                                        name="person-fill"
                                                                        size={18}
                                                                        color="#ffffff"
                                                                    />
                                                                )}
                                                            </View>
                                                            <View style={styles.teacherMeta}>
                                                                <Text style={styles.teacherMetaLabel}>
                                                                    Your Assigned Teacher
                                                                </Text>
                                                                <Text style={styles.teacherMetaName}>
                                                                    {sub.assigned_teacher_details.full_name}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    )}

                                                    <View style={styles.subscriptionDetailsList}>
                                                        <View style={styles.subscriptionDetailsItem}>
                                                            <Text style={styles.subscriptionDetailsKey}>Price Paid</Text>
                                                            <Text style={styles.subscriptionDetailsValue}>${sub.price_paid}</Text>
                                                        </View>
                                                        <View style={styles.subscriptionDetailsItem}>
                                                            <Text style={styles.subscriptionDetailsKey}>Start Date</Text>
                                                            <Text style={styles.subscriptionDetailsValue}>
                                                                {new Date(sub.start_date).toLocaleDateString()}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.subscriptionDetailsItem}>
                                                            <Text style={styles.subscriptionDetailsKey}>End Date</Text>
                                                            <Text style={styles.subscriptionDetailsValue}>
                                                                {new Date(sub.end_date).toLocaleDateString()}
                                                            </Text>
                                                        </View>
                                                        {sub.status === 'active' && sub.days_remaining ? (
                                                            <View style={styles.subscriptionDetailsItemSuccess}>
                                                                <Text style={styles.subscriptionDetailsKeySuccess}>
                                                                    Days Left
                                                                </Text>
                                                                <Text style={styles.subscriptionDetailsValueSuccess}>
                                                                    {sub.days_remaining} days
                                                                </Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </ScrollView>

                <Modal
                    visible={!!selectedPlan}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setSelectedPlan(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Complete Your Purchase</Text>
                                    <Text style={styles.modalSubTitle}>{selectedPlan?.name} Plan</Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedPlan(null)}>
                                    <Bootstrap name="x-lg" size={16} color="#ffffff" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                {!!selectedPlan && (
                                    <View style={styles.planSummary}>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryKey}>{selectedPlan.name} Plan</Text>
                                            <Text style={styles.summaryValue}>
                                                ${parseFloat(selectedPlan.price || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryKey}>Duration</Text>
                                            <Text style={styles.summaryValue}>
                                                {String(selectedPlan.duration || '').replace('_', ' ')}
                                            </Text>
                                        </View>
                                        {!!selectedPlan.discount_price && (
                                            <View style={styles.summaryItemDiscount}>
                                                <Text style={styles.summaryKeyDiscount}>Special Offer</Text>
                                                <Text style={styles.summaryValueDiscount}>
                                                    -$
                                                    {(
                                                        parseFloat(selectedPlan.price || 0) -
                                                        parseFloat(selectedPlan.discount_price || 0)
                                                    ).toFixed(2)}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.summaryItemTotal}>
                                            <Text style={styles.summaryKeyTotal}>You Pay</Text>
                                            <Text style={styles.summaryValueTotal}>
                                                ${parseFloat(selectedPlan.final_price || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {!!selectedPlan && (
                                    <PaymentSheetForm
                                        plan={selectedPlan}
                                        studentId={studentId}
                                        onSuccess={handleSubscriptionSuccess}
                                        onCancel={() => setSelectedPlan(null)}
                                    />
                                )}

                                <View style={styles.securityInfo}>
                                    <Text style={styles.securityInfoText}>
                                        Secure payment powered by Stripe
                                    </Text>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </>
        </StripeProvider>
    );
};

const styles = StyleSheet.create({
    screenWrap: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f0f9ff',
    },
    screenContent: {
        flex: 1,
    },
    sidebarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 999,
    },
    mobileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59,130,246,0.12)',
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
    contentWrapper: {
        flex: 1,
    },
    contentWrapperInner: {
        padding: 16,
        paddingBottom: 30,
    },
    studentSubscriptions: {
        borderRadius: 12,
    },
    subscriptionHeader: {
        fontSize: 30,
        color: '#1a1a1a',
        fontWeight: '800',
        marginBottom: 14,
    },
    tabsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    tabButton: {
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.2)',
    },
    tabButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    tabButtonText: {
        color: '#6b7280',
        fontWeight: '600',
        fontSize: 13,
    },
    tabButtonTextActive: {
        color: '#ffffff',
    },
    plansGrid: {
        gap: 14,
    },
    planCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.12)',
        gap: 8,
    },
    planBadgeCol: {
        alignItems: 'flex-end',
        gap: 6,
    },
    accessBadge: {
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    accessBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    subscribedBadge: {
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#10b981',
    },
    subscribedBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    planTitle: {
        fontSize: 20,
        color: '#1a1a1a',
        fontWeight: '700',
    },
    planDescription: {
        color: '#6b7280',
        fontSize: 14,
    },
    planPriceWrap: {
        marginVertical: 4,
    },
    priceMain: {
        fontSize: 34,
        color: '#3b82f6',
        fontWeight: '800',
    },
    priceDuration: {
        color: '#6b7280',
        fontSize: 14,
    },
    priceDiscount: {
        color: '#6c757d',
        textDecorationLine: 'line-through',
        fontSize: 12,
    },
    planFeatures: {
        gap: 6,
        marginVertical: 6,
    },
    featureText: {
        fontSize: 13,
        color: '#374151',
    },
    subscribeButton: {
        minHeight: 44,
        borderRadius: 10,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    subscribeButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    subscribeButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    subscriptionsList: {
        gap: 14,
    },
    subscriptionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.12)',
    },
    subscriptionTop: {
        padding: 16,
    },
    subscriptionTopBadge: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
    },
    subscriptionTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    statusBadgeLight: {
        alignSelf: 'flex-start',
        marginTop: 8,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusBadgeLightText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    subscriptionBody: {
        padding: 16,
        gap: 12,
    },
    expiringBox: {
        backgroundColor: '#fef3c7',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    expiringText: {
        color: '#92400e',
        fontSize: 13,
    },
    assignedTeacherBox: {
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    teacherAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    teacherAvatarImage: {
        width: '100%',
        height: '100%',
    },
    teacherMeta: {
        flex: 1,
    },
    teacherMetaLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '600',
    },
    teacherMetaName: {
        color: '#1e40af',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    subscriptionDetailsList: {
        gap: 8,
    },
    subscriptionDetailsItem: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.12)',
        backgroundColor: 'rgba(59,130,246,0.04)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subscriptionDetailsKey: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '600',
    },
    subscriptionDetailsValue: {
        color: '#1a1a1a',
        fontSize: 13,
        fontWeight: '700',
    },
    subscriptionDetailsItemSuccess: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        backgroundColor: 'rgba(16,185,129,0.06)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subscriptionDetailsKeySuccess: {
        color: '#047857',
        fontSize: 13,
        fontWeight: '700',
    },
    subscriptionDetailsValueSuccess: {
        color: '#047857',
        fontSize: 13,
        fontWeight: '800',
    },
    infoAlert: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.12)',
        borderRadius: 12,
        padding: 14,
    },
    infoAlertText: {
        color: '#1a1a1a',
        fontSize: 14,
    },
    warningAlert: {
        margin: 16,
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#fcd34d',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    warningText: {
        color: '#92400e',
        fontSize: 14,
        fontWeight: '500',
    },
    loadingCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        width: '100%',
        maxWidth: 520,
        maxHeight: '90%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },
    modalHeader: {
        padding: 16,
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    modalSubTitle: {
        color: '#dbeafe',
        fontSize: 13,
        marginTop: 2,
    },
    modalBody: {
        padding: 16,
    },
    planSummary: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.12)',
        padding: 14,
        marginBottom: 14,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryKey: {
        color: '#6b7280',
        fontSize: 13,
    },
    summaryValue: {
        color: '#1a1a1a',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    summaryItemDiscount: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryKeyDiscount: {
        color: '#10b981',
        fontSize: 13,
    },
    summaryValueDiscount: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: '700',
    },
    summaryItemTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(59,130,246,0.12)',
        marginTop: 8,
        paddingTop: 10,
    },
    summaryKeyTotal: {
        color: '#1a1a1a',
        fontSize: 15,
        fontWeight: '700',
    },
    summaryValueTotal: {
        color: '#3b82f6',
        fontSize: 22,
        fontWeight: '800',
    },
    paymentForm: {
        gap: 10,
    },
    errorAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        padding: 10,
    },
    errorAlertText: {
        flex: 1,
        color: '#b91c1c',
        fontSize: 13,
    },
    inputGroup: {
        gap: 5,
    },
    inputLabel: {
        color: '#1a1a1a',
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.18)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1a1a1a',
        backgroundColor: 'rgba(59,130,246,0.02)',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    payButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 10,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    payButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    cancelButton: {
        minHeight: 44,
        minWidth: 90,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.2)',
        backgroundColor: 'rgba(59,130,246,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },
    cancelButtonText: {
        color: '#3b82f6',
        fontSize: 13,
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    securityInfo: {
        marginTop: 14,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        padding: 12,
        alignItems: 'center',
    },
    securityInfoText: {
        color: '#6c757d',
        fontSize: 13,
    },
});

export default StudentSubscriptions;
