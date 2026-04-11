/**
 * Subscription Access Control Service for Kannari Music Academy (React Native)
 * Copied from frontend/src/services/subscriptionService.js
 * Changed: hardcoded API URLs → ENDPOINTS from endpoints.js, axios → axiosInstance
 */

import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

// Cache for subscription status (avoids repeated API calls)
let subscriptionCache = {
    data: null,
    timestamp: null,
    studentId: null,
    ttl: 60000 // 1 minute cache
};

/**
 * Get the student's active subscription with full details
 */
export const getStudentSubscription = async (studentId, forceRefresh = false) => {
    if (!studentId) return null;
    
    // Check cache
    const now = Date.now();
    if (!forceRefresh && 
        subscriptionCache.data && 
        subscriptionCache.studentId === studentId &&
        subscriptionCache.timestamp && 
        (now - subscriptionCache.timestamp) < subscriptionCache.ttl) {
        return subscriptionCache.data;
    }
    
    try {
        const response = await axiosInstance.get(ENDPOINTS.ACCESS_SUMMARY(studentId), {
            params: { requester_student_id: studentId },
            headers: { 'X-Student-Id': String(studentId) }
        });
        
        // Update cache
        subscriptionCache = {
            data: response.data,
            timestamp: now,
            studentId: studentId
        };
        
        return response.data;
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }
};

/**
 * Check if student has an active subscription
 */
export const checkSubscriptionStatus = async (studentId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.CHECK_SUBSCRIPTION(studentId), {
            params: { requester_student_id: studentId },
            headers: { 'X-Student-Id': String(studentId) }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking subscription:', error);
        return { has_active_subscription: false, status: 'error' };
    }
};

/**
 * Check if student can access a specific course
 */
export const checkCourseAccess = async (studentId, courseId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.CHECK_COURSE_ACCESS(studentId, courseId), {
            params: { requester_student_id: studentId },
            headers: { 'X-Student-Id': String(studentId) }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking course access:', error);
        return { 
            can_access: false, 
            reason: error.response?.data?.reason || 'Unable to verify access'
        };
    }
};

/**
 * Check if student can access a specific lesson
 */
export const checkLessonAccess = async (studentId, lessonId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.CHECK_LESSON_ACCESS(studentId, lessonId), {
            params: { requester_student_id: studentId },
            headers: { 'X-Student-Id': String(studentId) }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking lesson access:', error);
        return { 
            can_access: false, 
            reason: error.response?.data?.reason || 'Unable to verify access'
        };
    }
};

/**
 * Record lesson access (for usage tracking)
 */
export const recordLessonAccess = async (studentId, lessonId) => {
    try {
        const response = await axiosInstance.post(
            ENDPOINTS.RECORD_LESSON_ACCESS(studentId, lessonId),
            { requester_student_id: studentId },
            { headers: { 'X-Student-Id': String(studentId) } }
        );
        // Invalidate cache as usage has changed
        subscriptionCache.data = null;
        return response.data;
    } catch (error) {
        console.error('Error recording lesson access:', error);
        return { success: false };
    }
};

/**
 * Enroll in a course with subscription validation
 */
export const enrollWithSubscription = async (studentId, courseId) => {
    try {
        const response = await axiosInstance.post(ENDPOINTS.ACCESS_ENROLL, {
            student_id: studentId,
            course_id: courseId
        });
        // Invalidate cache as enrollment has changed
        subscriptionCache.data = null;
        return response.data;
    } catch (error) {
        console.error('Error enrolling with subscription:', error);
        return { 
            success: false, 
            error: error.response?.data?.error || 'Enrollment failed'
        };
    }
};

/**
 * Get list of courses accessible to the student
 */
export const getAccessibleCourses = async (studentId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.ACCESSIBLE_COURSES(studentId), {
            params: { requester_student_id: studentId },
            headers: { 'X-Student-Id': String(studentId) }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching accessible courses:', error);
        return { courses: [] };
    }
};

/**
 * Get subscription usage statistics
 */
export const getSubscriptionUsage = async (studentId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.SUBSCRIPTION_USAGE(studentId), {
            params: { requester_student_id: studentId },
            headers: { 'X-Student-Id': String(studentId) }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching usage:', error);
        return null;
    }
};

/**
 * Get the assigned teacher for the student's subscription
 */
export const getAssignedTeacher = async (studentId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.ASSIGNED_TEACHER(studentId), {
            params: { requester_student_id: studentId },
            headers: { 'X-Student-Id': String(studentId) }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching assigned teacher:', error);
        return { has_assigned_teacher: false };
    }
};

/**
 * Get teachers available for a subscription plan
 */
export const getPlanTeachers = async (planId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.PLAN_TEACHERS(planId));
        return response.data;
    } catch (error) {
        console.error('Error fetching plan teachers:', error);
        return { teachers: [] };
    }
};

/**
 * Clear the subscription cache (call after subscription changes)
 */
export const clearSubscriptionCache = () => {
    subscriptionCache = {
        data: null,
        timestamp: null,
        studentId: null,
        ttl: 60000
    };
};

/**
 * Format access level for display
 */
export const formatAccessLevel = (level) => {
    const levels = {
        'free': 'Free',
        'basic': 'Basic',
        'standard': 'Standard',
        'premium': 'Premium',
        'unlimited': 'Unlimited'
    };
    return levels[level] || levels[String(level).toLowerCase()] || 'Unknown';
};

/**
 * Get access level badge color
 */
export const getAccessLevelColor = (level) => {
    const colors = {
        'free': '#6b7280', // gray
        'basic': '#3b82f6', // blue
        'standard': '#8b5cf6', // purple
        'premium': '#f59e0b', // amber
        'unlimited': '#10b981'  // emerald
    };
    return colors[level] || colors[String(level).toLowerCase()] || '#6b7280';
};

/**
 * Check if a course is locked for the student
 */
export const isCourseLockedForStudent = async (studentId, course) => {
    // Free courses are never locked
    if (!course.required_access_level || course.required_access_level === 'free') {
        return { locked: false, reason: null };
    }
    
    // Check subscription access
    const access = await checkCourseAccess(studentId, course.id);
    
    if (!access.can_access) {
        return { 
            locked: true, 
            reason: access.reason,
            required_level: course.required_access_level
        };
    }
    
    return { locked: false, reason: null };
};

/**
 * Hook-friendly subscription checker
 * Returns subscription status with loading state
 */
export const useSubscriptionStatus = (studentId) => {
    // This is a utility for components - actual hook implementation would need React imports
    return {
        checkStatus: () => checkSubscriptionStatus(studentId),
        checkCourseAccess: (courseId) => checkCourseAccess(studentId, courseId),
        checkLessonAccess: (lessonId) => checkLessonAccess(studentId, lessonId),
        getUsage: () => getSubscriptionUsage(studentId),
        getSummary: () => getStudentSubscription(studentId)
    };
};

export default {
    getStudentSubscription,
    checkSubscriptionStatus,
    checkCourseAccess,
    checkLessonAccess,
    recordLessonAccess,
    enrollWithSubscription,
    getAccessibleCourses,
    getSubscriptionUsage,
    getAssignedTeacher,
    getPlanTeachers,
    clearSubscriptionCache,
    formatAccessLevel,
    getAccessLevelColor,
    isCourseLockedForStudent
};
