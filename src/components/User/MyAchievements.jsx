import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyAchievements = () => {
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
    const [achievements, setAchievements] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 768);

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

    const fetchAchievements = async () => {
        if (!studentId) return;

        try {
            const [earned, all] = await Promise.all([
                axios.get(`${baseUrl}/student/achievements/${studentId}/`),
                axios.get(`${baseUrl}/achievements/`),
            ]);
            setAchievements(Array.isArray(earned.data) ? earned.data : []);
            setAllAchievements(Array.isArray(all.data) ? all.data : []);
            setLoading(false);
        } catch (error) {
            console.log('Error fetching achievements:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentLoginStatus === 'true' && studentId) {
            fetchAchievements();
        }
    }, [studentLoginStatus, studentId]);

    const earnedIds = achievements.map((a) => a.achievement?.id || a.achievement);

    const getAchievementTypeIcon = (type) => {
        const icons = {
            completion: 'trophy',
            quiz_master: 'patch-question',
            time_spent: 'clock-history',
            first_steps: 'footprints',
            social: 'people',
        };
        return icons[type] || 'award';
    };

    const getAchievementTypeColor = (type) => {
        const colors = {
            completion: '#ffd43b',
            quiz_master: '#69db7c',
            time_spent: '#4dabf7',
            first_steps: '#da77f2',
            social: '#ffa94d',
        };
        return colors[type] || '#868e96';
    };

    const totalPoints = achievements.reduce((sum, a) => sum + (a.achievement?.points || 0), 0);
    const completionRate = Math.round((achievements.length / (allAchievements.length || 1)) * 100) || 0;

    if (studentLoginStatus === null) {
        return (
            <LoadingSpinner size="md" text="Loading achievements..." />
        );
    }

    if (studentLoginStatus !== 'true') {
        return null;
    }

    return (

                <ScrollView style={styles.achievementsMain} contentContainerStyle={styles.achievementsMainContent}>
                    <View style={styles.achievementsHeader}>
                        <View style={styles.titleRow}>
                            <Bootstrap name="trophy-fill" size={22} color="#f59e0b" />
                            <Text style={styles.headerTitle}>My Achievements</Text>
                        </View>
                        <View style={styles.unlockedBadge}>
                            <Text style={styles.unlockedBadgeText}>
                                {achievements.length} / {allAchievements.length} Unlocked
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.summaryCard, !isMobile ? styles.summaryCardDesktop : null]}>
                        <View style={[styles.summaryItem, isMobile ? styles.summaryItemMobile : null]}>
                            <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>{achievements.length}</Text>
                            <Text style={styles.summaryLabel}>Achievements Earned</Text>
                        </View>
                        <View style={[styles.summaryItem, isMobile ? styles.summaryItemMobile : null]}>
                            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{totalPoints}</Text>
                            <Text style={styles.summaryLabel}>Total Points</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{completionRate}%</Text>
                            <Text style={styles.summaryLabel}>Completion Rate</Text>
                        </View>
                    </View>

                    <View style={styles.sectionTitleRow}>
                        <Bootstrap name="check-circle-fill" size={18} color="#10b981" />
                        <Text style={styles.sectionTitle}>Earned Achievements</Text>
                    </View>

                    {loading ? (
                        <LoadingSpinner size="md" text="Loading achievements..." />
                    ) : achievements.length > 0 ? (
                        <View style={styles.achievementsGrid}>
                            {achievements.map((item, index) => {
                                const achievement = item.achievement;
                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.achievementCard,
                                            styles.achievementCardEarned,
                                            !isMobile ? styles.achievementCardDesktop : null,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.achievementIconWrapper,
                                                {
                                                    backgroundColor: getAchievementTypeColor(
                                                        achievement?.achievement_type
                                                    ),
                                                },
                                            ]}
                                        >
                                            {achievement?.icon ? (
                                                <Image
                                                    source={{ uri: achievement.icon }}
                                                    style={styles.achievementIconImage}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <Bootstrap
                                                    name={getAchievementTypeIcon(achievement?.achievement_type)}
                                                    size={24}
                                                    color="#ffffff"
                                                />
                                            )}
                                        </View>

                                        <Text style={styles.achievementName}>{achievement?.name}</Text>
                                        <Text style={styles.achievementDesc}>{achievement?.description}</Text>

                                        <View style={styles.achievementMeta}>
                                            <View style={styles.achievementBadge}>
                                                <Bootstrap name="star-fill" size={10} color="#92400e" />
                                                <Text style={styles.achievementBadgeText}>{achievement?.points} pts</Text>
                                            </View>
                                            <Text style={styles.achievementMetaText}>
                                                Earned: {new Date(item.earned_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.alertInfo}>
                            <View style={styles.alertInfoRow}>
                                <Bootstrap name="music-note-beamed" size={18} color="#1a1a1a" />
                                <Text style={styles.alertInfoText}>
                                    Start your musical journey to earn your first achievement!
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.sectionTitleRow}>
                        <Bootstrap name="lock-fill" size={18} color="#9ca3af" />
                        <Text style={styles.sectionTitle}>Locked Achievements</Text>
                    </View>

                    <View style={styles.achievementsGrid}>
                        {allAchievements
                            .filter((a) => !earnedIds.includes(a.id))
                            .map((achievement, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.achievementCard,
                                        styles.achievementCardLocked,
                                        !isMobile ? styles.achievementCardDesktop : null,
                                    ]}
                                >
                                    <View style={[styles.achievementIconWrapper, styles.achievementIconWrapperLocked]}>
                                        <Bootstrap
                                            name={getAchievementTypeIcon(achievement.achievement_type)}
                                            size={24}
                                            color="#ffffff"
                                        />
                                    </View>
                                    <Text style={styles.achievementName}>{achievement.name}</Text>
                                    <Text style={styles.achievementDesc}>{achievement.description}</Text>

                                    <View style={styles.achievementMeta}>
                                        <View style={styles.achievementBadgeLocked}>
                                            <Bootstrap name="star" size={10} color="#6b7280" />
                                            <Text style={styles.achievementBadgeLockedText}>{achievement.points} pts</Text>
                                        </View>
                                        <Text style={styles.achievementMetaText}>Goal: {achievement.requirement_value}</Text>
                                    </View>
                                </View>
                            ))}
                    </View>
                </ScrollView>
    );
};

