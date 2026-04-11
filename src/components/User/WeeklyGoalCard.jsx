import React, { useState } from 'react';
import axios from 'axios';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const WeeklyGoalCard = ({ weeklyGoal, studentId, onGoalUpdate }) => {
    const [showModal, setShowModal] = useState(false);
    const [goalType, setGoalType] = useState(weeklyGoal?.goal_type || 'lessons');
    const [targetValue, setTargetValue] = useState(weeklyGoal?.target_value || 5);
    const [saving, setSaving] = useState(false);

    const goalTypeLabels = {
        'lessons': { label: 'Lessons', icon: 'book', unit: 'lessons' },
        'minutes': { label: 'Minutes', icon: 'clock', unit: 'minutes' },
        'courses': { label: 'Courses', icon: 'mortarboard', unit: 'courses' }
    };

    const currentGoal = goalTypeLabels[weeklyGoal?.goal_type || 'lessons'];
    const progressPercentage = weeklyGoal?.progress_percentage || 0;
    const currentValue = weeklyGoal?.current_value || 0;
    const target = weeklyGoal?.target_value || 5;

    const handleSaveGoal = async () => {
        setSaving(true);
        try {
            const response = await axios.post(`${baseUrl}/student/create-weekly-goal/${studentId}/`, {
                goal_type: goalType,
                target_value: targetValue
            });

            if (response.data.bool) {
                Alert.alert('Goal Updated!', 'Your weekly goal has been set.');
                setShowModal(false);
                if (onGoalUpdate) onGoalUpdate();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update goal. Please try again.');
        }
        setSaving(false);
    };

    const getMotivationalMessage = () => {
        if (progressPercentage >= 100) return '🎉 Goal achieved! Amazing work!';
        if (progressPercentage >= 75) return 'Almost there! Keep pushing!';
        if (progressPercentage >= 50) return 'Halfway through! You got this!';
        if (progressPercentage >= 25) return 'Great start! Keep it up!';
        return "Let's crush this week's goal!";
    };

    const maxTarget = goalType === 'minutes' ? 300 : 20;
    const targetLeft = Math.max(target - currentValue, 0);

    return (
        <>
            <View style={styles.card}>
                <View style={styles.cardBody}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <View style={styles.titleRow}>
                                <Bootstrap name={currentGoal.icon} size={16} color="#2563eb" />
                                <Text style={styles.cardTitle}>Weekly Goal</Text>
                            </View>
                            <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
                        </View>
                        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowModal(true)}>
                            <Bootstrap name="gear" size={14} color="#2563eb" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.progressCenterWrap}>
                        <View style={styles.circularProgress}>
                            <View style={styles.circularProgressInner}>
                                <Text style={styles.progressValue}>{currentValue}</Text>
                                <Text style={styles.progressDivider}>/</Text>
                                <Text style={styles.progressTarget}>{target}</Text>
                            </View>
                        </View>
                        <View style={styles.goalBadge}>
                            <Text style={styles.goalBadgeText}>{currentGoal.label}</Text>
                        </View>
                    </View>

                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                progressPercentage >= 100 ? styles.progressFillSuccess : styles.progressFillPrimary,
                                { width: `${Math.min(progressPercentage, 100)}%` },
                            ]}
                        />
                    </View>

                    <View style={styles.progressMetaRow}>
                        <Text style={styles.metaText}>{progressPercentage}% complete</Text>
                        <Text style={styles.metaText}>{targetLeft} {currentGoal.unit} left</Text>
                    </View>

                    {weeklyGoal?.is_achieved && (
                        <View style={styles.achievedAlert}>
                            <Bootstrap name="trophy-fill" size={14} color="#15803d" />
                            <Text style={styles.achievedAlertText}>Goal Achieved!</Text>
                        </View>
                    )}
                </View>
            </View>

            <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalDialog}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Set Weekly Goal</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Bootstrap name="x-lg" size={16} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.fieldBlock}>
                                <Text style={styles.fieldLabel}>Goal Type</Text>
                                <View style={styles.goalTypeGrid}>
                                    {Object.entries(goalTypeLabels).map(([key, value]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[styles.goalTypeOption, goalType === key ? styles.goalTypeOptionActive : null]}
                                            onPress={() => setGoalType(key)}
                                        >
                                            <Bootstrap name={value.icon} size={14} color={goalType === key ? '#fff' : '#4b5563'} />
                                            <Text style={[styles.goalTypeText, goalType === key ? styles.goalTypeTextActive : null]}>{value.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.fieldBlock}>
                                <Text style={styles.fieldLabel}>Target ({goalTypeLabels[goalType].unit} per week)</Text>
                                <TextInput
                                    value={String(targetValue)}
                                    onChangeText={(value) => {
                                        const numericValue = parseInt(value || '0', 10);
                                        if (!Number.isNaN(numericValue)) {
                                            const clamped = Math.min(Math.max(numericValue, 1), maxTarget);
                                            setTargetValue(clamped);
                                        } else if (value === '') {
                                            setTargetValue(1);
                                        }
                                    }}
                                    keyboardType="numeric"
                                    style={styles.targetInput}
                                />
                                <View style={styles.targetMetaRow}>
                                    <View style={styles.targetBadge}>
                                        <Text style={styles.targetBadgeText}>{targetValue}</Text>
                                    </View>
                                    <Text style={styles.targetUnitText}>{goalTypeLabels[goalType].unit}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]} onPress={handleSaveGoal} disabled={saving}>
                                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Goal'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardBody: {
        padding: 16,
        backgroundColor: '#f0f9ff',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
        paddingRight: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    motivationalText: {
        color: '#6b7280',
        fontSize: 12,
    },
    settingsButton: {
        width: 30,
        height: 30,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#93c5fd',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
    },
    progressCenterWrap: {
        alignItems: 'center',
        marginBottom: 12,
    },
    circularProgress: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e5e7eb',
    },
    circularProgressInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#4f46e5',
        lineHeight: 30,
    },
    progressDivider: {
        fontSize: 14,
        color: '#9ca3af',
        marginVertical: 2,
        lineHeight: 16,
    },
    progressTarget: {
        fontSize: 16,
        color: '#6b7280',
    },
    goalBadge: {
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    goalBadgeText: {
        color: '#111827',
        fontSize: 12,
        fontWeight: '500',
    },
    progressTrack: {
        height: 10,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 8,
    },
    progressFillPrimary: {
        backgroundColor: '#3b82f6',
    },
    progressFillSuccess: {
        backgroundColor: '#22c55e',
    },
    progressMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaText: {
        color: '#6b7280',
        fontSize: 12,
    },
    achievedAlert: {
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#dcfce7',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    achievedAlertText: {
        color: '#166534',
        fontWeight: '600',
        fontSize: 13,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    modalDialog: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalHeader: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    modalBody: {
        padding: 16,
    },
    fieldBlock: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    goalTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    goalTypeOption: {
        width: '48%',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#fff',
    },
    goalTypeOptionActive: {
        borderColor: '#4f46e5',
        backgroundColor: '#4f46e5',
    },
    goalTypeText: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '500',
    },
    goalTypeTextActive: {
        color: '#fff',
    },
    targetInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
    },
    targetMetaRow: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    targetBadge: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    targetBadgeText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    targetUnitText: {
        color: '#6b7280',
        fontSize: 14,
    },
    modalFooter: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    cancelButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '500',
    },
    saveButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#2563eb',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default WeeklyGoalCard;
