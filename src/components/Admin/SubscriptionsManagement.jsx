import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const formatAccessLevel = (level) => {
    const levels = { 0: 'Free', 1: 'Basic', 2: 'Standard', 3: 'Premium', 4: 'Unlimited' };
    return levels[level] || 'Unknown';
};

const getAccessLevelColor = (level) => {
    const colors = { 0: '#6b7280', 1: '#3b82f6', 2: '#8b5cf6', 3: '#f59e0b', 4: '#10b981' };
    return colors[level] || '#6b7280';
};

const mapAccessLevelToString = (level) => {
    const map = {
        0: 'free',
        1: 'basic',
        2: 'standard',
        3: 'premium',
        4: 'unlimited',
    };
    if (typeof level === 'string') return level;
    return map[parseInt(level, 10)] || 'basic';
};

const defaultSubscriptionForm = {
    student: '',
    plan: '',
    start_date: '',
    end_date: '',
    price_paid: '',
    is_paid: false,
    assigned_teacher: '',
};

const defaultPlanForm = {
    name: '',
    description: '',
    duration: 'monthly',
    price: '',
    discount_price: '',
    max_courses: '10',
    max_lessons: '100',
    lessons_per_week: '',
    features: '',
    access_level: 'basic',
    can_download: false,
    can_access_live_sessions: false,
    priority_support: false,
    max_live_sessions_per_month: '0',
    max_audio_messages_per_month: '0',
    allowed_teachers: [],
};