const styles = StyleSheet.create({
    achievementsContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f0f9ff',
    },
    achievementsContent: {
        flex: 1,
    },
    sidebarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 999,
    },
    mobileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59,130,246,0.1)',
        zIndex: 5,
    },
    sidebarToggle: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59,130,246,0.08)',
    },
    logoMini: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2563eb',
    },
    achievementsMain: {
        flex: 1,
    },
    achievementsMainContent: {
        padding: 16,
        paddingBottom: 32,
    },
    achievementsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 18,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    unlockedBadge: {
        backgroundColor: '#3b82f6',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    unlockedBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.08)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
    },
    summaryCardDesktop: {
        flexDirection: 'row',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryItemMobile: {
        marginBottom: 14,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 6,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        textAlign: 'center',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginBottom: 24,
    },
    achievementCard: {
        width: '50%',
        paddingHorizontal: 6,
        marginBottom: 12,
    },
    achievementCardDesktop: {
        width: '33.3333%',
    },
    achievementCardEarned: {
        opacity: 1,
    },
    achievementCardLocked: {
        opacity: 0.55,
    },
    achievementIconWrapper: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        alignSelf: 'center',
    },
    achievementIconWrapperLocked: {
        backgroundColor: '#9ca3af',
    },
    achievementIconImage: {
        width: 40,
        height: 40,
    },
    achievementName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 6,
        textAlign: 'center',
    },
    achievementDesc: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
        textAlign: 'center',
        minHeight: 36,
    },
    achievementMeta: {
        alignItems: 'center',
        gap: 6,
    },
    achievementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    achievementBadgeText: {
        color: '#92400e',
        fontSize: 11,
        fontWeight: '600',
    },
    achievementBadgeLocked: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(59,130,246,0.06)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    achievementBadgeLockedText: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '600',
    },
    achievementMetaText: {
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'center',
    },
    alertInfo: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.12)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },
    alertInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alertInfoText: {
        flex: 1,
        color: '#1a1a1a',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default MyAchievements;
