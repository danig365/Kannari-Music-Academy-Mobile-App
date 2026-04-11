/**
 * API Endpoints for Kannari Music Academy
 * Generated from backend/main/urls.py and backend/lms_api/urls.py
 */

export const API_BASE = "https://kannarimusicacademy.com/api/";

export const ENDPOINTS = {
  // ==================== AUTH & USERS ====================

  // Student Auth
  STUDENT_LOGIN:                "student-login",
  STUDENT_REGISTER:             "student/",
  STUDENT_DETAIL:               (id) => `student/${id}/`,
  STUDENT_DASHBOARD:            (id) => `student/dashboard/${id}/`,
  STUDENT_CHANGE_PASSWORD:      (id) => `student/change-password/${id}/`,
  VERIFY_STUDENT_EMAIL:         "verify-email/student/",
  STUDENT_PASSWORD_RESET_REQ:   "password-reset/request/student/",
  STUDENT_PASSWORD_RESET_CONF:  "password-reset/confirm/student/",

  // Teacher Auth
  TEACHER_LOGIN:                "teacher-login",
  TEACHER_REGISTER:             "teacher/",
  TEACHER_DETAIL:               (id) => `teacher/${id}/`,
  TEACHER_DASHBOARD:            (id) => `teacher/dashboard/${id}/`,
  TEACHER_CHANGE_PASSWORD:      (id) => `teacher/change-password/${id}/`,
  VERIFY_TEACHER_EMAIL:         "verify-email/teacher/",
  TEACHER_PASSWORD_RESET_REQ:   "password-reset/request/teacher/",
  TEACHER_PASSWORD_RESET_CONF:  "password-reset/confirm/teacher/",

  // Admin Auth
  ADMIN_LIST:                   "admin-user/",
  ADMIN_DETAIL:                 (id) => `admin-user/${id}/`,
  ADMIN_LOGIN:                  "admin-login",
  ADMIN_CHANGE_PASSWORD:        (id) => `admin/change-password/${id}/`,
  ADMIN_DASHBOARD:              (id) => `admin/dashboard/${id}/`,
  ADMIN_STATS:                  "admin/stats/",

  // School Auth
  SCHOOL_LOGIN:                 "school-login",
  SCHOOL_CHANGE_PASSWORD:       (id) => `school/change-password/${id}/`,
  SCHOOL_DASHBOARD_STATS:       (id) => `school/dashboard/${id}/`,

  // Parent Auth
  PARENT_LOGIN_REQUEST:         "parent/login/request/",
  PARENT_LOGIN_VERIFY:          "parent/login/verify/",
  PARENT_CHILDREN:              (id) => `parent/${id}/children/`,

  // ==================== CATEGORIES & COURSES ====================

  CATEGORIES:                   "category/",
  ALL_COURSES:                  "course/",
  SEARCH_COURSES:               (q) => `search-courses/${q}`,
  COURSE_DETAIL:                (id) => `course/${id}/`,
  POPULAR_COURSES:              "popular-courses/",
  UPDATE_VIEW:                  (id) => `update-view/${id}`,

  // ==================== CHAPTERS / COURSE CONTENT ====================

  CHAPTER_DETAIL:               (id) => `chapter/${id}`,
  COURSE_CHAPTERS:              (courseId) => `course-chapters/${courseId}`,

  // ==================== TEACHER COURSES ====================

  TEACHER_COURSES:              (teacherId) => `teacher-course/${teacherId}`,
  TEACHER_COURSE_DETAIL:        (id) => `teacher-course-detail/${id}`,

  // ==================== ENROLLMENT ====================

  STUDENT_ENROLL_COURSE:        "student-enroll-course/",
  FETCH_ENROLL_STATUS:          (studentId, courseId) => `fetch-enroll-status/${studentId}/${courseId}`,
  FETCH_ENROLLED_COURSES:       (studentId) => `fetch-enrolled-courses/${studentId}`,
  FETCH_ENROLLED_STUDENTS:      (courseId) => `fetch-enrolled-students/${courseId}`,
  FETCH_RECOMMENDED_COURSES:    (studentId) => `fetch-recomemded-coourses/${studentId}`,
  FETCH_ALL_ENROLLED_STUDENTS:  (teacherId) => `fetch-all-enrolled-students/${teacherId}`,

  // ==================== RATINGS & FAVORITES ====================

  COURSE_RATING:                "course-rating/",
  FETCH_RATING_STATUS:          (studentId, courseId) => `fetch-rating-status/${studentId}/${courseId}`,
  FETCH_FAVORITE_STATUS:        (studentId, courseId) => `fetch-favorite-status/${studentId}/${courseId}`,
  STUDENT_ADD_FAVORITE:         "student-add-favorte-course/",
  STUDENT_REMOVE_FAVORITE:      (courseId, studentId) => `student-remove-favorite-course/${courseId}/${studentId}`,
  FETCH_FAVORITE_COURSES:       (studentId) => `fetch-favorite-coourses/${studentId}`,

  // ==================== STUDY MATERIALS ====================

  STUDY_MATERIALS:              (courseId) => `study-material/${courseId}`,
  STUDY_MATERIAL_DETAIL:        (id) => `study-materials/${id}`,
  USER_STUDY_MATERIAL:          (courseId) => `user/study-material/${courseId}`,

  // ==================== MISC ====================

  POPULAR_TEACHERS:             "popular-teachers/",
  FAQ:                          "faq/",
  PAGES:                        "pages/",
  PAGE_DETAIL:                  (id, slug) => `pages/${id}/${slug}`,
  MY_TEACHERS:                  (studentId) => `fetch-my-teachers/${studentId}`,

  // ==================== SCHOOLS (Admin managed) ====================

  SCHOOLS:                      "schools/",
  SCHOOL_DETAIL:                (id) => `schools/${id}/`,
  SCHOOL_TEACHERS_ADMIN:        (schoolId) => `schools/${schoolId}/teachers/`,
  SCHOOL_TEACHER_DETAIL_ADMIN:  (id) => `school-teachers/${id}/`,
  SCHOOL_STUDENTS_ADMIN:        (schoolId) => `schools/${schoolId}/students/`,
  SCHOOL_STUDENT_DETAIL_ADMIN:  (id) => `school-students/${id}/`,
  SCHOOL_COURSES_ADMIN:         (schoolId) => `schools/${schoolId}/courses/`,
  SCHOOL_COURSE_DETAIL_ADMIN:   (id) => `school-courses/${id}/`,

  // ==================== ACTIVITY LOGS ====================

  ACTIVITY_LOGS:                "activity-logs/",

  // ==================== SYSTEM SETTINGS ====================

  SYSTEM_SETTINGS:              "system-settings/",
  SYSTEM_SETTINGS_DETAIL:       (id) => `system-settings/${id}/`,
  GET_SETTINGS:                 "get-settings/",

  // ==================== ADMIN USER MANAGEMENT ====================

  ADMIN_TEACHERS:               "admin/teachers/",
  ADMIN_TOGGLE_TEACHER:         (id) => `admin/toggle-teacher/${id}/`,
  ADMIN_STUDENTS:               "admin/students/",
  ADMIN_COURSES:                "admin/courses/",
  ADMIN_COURSE_CREATE:          "admin/course/create/",
  ADMIN_COURSE_DETAIL:          (id) => `admin/course/${id}/`,
  ADMIN_DELETE_COURSE:          (id) => `admin/delete-course/${id}/`,

  // ==================== TEACHER VERIFICATION ====================

  TEACHER_VERIFICATION_START:          (id) => `teacher/${id}/verification/start/`,
  TEACHER_VERIFICATION_STATUS:         (id) => `teacher/${id}/verification/status/`,
  TEACHER_VERIFICATION_UPLOAD_ID:      (id) => `teacher/${id}/verification/upload-id/`,
  TEACHER_VERIFICATION_BACKGROUND:     (id) => `teacher/${id}/verification/background-check/`,
  TEACHER_VERIFICATION_SIGN:           (id) => `teacher/${id}/verification/sign-agreement/`,
  ADMIN_TEACHER_VERIFICATION:          (id) => `admin/teacher/${id}/verification/`,
  ADMIN_REVIEW_TEACHER_ID:             (id) => `admin/teacher/${id}/verification/review-id/`,
  ADMIN_REVIEW_TEACHER_BG:             (id) => `admin/teacher/${id}/verification/review-background/`,
  ADMIN_REVIEW_TEACHER_AGREEMENT:      (teacherId, sigId) => `admin/teacher/${teacherId}/verification/review-agreement/${sigId}/`,
  ADMIN_ACTIVATE_TEACHER:              (id) => `admin/teacher/${id}/verification/activate/`,
  ADMIN_REJECT_TEACHER:                (id) => `admin/teacher/${id}/verification/reject/`,

  // ==================== ADMIN LESSON MANAGEMENT ====================

  ADMIN_MODULES:                "admin/modules/",
  ADMIN_MODULE_DETAIL:          (id) => `admin/module/${id}/`,
  ADMIN_COURSE_MODULES:         (courseId) => `admin/course/${courseId}/modules/`,
  ADMIN_REORDER_MODULES:        (courseId) => `admin/course/${courseId}/reorder-modules/`,
  ADMIN_MODULE_LESSONS:         (moduleId) => `admin/module/${moduleId}/lessons/`,
  ADMIN_LESSON_DETAIL:          (id) => `admin/lesson/${id}/`,
  ADMIN_DUPLICATE_LESSON:       (id) => `admin/lesson/${id}/duplicate/`,
  ADMIN_REORDER_LESSONS:        (moduleId) => `admin/module/${moduleId}/reorder-lessons/`,
  ADMIN_BULK_DELETE_LESSONS:    "admin/lessons/bulk-delete/",

  // ==================== LESSON DOWNLOADABLES ====================

  LESSON_DOWNLOADABLES:         (lessonId) => `lesson/${lessonId}/downloadables/`,
  DOWNLOADABLE_DETAIL:          (id) => `downloadable/${id}/`,
  DOWNLOADABLE_INCREMENT:       (id) => `downloadable/${id}/increment/`,

  // ==================== STUDENT LESSON PROGRESS ====================

  STUDENT_MODULE_PROGRESS:          (studentId, courseId) => `student/${studentId}/course/${courseId}/progress/`,
  STUDENT_MODULE_PROGRESS_ENHANCED: (studentId, courseId) => `student/${studentId}/course/${courseId}/progress-enhanced/`,
  MARK_LESSON_COMPLETE:             (studentId, lessonId) => `student/${studentId}/lesson/${lessonId}/complete/`,
  UPDATE_LESSON_POSITION:           (studentId, lessonId) => `student/${studentId}/lesson/${lessonId}/position/`,
  STUDENT_COURSE_NAVIGATION:        (studentId, courseId, lessonId) => `student/${studentId}/course/${courseId}/lesson/${lessonId}/navigation/`,
  CHECK_LESSON_UNLOCK:              (studentId, lessonId) => `student/${studentId}/lesson/${lessonId}/unlock-status/`,
  LESSON_DETAIL_WITH_DOWNLOADS:     (lessonId) => `lesson/${lessonId}/detail/`,
  LESSON_DETAIL_WITH_DOWNLOADS_STU: (lessonId, studentId) => `lesson/${lessonId}/detail/${studentId}/`,

  // ==================== CONSOLIDATED LESSON PAGE DATA ====================

  STUDENT_LESSON_PAGE_DATA:         (studentId, courseId, lessonId) => `student/${studentId}/course/${courseId}/lesson/${lessonId}/full-page-data/`,
  STUDENT_COURSE_PAGE_DATA:         (studentId, courseId) => `student/${studentId}/course/${courseId}/full-page-data/`,

  // ==================== MINOR SAFETY & PARENTAL CONSENT ====================

  STUDENT_REQUEST_PARENT_LINK:      (studentId) => `student/${studentId}/parent/request-link/`,
  RESEND_PARENTAL_CONSENT_EMAIL:    (studentId) => `student/${studentId}/parent/resend-email/`,
  STUDENT_PARENT_CONSENT_STATUS:    (studentId) => `student/${studentId}/parent/status/`,
  PARENTAL_CONSENT_VERIFY:          "parent/consent/verify/",
  PARENTAL_CONSENT_RESPOND:         "parent/consent/respond/",
  PARENT_AUTHORIZE_STUDENT:         (parentId, studentId) => `parent/${parentId}/student/${studentId}/authorize/`,
  PARENT_MANAGE_LIVE_CONSENT:       (parentId, studentId) => `parent/${parentId}/student/${studentId}/live-consent/`,
  PARENT_PREAUTHORIZE_SESSIONS:     (parentId, studentId) => `parent/${parentId}/student/${studentId}/preauthorize-sessions/`,

  // Minor registration & access
  STUDENT_SUBMIT_PARENT_EMAIL:      (studentId) => `student/${studentId}/submit-parent-email/`,
  STUDENT_MINOR_ACCESS_STATUS:      (studentId) => `student/${studentId}/minor-access-status/`,
  SESSION_PARENTAL_STATUS:          (sessionId, studentId) => `session/${sessionId}/student/${studentId}/parental-status/`,
  ADMIN_MINORS_CONSENT_STATUS:      "admin/minors/consent-status/",

  // ==================== ENHANCED STUDENT DASHBOARD ====================

  ENHANCED_STUDENT_DASHBOARD:       (studentId) => `student/enhanced-dashboard/${studentId}/`,
  STREAK_CALENDAR:                  (studentId) => `student/streak-calendar/${studentId}/`,
  ALL_ACHIEVEMENTS:                 (studentId) => `student/all-achievements/${studentId}/`,

  // Weekly Goals
  WEEKLY_GOALS:                     (studentId) => `student/weekly-goals/${studentId}/`,
  WEEKLY_GOAL_DETAIL:               (id) => `student/weekly-goal/${id}/`,
  CREATE_WEEKLY_GOAL:               (studentId) => `student/create-weekly-goal/${studentId}/`,

  // Lesson Progress
  LESSON_PROGRESS:                  (studentId) => `student/lesson-progress/${studentId}/`,
  LESSON_PROGRESS_COURSE:           (studentId, courseId) => `student/lesson-progress/${studentId}/${courseId}/`,
  UPDATE_LESSON_PROGRESS:           (studentId, chapterId) => `student/update-lesson-progress/${studentId}/${chapterId}/`,

  // Course Progress
  COURSE_PROGRESS:                  (studentId) => `student/course-progress/${studentId}/`,
  COURSE_PROGRESS_DETAIL:           (studentId, courseId) => `student/course-progress/${studentId}/${courseId}/`,

  // Daily Activity
  DAILY_ACTIVITY:                   (studentId) => `student/daily-activity/${studentId}/`,

  // Achievements
  ACHIEVEMENTS:                     "achievements/",
  STUDENT_ACHIEVEMENTS:             (studentId) => `student/achievements/${studentId}/`,
  CHECK_ACHIEVEMENTS:               (studentId) => `student/check-achievements/${studentId}/`,

  // ==================== ENHANCED TEACHER DASHBOARD ====================

  TEACHER_OVERVIEW:                 (teacherId) => `teacher/overview/${teacherId}/`,
  TEACHER_STUDENTS:                 (teacherId) => `teacher/students/${teacherId}/`,
  TEACHER_STUDENT_DETAIL:           (id) => `teacher/student/${id}/`,
  TEACHER_STUDENTS_FROM_ENROLL:     (teacherId) => `teacher/students-from-enrollments/${teacherId}/`,
  SEARCH_STUDENTS_FOR_TEACHER:      (teacherId) => `teacher/search-students/${teacherId}/`,
  ASSIGN_COURSE_TO_STUDENT:         (teacherId) => `teacher/assign-course/${teacherId}/`,
  UNASSIGN_COURSE_FROM_STUDENT:     (teacherId) => `teacher/unassign-course/${teacherId}/`,
  TEACHER_COURSES_FOR_STUDENT:      (teacherId, studentId) => `teacher/courses-for-student/${teacherId}/${studentId}/`,

  // Teacher Sessions
  TEACHER_SESSIONS:                 (teacherId) => `teacher/sessions/${teacherId}/`,
  TEACHER_SESSION_DETAIL:           (id) => `teacher/session/${id}/`,
  UPDATE_SESSION_RECORDING:         (sessionId) => `session/${sessionId}/recording/update/`,
  CREATE_SESSION_SAFETY_REPORT:     (sessionId) => `session/${sessionId}/report/`,
  CREATE_AUDIO_SAFETY_REPORT:       (audioMessageId) => `audio-message/${audioMessageId}/report/`,
  ADMIN_SAFETY_REPORTS:             "admin/safety-reports/",
  ADMIN_UPDATE_SAFETY_REPORT:       (reportId) => `admin/safety-report/${reportId}/update/`,

  // Teacher Activity Feed
  TEACHER_ACTIVITIES:               (teacherId) => `teacher/activities/${teacherId}/`,
  CREATE_TEACHER_ACTIVITY:          (teacherId) => `teacher/activity/create/${teacherId}/`,

  // Lesson Library
  TEACHER_LESSONS:                  (teacherId) => `teacher/lessons/${teacherId}/`,
  TEACHER_LESSON_DETAIL:            (id) => `teacher/lesson/${id}/`,

  // Lesson Materials
  LESSON_MATERIALS:                 (lessonId) => `lesson/materials/${lessonId}/`,
  LESSON_MATERIAL_DETAIL:           (id) => `lesson/material/${id}/`,
  UPLOAD_LESSON_MATERIAL:           (lessonId) => `lesson/upload-material/${lessonId}/`,

  // Teacher Progress Dashboard
  TEACHER_PROGRESS:                 (teacherId) => `teacher/progress/${teacherId}/`,

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  SUBSCRIPTION_PLANS:               "subscription-plans/",
  SUBSCRIPTION_PLAN_DETAIL:         (id) => `subscription-plan/${id}/`,
  SUBSCRIPTIONS:                    "subscriptions/",
  CREATE_PAYMENT_INTENT:            "subscription/create-payment-intent/",
  ACTIVATE_SUBSCRIPTION:            (id) => `subscription/${id}/activate/`,
  CANCEL_SUBSCRIPTION:              (id) => `subscription/${id}/cancel/`,
  SUBSCRIPTION_DETAIL:              (id) => `subscription/${id}/`,
  SUBSCRIPTION_HISTORY:             "subscription-history/",
  ADMIN_SUBSCRIPTION_STATS:         "admin/subscription-stats/",

  // ==================== ACCESS CONTROL ====================

  CHECK_SUBSCRIPTION:               (studentId) => `access/check-subscription/${studentId}/`,
  CHECK_COURSE_ACCESS:              (studentId, courseId) => `access/course/${studentId}/${courseId}/`,
  CHECK_LESSON_ACCESS:              (studentId, lessonId) => `access/lesson/${studentId}/${lessonId}/`,
  RECORD_LESSON_ACCESS:             (studentId, lessonId) => `access/record-lesson/${studentId}/${lessonId}/`,
  ACCESS_ENROLL:                    "access/enroll/",
  PROTECTED_ENROLL:                 "access/protected-enroll/",
  ACCESS_SUMMARY:                   (studentId) => `access/summary/${studentId}/`,
  ACCESSIBLE_COURSES:               (studentId) => `access/courses/${studentId}/`,
  SUBSCRIPTION_USAGE:               (studentId) => `access/usage/${studentId}/`,
  ASSIGNED_TEACHER:                 (studentId) => `access/assigned-teacher/${studentId}/`,
  ASSIGN_TEACHER:                   "access/assign-teacher/",
  PLAN_TEACHERS:                    (planId) => `access/plan-teachers/${planId}/`,
  UPGRADE_SUBSCRIPTION:             "access/upgrade/",
  DOWNGRADE_SUBSCRIPTION:           "access/downgrade/",
  EXPIRE_CHECK:                     "access/expire-check/",

  // ==================== AUDIT LOGS ====================

  AUDIT_UPLOADS:                    "audit/uploads/",
  AUDIT_UPLOAD_DETAIL:              (id) => `audit/uploads/${id}/`,
  AUDIT_LOG_UPLOAD:                 "audit/log-upload/",
  AUDIT_PAYMENTS:                   "audit/payments/",
  AUDIT_PAYMENT_DETAIL:             (id) => `audit/payments/${id}/`,
  AUDIT_LOG_PAYMENT:                "audit/log-payment/",
  AUDIT_ACCESS:                     "audit/access/",
  AUDIT_ACCESS_DETAIL:              (id) => `audit/access/${id}/`,
  AUDIT_LOG_ACCESS:                 "audit/log-access/",
  AUDIT_SUMMARY:                    "audit/summary/",
  AUDIT_EXPORT:                     (logType) => `audit/export/${logType}/`,
  AUDIT_ACTIVITY_LOGS:              "audit/activity-logs/",

  // ==================== SCHOOL DASHBOARD ====================

  SCHOOL_TEACHERS:                  (schoolId) => `school/teachers/${schoolId}/`,
  SCHOOL_STUDENTS:                  (schoolId) => `school/students/${schoolId}/`,
  SCHOOL_COURSES:                   (schoolId) => `school/courses/${schoolId}/`,
  SCHOOL_ASSIGN_TEACHER_STUDENT:    (schoolId) => `school/assign-teacher-to-student/${schoolId}/`,

  // Group Classes
  SCHOOL_GROUPS:                    (schoolId) => `school/groups/${schoolId}/`,
  SCHOOL_GROUP_DETAIL:              (id) => `school/group/${id}/`,
  SCHOOL_GROUP_ASSIGN_TEACHER:      (groupId) => `school/group/${groupId}/assign-teacher/`,
  SCHOOL_GROUP_REMOVE_TEACHER:      (groupId, teacherId) => `school/group/${groupId}/remove-teacher/${teacherId}/`,
  SCHOOL_GROUP_ASSIGN_STUDENT:      (groupId) => `school/group/${groupId}/assign-student/`,
  SCHOOL_GROUP_REMOVE_STUDENT:      (groupId, studentId) => `school/group/${groupId}/remove-student/${studentId}/`,
  GROUP_CLASS_TEACHERS:             (groupId) => `school/group/${groupId}/teachers/`,
  GROUP_CLASS_STUDENTS:             (groupId) => `school/group/${groupId}/students/`,

  // Lesson Assignments (School)
  SCHOOL_LESSON_ASSIGNMENTS:        (schoolId) => `school/lesson-assignments/${schoolId}/`,
  SCHOOL_LESSON_ASSIGNMENT_DETAIL:  (id) => `school/lesson-assignment/${id}/`,
  STUDENT_LESSON_ASSIGNMENTS:       (studentId) => `student/${studentId}/lesson-assignments/`,
  STUDENT_SUBMIT_LESSON_ASSIGNMENT: (studentId, assignmentId) => `student/${studentId}/lesson-assignment/${assignmentId}/submit/`,
  TEACHER_LESSON_ASSIGNMENT_SUBS:   (teacherId) => `teacher/${teacherId}/lesson-assignment-submissions/`,
  TEACHER_GRADE_LESSON_ASSIGNMENT:  (teacherId, submissionId) => `teacher/${teacherId}/lesson-assignment-submission/${submissionId}/grade/`,

  // School Progress
  SCHOOL_PROGRESS:                  (schoolId) => `school/progress/${schoolId}/`,

  // ==================== LIVE VIDEO SESSIONS ====================

  SESSION_GO_LIVE:                  (sessionId) => `session/${sessionId}/go-live/`,
  SESSION_END:                      (sessionId) => `session/${sessionId}/end/`,
  STUDENT_UPCOMING_SESSIONS:        (studentId) => `student/${studentId}/upcoming-sessions/`,
  STUDENT_LIVE_SESSIONS:            (studentId) => `student/${studentId}/live-sessions/`,
  STUDENT_JOIN_SESSION:             (studentId, sessionId) => `student/${studentId}/join-session/${sessionId}/`,

  // ==================== AUDIO MESSAGES ====================

  TEACHER_AUDIO_MESSAGES:           (teacherId) => `teacher/${teacherId}/audio-messages/`,
  AUDIO_MESSAGE_DETAIL:             (id) => `audio-message/${id}/`,
  STUDENT_AUDIO_MESSAGES:           (studentId) => `student/${studentId}/audio-messages/`,
  MARK_AUDIO_MESSAGE_READ:          (id) => `audio-message/${id}/read/`,
  STUDENT_UNREAD_AUDIO_COUNT:       (studentId) => `student/${studentId}/unread-audio-count/`,

  // ==================== TEXT MESSAGING ====================

  MESSAGES:                         "messages/",
  MESSAGE_CONVERSATION:             (parentLinkId) => `messages/conversation/${parentLinkId}/`,
  DIRECT_CONVERSATION:              (teacherStudentId) => `messages/direct-conversation/${teacherStudentId}/`,
  SEND_MESSAGE:                     "messages/send/",
  MARK_MESSAGES_READ:               (parentLinkId) => `messages/mark-read/${parentLinkId}/`,
  MARK_DIRECT_MESSAGES_READ:        (teacherStudentId) => `messages/mark-read-direct/${teacherStudentId}/`,
  UNREAD_MESSAGE_COUNT:             "messages/unread-count/",
  STUDENT_TEACHER_CONVERSATIONS:    (studentId) => `student/${studentId}/teacher-conversations/`,

  // ==================== CHAT LOCK & UNLOCK ====================

  CHAT_LOCK_POLICIES:               "chat-lock-policies/",
  CHAT_LOCK_POLICY_DETAIL:          (id) => `chat-lock-policy/${id}/`,
  CHAT_LOCK_STATUS:                 (parentLinkId) => `chat-lock-status/${parentLinkId}/`,
  ADMIN_TOGGLE_CHAT_LOCK:           (parentLinkId) => `admin/chat-lock/${parentLinkId}/toggle/`,
  CHAT_UNLOCK_REQUESTS:             "chat-unlock-requests/",

  // ==================== TEACHER OFFICE HOURS ====================

  TEACHER_OFFICE_HOURS:             (teacherId) => `teacher/${teacherId}/office-hours/`,
  OFFICE_HOURS_DETAIL:              (id) => `office-hours/${id}/`,

  // ==================== GROUP MESSAGING & FEATURES ====================

  // Group Messages (chat)
  GROUP_MESSAGES:                   (groupId) => `group/${groupId}/messages/`,
  GROUP_MESSAGE_TOGGLE_PIN:         (messageId) => `group-message/${messageId}/toggle-pin/`,
  GROUP_MESSAGE_HIDE:               (messageId) => `group-message/${messageId}/hide/`,

  // Group Announcements
  GROUP_ANNOUNCEMENTS:              (groupId) => `group/${groupId}/announcements/`,
  GROUP_ANNOUNCEMENT_DETAIL:        (id) => `group-announcement/${id}/`,

  // Group Resources
  GROUP_RESOURCES:                  (groupId) => `group/${groupId}/resources/`,
  GROUP_RESOURCE_DETAIL:            (id) => `group-resource/${id}/`,
  GROUP_RESOURCE_DOWNLOAD:          (resourceId) => `group-resource/${resourceId}/download/`,

  // Group Sessions (live video)
  GROUP_SESSIONS:                   (groupId) => `group/${groupId}/sessions/`,
  GROUP_SESSION_DETAIL:             (id) => `group-session/${id}/`,
  GROUP_SESSION_GO_LIVE:            (sessionId) => `group-session/${sessionId}/go-live/`,
  GROUP_SESSION_END:                (sessionId) => `group-session/${sessionId}/end/`,
  GROUP_SESSION_JOIN:               (sessionId, studentId) => `group-session/${sessionId}/join/${studentId}/`,
  GROUP_SESSION_LEAVE:              (sessionId, logId) => `group-session/${sessionId}/leave/${logId}/`,
  GROUP_SESSION_PARTICIPANTS:       (sessionId) => `group-session/${sessionId}/participants/`,

  // Phase 4: Convenience group endpoints
  GROUP_CHAT_SEND:                  (groupId) => `group/${groupId}/chat/send/`,
  SCHEDULE_GROUP_SESSION:           (groupId) => `group/${groupId}/schedule-session/`,
  STUDENT_JOIN_GROUP_SESSION:       (studentId, sessionId) => `student/${studentId}/join-group-session/${sessionId}/`,
  GROUP_ASSIGNMENTS:                (groupId) => `group/${groupId}/assignments/`,
  STUDENT_GROUP_ASSIGNMENTS:        (studentId) => `student/${studentId}/group-assignments/`,
  STUDENT_MY_GROUPS:                (studentId) => `student/${studentId}/my-groups/`,
  GROUP_CLASS_DETAIL_EXTENDED:      (groupId) => `group-class/${groupId}/`,

  // ==================== TEACHER ASSIGNMENT MANAGEMENT ====================

  TEACHER_ASSIGNMENTS:              (teacherId) => `teacher/${teacherId}/assignments/`,
  TEACHER_ASSIGNMENT_DETAIL:        (teacherId, id) => `teacher/${teacherId}/assignment/${id}/`,
  TEACHER_GROUPS:                   (teacherId) => `teacher/${teacherId}/groups/`,

  // ==================== DISCUSSION THREADS ====================

  DISCUSSION_THREADS:               (assignmentId) => `assignment/${assignmentId}/discussions/`,
  DISCUSSION_THREAD_DETAIL:         (id) => `discussion/${id}/`,

  // ==================== MULTIPLE CHOICE ====================

  MC_QUESTIONS:                     (assignmentId) => `assignment/${assignmentId}/mc-questions/`,
  MC_QUESTION_DETAIL:               (id) => `mc-question/${id}/`,
  MC_SUBMIT:                        (assignmentId, studentId) => `assignment/${assignmentId}/mc-submit/${studentId}/`,

  // ==================== PARENT POLICY ACCEPTANCE ====================

  PARENT_POLICY_ACCEPTANCES:        (parentId) => `parent/${parentId}/policy-acceptances/`,
  PARENT_POLICY_STATUS:             (parentId) => `parent/${parentId}/policy-status/`,

  // ==================== TEACHER COMMUNITY ====================

  TEACHER_COMMUNITY_MESSAGES:       "teacher-community/messages/",
  TEACHER_COMMUNITY_MESSAGE_DETAIL: (id) => `teacher-community/message/${id}/`,
  TEACHER_COMMUNITY_TOGGLE_PIN:     (id) => `teacher-community/message/${id}/toggle-pin/`,
  TEACHER_COMMUNITY_HIDE:           (id) => `teacher-community/message/${id}/hide/`,

  // ==================== GAMES & GAMIFICATION ====================

  GAMES_SEED:                       "games/seed-phase1/",
  GAMES_LIST:                       "games/",
  STUDENT_GAMES_OVERVIEW:           (studentId) => `student/${studentId}/games/overview/`,
  STUDENT_SONARA_COINS:             (studentId) => `student/${studentId}/games/sonara-coins/`,
  STUDENT_GAME_START:               (studentId, gameType) => `student/${studentId}/games/${gameType}/start/`,
  GAME_SESSION_ATTEMPT:             (sessionId) => `games/session/${sessionId}/attempt/`,
  GAME_SESSION_NEXT_QUESTION:       (sessionId) => `games/session/${sessionId}/next-question/`,
  GAME_SESSION_QUESTIONS:           (sessionId) => `games/session/${sessionId}/questions/`,
  GAME_SESSION_FINISH:              (sessionId) => `games/session/${sessionId}/finish/`,
  GAME_LEADERBOARD:                 (gameType) => `games/leaderboard/${gameType}/`,
  TEACHER_GAMES_PERFORMANCE:        (teacherId) => `teacher/${teacherId}/games/students-performance/`,
  ADMIN_GAMES_ANALYTICS:            "admin/games/analytics/",
};
