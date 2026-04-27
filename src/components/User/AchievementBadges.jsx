import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bootstrap } from '../shared/BootstrapIcon';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const AchievementBadges = ({ studentId, compact = false }) => {
    const navigation = useNavigation();
    const openMyAchievements = () => {
        navigation.navigate('MyAchievements');
    };
    const [achievementData, setAchievementData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAchievement, setSelectedAchievement] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchAchievements();
        }
    }, [studentId]);

    const fetchAchievements = async () => {
        try {
            const response = await axios.get(`${baseUrl}/student/all-achievements/${studentId}/`);
            setAchievementData(response.data);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            setAchievementData({
                achievements: [],
                total_earned: 0,
                total_available: 0,
                total_points: 0,
                completion_percentage: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const getAchievementIcon = (achievement, size = 28, color = '#fff') => {
        if (achievement.icon) {
            return <Image source={{ uri: achievement.icon }} style={{ width: size, height: size, resizeMode: 'contain' }} />;
        }

        const typeIcons = {
            completion: 'trophy-fill',
            quiz_master: 'mortarboard-fill',
            time_spent: 'clock-fill',
            first_steps: 'star-fill',
            social: 'people-fill'
        };

        return <Bootstrap name={typeIcons[achievement.achievement_type] || 'award-fill'} size={size} color={color} />;
    };

    const getTypeGradient = (type) => {
        const gradients = {
            completion: '#ffd700',
            quiz_master: '#9b59b6',
            time_spent: '#3498db',
            first_steps: '#2ecc71',
            social: '#e74c3c'
        };
        return gradients[type] || '#95a5a6';
    };

    if (loading) {
        return (
            <View style={[styles.achievementBadgesCard, styles.loadingCard]}>
                <LoadingSpinner size="sm" />
            </View>
        );
    }

    if (compact) {
        const earnedAchievements = achievementData?.achievements?.filter((a) => a.is_earned) || [];
        const displayAchievements = earnedAchievements.slice(0, 5);

        return (
            <View style={styles.achievementBadgesCompact}>
                <View style={styles.compactHeader}>
                    <View style={styles.compactTitle}>
                        <Bootstrap name="award-fill" size={20} color="#FFA500" />
                        <Text style={styles.compactTitleText}>Achievements</Text>
                    </View>
                    <View style={styles.compactStats}>
                        <View style={styles.pointsBadge}>
                            <Bootstrap name="star-fill" size={12} color="#FFA500" />
                            <Text style={styles.pointsBadgeText}>{achievementData?.total_points || 0} pts</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.compactBadges}>
                    {displayAchievements.length > 0 ? (
                        displayAchievements.map((achievement) => (
                            <TouchableOpacity
                                key={achievement.id}
                                style={[styles.compactBadge, { backgroundColor: getTypeGradient(achievement.achievement_type) }]}
                                onPress={() => setSelectedAchievement(achievement)}
                            >
                                {getAchievementIcon(achievement, 22)}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.noBadgesMessage}>
                            <Bootstrap name="emoji-smile" size={20} color="#6B7280" />
                            <Text style={styles.noBadgesText}>Start learning to earn badges!</Text>
                        </View>
                    )}

                    {earnedAchievements.length > 5 && (
                        <TouchableOpacity style={styles.moreBadges} onPress={openMyAchievements}>
                            <Text style={styles.moreBadgesText}>+{earnedAchievements.length - 5}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.compactProgress}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressInfoText}>{achievementData?.total_earned || 0}/{achievementData?.total_available || 0} unlocked</Text>
                        <Text style={styles.progressInfoText}>{achievementData?.completion_percentage || 0}%</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${achievementData?.completion_percentage || 0}%` }
                            ]}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.viewAllBtn} onPress={openMyAchievements}>
                    <Text style={styles.viewAllBtnText}>View All Achievements</Text>
                    <Bootstrap name="arrow-right" size={14} color="#374151" />
                </TouchableOpacity>

                <Modal visible={!!selectedAchievement} transparent animationType="fade" onRequestClose={() => setSelectedAchievement(null)}>
                    <TouchableOpacity style={styles.achievementModalOverlay} activeOpacity={1} onPress={() => setSelectedAchievement(null)}>
                        {selectedAchievement && (
                            <TouchableOpacity style={styles.achievementModal} activeOpacity={1} onPress={() => {}}>
                                <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedAchievement(null)}>
                                    <Bootstrap name="x-lg" size={14} color="#6B7280" />
                                </TouchableOpacity>
                                <View style={[styles.modalBadge, { backgroundColor: getTypeGradient(selectedAchievement.achievement_type) }]}>
                                    {getAchievementIcon(selectedAchievement, 48)}
                                </View>
                                <Text style={styles.modalTitle}>{selectedAchievement.name}</Text>
                                <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>
                                <View style={styles.modalMeta}>
                                    <View style={styles.modalMetaItem}>
                                        <Bootstrap name="star-fill" size={14} color="#FFA500" />
                                        <Text style={styles.pointsText}>{selectedAchievement.points} points</Text>
                                    </View>
                                    {selectedAchievement.earned_at && (
                                        <View style={styles.modalMetaItem}>
                                            <Bootstrap name="calendar-check" size={14} color="#6B7280" />
                                            <Text style={styles.earnedDateText}>Earned: {new Date(selectedAchievement.earned_at).toLocaleDateString()}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    }

    return (
        <View style={styles.achievementBadgesCard}>
            <View style={styles.badgesHeader}>
                <View style={styles.headerTitle}>
                    <Bootstrap name="award-fill" size={24} color="#FFA500" />
                    <Text style={styles.headerTitleText}>Achievement Badges</Text>
                </View>
                <View style={styles.headerStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{achievementData?.total_earned || 0}</Text>
                        <Text style={styles.statLabel}>Earned</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{achievementData?.total_points || 0}</Text>
                        <Text style={styles.statLabel}>Points</Text>
                    </View>
                </View>
            </View>

            <View style={styles.badgesProgress}>
                <View style={styles.progressText}>
                    <Text style={styles.progressTextValue}>Collection Progress</Text>
                    <Text style={styles.progressTextValue}>{achievementData?.completion_percentage || 0}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                    <View
                        style={[
                            styles.progressBarFill,
                            styles.progressBarFillRainbow,
                            { width: `${achievementData?.completion_percentage || 0}%` }
                        ]}
                    />
                </View>
            </View>

            <View style={styles.badgesGrid}>
                {achievementData?.achievements?.map((achievement) => (
                    <TouchableOpacity
                        key={achievement.id}
                        style={[
                            styles.badgeItem,
                            achievement.is_earned ? styles.badgeItemEarned : styles.badgeItemLocked
                        ]}
                        onPress={() => setSelectedAchievement(achievement)}
                    >
                        <View
                            style={[
                                styles.badgeIcon,
                                { backgroundColor: achievement.is_earned ? getTypeGradient(achievement.achievement_type) : '#2a2a2a' }
                            ]}
                        >
                            {achievement.is_earned ? (
                                getAchievementIcon(achievement, 28)
                            ) : (
                                <Bootstrap name="lock-fill" size={28} color="#fff" />
                            )}
                            {achievement.is_earned && (
                                <View style={styles.earnedCheck}>
                                    <Bootstrap name="check-circle-fill" size={12} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                        <View style={styles.badgeInfo}>
                            <Text style={styles.badgeName}>{achievement.name}</Text>
                            <View style={styles.badgePoints}>
                                <Bootstrap name="star-fill" size={10} color="#FFA500" />
                                <Text style={styles.badgePointsText}>{achievement.points} pts</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <Modal visible={!!selectedAchievement} transparent animationType="fade" onRequestClose={() => setSelectedAchievement(null)}>
                <TouchableOpacity style={styles.achievementModalOverlay} activeOpacity={1} onPress={() => setSelectedAchievement(null)}>
                    {selectedAchievement && (
                        <TouchableOpacity style={styles.achievementModal} activeOpacity={1} onPress={() => {}}>
                            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedAchievement(null)}>
                                <Bootstrap name="x-lg" size={14} color="#6B7280" />
                            </TouchableOpacity>
                            <View
                                style={[
                                    styles.modalBadge,
                                    { backgroundColor: selectedAchievement.is_earned ? getTypeGradient(selectedAchievement.achievement_type) : '#2a2a2a' }
                                ]}
                            >
                                {selectedAchievement.is_earned ? (
                                    getAchievementIcon(selectedAchievement, 48)
                                ) : (
                                    <Bootstrap name="lock-fill" size={48} color="#fff" />
                                )}
                            </View>
                            <Text style={styles.modalTitle}>{selectedAchievement.name}</Text>
                            <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>
                            {!selectedAchievement.is_earned && (
                                <View style={styles.requirementBadge}>
                                    <Bootstrap name="target" size={13} color="#374151" />
                                    <Text style={styles.requirementBadgeText}>Requirement: {selectedAchievement.requirement_value}</Text>
                                </View>
                            )}
                            <View style={styles.modalMeta}>
                                <View style={styles.modalMetaItem}>
                                    <Bootstrap name="star-fill" size={14} color="#FFA500" />
                                    <Text style={styles.pointsText}>{selectedAchievement.points} points</Text>
                                </View>
                                {selectedAchievement.earned_at && (
                                    <View style={styles.modalMetaItem}>
                                        <Bootstrap name="calendar-check" size={14} color="#6B7280" />
                                        <Text style={styles.earnedDateText}>Earned: {new Date(selectedAchievement.earned_at).toLocaleDateString()}</Text>
                                    </View>
                                )}
                            </View>
                            {!selectedAchievement.is_earned && (
                                <View style={styles.unlockHint}>
                                    <Bootstrap name="lightbulb" size={16} color="#1E40AF" />
                                    <Text style={styles.unlockHintText}>Keep learning to unlock this achievement!</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    achievementBadgesCompact: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderLeftWidth: 4,
        borderLeftColor: '#FFA500',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    compactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    compactTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    compactTitleText: {
        fontWeight: '600',
        fontSize: 16,
        color: '#111827',
    },
    compactStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 165, 0, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 165, 0, 0.3)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    pointsBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
    },
    compactBadges: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    compactBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    noBadgesMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    noBadgesText: {
        color: '#6B7280',
        fontSize: 13,
    },
    moreBadges: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    moreBadgesText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
    },
    compactProgress: {
        marginBottom: 16,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressInfoText: {
        fontSize: 12,
        color: '#6B7280',
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ffd700',
        borderRadius: 3,
    },
    progressBarFillRainbow: {
        backgroundColor: '#9b59b6',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
    },
    viewAllBtnText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '500',
    },
    achievementBadgesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderLeftWidth: 4,
        borderLeftColor: '#FFA500',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    loadingCard: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    badgesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    headerStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFA500',
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E5E7EB',
    },
    badgesProgress: {
        marginBottom: 24,
    },
    progressText: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressTextValue: {
        fontSize: 13,
        color: '#374151',
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    badgeItem: {
        width: '30%',
        minWidth: 110,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    badgeItemEarned: {
        borderColor: 'rgba(255, 165, 0, 0.3)',
        backgroundColor: 'rgba(255, 165, 0, 0.04)',
    },
    badgeItemLocked: {
        opacity: 0.6,
    },
    badgeIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    earnedCheck: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 22,
        height: 22,
        backgroundColor: '#10B981',
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    badgeInfo: {
        alignItems: 'center',
    },
    badgeName: {
        fontSize: 13,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
        textAlign: 'center',
    },
    badgePoints: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    badgePointsText: {
        fontSize: 11,
        color: '#6B7280',
    },
    achievementModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    achievementModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        width: '90%',
        maxWidth: 360,
        alignItems: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 60,
        elevation: 8,
    },
    modalClose: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#F3F4F6',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 8,
    },
    modalTitle: {
        color: '#111827',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalDescription: {
        color: '#6B7280',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 21,
        textAlign: 'center',
    },
    requirementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F9FAFB',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    requirementBadgeText: {
        fontSize: 13,
        color: '#374151',
    },
    modalMeta: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    modalMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pointsText: {
        color: '#FFA500',
        fontSize: 13,
    },
    earnedDateText: {
        color: '#6B7280',
        fontSize: 13,
    },
    unlockHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    unlockHintText: {
        fontSize: 13,
        color: '#1E40AF',
    },
});

export default AchievementBadges;
