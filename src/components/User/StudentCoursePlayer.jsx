import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, Modal, Linking } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Bootstrap } from '../shared/BootstrapIcon';
import { checkLessonAccess, recordLessonAccess, getStudentSubscription, formatAccessLevel } from '../../services/subscriptionService';

import { API_BASE_URL, SITE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const mediaUrl = SITE_URL;

const StudentCoursePlayer = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { course_id, lesson_id } = route.params || {};
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    const [studentId, setStudentId] = useState(null);
    const [studentLoginStatus, setStudentLoginStatus] = useState(null);

    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDownloadables, setShowDownloadables] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [floatingObjectivesOpen, setFloatingObjectivesOpen] = useState(false);
    const [floatingResourcesOpen, setFloatingResourcesOpen] = useState(false);
    const [lessonAccess, setLessonAccess] = useState({ can_access: true, checking: true });
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [showYouTubeModal, setShowYouTubeModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [activeVideoUrl, setActiveVideoUrl] = useState(null);
    const [activeVideoTitle, setActiveVideoTitle] = useState('Lesson Video');

        const navigateToStudentLogin = () => {
            const parentNav = navigation.getParent();
            if (parentNav) {
                parentNav.navigate('Auth', { screen: 'StudentLogin' });
                return;
            }
            navigation.navigate('StudentLogin');
        };

        const navigateToCourseDetail = () => {
            if (!course_id) return;
            navigation.navigate('CourseDetail', { course_id });
        };

        const navigateToLesson = (targetLessonId) => {
            if (!course_id || !targetLessonId) return;
            navigation.navigate('StudentCoursePlayer', { course_id, lesson_id: targetLessonId });
        };

    const milestoneMessages = {
        25: { emoji: '🚀', title: 'Great Start!', text: "You're 25% through! Keep up the momentum!" },
        50: { emoji: '🔥', title: 'Halfway There!', text: "You've reached the halfway point! You're doing amazing!" },
        75: { emoji: '💪', title: 'Almost There!', text: "75% complete! The finish line is in sight!" },
        90: { emoji: '🎯', title: 'So Close!', text: "Just a bit more! You're about to finish!" }
    };

    const currentLesson = pageData?.current_lesson;
    const modules = pageData?.modules || [];
    const navData = pageData?.navigation || { previous: null, next: null };
    const progress = pageData?.progress || {};
    const isEnrolled = pageData?.is_enrolled ?? false;

    useEffect(() => {
      const loadAuth = async () => {
        const sid = await AsyncStorage.getItem('studentId');
        const sls = await AsyncStorage.getItem('studentLoginStatus');
        setStudentId(sid);
        setStudentLoginStatus(sls);
      };
      loadAuth();
    }, []);

    useEffect(() => {
        const initializePage = async () => {
            if (studentLoginStatus !== 'true' || !studentId) {
                Alert.alert('Login Required', 'Please login to access course content', [
                                    { text: 'OK', onPress: navigateToStudentLogin }
                ]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const url = `${baseUrl}/student/${studentId}/course/${course_id}/full-page-data/`;
                const response = await axios.get(url);

                if (!response.data.is_enrolled) {
                    Alert.alert('Access Denied', 'You must enroll in this course to access the lessons', [
                                            { text: 'OK', onPress: navigateToCourseDetail }
                    ]);
                    setLoading(false);
                    return;
                }

                setPageData(response.data);

                if (!lesson_id && response.data.current_lesson) {
                                        navigation.navigate('StudentCoursePlayer', {
                      course_id,
                      lesson_id: response.data.current_lesson.id,
                    });
                }
            } catch (err) {
                console.error('Error loading page data:', err);
                const errorMsg = err.response?.data?.error || err.message || 'Failed to load course content';
                setError(errorMsg);

                if (err.response?.status === 403) {
                    Alert.alert('Access Denied', errorMsg, [
                                            { text: 'OK', onPress: navigateToCourseDetail }
                    ]);
                } else {
                    Alert.alert('Error Loading Content', errorMsg);
                }
            } finally {
                setLoading(false);
            }
        };

        if (studentLoginStatus !== null && studentId && course_id) {
          initializePage();
        }
    }, [course_id, studentId, studentLoginStatus, navigation, lesson_id]);

    useEffect(() => {
        if (!lesson_id || !course_id || !studentId) return;

        const loadLessonData = async () => {
            setLoading(true);
            setError(null);
            setShowResumePrompt(false);

            try {
                const [accessResult, subInfo] = await Promise.all([
                    checkLessonAccess(studentId, lesson_id),
                    getStudentSubscription(studentId)
                ]);

                setLessonAccess({ ...accessResult, checking: false });
                setSubscriptionInfo(subInfo);

                if (!accessResult.can_access) {
                    setLoading(false);
                    return;
                }

                const url = `${baseUrl}/student/${studentId}/course/${course_id}/lesson/${lesson_id}/full-page-data/`;
                const response = await axios.get(url);

                setPageData(response.data);

                if (response.data.current_lesson?.last_position &&
                    response.data.current_lesson.last_position > 10 &&
                    !response.data.current_lesson.is_completed) {
                    setShowResumePrompt(true);
                }

                await recordLessonAccess(studentId, lesson_id);
            } catch (err) {
                console.error('Error loading lesson data:', err);
                const errorMsg = err.response?.data?.error || err.message || 'Failed to load lesson content';
                setError(errorMsg);

                Alert.alert('Error Loading Content', errorMsg);
            } finally {
                setLoading(false);
            }
        };

        loadLessonData();
    }, [lesson_id, course_id, studentId]);

    const launchConfetti = () => {};

    const handleMarkComplete = async () => {
        try {
            const currentProgress = progress.overall_progress || 0;
            const response = await axios.post(`${baseUrl}/student/${studentId}/lesson/${lesson_id}/complete/`);

            if (response.data.bool) {
                const newProgress = response.data.course_progress_percentage || currentProgress;

                triggerCelebration(
                    response.data.module_completed,
                    response.data.course_completed,
                    currentProgress,
                    newProgress
                );

                const url = `${baseUrl}/student/${studentId}/course/${course_id}/lesson/${lesson_id}/full-page-data/`;
                const refreshResponse = await axios.get(url);
                setPageData(refreshResponse.data);
            }
        } catch (error) {
            console.error('Error marking lesson complete:', error);
            Alert.alert('Error', 'Failed to mark lesson as complete');
        }
    };

    const checkMilestoneProgress = (oldProgress, newProgress) => {
        const milestones = [25, 50, 75, 90];
        for (const milestone of milestones) {
            if (oldProgress < milestone && newProgress >= milestone) {
                return milestone;
            }
        }
        return null;
    };

    const triggerCelebration = (moduleCompleted, courseCompleted, oldProgress = 0, newProgress = 0) => {
        if (courseCompleted) {
            launchConfetti('large');
            Alert.alert('🎉 Course Completed!', 'Congratulations! You have completed this entire course!');
        } else if (moduleCompleted) {
            launchConfetti('medium');
            Alert.alert('🎯 Module Completed!', 'Great job! You have completed this module.');

            setTimeout(() => {
                const milestone = checkMilestoneProgress(oldProgress, newProgress);
                if (milestone) showProgressToast(milestone);
            }, 600);
        } else {
            launchConfetti('small');
            const milestone = checkMilestoneProgress(oldProgress, newProgress);

            if (milestone) {
                const msg = milestoneMessages[milestone];
                Alert.alert(`${msg.emoji} ${msg.title}`, `${msg.text}\n${Math.round(newProgress)}% Complete`);
            } else {
                Alert.alert('✅ Lesson Complete!', 'Keep up the great work!');
            }
        }
    };

    const showProgressToast = (milestone) => {
        const msg = milestoneMessages[milestone];
        if (!msg) return;
        Alert.alert(`${msg.emoji} ${msg.title}`, msg.text);
    };

    const handlePrevious = () => {
        if (navData.previous) {
            setShowYouTubeModal(false);
            navigateToLesson(navData.previous.id);
        }
    };

    const handleNext = () => {
        if (navData.next) {
            if (navData.next.is_locked) {
                Alert.alert('🔒 Next Lesson Locked', 'Complete this lesson first to unlock the next one');
                return;
            }
            setShowYouTubeModal(false);
            navigateToLesson(navData.next.id);
        }
    };

    const handleDownload = async (downloadable) => {
        try {
            await axios.post(`${baseUrl}/downloadable/${downloadable.id}/increment/`, {
                student_id: studentId
            });
            await Linking.openURL(downloadable.file);
        } catch (error) {
            console.error('Error downloading:', error);
            Alert.alert('Download blocked', error?.response?.data?.message || 'Your subscription does not allow this download.');
        }
    };

    const handleResumeVideo = () => {
        setShowResumePrompt(false);
    };

    const saveVideoPosition = () => {
        if (!currentLesson) return;
        const position = currentLesson?.last_position || 0;
        axios.post(
            `${baseUrl}/student/${studentId}/lesson/${lesson_id}/position/`,
            { position },
            { headers: { 'Content-Type': 'application/json' } }
        ).catch(err => console.error('Error saving position:', err));
    };

    const getDownloadIcon = (fileType) => {
        const icons = {
            pdf: 'file-pdf-fill',
            sheet_music: 'music-note-list',
            audio_slow: 'soundwave',
            audio_fast: 'lightning-fill',
            audio_playalong: 'headphones',
            worksheet: 'file-earmark-text-fill',
            other: 'file-earmark-fill'
        };
        return icons[fileType] || 'file-earmark-fill';
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        let videoId = null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            }
        } catch (e) {
            const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (match) videoId = match[1];
        }
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
    };

    const openContentUrl = async (url) => {
      try {
        if (url) await Linking.openURL(url);
      } catch (e) {
        Alert.alert('Error', 'Unable to open content URL');
      }
    };

        const isVideoFileUrl = (url = '') => {
            return /\.(mp4|m4v|mov|webm)(\?.*)?$/i.test(url);
        };

        const openLessonContent = () => {
                if (!currentLesson) return;

                const { file, youtube_url, title, content_type } = currentLesson;
                let fileUrl = file;
                if (file && !file.startsWith('http')) {
                        fileUrl = `${mediaUrl}${file.startsWith('/') ? '' : '/'}${file}`;
                }

                const youtubeUrl = getYouTubeEmbedUrl(youtube_url);
                const isVideoLesson = content_type === 'video' || (fileUrl && isVideoFileUrl(fileUrl));

                if (isVideoLesson && fileUrl) {
                        setActiveVideoUrl(fileUrl);
                        setActiveVideoTitle(title || 'Lesson Video');
                        setShowVideoModal(true);
                        return;
                }

                if (youtubeUrl) {
                        setShowYouTubeModal(true);
                        return;
                }

                if (fileUrl) {
                        openContentUrl(fileUrl);
                        return;
                }

                Alert.alert('Content Unavailable', 'This lesson does not have an available file to open.');
        };

    const renderContent = () => {
        if (!currentLesson) {
            return (
                <View style={styles.emptyStateContainer}>
                    <Bootstrap name="play-circle" size={48} color="#fff" />
                    <Text style={styles.emptyStateTitle}>Ready to Learn?</Text>
                    <Text style={styles.emptyStateText}>Select a lesson from the sidebar to begin</Text>
                </View>
            );
        }

        if (currentLesson.is_locked) {
            return (
                <View style={styles.lockedLessonContainer}>
                    <Bootstrap name="lock-fill" size={48} color="#fff" />
                    <Text style={styles.lockedTitle}>🔒 Lesson Locked</Text>
                    <Text style={styles.lockedText}>Complete the previous lessons to unlock this content</Text>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => {
                            if (navData.previous) {
                                navigateToLesson(navData.previous.id);
                            }
                        }}
                    >
                        <Text style={styles.primaryBtnText}>Go to Previous Lesson</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const { content_type, file, title, youtube_url } = currentLesson;
        const youtubeUrl = getYouTubeEmbedUrl(youtube_url);

        let fileUrl = file;
        if (file && !file.startsWith('http')) {
            fileUrl = `${mediaUrl}${file.startsWith('/') ? '' : '/'}${file}`;
        }

        const isVideoLesson = content_type === 'video' || (fileUrl && isVideoFileUrl(fileUrl));

        if (!fileUrl && !youtubeUrl) {
            return (
                <View style={styles.errorStateContainer}>
                    <Text style={styles.emptyStateTitle}>Content Unavailable</Text>
                    <Text style={styles.emptyStateText}>This lesson does not have any content yet</Text>
                </View>
            );
        }

        return (
          <View style={styles.contentSectionWrapper}>
            <View style={styles.contentPlayerWrapper}>
              <Text style={styles.contentLabel}>{title}</Text>
              <Text style={styles.contentType}>Type: {content_type}</Text>
                            {fileUrl ? (
                                <TouchableOpacity style={styles.openBtn} onPress={openLessonContent}>
                                    <Text style={styles.openBtnText}>{isVideoLesson ? 'Play Video Lesson' : 'Open Lesson Content'}</Text>
                                </TouchableOpacity>
              ) : null}
              {youtubeUrl ? (
                <TouchableOpacity style={[styles.openBtn, styles.youtubeBtn]} onPress={() => setShowYouTubeModal(true)}>
                  <Text style={styles.openBtnText}>Watch YouTube Video</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
    };

    if (loading) {
        return <LoadingSpinner fullScreen size="xl" text="Loading course content..." />;
    }

    if (!lessonAccess.checking && !lessonAccess.can_access) {
        return (
                <View style={styles.playerMainContent}>
                    <View style={styles.accessDeniedContainer}>
                        <View style={styles.accessDeniedIcon}>
                            <Bootstrap name="lock-fill" size={40} color="#f59e0b" />
                        </View>
                        <Text style={styles.accessDeniedTitle}>Premium Content</Text>
                        <Text style={styles.accessDeniedText}>
                            {lessonAccess.message || lessonAccess.reason || 'This lesson requires an upgraded subscription.'}
                        </Text>

                        {subscriptionInfo?.subscription && (
                            <View style={styles.subscriptionInfoBox}>
                                <Text style={styles.subscriptionText}>
                                    Your current plan: {subscriptionInfo.subscription.plan_name || 'Basic'}
                                </Text>
                                {subscriptionInfo.usage && (
                                    <Text style={styles.usageText}>
                                        Weekly lessons: {subscriptionInfo.usage.lessons_this_week || 0} / {subscriptionInfo.usage.lessons_per_week || '∞'}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.accessActionsRow}>
                            <TouchableOpacity
                                style={styles.upgradeBtn}
                                onPress={() => navigation.navigate('StudentSubscriptions')}
                            >
                                <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.backBtnAlt}
                                onPress={navigateToCourseDetail}
                            >
                                <Text style={styles.backBtnAltText}>Back to Course</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
        );
    }

    if (error) {
        return (
            <View style={styles.accessDeniedContainer}>
                <View style={styles.accessDeniedIcon}>
                    <Bootstrap name="exclamation-circle" size={40} color="#fff" />
                </View>
                <Text style={styles.accessDeniedTitle}>Error Loading Content</Text>
                <Text style={styles.accessDeniedText}>{error}</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={navigateToCourseDetail}>
                    <Text style={styles.primaryBtnText}>Back to Course</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
                <View style={styles.playerMobileHeader}>
                    <Text style={styles.courseTitleMini} numberOfLines={1}>{pageData?.course?.title}</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={navigateToCourseDetail}>
                        <Bootstrap name="x-lg" size={18} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.playerMainContent} contentContainerStyle={styles.mainContentPad}>
                    <TouchableOpacity style={styles.backToCourseLink} onPress={navigateToCourseDetail}>
                        <Bootstrap name="arrow-left" size={14} color="#3b82f6" />
                        <Text style={styles.backToCourseText}>Back to Course</Text>
                    </TouchableOpacity>

                    {currentLesson && !currentLesson.is_locked && (
                        <View style={styles.lessonHeader}>
                            <View style={styles.lessonHeaderContent}>
                                <View style={styles.lessonHeaderLeft}>
                                    <Text style={styles.currentLessonTitle}>{currentLesson.title}</Text>
                                    {currentLesson.description ? (
                                        <Text style={styles.lessonDescription}>{currentLesson.description}</Text>
                                    ) : null}
                                </View>
                                <View style={styles.lessonHeaderActions}>
                                    {currentLesson.downloadables?.length > 0 && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, floatingResourcesOpen ? styles.actionBtnActive : null]}
                                            onPress={() => setFloatingResourcesOpen(!floatingResourcesOpen)}
                                        >
                                            <Bootstrap name="download" size={14} color={floatingResourcesOpen ? '#fff' : '#1f2937'} />
                                            <Text style={[styles.actionBtnText, floatingResourcesOpen ? styles.actionBtnTextActive : null]}>
                                              Resources ({currentLesson.downloadables.length})
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    {currentLesson.objectives_list?.length > 0 && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, floatingObjectivesOpen ? styles.actionBtnActive : null]}
                                            onPress={() => setFloatingObjectivesOpen(!floatingObjectivesOpen)}
                                        >
                                            <Bootstrap name="bullseye" size={14} color={floatingObjectivesOpen ? '#fff' : '#1f2937'} />
                                            <Text style={[styles.actionBtnText, floatingObjectivesOpen ? styles.actionBtnTextActive : null]}>
                                              Objectives ({currentLesson.objectives_list.length})
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.mediaPlayerContainer}>{renderContent()}</View>

                    <View style={styles.bottomControls}>
                        <View style={styles.controlsLeft}>
                            <TouchableOpacity style={styles.navBtn} onPress={handlePrevious} disabled={!navData.previous}>
                                <Bootstrap name="chevron-left" size={14} color="#1f2937" />
                                <Text style={styles.navBtnText}>Previous</Text>
                            </TouchableOpacity>

                            <Text style={styles.lessonCounter}>
                                {navData.current_position || 0} of {navData.total_lessons || 0}
                            </Text>
                        </View>

                        <View style={styles.controlsRight}>
                            {currentLesson && !currentLesson.is_completed && !currentLesson.is_locked && (
                                <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete}>
                                    <Bootstrap name="check-lg" size={14} color="#fff" />
                                    <Text style={styles.completeBtnText}>Mark Complete</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.navBtn} onPress={handleNext} disabled={!navData.next}>
                                <Text style={styles.navBtnText}>Next</Text>
                                <Bootstrap name="chevron-right" size={14} color="#1f2937" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

            <Modal visible={floatingObjectivesOpen} transparent animationType="slide" onRequestClose={() => setFloatingObjectivesOpen(false)}>
              <TouchableOpacity style={styles.floatingOverlay} activeOpacity={1} onPress={() => setFloatingObjectivesOpen(false)}>
                <TouchableOpacity style={styles.floatingPanel} activeOpacity={1} onPress={() => {}}>
                  <View style={styles.floatingHeader}>
                    <Text style={styles.floatingHeaderTitle}>What you'll learn</Text>
                    <TouchableOpacity onPress={() => setFloatingObjectivesOpen(false)} style={styles.closeFloatingBtn}>
                      <Bootstrap name="x-lg" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={styles.floatingList}>
                    {(currentLesson?.objectives_list || []).map((obj, index) => (
                      <View key={index} style={styles.floatingListItem}>
                        <Bootstrap name="check-circle-fill" size={16} color="#10b981" />
                        <Text style={styles.floatingListText}>{obj}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            <Modal visible={floatingResourcesOpen} transparent animationType="slide" onRequestClose={() => setFloatingResourcesOpen(false)}>
              <TouchableOpacity style={styles.floatingOverlay} activeOpacity={1} onPress={() => setFloatingResourcesOpen(false)}>
                <TouchableOpacity style={styles.floatingPanelResources} activeOpacity={1} onPress={() => {}}>
                  <View style={[styles.floatingHeader, styles.floatingHeaderGreen]}>
                    <Text style={styles.floatingHeaderTitle}>Lesson Resources</Text>
                    <TouchableOpacity onPress={() => setFloatingResourcesOpen(false)} style={styles.closeFloatingBtn}>
                      <Bootstrap name="x-lg" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={styles.resourcesGrid}>
                    {(currentLesson?.downloadables || []).map((item) => (
                      <TouchableOpacity key={item.id} style={styles.resourceCard} onPress={() => handleDownload(item)}>
                        <View style={styles.resourceIcon}>
                          <Bootstrap name={getDownloadIcon(item.file_type)} size={18} color="#16a34a" />
                        </View>
                        <View style={styles.resourceInfo}>
                          <Text style={styles.resourceTitle}>{item.title}</Text>
                          <Text style={styles.resourceMeta}>{item.file_type_display} • {item.file_size_formatted}</Text>
                        </View>
                        <Bootstrap name="download" size={16} color="#16a34a" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            <Modal visible={showYouTubeModal && !!currentLesson?.youtube_url} transparent animationType="fade" onRequestClose={() => setShowYouTubeModal(false)}>
              <TouchableOpacity style={styles.youtubeModalOverlay} activeOpacity={1} onPress={() => setShowYouTubeModal(false)}>
                <TouchableOpacity style={styles.youtubeModalCard} activeOpacity={1} onPress={() => {}}>
                  <View style={styles.youtubeModalHeader}>
                    <Text style={styles.youtubeTitle} numberOfLines={1}>YouTube Video — {currentLesson?.title}</Text>
                    <TouchableOpacity onPress={() => setShowYouTubeModal(false)}>
                      <Bootstrap name="x-lg" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.youtubeBody}>
                    <Text style={styles.youtubeText}>Open YouTube video in browser/app.</Text>
                    <TouchableOpacity
                      style={styles.openBtn}
                      onPress={() => openContentUrl(getYouTubeEmbedUrl(currentLesson?.youtube_url))}
                    >
                      <Text style={styles.openBtnText}>Open YouTube</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

                        <Modal visible={showVideoModal && !!activeVideoUrl} transparent animationType="fade" onRequestClose={() => setShowVideoModal(false)}>
                            <TouchableOpacity style={styles.videoModalOverlay} activeOpacity={1} onPress={() => setShowVideoModal(false)}>
                                <TouchableOpacity style={styles.videoModalCard} activeOpacity={1} onPress={() => {}}>
                                    <View style={styles.videoModalHeader}>
                                        <Text style={styles.youtubeTitle} numberOfLines={1}>{activeVideoTitle}</Text>
                                        <TouchableOpacity onPress={() => setShowVideoModal(false)}>
                                            <Bootstrap name="x-lg" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.videoWrap}>
                                        <Video
                                            ref={videoRef}
                                            source={{ uri: activeVideoUrl }}
                                            style={styles.videoPlayer}
                                            useNativeControls
                                            resizeMode={ResizeMode.CONTAIN}
                                            shouldPlay
                                            isLooping={false}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        </Modal>
        </>
    );
};

const styles = StyleSheet.create({
  coursePlayerContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F9FAFB' },
  coursePlayerContent: { flex: 1, flexDirection: 'column' },
  playerMainContent: { flex: 1 },
  mainContentPad: { padding: 16, gap: 12 },
  playerMobileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  sidebarToggleBtn: { padding: 8, borderRadius: 8 },
  courseTitleMini: { flex: 1, fontWeight: '700', color: '#4169E1', fontSize: 15 },
  backBtn: { padding: 8, borderRadius: 8 },
  sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 },

  accessDeniedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#1f2937' },
  accessDeniedIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  accessDeniedTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  accessDeniedText: { color: '#fff', opacity: 0.9, textAlign: 'center', marginBottom: 16 },
  subscriptionInfoBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, width: '100%' },
  subscriptionText: { fontSize: 14, color: '#334155', textAlign: 'center' },
  usageText: { marginTop: 6, fontSize: 12, color: '#64748b', textAlign: 'center' },
  accessActionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  upgradeBtn: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  upgradeBtnText: { color: '#fff', fontWeight: '600' },
  backBtnAlt: { backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  backBtnAltText: { color: '#475569', fontWeight: '600' },

  backToCourseLink: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  backToCourseText: { color: '#3b82f6', fontWeight: '600', fontSize: 13 },

  lessonHeader: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14 },
  lessonHeaderContent: { flexDirection: 'column', gap: 10 },
  lessonHeaderLeft: { flex: 1 },
  currentLessonTitle: { color: '#1f2937', fontWeight: '600', fontSize: 18, marginBottom: 4 },
  lessonDescription: { color: '#6b7280', fontSize: 13 },
  lessonHeaderActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  actionBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  actionBtnText: { color: '#1f2937', fontSize: 12, fontWeight: '600' },
  actionBtnTextActive: { color: '#fff' },

  mediaPlayerContainer: { minHeight: 340, backgroundColor: '#f9fafb', padding: 12, borderRadius: 12 },
  contentSectionWrapper: { width: '100%' },
  contentPlayerWrapper: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, gap: 10 },
  contentLabel: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  contentType: { fontSize: 13, color: '#6b7280' },
  openBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  youtubeBtn: { backgroundColor: '#ef4444' },
  openBtnText: { color: '#fff', fontWeight: '600' },

  emptyStateContainer: { flex: 1, minHeight: 280, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorStateContainer: { flex: 1, minHeight: 280, borderRadius: 16, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', padding: 20 },
  lockedLessonContainer: { flex: 1, minHeight: 280, borderRadius: 16, backgroundColor: '#f5576c', alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyStateTitle: { marginTop: 10, color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyStateText: { marginTop: 8, color: '#fff', opacity: 0.95, textAlign: 'center' },
  lockedTitle: { marginTop: 10, color: '#fff', fontSize: 20, fontWeight: '700' },
  lockedText: { marginTop: 8, color: '#fff', opacity: 0.95, textAlign: 'center', marginBottom: 14 },
  primaryBtn: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  primaryBtnText: { color: '#3b82f6', fontWeight: '700' },

  bottomControls: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderRadius: 10 },
  controlsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#f3f4f6' },
  navBtnText: { color: '#1f2937', fontWeight: '600', fontSize: 12 },
  lessonCounter: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10b981', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  floatingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  floatingPanel: { width: '100%', maxHeight: '75%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  floatingPanelResources: { width: '100%', maxHeight: '75%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  floatingHeader: { backgroundColor: '#667eea', paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  floatingHeaderGreen: { backgroundColor: '#16a34a' },
  floatingHeaderTitle: { color: '#fff', fontWeight: '700', fontSize: 16, flex: 1 },
  closeFloatingBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  floatingList: { padding: 16, gap: 10 },
  floatingListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  floatingListText: { color: '#1f2937', fontSize: 14, lineHeight: 20, flex: 1 },

  resourcesGrid: { padding: 16, gap: 10 },
  resourceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, backgroundColor: '#f9fafb' },
  resourceIcon: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  resourceInfo: { flex: 1 },
  resourceTitle: { color: '#1f2937', fontWeight: '700', fontSize: 13 },
  resourceMeta: { color: '#6b7280', fontSize: 12, marginTop: 3 },

  youtubeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  youtubeModalCard: { width: '100%', maxWidth: 560, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000' },
  youtubeModalHeader: { backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  youtubeTitle: { color: '#fff', fontWeight: '600', flex: 1 },
  youtubeBody: { padding: 16, gap: 12, backgroundColor: '#111' },
  youtubeText: { color: '#ddd' },

    videoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 16 },
    videoModalCard: { width: '100%', maxWidth: 720, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000' },
    videoModalHeader: { backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    videoWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
    videoPlayer: { width: '100%', height: '100%' },
});

export default StudentCoursePlayer;
