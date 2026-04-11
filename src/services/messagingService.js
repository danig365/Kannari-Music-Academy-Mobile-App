/**
 * Messaging Service for Kannari Music Academy (React Native)
 * Copied from frontend/src/services/messagingService.js
 * Changed: hardcoded API URLs → ENDPOINTS from endpoints.js, axios → axiosInstance
 */

import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

// ==================== TEXT MESSAGING ====================

export const getConversation = (parentLinkId) =>
  axiosInstance.get(ENDPOINTS.MESSAGE_CONVERSATION(parentLinkId));

export const getDirectConversation = (teacherStudentId) =>
  axiosInstance.get(ENDPOINTS.DIRECT_CONVERSATION(teacherStudentId));

export const sendMessage = (payload) =>
  axiosInstance.post(ENDPOINTS.SEND_MESSAGE, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

export const markMessagesRead = (parentLinkId, readerType, readerId) =>
  axiosInstance.post(ENDPOINTS.MARK_MESSAGES_READ(parentLinkId),
    JSON.stringify({ reader_type: readerType, reader_id: readerId }),
    { headers: { 'Content-Type': 'application/json' } }
  );

export const markDirectMessagesRead = (teacherStudentId, readerType, readerId) =>
  axiosInstance.post(ENDPOINTS.MARK_DIRECT_MESSAGES_READ(teacherStudentId),
    JSON.stringify({ reader_type: readerType, reader_id: readerId }),
    { headers: { 'Content-Type': 'application/json' } }
  );

export const getUnreadMessageCount = (userType, userId) =>
  axiosInstance.get(`${ENDPOINTS.UNREAD_MESSAGE_COUNT}?user_type=${userType}&user_id=${userId}`);

export const getStudentTeacherConversations = (studentId) =>
  axiosInstance.get(ENDPOINTS.STUDENT_TEACHER_CONVERSATIONS(studentId));

// ==================== CHAT LOCK / UNLOCK ====================

export const getChatLockStatus = (parentLinkId) =>
  axiosInstance.get(ENDPOINTS.CHAT_LOCK_STATUS(parentLinkId));

export const adminToggleChatLock = (parentLinkId, payload) =>
  axiosInstance.post(ENDPOINTS.ADMIN_TOGGLE_CHAT_LOCK(parentLinkId), payload, {
    headers: { 'Content-Type': 'application/json' }
  });

export const getChatLockPolicies = (params = '') =>
  axiosInstance.get(`${ENDPOINTS.CHAT_LOCK_POLICIES}${params}`);

// ==================== TEACHER OFFICE HOURS ====================

export const getTeacherOfficeHours = (teacherId) =>
  axiosInstance.get(ENDPOINTS.TEACHER_OFFICE_HOURS(teacherId));

export const createTeacherOfficeHours = (teacherId, data) =>
  axiosInstance.post(ENDPOINTS.TEACHER_OFFICE_HOURS(teacherId), data);

export const updateTeacherOfficeHours = (id, data) =>
  axiosInstance.put(ENDPOINTS.OFFICE_HOURS_DETAIL(id), data);

export const deleteTeacherOfficeHours = (id) =>
  axiosInstance.delete(ENDPOINTS.OFFICE_HOURS_DETAIL(id));

// ==================== GROUP MESSAGES ====================

export const getGroupMessages = (groupId) =>
  axiosInstance.get(ENDPOINTS.GROUP_MESSAGES(groupId));

export const sendGroupMessage = (groupId, data) =>
  axiosInstance.post(ENDPOINTS.GROUP_MESSAGES(groupId), data);

export const toggleGroupMessagePin = (messageId) =>
  axiosInstance.post(ENDPOINTS.GROUP_MESSAGE_TOGGLE_PIN(messageId));

export const hideGroupMessage = (messageId) =>
  axiosInstance.post(ENDPOINTS.GROUP_MESSAGE_HIDE(messageId));

// ==================== GROUP ANNOUNCEMENTS ====================

export const getGroupAnnouncements = (groupId) =>
  axiosInstance.get(ENDPOINTS.GROUP_ANNOUNCEMENTS(groupId));

export const createGroupAnnouncement = (groupId, data) =>
  axiosInstance.post(ENDPOINTS.GROUP_ANNOUNCEMENTS(groupId), data);

export const updateGroupAnnouncement = (id, data) =>
  axiosInstance.put(ENDPOINTS.GROUP_ANNOUNCEMENT_DETAIL(id), data);

export const deleteGroupAnnouncement = (id) =>
  axiosInstance.delete(ENDPOINTS.GROUP_ANNOUNCEMENT_DETAIL(id));

// ==================== GROUP RESOURCES ====================

export const getGroupResources = (groupId) =>
  axiosInstance.get(ENDPOINTS.GROUP_RESOURCES(groupId));

export const uploadGroupResource = (groupId, formData) =>
  axiosInstance.post(ENDPOINTS.GROUP_RESOURCES(groupId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteGroupResource = (id) =>
  axiosInstance.delete(ENDPOINTS.GROUP_RESOURCE_DETAIL(id));

export const downloadGroupResource = (resourceId) =>
  axiosInstance.post(ENDPOINTS.GROUP_RESOURCE_DOWNLOAD(resourceId));

// ==================== GROUP SESSIONS ====================

export const getGroupSessions = (groupId, status = '') =>
  axiosInstance.get(`${ENDPOINTS.GROUP_SESSIONS(groupId)}${status ? `?status=${status}` : ''}`);

export const createGroupSession = (groupId, data) =>
  axiosInstance.post(ENDPOINTS.GROUP_SESSIONS(groupId), data);

export const updateGroupSession = (id, data) =>
  axiosInstance.put(ENDPOINTS.GROUP_SESSION_DETAIL(id), data);

export const deleteGroupSession = (id) =>
  axiosInstance.delete(ENDPOINTS.GROUP_SESSION_DETAIL(id));

export const groupSessionGoLive = (sessionId) =>
  axiosInstance.post(ENDPOINTS.GROUP_SESSION_GO_LIVE(sessionId));

export const groupSessionEnd = (sessionId) =>
  axiosInstance.post(ENDPOINTS.GROUP_SESSION_END(sessionId));

export const groupSessionJoin = (sessionId, studentId) =>
  axiosInstance.post(ENDPOINTS.GROUP_SESSION_JOIN(sessionId, studentId));

export const groupSessionLeave = (sessionId, logId) =>
  axiosInstance.post(ENDPOINTS.GROUP_SESSION_LEAVE(sessionId, logId));

export const getGroupSessionParticipants = (sessionId) =>
  axiosInstance.get(ENDPOINTS.GROUP_SESSION_PARTICIPANTS(sessionId));

// ==================== DISCUSSION THREADS ====================

export const getDiscussionThreads = (assignmentId) =>
  axiosInstance.get(ENDPOINTS.DISCUSSION_THREADS(assignmentId));

export const createDiscussionPost = (assignmentId, data) =>
  axiosInstance.post(ENDPOINTS.DISCUSSION_THREADS(assignmentId), data);

export const updateDiscussionPost = (id, data) =>
  axiosInstance.put(ENDPOINTS.DISCUSSION_THREAD_DETAIL(id), data);

export const deleteDiscussionPost = (id) =>
  axiosInstance.delete(ENDPOINTS.DISCUSSION_THREAD_DETAIL(id));

// ==================== MULTIPLE CHOICE ====================

export const getMCQuestions = (assignmentId) =>
  axiosInstance.get(ENDPOINTS.MC_QUESTIONS(assignmentId));

export const createMCQuestion = (assignmentId, data) =>
  axiosInstance.post(ENDPOINTS.MC_QUESTIONS(assignmentId), data);

export const updateMCQuestion = (id, data) =>
  axiosInstance.put(ENDPOINTS.MC_QUESTION_DETAIL(id), data);

export const deleteMCQuestion = (id) =>
  axiosInstance.delete(ENDPOINTS.MC_QUESTION_DETAIL(id));

export const submitMCAnswers = (assignmentId, studentId, answers) =>
  axiosInstance.post(ENDPOINTS.MC_SUBMIT(assignmentId, studentId),
    JSON.stringify({ answers }),
    { headers: { 'Content-Type': 'application/json' } }
  );

// ==================== TEACHER ASSIGNMENTS ====================

export const getTeacherAssignments = (teacherId) =>
  axiosInstance.get(ENDPOINTS.TEACHER_ASSIGNMENTS(teacherId));

export const createTeacherAssignment = (teacherId, data) =>
  axiosInstance.post(ENDPOINTS.TEACHER_ASSIGNMENTS(teacherId), data);

// ==================== PARENT POLICY ====================

export const getParentPolicyStatus = (parentId) =>
  axiosInstance.get(ENDPOINTS.PARENT_POLICY_STATUS(parentId));

export const acceptParentPolicy = (parentId, data) =>
  axiosInstance.post(ENDPOINTS.PARENT_POLICY_ACCEPTANCES(parentId), data);