const SubscriptionsManagement = () => {
    const [activeTab, setActiveTab] = useState('subscriptions');
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    const [assigningTeacher, setAssigningTeacher] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');

    const [formData, setFormData] = useState(defaultSubscriptionForm);
    const [planFormData, setPlanFormData] = useState(defaultPlanForm);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            let fetchedSubscriptions = [];
            let fetchedPlans = [];
            let fetchedStats = {};
            let fetchedStudents = [];
            let fetchedTeachers = [];

            try {
                const subsRes = await axios.get(`${baseUrl}/subscriptions/`);
                fetchedSubscriptions = subsRes.data.results || subsRes.data || [];
            } catch (err) {
                fetchedSubscriptions = [];
            }

            try {
                const plansRes = await axios.get(`${baseUrl}/subscription-plans/`);
                fetchedPlans = plansRes.data.results || plansRes.data || [];
            } catch (err) {
                fetchedPlans = [];
            }

            try {
                const statsRes = await axios.get(`${baseUrl}/admin/subscription-stats/`);
                fetchedStats = statsRes.data.stats || {};
            } catch (err) {
                fetchedStats = {
                    total_subscriptions: 0,
                    active_subscriptions: 0,
                    pending_subscriptions: 0,
                    total_revenue: 0,
                };
            }

            try {
                const studentsRes = await axios.get(`${baseUrl}/student/`);
                fetchedStudents = studentsRes.data.results || studentsRes.data || [];
            } catch (err) {
                fetchedStudents = [];
            }

            try {
                const teachersRes = await axios.get(`${baseUrl}/teacher/`);
                fetchedTeachers = teachersRes.data.results || teachersRes.data || [];
            } catch (err) {
                fetchedTeachers = [];
            }

            setSubscriptions(fetchedSubscriptions);
            setPlans(fetchedPlans);
            setStats(fetchedStats);
            setStudents(fetchedStudents);
            setTeachers(fetchedTeachers);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch subscription data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubscription = async () => {
        try {
            const payload = {
                student: parseInt(formData.student, 10),
                plan: parseInt(formData.plan, 10),
                start_date: formData.start_date,
                end_date: formData.end_date,
                price_paid: parseFloat(formData.price_paid) || 0,
                is_paid: formData.is_paid,
                status: 'pending',
                assigned_teacher: formData.assigned_teacher ? parseInt(formData.assigned_teacher, 10) : null,
            };

            const response = await axios.post(`${baseUrl}/subscriptions/`, payload);
            setSubscriptions([response.data, ...subscriptions]);
            setShowSubscriptionForm(false);
            setFormData(defaultSubscriptionForm);
            Alert.alert('Success', 'Subscription created successfully!');
        } catch (error) {
            Alert.alert(
                'Error',
                error.response?.data?.detail || error.response?.data?.student?.[0] || 'Error creating subscription.'
            );
        }
    };

    const savePlanPayload = () => ({
        name: planFormData.name.trim(),
        description: planFormData.description.trim(),
        duration: planFormData.duration,
        price: parseFloat(planFormData.price) || 0,
        discount_price:
            planFormData.discount_price && String(planFormData.discount_price).trim()
                ? parseFloat(planFormData.discount_price)
                : null,
        max_courses: parseInt(planFormData.max_courses, 10) || 10,
        max_lessons: parseInt(planFormData.max_lessons, 10) || 100,
        lessons_per_week:
            planFormData.lessons_per_week && String(planFormData.lessons_per_week).trim()
                ? parseInt(planFormData.lessons_per_week, 10)
                : null,
        features: planFormData.features.trim(),
        access_level: mapAccessLevelToString(planFormData.access_level),
        can_download: planFormData.can_download,
        can_access_live_sessions: planFormData.can_access_live_sessions,
        priority_support: planFormData.priority_support,
        max_live_sessions_per_month: parseInt(planFormData.max_live_sessions_per_month, 10) || 0,
        max_audio_messages_per_month: parseInt(planFormData.max_audio_messages_per_month, 10) || 0,
        allowed_teachers: planFormData.allowed_teachers,
        status: 'active',
    });

    const handleCreatePlan = async () => {
        try {
            const payload = savePlanPayload();
            const response = await axios.post(`${baseUrl}/subscription-plans/`, payload);
            setPlans([response.data, ...plans]);
            setShowPlanForm(false);
            setPlanFormData(defaultPlanForm);
            Alert.alert('Success', 'Plan created successfully!');
        } catch (error) {
            const errorMsg =
                error.response?.data?.detail ||
                Object.entries(error.response?.data || {})
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                    .join('; ') ||
                'Error creating plan.';
            Alert.alert('Error', errorMsg);
        }
    };

    const handleUpdatePlan = async () => {
        try {
            const payload = savePlanPayload();
            const response = await axios.put(`${baseUrl}/subscription-plan/${editingPlan.id}/`, payload);
            setPlans(plans.map((p) => (p.id === editingPlan.id ? response.data : p)));
            setShowPlanForm(false);
            setEditingPlan(null);
            setPlanFormData(defaultPlanForm);
            Alert.alert('Success', 'Plan updated successfully!');
        } catch (error) {
            Alert.alert(
                'Error',
                error.response?.data?.detail || error.response?.data?.price?.[0] || 'Error updating plan.'
            );
        }
    };

    const handleEditPlan = (plan) => {
        setEditingPlan(plan);
        setPlanFormData({
            name: plan.name || '',
            description: plan.description || '',
            duration: plan.duration || 'monthly',
            price: String(plan.price || ''),
            discount_price: plan.discount_price ? String(plan.discount_price) : '',
            max_courses: String(plan.max_courses ?? 10),
            max_lessons: String(plan.max_lessons ?? 100),
            lessons_per_week: plan.lessons_per_week ? String(plan.lessons_per_week) : '',
            features: plan.features || '',
            access_level: plan.access_level || 'basic',
            can_download: !!plan.can_download,
            can_access_live_sessions: !!plan.can_access_live_sessions,
            priority_support: !!plan.priority_support,
            max_live_sessions_per_month: String(plan.max_live_sessions_per_month ?? 0),
            max_audio_messages_per_month: String(plan.max_audio_messages_per_month ?? 0),
            allowed_teachers: plan.allowed_teachers || [],
        });
        setShowPlanForm(true);
    };

    const handleDeletePlan = (planId) => {
        Alert.alert('Delete Plan', 'Are you sure you want to delete this plan?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/subscription-plan/${planId}/`);
                        setPlans(plans.filter((p) => p.id !== planId));
                        Alert.alert('Success', 'Plan deleted successfully!');
                    } catch (error) {
                        Alert.alert('Error', error.response?.data?.detail || 'Error deleting plan.');
                    }
                },
            },
        ]);
    };

    const handleCancelEditPlan = () => {
        setShowPlanForm(false);
        setEditingPlan(null);
        setPlanFormData(defaultPlanForm);
    };

    const handleActivateSubscription = async (subscriptionId) => {
        try {
            const response = await axios.post(`${baseUrl}/subscription/${subscriptionId}/activate/`);
            if (response.data.bool) {
                setSubscriptions(
                    subscriptions.map((sub) =>
                        sub.id === subscriptionId
                            ? { ...sub, status: 'active', activated_at: response.data.subscription?.activated_at }
                            : sub
                    )
                );
                Alert.alert('Success', 'Subscription activated successfully!');
            }
        } catch (error) {
            Alert.alert('Error', 'Error activating subscription.');
        }
    };

    const handleCancelSubscription = (subscriptionId) => {
        Alert.alert('Cancel Subscription', 'Are you sure you want to cancel this subscription?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await axios.post(`${baseUrl}/subscription/${subscriptionId}/cancel/`);
                        if (response.data.bool) {
                            setSubscriptions(
                                subscriptions.map((sub) =>
                                    sub.id === subscriptionId ? { ...sub, status: 'cancelled' } : sub
                                )
                            );
                            Alert.alert('Success', 'Subscription cancelled successfully!');
                        }
                    } catch (error) {
                        Alert.alert('Error', 'Error cancelling subscription.');
                    }
                },
            },
        ]);
    };

    const handleAssignTeacher = async (subscriptionId) => {
        try {
            const response = await axios.post(`${baseUrl}/access/assign-teacher/`, {
                subscription_id: subscriptionId,
                teacher_id: selectedTeacher || null,
            });

            if (response.data.success) {
                Alert.alert('Success', response.data.message || 'Teacher assignment updated.');
                setAssigningTeacher(null);
                setSelectedTeacher('');
                fetchAllData();
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Error assigning teacher.');
        }
    };

    const viewSubscriptionDetails = (subscription) => {
        const details = [
            `Student: ${subscription.student_details?.fullname || 'N/A'}`,
            `Email: ${subscription.student_details?.email || 'N/A'}`,
            `Plan: ${subscription.plan_details?.name || 'N/A'}`,
            `Access Level: ${formatAccessLevel(subscription.plan_details?.access_level || 0)}`,
            `Status: ${subscription.status}`,
            `Start: ${subscription.start_date}`,
            `End: ${subscription.end_date}`,
            `Days Remaining: ${subscription.days_remaining || 0}`,
            `Price Paid: $${subscription.price_paid}`,
            `Assigned Teacher: ${subscription.assigned_teacher_details?.fullname || 'None'}`,
            '',
            `Courses: ${subscription.courses_accessed || 0}/${subscription.plan_details?.max_courses || '∞'}`,
            `Lessons: ${subscription.lessons_accessed || 0}/${subscription.plan_details?.max_lessons || '∞'}`,
            `Weekly: ${subscription.current_week_lessons || 0}/${subscription.plan_details?.lessons_per_week || '∞'}`,
        ].join('\n');

        Alert.alert('Subscription Details', details);
    };

    const filteredSubscriptions = useMemo(() => {
        let filtered = [...subscriptions];

        if (filterStatus !== 'all') {
            filtered = filtered.filter((sub) => sub.status === filterStatus);
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((sub) => {
                const studentName = sub.student_details?.fullname?.toLowerCase() || '';
                const studentEmail = sub.student_details?.email?.toLowerCase() || '';
                const planName = sub.plan_details?.name?.toLowerCase() || '';
                return (
                    studentName.includes(lower) || studentEmail.includes(lower) || planName.includes(lower)
                );
            });
        }

        return filtered;
    }, [subscriptions, filterStatus, searchTerm]);

    const toggleTeacherForPlan = (teacherId) => {
        const exists = planFormData.allowed_teachers.includes(teacherId);
        if (exists) {
            setPlanFormData({
                ...planFormData,
                allowed_teachers: planFormData.allowed_teachers.filter((id) => id !== teacherId),
            });
        } else {
            setPlanFormData({
                ...planFormData,
                allowed_teachers: [...planFormData.allowed_teachers, teacherId],
            });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading subscriptions..." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>Subscriptions Management</Text>

                <View style={styles.statsGrid}>
                    <StatCard label="Total" value={stats.total_subscriptions || 0} color="#2563eb" />
                    <StatCard label="Active" value={stats.active_subscriptions || 0} color="#16a34a" />
                    <StatCard label="Pending" value={stats.pending_subscriptions || 0} color="#f59e0b" />
                    <StatCard
                        label="Revenue"
                        value={`$${parseFloat(stats.total_revenue || 0).toFixed(2)}`}
                        color="#0891b2"
                    />
                </View>

                <View style={styles.tabRow}>
                    {['subscriptions', 'plans', 'history'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'subscriptions' && (
                    <>
                        <SectionHeader
                            title="Student Subscriptions"
                            buttonText={showSubscriptionForm ? 'Cancel' : 'Create Subscription'}
                            onPress={() => setShowSubscriptionForm(!showSubscriptionForm)}
                        />

                        {showSubscriptionForm && (
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>Create New Subscription</Text>
                                <SelectField
                                    label="Student"
                                    value={formData.student}
                                    options={students.map((s) => ({
                                        label: `${s.fullname} (${s.email})`,
                                        value: String(s.id),
                                    }))}
                                    onChange={(value) => setFormData({ ...formData, student: value })}
                                />
                                <SelectField
                                    label="Plan"
                                    value={formData.plan}
                                    options={plans.map((p) => ({
                                        label: `${p.name} - $${p.final_price}`,
                                        value: String(p.id),
                                    }))}
                                    onChange={(value) => setFormData({ ...formData, plan: value })}
                                />
                                <Field
                                    label="Start Date (YYYY-MM-DD)"
                                    value={formData.start_date}
                                    onChangeText={(value) => setFormData({ ...formData, start_date: value })}
                                />
                                <Field
                                    label="End Date (YYYY-MM-DD)"
                                    value={formData.end_date}
                                    onChangeText={(value) => setFormData({ ...formData, end_date: value })}
                                />
                                <Field
                                    label="Price Paid"
                                    value={formData.price_paid}
                                    keyboardType="numeric"
                                    onChangeText={(value) => setFormData({ ...formData, price_paid: value })}
                                />

                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>Mark as Paid</Text>
                                    <Switch
                                        value={formData.is_paid}
                                        onValueChange={(value) => setFormData({ ...formData, is_paid: value })}
                                    />
                                </View>

                                <SelectField
                                    label="Assigned Teacher (Optional)"
                                    value={formData.assigned_teacher}
                                    options={[
                                        { label: 'No Teacher Assigned', value: '' },
                                        ...teachers.map((t) => ({
                                            label: `${t.full_name} (${t.email})`,
                                            value: String(t.id),
                                        })),
                                    ]}
                                    onChange={(value) => setFormData({ ...formData, assigned_teacher: value })}
                                />

                                <PrimaryButton label="Create Subscription" onPress={handleCreateSubscription} />
                            </View>
                        )}

                        <Field
                            label="Search"
                            value={searchTerm}
                            placeholder="Search by student name/email"
                            onChangeText={setSearchTerm}
                        />

                        <View style={styles.filterRow}>
                            {['all', 'active', 'pending', 'cancelled', 'expired'].map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[styles.chip, filterStatus === status && styles.chipActive]}
                                    onPress={() => setFilterStatus(status)}
                                >
                                    <Text style={[styles.chipText, filterStatus === status && styles.chipTextActive]}>
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {filteredSubscriptions.length ? (
                            filteredSubscriptions.map((subscription) => (
                                <View key={subscription.id} style={styles.card}>
                                    <Text style={styles.cardTitle}>{subscription.student_details?.fullname || 'N/A'}</Text>
                                    <Text style={styles.cardSub}>{subscription.student_details?.email || ''}</Text>
                                    <Text style={styles.cardSub}>
                                        Plan: {subscription.plan_details?.name || 'N/A'} (${subscription.price_paid})
                                    </Text>

                                    <View style={styles.badgesRow}>
                                        <View
                                            style={[
                                                styles.badge,
                                                { backgroundColor: getAccessLevelColor(subscription.plan_details?.access_level || 0) },
                                            ]}
                                        >
                                            <Text style={styles.badgeText}>
                                                {formatAccessLevel(subscription.plan_details?.access_level || 0)}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.badge,
                                                subscription.status === 'active'
                                                    ? styles.success
                                                    : subscription.status === 'pending'
                                                    ? styles.warning
                                                    : subscription.status === 'cancelled'
                                                    ? styles.danger
                                                    : styles.secondary,
                                            ]}
                                        >
                                            <Text style={styles.badgeText}>{subscription.status}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.cardSub}>
                                        Teacher: {subscription.assigned_teacher_details?.fullname || 'Not Assigned'}
                                    </Text>
                                    <Text style={styles.cardSub}>
                                        Days: {subscription.is_active_status ? `${subscription.days_remaining} days` : 'Expired'}
                                    </Text>
                                    <Text style={styles.cardSub}>
                                        Usage: Courses {subscription.courses_accessed || 0}/{subscription.plan_details?.max_courses || '∞'}
                                    </Text>
                                    <Text style={styles.cardSub}>
                                        Lessons {subscription.lessons_accessed || 0}/{subscription.plan_details?.max_lessons || '∞'}
                                    </Text>

                                    <View style={styles.actionWrap}>
                                        {subscription.status === 'pending' && (
                                            <MiniButton
                                                label="Activate"
                                                style={styles.success}
                                                onPress={() => handleActivateSubscription(subscription.id)}
                                            />
                                        )}
                                        {subscription.status === 'active' && (
                                            <>
                                                <MiniButton
                                                    label="Assign Teacher"
                                                    style={styles.info}
                                                    onPress={() => {
                                                        setAssigningTeacher(subscription.id);
                                                        setSelectedTeacher(
                                                            subscription.assigned_teacher_details?.id
                                                                ? String(subscription.assigned_teacher_details.id)
                                                                : ''
                                                        );
                                                    }}
                                                />
                                                <MiniButton
                                                    label="Cancel"
                                                    style={styles.danger}
                                                    onPress={() => handleCancelSubscription(subscription.id)}
                                                />
                                            </>
                                        )}
                                        <MiniButton
                                            label="Details"
                                            style={styles.secondary}
                                            onPress={() => viewSubscriptionDetails(subscription)}
                                        />
                                    </View>

                                    {assigningTeacher === subscription.id && (
                                        <View style={styles.assignmentBox}>
                                            <Text style={styles.assignmentTitle}>Assign Teacher</Text>
                                            <SelectField
                                                label="Teacher"
                                                value={selectedTeacher}
                                                options={[
                                                    { label: 'No Teacher Assigned', value: '' },
                                                    ...teachers.map((t) => ({
                                                        label: t.full_name,
                                                        value: String(t.id),
                                                    })),
                                                ]}
                                                onChange={setSelectedTeacher}
                                            />
                                            <View style={styles.rowButtons}>
                                                <MiniButton
                                                    label="Save"
                                                    style={styles.info}
                                                    onPress={() => handleAssignTeacher(subscription.id)}
                                                />
                                                <MiniButton
                                                    label="Close"
                                                    style={styles.secondary}
                                                    onPress={() => {
                                                        setAssigningTeacher(null);
                                                        setSelectedTeacher('');
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.empty}>No subscriptions found</Text>
                        )}
                    </>
                )}

                {activeTab === 'plans' && (
                    <>
                        <SectionHeader
                            title="Subscription Plans"
                            buttonText={editingPlan ? 'Cancel Edit' : showPlanForm ? 'Cancel' : 'Create Plan'}
                            onPress={() => {
                                if (editingPlan) {
                                    handleCancelEditPlan();
                                } else {
                                    setShowPlanForm(!showPlanForm);
                                }
                            }}
                        />

                        {showPlanForm && (
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</Text>
                                <Field
                                    label="Plan Name"
                                    value={planFormData.name}
                                    onChangeText={(value) => setPlanFormData({ ...planFormData, name: value })}
                                />
                                <SelectField
                                    label="Duration"
                                    value={planFormData.duration}
                                    options={[
                                        { label: 'Monthly', value: 'monthly' },
                                        { label: 'Quarterly', value: 'quarterly' },
                                        { label: 'Semi-Annual', value: 'semi_annual' },
                                        { label: 'Annual', value: 'annual' },
                                    ]}
                                    onChange={(value) => setPlanFormData({ ...planFormData, duration: value })}
                                />
                                <Field
                                    label="Description"
                                    value={planFormData.description}
                                    multiline
                                    onChangeText={(value) => setPlanFormData({ ...planFormData, description: value })}
                                />
                                <Field
                                    label="Price"
                                    value={planFormData.price}
                                    keyboardType="numeric"
                                    onChangeText={(value) => setPlanFormData({ ...planFormData, price: value })}
                                />
                                <Field
                                    label="Discount Price"
                                    value={planFormData.discount_price}
                                    keyboardType="numeric"
                                    onChangeText={(value) =>
                                        setPlanFormData({ ...planFormData, discount_price: value })
                                    }
                                />
                                <Field
                                    label="Max Courses"
                                    value={planFormData.max_courses}
                                    keyboardType="numeric"
                                    onChangeText={(value) => setPlanFormData({ ...planFormData, max_courses: value })}
                                />
                                <Field
                                    label="Max Lessons"
                                    value={planFormData.max_lessons}
                                    keyboardType="numeric"
                                    onChangeText={(value) => setPlanFormData({ ...planFormData, max_lessons: value })}
                                />
                                <Field
                                    label="Lessons Per Week"
                                    value={planFormData.lessons_per_week}
                                    keyboardType="numeric"
                                    onChangeText={(value) =>
                                        setPlanFormData({ ...planFormData, lessons_per_week: value })
                                    }
                                />
                                <SelectField
                                    label="Access Level"
                                    value={String(planFormData.access_level)}
                                    options={[
                                        { label: 'Free', value: 'free' },
                                        { label: 'Basic', value: 'basic' },
                                        { label: 'Standard', value: 'standard' },
                                        { label: 'Premium', value: 'premium' },
                                        { label: 'Unlimited', value: 'unlimited' },
                                    ]}
                                    onChange={(value) => setPlanFormData({ ...planFormData, access_level: value })}
                                />
                                <Field
                                    label="Features (comma-separated)"
                                    value={planFormData.features}
                                    onChangeText={(value) => setPlanFormData({ ...planFormData, features: value })}
                                />

                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>Download Content</Text>
                                    <Switch
                                        value={planFormData.can_download}
                                        onValueChange={(value) =>
                                            setPlanFormData({ ...planFormData, can_download: value })
                                        }
                                    />
                                </View>
                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>Live Sessions</Text>
                                    <Switch
                                        value={planFormData.can_access_live_sessions}
                                        onValueChange={(value) =>
                                            setPlanFormData({ ...planFormData, can_access_live_sessions: value })
                                        }
                                    />
                                </View>
                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>Priority Support</Text>
                                    <Switch
                                        value={planFormData.priority_support}
                                        onValueChange={(value) =>
                                            setPlanFormData({ ...planFormData, priority_support: value })
                                        }
                                    />
                                </View>

                                <Field
                                    label="Max Live Sessions / Month"
                                    value={planFormData.max_live_sessions_per_month}
                                    keyboardType="numeric"
                                    onChangeText={(value) =>
                                        setPlanFormData({ ...planFormData, max_live_sessions_per_month: value })
                                    }
                                />
                                <Field
                                    label="Max Audio Messages / Month"
                                    value={planFormData.max_audio_messages_per_month}
                                    keyboardType="numeric"
                                    onChangeText={(value) =>
                                        setPlanFormData({ ...planFormData, max_audio_messages_per_month: value })
                                    }
                                />

                                <Text style={styles.fieldLabel}>Allowed Teachers (empty = all)</Text>
                                <View style={styles.teacherListBox}>
                                    {teachers.length === 0 ? (
                                        <Text style={styles.smallMuted}>No teachers available</Text>
                                    ) : (
                                        teachers.map((teacher) => {
                                            const selected = planFormData.allowed_teachers.includes(teacher.id);
                                            return (
                                                <TouchableOpacity
                                                    key={teacher.id}
                                                    style={styles.teacherItem}
                                                    onPress={() => toggleTeacherForPlan(teacher.id)}
                                                >
                                                    <View
                                                        style={[
                                                            styles.checkbox,
                                                            selected && styles.checkboxSelected,
                                                        ]}
                                                    />
                                                    <Text style={styles.teacherItemText}>
                                                        {teacher.full_name || `Teacher #${teacher.id}`}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </View>

                                <PrimaryButton
                                    label={editingPlan ? 'Update Plan' : 'Create Plan'}
                                    onPress={editingPlan ? handleUpdatePlan : handleCreatePlan}
                                />
                            </View>
                        )}

                        {plans.length ? (
                            plans.map((plan) => (
                                <View key={plan.id} style={styles.card}>
                                    <View style={styles.cardHeadRow}>
                                        <Text style={styles.cardTitle}>{plan.name}</Text>
                                        <View
                                            style={[
                                                styles.badge,
                                                { backgroundColor: getAccessLevelColor(plan.access_level || 0) },
                                            ]}
                                        >
                                            <Text style={styles.badgeText}>
                                                {formatAccessLevel(plan.access_level || 0)}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.cardSub}>{plan.description}</Text>
                                    <Text style={styles.priceText}>
                                        ${plan.final_price} / {plan.duration}
                                    </Text>
                                    {!!plan.discount_price && (
                                        <Text style={styles.saveText}>
                                            Save ${(plan.price - plan.discount_price).toFixed(2)}
                                        </Text>
                                    )}

                                    <Text style={styles.cardSub}>Max Courses: {plan.max_courses}</Text>
                                    <Text style={styles.cardSub}>Max Lessons: {plan.max_lessons}</Text>
                                    {!!plan.lessons_per_week && (
                                        <Text style={styles.cardSub}>Lessons/Week: {plan.lessons_per_week}</Text>
                                    )}

                                    <Text style={styles.cardSub}>
                                        Features:{' '}
                                        {plan.features_list && plan.features_list.length
                                            ? plan.features_list.join(', ')
                                            : plan.features || 'N/A'}
                                    </Text>

                                    {plan.allowed_teachers && plan.allowed_teachers.length > 0 && (
                                        <Text style={styles.cardSub}>
                                            Allowed Teachers:{' '}
                                            {plan.allowed_teachers
                                                .map((tid) => {
                                                    const teacher = teachers.find((t) => t.id === tid);
                                                    return teacher ? teacher.full_name : `Teacher #${tid}`;
                                                })
                                                .join(', ')}
                                        </Text>
                                    )}

                                    <View style={styles.actionWrap}>
                                        <MiniButton
                                            label="Edit"
                                            style={styles.warning}
                                            onPress={() => handleEditPlan(plan)}
                                        />
                                        <MiniButton
                                            label="Delete"
                                            style={styles.danger}
                                            onPress={() => handleDeletePlan(plan.id)}
                                        />
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.empty}>No plans found</Text>
                        )}
                    </>
                )}

                {activeTab === 'history' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Subscription History</Text>
                        <Text style={styles.cardSub}>
                            Subscription history is currently being fetched and displayed.
                        </Text>
                        <Text style={styles.cardSub}>
                            History tracking for subscription changes will appear here.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const SectionHeader = ({ title, buttonText, onPress }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.sectionButton} onPress={onPress}>
            <Text style={styles.sectionButtonText}>{buttonText}</Text>
        </TouchableOpacity>
    </View>
);

const StatCard = ({ label, value, color }) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={styles.fieldWrap}>
        {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
        <TextInput
            style={[styles.input, multiline && styles.inputMultiline]}
            value={value}
            placeholder={placeholder}
            keyboardType={keyboardType}
            onChangeText={onChangeText}
            multiline={multiline}
        />
    </View>
);

const SelectField = ({ label, value, options, onChange }) => (
    <View style={styles.fieldWrap}>
        {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
        <View style={styles.selectBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.selectOptionsRow}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={`${label}-${opt.value}`}
                            style={[styles.optionChip, String(value) === String(opt.value) && styles.optionChipActive]}
                            onPress={() => onChange(opt.value)}
                        >
                            <Text
                                style={[
                                    styles.optionChipText,
                                    String(value) === String(opt.value) && styles.optionChipTextActive,
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    </View>
);

const PrimaryButton = ({ label, onPress }) => (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress}>
        <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
);

const MiniButton = ({ label, style, onPress }) => (
    <TouchableOpacity style={[styles.miniButton, style]} onPress={onPress}>
        <Text style={styles.miniButtonText}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        padding: 14,
        paddingBottom: 30,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        color: '#2c3e50',
        fontWeight: '700',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statCard: {
        width: '48%',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    statLabel: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    tabRow: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    tabButton: {
        flex: 1,
        backgroundColor: '#e5e7eb',
        paddingVertical: 9,
        borderRadius: 8,
        marginRight: 6,
        alignItems: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#007bff',
    },
    tabText: {
        color: '#374151',
        fontSize: 12,
        fontWeight: '700',
    },
    tabTextActive: {
        color: '#fff',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        color: '#2c3e50',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    sectionButton: {
        backgroundColor: '#0056b3',
        borderRadius: 8,
        paddingVertical: 9,
        paddingHorizontal: 12,
    },
    sectionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    formTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    fieldWrap: {
        marginBottom: 10,
    },
    fieldLabel: {
        fontSize: 12,
        color: '#374151',
        marginBottom: 5,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingVertical: 9,
        paddingHorizontal: 10,
    },
    inputMultiline: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingVertical: 4,
    },
    switchLabel: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: '#16a34a',
        borderRadius: 8,
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    selectBox: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingVertical: 6,
    },
    selectOptionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 6,
    },
    optionChip: {
        backgroundColor: '#eff6ff',
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 999,
        marginRight: 6,
    },
    optionChipActive: {
        backgroundColor: '#2563eb',
    },
    optionChipText: {
        color: '#1e40af',
        fontSize: 11,
        fontWeight: '600',
    },
    optionChipTextActive: {
        color: '#fff',
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    chip: {
        backgroundColor: '#e5e7eb',
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 6,
        marginBottom: 6,
    },
    chipActive: {
        backgroundColor: '#1d4ed8',
    },
    chipText: {
        color: '#374151',
        fontSize: 11,
        textTransform: 'capitalize',
    },
    chipTextActive: {
        color: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    cardSub: {
        fontSize: 12,
        color: '#4b5563',
        marginTop: 4,
    },
    cardHeadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceText: {
        marginTop: 6,
        color: '#2563eb',
        fontWeight: '700',
        fontSize: 16,
    },
    saveText: {
        marginTop: 4,
        color: '#16a34a',
        fontSize: 12,
        fontWeight: '600',
    },
    badgesRow: {
        flexDirection: 'row',
        marginTop: 6,
        marginBottom: 4,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 9,
        borderRadius: 999,
        marginRight: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    actionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    miniButton: {
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 6,
        marginBottom: 6,
    },
    miniButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    assignmentBox: {
        marginTop: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 8,
    },
    assignmentTitle: {
        fontWeight: '700',
        fontSize: 12,
        color: '#1f2937',
        marginBottom: 6,
    },
    rowButtons: {
        flexDirection: 'row',
        marginTop: 4,
    },
    teacherListBox: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 8,
        marginBottom: 10,
    },
    teacherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 7,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#9ca3af',
        marginRight: 8,
        backgroundColor: '#fff',
    },
    checkboxSelected: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    teacherItemText: {
        fontSize: 12,
        color: '#374151',
    },
    smallMuted: {
        fontSize: 12,
        color: '#9ca3af',
    },
    empty: {
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 12,
    },
    success: {
        backgroundColor: '#16a34a',
    },
    warning: {
        backgroundColor: '#f59e0b',
    },
    danger: {
        backgroundColor: '#dc2626',
    },
    secondary: {
        backgroundColor: '#6b7280',
    },
    info: {
        backgroundColor: '#0891b2',
    },
});

export default SubscriptionsManagement;
