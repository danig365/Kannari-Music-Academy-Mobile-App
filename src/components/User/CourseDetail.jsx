import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import LoadingSpinner from '../shared/LoadingSpinner';
import { checkCourseAccess, enrollWithSubscription, getStudentSubscription, formatAccessLevel } from '../../services/subscriptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';

import { API_BASE_URL, SITE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const siteUrl = SITE_URL;

const CourseDetail = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const course_id = route?.params?.course_id || route?.params?.id;

    const navigateToStudentLogin = () => {
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('Auth', { screen: 'StudentLogin' });
        return;
      }
      navigation.navigate('StudentLogin');
    };

    const openCourseDetail = (id) => {
      if (!id) return;
      navigation.navigate('CourseDetail', { course_id: id });
    };

    const [courseData, setCourseData] = useState({});
    const [chapterData, setChapterData] = useState([]);
    const [teacherData, setTeacherData] = useState({});
    const [teachListData, setTeachListData] = useState([]);
    const [relatedCourseData, setRelatedCourseData] = useState([]);
    const [userLoginStatus, setUserLoginStatus] = useState('');
    const [enrolledStatus, setEnrolledStatus] = useState('');
    const [ratingStatus, setRatingStatus] = useState('');
    const [favoriteStatus, setFavoriteStatus] = useState('');
    const [courseViews, setCourseViews] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [courseProgress, setCourseProgress] = useState(null);
    const [courseAccess, setCourseAccess] = useState({ can_access: true, checking: true });
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [studentId, setStudentId] = useState(null);
    const [studentLoginStatus, setStudentLoginStatus] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);

    const [ratingData, setRatingData] = useState({
      rating: '',
      reviews: ''
    });

    useEffect(() => {
      const loadAuth = async () => {
        try {
          const storedStudentId = await AsyncStorage.getItem('studentId');
          const storedLoginStatus = await AsyncStorage.getItem('studentLoginStatus');
          setStudentId(storedStudentId);
          setStudentLoginStatus(storedLoginStatus);
        } catch (error) {
          console.log(error);
          setLoading(false);
        }
      };
      loadAuth();
    }, []);

    useEffect(() => {
      if (studentLoginStatus !== null && studentLoginStatus !== 'true') {
        Alert.alert('Login Required', 'Please login to view course details', [
          { text: 'OK', onPress: navigateToStudentLogin }
        ]);
      }
    }, [studentLoginStatus, navigation]);

    useEffect(() => {
      console.log('Chapter data changed:', chapterData);
    }, [chapterData]);

    useEffect(() => {
      if (!course_id) {
        setLoading(false);
        return;
      }

      const fetchAll = async () => {
        setLoading(true);
        try {
          const courseRes = await axios.get(`${baseUrl}/course/${course_id}`);
          console.log('Course data:', courseRes.data);
          console.log('Chapter data:', courseRes.data.course_chapters);
          console.log('Featured image path:', courseRes.data.featured_img);
          setChapterData(courseRes.data.course_chapters || []);
          setTeacherData(courseRes.data.teacher || {});
          setCourseData(courseRes.data || {});
          setRelatedCourseData(courseRes.data.related_videos ? JSON.parse(courseRes.data.related_videos) : []);
          setTeachListData(courseRes.data.teach_list || []);
          setCourseViews(courseRes.data.course_views || 0);
          if (courseRes.data.course_rating !== '' && courseRes.data.course_rating != null) {
            setAvgRating(courseRes.data.course_rating);
          }
        } catch (err) {
          console.error('Error fetching course:', err);
        }

        try {
          const viewRes = await axios.get(`${baseUrl}/update-view/${course_id}`);
          setCourseViews(viewRes.data.views);
        } catch (err) {
          console.log('View update error:', err);
        }

        if (studentId) {
          try {
            const enrollRes = await axios.get(`${baseUrl}/fetch-enroll-status/${studentId}/${course_id}`);
            if (enrollRes.data.bool === true) {
              setEnrolledStatus('success');
              try {
                const progressRes = await axios.get(`${baseUrl}/student/course-progress/${studentId}/`);
                const courseProgressData = progressRes.data.find((cp) => cp.course?.id == course_id || cp.id == course_id);
                if (courseProgressData) {
                  setCourseProgress(courseProgressData);
                }
              } catch (err) {
                console.log('Error fetching progress:', err);
              }
            }
          } catch (error) {
            console.log(error);
          }

          try {
            const ratingRes = await axios.get(`${baseUrl}/fetch-rating-status/${studentId}/${course_id}`);
            if (ratingRes.data.bool === true) {
              setRatingStatus('success');
            }
          } catch (error) {
            console.log(error);
          }

          try {
            const favRes = await axios.get(`${baseUrl}/fetch-favorite-status/${studentId}/${course_id}`);
            if (favRes.data.bool === true) {
              setFavoriteStatus('success');
            } else {
              setFavoriteStatus('');
            }
          } catch (err) {
            console.log('Favorite status fetch error:', err);
            setFavoriteStatus('');
          }
        }

        if (studentLoginStatus === 'true') {
          setUserLoginStatus('success');
        }

        const checkAccess = async () => {
          if (studentId && course_id) {
            try {
              const [accessResult, subInfo] = await Promise.all([
                checkCourseAccess(studentId, course_id),
                getStudentSubscription(studentId)
              ]);
              setCourseAccess({ ...accessResult, checking: false });
              setSubscriptionInfo(subInfo);
            } catch (error) {
              console.error('Access check error:', error);
              setCourseAccess({ can_access: false, checking: false, reason: 'Unable to verify access. Please try again.' });
            }
          } else {
            setCourseAccess({ can_access: false, checking: false, reason: 'Please log in to access courses.' });
          }
        };

        await checkAccess();
        setLoading(false);
      };

      fetchAll();
    }, [course_id, studentLoginStatus, studentId]);

    const enrollCourse = async () => {
        if (!studentId) {
            Alert.alert('Please Login', 'You need to be logged in to enroll');
            return;
        }

        try {
            const subscriptionCheck = await getStudentSubscription(studentId);

            if (!subscriptionCheck || !subscriptionCheck.has_active_subscription) {
                Alert.alert(
                  'Active Subscription Required',
                  'You need an active subscription to enroll in courses.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Browse Plans', onPress: () => navigation.navigate('StudentSubscriptions') }
                  ]
                );
                return;
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
            Alert.alert('Error', 'Unable to verify your subscription status. Please try again.');
            return;
        }

        if (!courseAccess.can_access) {
            Alert.alert(
              'Cannot Access Course',
              `${courseAccess.message || courseAccess.reason || 'This course requires an active subscription.'}${courseData.required_access_level ? `\nRequired Level: ${formatAccessLevel(courseData.required_access_level)}` : ''}`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'View Plans', onPress: () => navigation.navigate('StudentSubscriptions') }
              ]
            );
            return;
        }

        try {
            const result = await enrollWithSubscription(studentId, course_id);

            if (result.success) {
                Alert.alert('Success', 'You Successfully Enrolled!');
                setEnrolledStatus('success');

                const newAccessInfo = await checkCourseAccess(studentId, course_id);
                setCourseAccess({ ...newAccessInfo, checking: false });
            } else {
                Alert.alert(
                  'Enrollment Failed',
                  result.message || result.error || 'You do not meet the subscription requirements for this course.',
                  [
                    { text: 'Close', style: 'cancel' },
                    { text: 'View Plans', onPress: () => navigation.navigate('StudentSubscriptions') }
                  ]
                );
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            Alert.alert('Enrollment Failed', error.response?.data?.message || error.response?.data?.error || 'Something went wrong. Please try again.');
        }
    };

    const handleChange = (name, value) => {
      setRatingData({
          ...ratingData,
          [name]: value
      });
    };

    const formSubmit = async () => {
      if (!studentId) {
        Alert.alert('Login Required', 'Please login again before submitting a rating.');
        return;
      }

      const ratingValue = Number(ratingData.rating);
      if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        Alert.alert('Invalid Rating', 'Please enter a rating from 1 to 5.');
        return;
      }

      const _formData = new FormData();
      _formData.append('course', course_id);
      _formData.append('student', studentId);
      _formData.append('rating', String(ratingValue));
      _formData.append('reviews', (ratingData.reviews || '').trim());

      try {
          setSubmittingRating(true);
          const res = await axios.post(`${baseUrl}/course-rating/`, _formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.status === 200 || res.status === 201) {
              Alert.alert('Success', 'Rated Successfully!');
              setShowRatingModal(false);
              setRatingStatus('success');
              setRatingData({ rating: '', reviews: '' });
          } else {
              Alert.alert('Rating Failed', 'Unable to submit your rating right now.');
          }
      } catch (error) {
          console.log('Rating submit error:', error);
          Alert.alert(
            'Rating Failed',
            error.response?.data?.message || error.response?.data?.error || 'Unable to submit your rating right now.'
          );
      } finally {
          setSubmittingRating(false);
      }
    };

    const markAsFav = async () => {
      const _formData = new FormData();
      _formData.append('course', course_id);
      _formData.append('student', studentId);
      _formData.append('status', true);

      try {
          const res = await axios.post(`${baseUrl}/student-add-favorte-course/`, _formData, {
            headers: {
              'content-type': 'multipart/form-data'
            }
          });
          if (res.status === 200 || res.status === 201) {
              Alert.alert('Success', 'This Course Successfully added to your Favorite list');
              setFavoriteStatus('success');
          }
      } catch (error) {
          console.log(error);
      }
    };

    const removeFav = async () => {
      try {
          const res = await axios.get(`${baseUrl}/student-remove-favorite-course/${course_id}/${studentId}`, {
            headers: {
              'content-type': 'multipart/form-data'
            }
          });
          if (res.status === 200 || res.status === 201) {
              Alert.alert('Success', 'This Course Successfully removed from your Favorite list');
              setFavoriteStatus('');
          }
      } catch (error) {
          console.log(error);
      }
    };

    if (studentLoginStatus !== null && studentLoginStatus !== 'true') {
      return <LoadingSpinner fullScreen size="xl" text="Redirecting to login..." />;
    }

    if (loading) {
      return (
        <View style={styles.courseLoadingMain}>
          <LoadingSpinner size="lg" text="Loading course details..." />
        </View>
      );
    }

    return (
      <ScrollView style={styles.courseDetailMain} contentContainerStyle={styles.courseDetailMainContent}>
            <View style={styles.courseBackSection}>
              <View style={styles.courseBackContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('MyCourses')}
                  style={styles.courseBackLink}
                >
                  <Bootstrap name="arrow-left" size={16} color="#3b82f6" />
                  <Text style={styles.courseBackLinkText}>Back to My Courses</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.courseHeroSection}>
              <View style={styles.courseHeroContainer}>
                <View style={styles.courseHeroRow}>
                  <View style={styles.courseImageCol}>
                    <View style={styles.courseImageWrapper}>
                      {courseData.featured_img ? (
                        <Image
                          source={{ uri: courseData.featured_img.startsWith('http') ? courseData.featured_img : `${siteUrl}media/${courseData.featured_img}` }}
                          style={styles.courseFeaturedImage}
                        />
                      ) : (
                        <View style={styles.courseImagePlaceholder}>
                          <Bootstrap name="music-note-beamed" size={64} color="rgba(255,255,255,0.6)" />
                        </View>
                      )}
                    </View>

                    <View style={styles.courseActionButtons}>
                      {!courseAccess.checking && !courseAccess.can_access && (
                        <View style={styles.courseAccessBanner}>
                          <View style={styles.courseAccessIconWrap}>
                            <Bootstrap name="lock-fill" size={18} color="white" />
                          </View>
                          <View style={styles.courseAccessTextWrap}>
                            <Text style={styles.courseAccessTitle}>Subscription Required</Text>
                            <Text style={styles.courseAccessBody}>{courseAccess.reason || 'You need an active subscription to access this course'}</Text>
                          </View>
                        </View>
                      )}

                      {userLoginStatus === 'success' && enrolledStatus !== 'success' && (
                        courseAccess.can_access ? (
                          <TouchableOpacity type='button' onPress={enrollCourse} style={[styles.courseBtn, styles.courseBtnEnroll]}>
                            <Bootstrap name="plus-circle" size={16} color="#fff" />
                            <Text style={styles.courseBtnText}>Enroll Now</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => navigation.navigate('StudentSubscriptions')}
                            style={[styles.courseBtn, styles.courseBtnUpgrade]}
                          >
                            <Bootstrap name="star-fill" size={16} color="#fff" />
                            <Text style={styles.courseBtnText}>Upgrade to Enroll</Text>
                          </TouchableOpacity>
                        )
                      )}

                      {enrolledStatus === 'success' && userLoginStatus === 'success' && (
                        <TouchableOpacity
                          onPress={() => navigation.navigate('StudentCoursePlayer', { course_id })}
                          style={[styles.courseBtn, styles.courseBtnLearn]}
                        >
                          <Bootstrap name="play-fill" size={16} color="#fff" />
                          <Text style={styles.courseBtnText}>{courseProgress && courseProgress.progress_percentage > 0 ? 'Continue Learning' : 'Start Learning'}</Text>
                        </TouchableOpacity>
                      )}

                      {userLoginStatus !== 'success' && (
                        <TouchableOpacity
                          onPress={navigateToStudentLogin}
                          style={[styles.courseBtn, styles.courseBtnLogin]}
                        >
                          <Text style={styles.courseBtnText}>Login to Enroll</Text>
                        </TouchableOpacity>
                      )}

                      {favoriteStatus !== 'success' ? (
                        <TouchableOpacity
                          onPress={markAsFav}
                          style={[styles.courseBtn, styles.courseBtnFavorite]}
                        >
                          <Bootstrap name="heart" size={16} color="#e11d48" />
                          <Text style={styles.courseBtnFavoriteText}>Add to Favorites</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={removeFav}
                          style={[styles.courseBtn, styles.courseBtnFavoriteSaved]}
                        >
                          <Bootstrap name="heart-fill" size={16} color="#fff" />
                          <Text style={styles.courseBtnText}>Favorited</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.courseInfoCol}>
                    <Text style={styles.courseTitle}>{courseData.title}</Text>
                    <Text style={styles.courseDescription}>{courseData.description}</Text>

                    <View style={styles.courseMetaGrid}>
                      <View style={styles.courseMetaItem}>
                        <Text style={styles.courseMetaLabel}>Instructor</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('TeacherDetail', { teacher_id: teacherData.id })}>
                          <Text style={styles.courseMetaValue}>{teacherData.full_name}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={[styles.courseMetaItem, styles.courseMetaItemCategory]}>
                        <Text style={styles.courseMetaLabel}>Category</Text>
                        <Text style={styles.courseMetaValue}>{courseData.category?.title || 'General'}</Text>
                      </View>

                      <View style={[styles.courseMetaItem, styles.courseMetaItemTech]}>
                        <Text style={styles.courseMetaLabel}>Technologies</Text>
                        <View style={styles.courseTechBadges}>
                          {(courseData.techs || '').split(',').filter(Boolean).map((tech, idx) => (
                            <View key={idx} style={styles.courseTechBadge}>
                              <Text style={styles.courseTechBadgeText}>{tech.trim()}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>

                    <View style={styles.courseStats}>
                      <View style={[styles.courseStatBox, styles.courseStatRating]}>
                        <Text style={[styles.courseStatValue, styles.courseStatValueRating]}>
                          {avgRating > 0 ? `${Number(avgRating).toFixed(1)} / 5` : 'Not rated yet'}
                        </Text>
                        <Text style={[styles.courseStatLabel, styles.courseStatLabelRating]}>Rating</Text>
                      </View>

                      <View style={[styles.courseStatBox, styles.courseStatStudents]}>
                        <Text style={[styles.courseStatValue, styles.courseStatValueStudents]}>{courseData.total_enrolled_students || 0}</Text>
                        <Text style={[styles.courseStatLabel, styles.courseStatLabelStudents]}>Students</Text>
                      </View>

                      <View style={[styles.courseStatBox, styles.courseStatViews]}>
                        <Text style={[styles.courseStatValue, styles.courseStatValueViews]}>{courseViews}</Text>
                        <Text style={[styles.courseStatLabel, styles.courseStatLabelViews]}>Views</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.courseContentSection}>
              <View style={styles.courseContentRow}>
                <View style={styles.flexFull}>
                  {userLoginStatus === 'success' && enrolledStatus === 'success' && chapterData.length > 0 && (
                    <View style={styles.courseModulesCard}>
                      <Text style={styles.courseCardTitle}>Course Content</Text>
                      <View style={styles.courseModulesList}>
                        {chapterData && chapterData.length > 0 ? (
                          chapterData.map((chapter, index) => (
                            <View key={chapter.id || index} style={styles.courseModuleItem}>
                              <Text style={styles.courseModuleNumber}>{index + 1}</Text>
                              <View style={styles.courseModuleInfo}>
                                <Text style={styles.courseModuleTitle}>{chapter.title || 'Untitled Chapter'}</Text>
                                <Text style={styles.courseModuleLessons}>{(chapter.module_lessons && chapter.module_lessons.length) || chapter.total_lessons || 0} lessons</Text>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyChaptersText}>No chapters available</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {enrolledStatus === 'success' && userLoginStatus === 'success' && (
                    <View style={styles.courseRatingCard}>
                      <Text style={styles.courseCardTitle}>Course Rating</Text>

                      {ratingStatus !== 'success' ? (
                        <>
                          <TouchableOpacity
                            style={styles.courseRatingBtn}
                            onPress={() => setShowRatingModal(true)}
                          >
                            <Bootstrap name="star" size={16} color="#fff" />
                            <Text style={styles.courseRatingBtnText}>Rate This Course</Text>
                          </TouchableOpacity>

                          <Modal visible={showRatingModal} transparent animationType="fade" onRequestClose={() => setShowRatingModal(false)}>
                            <View style={styles.modalOverlay}>
                              <View style={styles.modalCard}>
                                <View style={styles.modalHeader}>
                                  <Text style={styles.modalTitle}>Rate "{courseData.title}"</Text>
                                  <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                                    <Bootstrap name="x-lg" size={16} color="#6b7280" />
                                  </TouchableOpacity>
                                </View>
                                <View style={styles.modalBody}>
                                  <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Rating (1-5)</Text>
                                    <TextInput
                                      value={ratingData.rating}
                                      onChangeText={(value) => handleChange('rating', value)}
                                      placeholder="Enter rating"
                                      keyboardType="numeric"
                                      style={styles.formInput}
                                    />
                                  </View>
                                  <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Your Review</Text>
                                    <TextInput
                                      value={ratingData.reviews}
                                      onChangeText={(value) => handleChange('reviews', value)}
                                      placeholder="Share your experience with this course..."
                                      multiline
                                      style={[styles.formInput, styles.formTextarea]}
                                    />
                                  </View>
                                </View>
                                <View style={styles.modalFooter}>
                                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRatingModal(false)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.submitBtn, submittingRating && styles.submitBtnDisabled]}
                                    onPress={formSubmit}
                                    disabled={submittingRating}
                                  >
                                    <Text style={styles.submitBtnText}>
                                      {submittingRating ? 'Submitting...' : 'Submit Rating'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </Modal>
                        </>
                      ) : (
                        <View style={styles.courseRatingSuccess}>
                          <Bootstrap name="check-circle" size={18} color="#10b981" />
                          <Text style={styles.courseRatingSuccessText}>Thank you! You have already rated this course.</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.flexFull}>
                  <View style={styles.courseQuickInfoCard}>
                    <Text style={styles.quickInfoTitle}>Course Info</Text>

                    <View style={styles.courseInfoList}>
                      <View style={styles.courseInfoItem}>
                        <Text style={styles.courseInfoLabel}>Level</Text>
                        <Text style={styles.courseInfoValue}>{courseData.category?.title || 'All Levels'}</Text>
                      </View>

                      <View style={styles.courseInfoItem}>
                        <Text style={styles.courseInfoLabel}>Students Enrolled</Text>
                        <Text style={styles.courseInfoValue}>{courseData.total_enrolled_students || 0}</Text>
                      </View>

                      <View style={styles.courseInfoItem}>
                        <Text style={styles.courseInfoLabel}>Course Views</Text>
                        <Text style={styles.courseInfoValue}>{courseViews}</Text>
                      </View>

                      <View style={styles.courseInfoItemLast}>
                        <Text style={styles.courseInfoLabel}>Average Rating</Text>
                        <View style={styles.courseRatingDisplay}>
                          <Text style={styles.courseRatingValue}>{avgRating > 0 ? Number(avgRating).toFixed(1) : 'Not rated yet'}</Text>
                          <Text style={styles.courseRatingStars}>{avgRating > 0 ? '⭐'.repeat(Math.round(avgRating)) : ''}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {relatedCourseData.length > 0 && (
              <View style={styles.courseRelatedSection}>
                <Text style={styles.courseRelatedTitle}>Related Courses</Text>

                <View style={styles.courseRelatedGrid}>
                  {relatedCourseData.slice(0, 4).map((rcourse, index) => (
                    <TouchableOpacity
                      onPress={() => openCourseDetail(rcourse.pk || rcourse.id)}
                      key={index}
                      style={styles.courseRelatedCard}
                    >
                      <Image
                        source={{ uri: `${siteUrl}media/${rcourse.fields.featured_img}` }}
                        style={styles.courseRelatedImage}
                      />
                      <View style={styles.courseRelatedBody}>
                        <Text style={styles.courseRelatedCourseTitle}>{rcourse.fields.title}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
    )
}

const styles = StyleSheet.create({
  courseDetailContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#f0f9ff',
  },
  courseDetailContent: {
    flexDirection: 'column',
    backgroundColor: 'transparent',
    flex: 1,
  },
  courseDetailMain: {
    width: '100%',
  },
  courseDetailMainContent: {
    paddingBottom: 60,
  },
  courseMobileHeader: {
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  courseMobileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  courseMobileMenuBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
  },
  courseMobileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  courseSidebarOverlay: {
    display: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  courseSidebarOverlayActive: {
    display: 'flex',
  },
  courseLoadingMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 600,
  },
  courseBackSection: {
    paddingBottom: 0,
  },
  courseBackContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  courseBackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  courseBackLinkText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 13,
  },
  courseHeroSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  courseHeroContainer: {},
  courseHeroRow: {
    gap: 24,
  },
  courseImageCol: {
    width: '100%',
    flexDirection: 'column',
  },
  courseImageWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 4,
  },
  courseFeaturedImage: {
    width: '100%',
    height: 240,
  },
  courseImagePlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseActionButtons: {
    marginTop: 20,
    flexDirection: 'column',
    gap: 10,
  },
  courseBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  courseBtnEnroll: {
    backgroundColor: '#3b82f6',
  },
  courseBtnUpgrade: {
    backgroundColor: '#f59e0b',
  },
  courseBtnLearn: {
    backgroundColor: '#10b981',
  },
  courseBtnLogin: {
    backgroundColor: '#f59e0b',
  },
  courseBtnFavorite: {
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: 'rgba(225,29,72,0.2)',
  },
  courseBtnFavoriteSaved: {
    backgroundColor: '#e11d48',
  },
  courseBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  courseBtnFavoriteText: {
    color: '#e11d48',
    fontWeight: '600',
    fontSize: 14,
  },
  courseInfoCol: {
    width: '100%',
  },
  courseTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 14,
    lineHeight: 40,
  },
  courseDescription: {
    color: '#6b7280',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  courseMetaGrid: {
    gap: 12,
    marginBottom: 24,
  },
  courseMetaItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  courseMetaItemCategory: {
    borderLeftColor: '#10b981',
  },
  courseMetaItemTech: {
    borderLeftColor: '#f59e0b',
  },
  courseMetaLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseMetaValue: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  courseTechBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  courseTechBadge: {
    backgroundColor: '#fde68a',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  courseTechBadgeText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '600',
  },
  courseStats: {
    gap: 10,
  },
  courseStatBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  courseStatRating: {
    backgroundColor: '#fef3c7',
  },
  courseStatStudents: {
    backgroundColor: '#d1fae5',
  },
  courseStatViews: {
    backgroundColor: '#e0e7ff',
  },
  courseStatValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  courseStatValueRating: {
    color: '#f59e0b',
  },
  courseStatValueStudents: {
    color: '#10b981',
  },
  courseStatValueViews: {
    color: '#6366f1',
  },
  courseStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseStatLabelRating: {
    color: '#b45309',
  },
  courseStatLabelStudents: {
    color: '#047857',
  },
  courseStatLabelViews: {
    color: '#4338ca',
  },
  courseContentSection: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  courseContentRow: {
    gap: 24,
  },
  flexFull: {
    width: '100%',
  },
  courseModulesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.06)',
  },
  courseCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  courseModulesList: {
    flexDirection: 'column',
    gap: 8,
  },
  courseModuleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  courseModuleNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  courseModuleInfo: {
    flex: 1,
  },
  courseModuleTitle: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  courseModuleLessons: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyChaptersText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  courseRatingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.06)',
  },
  courseRatingBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseRatingBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  courseRatingSuccess: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseRatingSuccessText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  modalBody: {
    padding: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    fontSize: 14,
  },
  formInput: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,130,246,0.08)',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  courseQuickInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.06)',
  },
  quickInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  courseInfoList: {
    flexDirection: 'column',
  },
  courseInfoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfoItemLast: {
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfoLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  courseInfoValue: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  courseRatingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseRatingValue: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '800',
  },
  courseRatingStars: {
    color: '#f59e0b',
    fontSize: 14,
  },
  courseRelatedSection: {
    marginTop: 48,
    paddingHorizontal: 16,
  },
  courseRelatedTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  courseRelatedGrid: {
    gap: 16,
  },
  courseRelatedCard: {
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.08)',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  courseRelatedImage: {
    width: '100%',
    height: 150,
  },
  courseRelatedBody: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  courseRelatedCourseTitle: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  courseAccessBanner: {
    backgroundColor: '#fecaca',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseAccessIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  courseAccessTextWrap: {
    flex: 1,
  },
  courseAccessTitle: {
    fontWeight: '600',
    color: '#7f1d1d',
    marginBottom: 4,
  },
  courseAccessBody: {
    fontSize: 13,
    color: '#991b1b',
  }
});

export default CourseDetail
