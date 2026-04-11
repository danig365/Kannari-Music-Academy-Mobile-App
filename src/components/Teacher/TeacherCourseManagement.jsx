import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'
import AdminLessonManagement from '../Admin/AdminLessonManagement';

/**
 * TeacherCourseManagement - Wrapper component that reuses AdminLessonManagement
 * for teacher-specific course management functionality.
 * 
 * This component passes teacher-specific props to AdminLessonManagement to:
 * - Filter courses to only show the logged-in teacher's courses
 * - Auto-assign the teacher when creating new courses
 * - Hide instructor selection dropdown (teacher is auto-assigned)
 * - Hide advanced analytics (admin-only feature)
 * - Use teacher-specific navigation paths
 */
const TeacherCourseManagement = () => {
    const [teacherId, setTeacherId] = React.useState(null)

    React.useEffect(() => {
        const getTeacherId = async () => {
            const id = await AsyncStorage.getItem('teacherId')
            setTeacherId(id)
        }

        getTeacherId()
    }, [])
    
    return (
        <AdminLessonManagement 
            userType="teacher"
            teacherId={teacherId}
            basePath="/teacher/course-management"
            pageTitle="My Course Management"
            showTeacherSelect={false}
            showAnalytics={false}
        />
    );
};

export default TeacherCourseManagement;
