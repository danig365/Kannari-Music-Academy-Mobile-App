import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { getStudentSubscription, formatAccessLevel, getAccessLevelColor } from '../../services/subscriptionService';
import LoadingSpinner from '../shared/LoadingSpinner';

const SubscriptionStatusCard = ({ studentId, compact = false }) => {
    const navigation = useNavigation();
    const openSubscriptions = () => {
        navigation.navigate('StudentSubscriptions');
    };
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!studentId) {
                setLoading(false);
                return;
            }
            
            try {
                const data = await getStudentSubscription(studentId);
                setSubscription(data);
            } catch (error) {
                console.error('Error fetching subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [studentId]);

    if (loading) {
        return (
            <View style={[styles.subscriptionStatusCard, compact ? styles.compactCard : null]}>
                <View style={styles.subscriptionLoading}>
                    <LoadingSpinner size="sm" />
                </View>
            </View>
        );
    }

    // No subscription or no active subscription
    if (!subscription || !subscription.has_active_subscription) {
        return (
            <View
                style={[
                    styles.subscriptionStatusCard,
                    styles.noSubscriptionCard,
                    compact ? styles.compactCard : null,
                ]}
            >
                <View style={styles.subscriptionIcon}>
                    <Bootstrap name="credit-card-2-front" size={24} color="#64748b" />
                </View>
                <View style={styles.subscriptionInfo}>
                    <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
                    <Text style={styles.noSubscriptionText}>Subscribe to unlock premium courses and features</Text>
                </View>
                <TouchableOpacity
                    style={styles.subscribeBtn}
                    onPress={openSubscriptions}
                >
                    <Bootstrap name="star" size={13} color="#ffffff" />
                    <Text style={styles.subscribeBtnText}>View Plans</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { subscription: sub, usage } = subscription;
    const accessLevel = sub?.plan_details?.access_level || 0;
    const levelColor = getAccessLevelColor(accessLevel);
    const daysRemaining = sub?.days_remaining || 0;
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

    // Calculate usage percentages
    const coursesUsedPercent = usage?.max_courses 
        ? Math.round((usage.courses_accessed / usage.max_courses) * 100) 
        : 0;
    const lessonsUsedPercent = usage?.max_lessons 
        ? Math.round((usage.lessons_accessed / usage.max_lessons) * 100) 
        : 0;
    const weeklyLessonsPercent = usage?.lessons_per_week 
        ? Math.round((usage.current_week_lessons / usage.lessons_per_week) * 100) 
        : 0;

    if (compact) {
        return (
            <View style={[styles.subscriptionStatusCard, styles.compactCard]}>
                <View style={[styles.subscriptionBadge, { backgroundColor: levelColor }]}>
                    <Bootstrap name="award" size={11} color="#ffffff" />
                    <Text style={styles.subscriptionBadgeText}>{formatAccessLevel(accessLevel)}</Text>
                </View>
                <View style={styles.subscriptionCompactInfo}>
                    <Text style={styles.compactPlanName}>{sub?.plan_details?.name || 'Active Plan'}</Text>
                    <Text style={[styles.daysLeftText, isExpiringSoon ? styles.daysLeftExpiring : null]}>
                        {daysRemaining} days left
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.manageBtn}
                    onPress={openSubscriptions}
                >
                    <Text style={styles.manageBtnText}>Manage</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.subscriptionStatusCard, styles.activeCard]}>
            <View style={styles.subscriptionHeader}>
                <View style={[styles.subscriptionBadge, { backgroundColor: levelColor }]}>
                    <Bootstrap name="award" size={12} color="#ffffff" />
                    <Text style={styles.subscriptionBadgeText}>{formatAccessLevel(accessLevel)} Plan</Text>
                </View>

                <View
                    style={[
                        styles.subscriptionStatusBadge,
                        sub?.status === 'active'
                            ? styles.statusActive
                            : sub?.status === 'pending'
                            ? styles.statusPending
                            : styles.statusCancelled,
                    ]}
                >
                    {sub?.status === 'active' ? <Bootstrap name="check-circle" size={11} color="#16a34a" /> : null}
                    <Text
                        style={[
                            styles.subscriptionStatusBadgeText,
                            sub?.status === 'active'
                                ? styles.statusTextActive
                                : sub?.status === 'pending'
                                ? styles.statusTextPending
                                : styles.statusTextCancelled,
                        ]}
                    >
                        {sub?.status === 'active' ? 'Active' : sub?.status}
                    </Text>
                </View>
            </View>

            <View style={styles.subscriptionDetails}>
                <Text style={styles.planName}>{sub?.plan_details?.name || 'Active Plan'}</Text>

                <View style={[styles.daysRemainingSection, isExpiringSoon ? styles.daysRemainingExpiring : null]}>
                    <View style={[styles.daysIcon, isExpiringSoon ? styles.daysIconExpiring : null]}>
                        <Bootstrap name="calendar-check" size={20} color={isExpiringSoon ? '#d97706' : '#0284c7'} />
                    </View>
                    <View style={styles.daysInfo}>
                        <Text style={styles.daysCount}>{daysRemaining}</Text>
                        <Text style={styles.daysLabel}>days remaining</Text>
                    </View>
                    {isExpiringSoon && (
                        <View style={styles.expiringBadge}>
                            <Bootstrap name="exclamation-circle" size={11} color="#ffffff" />
                            <Text style={styles.expiringBadgeText}>Expiring Soon</Text>
                        </View>
                    )}
                </View>

                {subscription.assigned_teacher && (
                    <View style={styles.assignedTeacherSection}>
                        <View style={styles.teacherAvatar}>
                            {subscription.assigned_teacher.profile_img ? (
                                <Image
                                    source={{ uri: subscription.assigned_teacher.profile_img }}
                                    style={styles.teacherAvatarImage}
                                />
                            ) : (
                                <Bootstrap name="person-fill" size={20} color="#ffffff" />
                            )}
                        </View>
                        <View style={styles.teacherInfo}>
                            <Text style={styles.teacherLabel}>Your Assigned Teacher</Text>
                            <Text style={styles.teacherName}>{subscription.assigned_teacher.fullname}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.usageStats}>
                    <View style={styles.usageItem}>
                        <View style={styles.usageHeader}>
                            <Text style={styles.usageHeaderLabel}>Courses</Text>
                            <Text style={styles.usageHeaderValue}>
                                {usage?.courses_accessed || 0} / {usage?.max_courses || '∞'}
                            </Text>
                        </View>
                        <View style={styles.usageBar}>
                            <View
                                style={[
                                    styles.usageFill,
                                    {
                                        width: `${Math.min(coursesUsedPercent, 100)}%`,
                                        backgroundColor: coursesUsedPercent > 90 ? '#ef4444' : '#3b82f6',
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.usageItem}>
                        <View style={styles.usageHeader}>
                            <Text style={styles.usageHeaderLabel}>Lessons</Text>
                            <Text style={styles.usageHeaderValue}>
                                {usage?.lessons_accessed || 0} / {usage?.max_lessons || '∞'}
                            </Text>
                        </View>
                        <View style={styles.usageBar}>
                            <View
                                style={[
                                    styles.usageFill,
                                    {
                                        width: `${Math.min(lessonsUsedPercent, 100)}%`,
                                        backgroundColor: lessonsUsedPercent > 90 ? '#ef4444' : '#10b981',
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    {usage?.lessons_per_week > 0 && (
                        <View style={styles.usageItem}>
                            <View style={styles.usageHeader}>
                                <Text style={styles.usageHeaderLabel}>Weekly Lessons</Text>
                                <Text style={styles.usageHeaderValue}>
                                    {usage?.current_week_lessons || 0} / {usage?.lessons_per_week}
                                </Text>
                            </View>
                            <View style={styles.usageBar}>
                                <View
                                    style={[
                                        styles.usageFill,
                                        {
                                            width: `${Math.min(weeklyLessonsPercent, 100)}%`,
                                            backgroundColor: weeklyLessonsPercent > 90 ? '#f59e0b' : '#8b5cf6',
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {sub?.plan_details?.features_list && sub.plan_details.features_list.length > 0 && (
                    <View style={styles.planFeaturesPreview}>
                        <Text style={styles.benefitsTitle}>Your Benefits</Text>
                        {sub.plan_details.features_list.slice(0, 3).map((feature, idx) => (
                            <View key={idx} style={styles.featureRow}>
                                <Bootstrap name="check-circle-fill" size={13} color="#10b981" />
                                <Text style={styles.featureRowText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.subscriptionActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnOutline]}
                    onPress={openSubscriptions}
                >
                    <Text style={[styles.actionBtnText, styles.actionBtnTextOutline]}>Manage Subscription</Text>
                </TouchableOpacity>
                {isExpiringSoon && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnPrimary]}
                        onPress={openSubscriptions}
                    >
                        <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Renew Now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    subscriptionStatusCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    compactCard: {
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subscriptionLoading: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    noSubscriptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#cbd5e1',
    },
    subscriptionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscriptionInfo: {
        flex: 1,
    },
    noSubscriptionTitle: {
        color: '#1e293b',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    noSubscriptionText: {
        color: '#64748b',
        fontSize: 14,
    },
    subscribeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    subscribeBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    activeCard: {
        backgroundColor: '#ffffff',
    },
    subscriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        gap: 10,
    },
    subscriptionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    subscriptionBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    subscriptionStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusActive: {
        backgroundColor: '#dcfce7',
    },
    statusPending: {
        backgroundColor: '#fef3c7',
    },
    statusCancelled: {
        backgroundColor: '#fee2e2',
    },
    subscriptionStatusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    statusTextActive: {
        color: '#16a34a',
    },
    statusTextPending: {
        color: '#d97706',
    },
    statusTextCancelled: {
        color: '#dc2626',
    },
    subscriptionDetails: {
        gap: 14,
    },
    planName: {
        color: '#0f172a',
        fontSize: 22,
        fontWeight: '700',
    },
    daysRemainingSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        flexWrap: 'wrap',
    },
    daysRemainingExpiring: {
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    daysIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#e0f2fe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    daysIconExpiring: {
        backgroundColor: '#fde68a',
    },
    daysInfo: {
        gap: 2,
    },
    daysCount: {
        color: '#0f172a',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 24,
    },
    daysLabel: {
        color: '#64748b',
        fontSize: 13,
    },
    expiringBadge: {
        marginLeft: 'auto',
        borderRadius: 12,
        backgroundColor: '#f59e0b',
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expiringBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    assignedTeacherSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#eff6ff',
    },
    teacherAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    teacherAvatarImage: {
        width: '100%',
        height: '100%',
    },
    teacherInfo: {
        gap: 2,
    },
    teacherLabel: {
        color: '#64748b',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    teacherName: {
        color: '#1e40af',
        fontSize: 16,
        fontWeight: '600',
    },
    usageStats: {
        gap: 12,
    },
    usageItem: {
        gap: 6,
    },
    usageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    usageHeaderLabel: {
        color: '#64748b',
        fontSize: 13,
    },
    usageHeaderValue: {
        color: '#334155',
        fontSize: 13,
        fontWeight: '600',
    },
    usageBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e2e8f0',
        overflow: 'hidden',
    },
    usageFill: {
        height: '100%',
        borderRadius: 4,
    },
    planFeaturesPreview: {
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#f8fafc',
    },
    benefitsTitle: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    featureRowText: {
        color: '#334155',
        fontSize: 14,
    },
    subscriptionActions: {
        flexDirection: 'row',
        gap: 10,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        marginTop: 6,
    },
    actionBtn: {
        flex: 1,
        minHeight: 42,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    actionBtnOutline: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    actionBtnPrimary: {
        backgroundColor: '#3b82f6',
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionBtnTextOutline: {
        color: '#3b82f6',
    },
    actionBtnTextPrimary: {
        color: '#ffffff',
    },
    subscriptionCompactInfo: {
        flex: 1,
        gap: 2,
    },
    compactPlanName: {
        color: '#0f172a',
        fontSize: 14,
        fontWeight: '600',
    },
    daysLeftText: {
        color: '#64748b',
        fontSize: 12,
    },
    daysLeftExpiring: {
        color: '#f59e0b',
        fontWeight: '600',
    },
    manageBtn: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    manageBtnText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default SubscriptionStatusCard;
