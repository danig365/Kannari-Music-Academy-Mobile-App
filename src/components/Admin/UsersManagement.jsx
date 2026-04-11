import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const mediaBaseUrl = API_BASE_URL.replace('/api', '');

const tabs = ['students', 'teachers', 'schools', 'minors', 'safety'];

const emptyStudentForm = {
    fullname: '',
    email: '',
    username: '',
    password: '',
    interseted_categories: '',
};

const emptyTeacherForm = {
    full_name: '',
    email: '',
    mobile_no: '',
    password: '',
    qualification: '',
    skills: '',
};

const emptySchoolForm = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    website: '',
    status: 'trial',
    max_teachers: '10',
    max_students: '100',
    max_courses: '50',
};

const UsersManagement = () => {
    const [adminId, setAdminId] = useState('');
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [schoolsSearchTerm, setSchoolsSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [students, setStudents] = useState([]);
    const [studentsTotalPages, setStudentsTotalPages] = useState(1);

    const [teachers, setTeachers] = useState([]);
    const [teachersTotalPages, setTeachersTotalPages] = useState(1);
    const [teacherVerificationFilter, setTeacherVerificationFilter] = useState('');

    const [schools, setSchools] = useState([]);

    const [minors, setMinors] = useState([]);
    const [minorsLoading, setMinorsLoading] = useState(false);

    const [safetyReports, setSafetyReports] = useState([]);
    const [safetyStatusFilter, setSafetyStatusFilter] = useState('');
    const [safetyLoading, setSafetyLoading] = useState(false);

    const [showStudentModal, setShowStudentModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [studentFormData, setStudentFormData] = useState(emptyStudentForm);

    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [teacherFormData, setTeacherFormData] = useState(emptyTeacherForm);

    const [showSchoolModal, setShowSchoolModal] = useState(false);
    const [editingSchool, setEditingSchool] = useState(null);
    const [schoolFormData, setSchoolFormData] = useState(emptySchoolForm);

    const [showMembersModal, setShowMembersModal] = useState(false);
    const [membersSchool, setMembersSchool] = useState(null);
    const [schoolTeachers, setSchoolTeachers] = useState([]);
    const [schoolStudents, setSchoolStudents] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersMsg, setMembersMsg] = useState('');

    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationDetail, setVerificationDetail] = useState(null);
    const [verificationTeacher, setVerificationTeacher] = useState(null);
    const [verificationLoading, setVerificationLoading] = useState(false);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordSchool, setPasswordSchool] = useState(null);
    const [newSchoolPassword, setNewSchoolPassword] = useState('');

    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [selectedSafetyReport, setSelectedSafetyReport] = useState(null);
    const [safetyUpdateStatus, setSafetyUpdateStatus] = useState('open');
    const [safetyUpdateNotes, setSafetyUpdateNotes] = useState('');

    useEffect(() => {
        const loadAdmin = async () => {
            const storedAdminId = await AsyncStorage.getItem('adminId');
            setAdminId(storedAdminId || '');
        };
        loadAdmin();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
        setSchoolsSearchTerm('');

        if (activeTab === 'students') fetchStudents(1, '');
        if (activeTab === 'teachers') fetchTeachers(1, '', teacherVerificationFilter);
        if (activeTab === 'schools') fetchSchools(1, '');
        if (activeTab === 'minors' && adminId) fetchMinorsStatus();
        if (activeTab === 'safety' && adminId) fetchSafetyReports(safetyStatusFilter);
    }, [activeTab, adminId]);

    useEffect(() => {
        if (activeTab === 'students') fetchStudents(currentPage, searchTerm);
        if (activeTab === 'teachers') fetchTeachers(currentPage, searchTerm, teacherVerificationFilter);
        if (activeTab === 'schools') fetchSchools(currentPage, schoolsSearchTerm);
        if (activeTab === 'safety' && adminId) fetchSafetyReports(safetyStatusFilter);
    }, [currentPage, searchTerm, schoolsSearchTerm, teacherVerificationFilter, safetyStatusFilter]);

    const fetchStudents = async (page = currentPage, search = searchTerm) => {
        setLoading(true);
        try {
            let url = `${baseUrl}/admin/students/?page=${page}`;
            if (search) url += `&search=${search}`;
            const response = await axios.get(url);
            if (response.data.results) {
                setStudents(response.data.results);
                setStudentsTotalPages(Math.ceil(response.data.count / 8) || 1);
            } else {
                setStudents(Array.isArray(response.data) ? response.data : []);
                setStudentsTotalPages(1);
            }
        } catch (error) {
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async (
        page = currentPage,
        search = searchTerm,
        verificationFilter = teacherVerificationFilter
    ) => {
        setLoading(true);
        try {
            let url = `${baseUrl}/admin/teachers/?page=${page}`;
            if (search) url += `&search=${search}`;
            if (verificationFilter) url += `&verification_status=${verificationFilter}`;
            const response = await axios.get(url);
            if (response.data.results) {
                setTeachers(response.data.results);
                setTeachersTotalPages(Math.ceil(response.data.count / 8) || 1);
            } else {
                setTeachers(Array.isArray(response.data) ? response.data : []);
                setTeachersTotalPages(1);
            }
        } catch (error) {
            setTeachers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async (page = currentPage, search = schoolsSearchTerm) => {
        setLoading(true);
        try {
            let url = `${baseUrl}/schools/?page=${page}`;
            if (search) url += `&search=${search}`;
            const response = await axios.get(url);
            const schoolsData = response.data.results ? response.data.results : response.data;
            setSchools(Array.isArray(schoolsData) ? schoolsData : []);
        } catch (error) {
            setSchools([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMinorsStatus = async () => {
        if (!adminId) return;
        setMinorsLoading(true);
        try {
            const res = await axios.get(`${baseUrl}/admin/minors/consent-status/?requester_admin_id=${adminId}`);
            setMinors(Array.isArray(res.data?.minors) ? res.data.minors : []);
        } catch (error) {
            setMinors([]);
        } finally {
            setMinorsLoading(false);
        }
    };

    const fetchSafetyReports = async (status = safetyStatusFilter) => {
        if (!adminId) return;
        setSafetyLoading(true);
        try {
            let url = `${baseUrl}/admin/safety-reports/?requester_admin_id=${adminId}`;
            if (status) url += `&status=${status}`;
            const res = await axios.get(url);
            setSafetyReports(Array.isArray(res.data?.reports) ? res.data.reports : []);
        } catch (error) {
            setSafetyReports([]);
        } finally {
            setSafetyLoading(false);
        }
    };

    const openStudentModal = () => {
        setEditingStudent(null);
        setStudentFormData(emptyStudentForm);
        setShowStudentModal(true);
    };

    const closeStudentModal = () => {
        setShowStudentModal(false);
        setEditingStudent(null);
        setStudentFormData(emptyStudentForm);
    };

    const handleEditStudent = (student) => {
        setEditingStudent(student);
        setStudentFormData({
            fullname: student.fullname || '',
            email: student.email || '',
            username: student.username || '',
            password: '',
            interseted_categories: student.interseted_categories || '',
        });
        setShowStudentModal(true);
    };

    const handleStudentSubmit = async () => {
        try {
            const formData = new FormData();
            formData.append('fullname', studentFormData.fullname);
            formData.append('email', studentFormData.email);
            formData.append('username', studentFormData.username);
            formData.append('interseted_categories', studentFormData.interseted_categories);
            if (studentFormData.password) formData.append('password', studentFormData.password);

            if (editingStudent) {
                await axios.put(`${baseUrl}/student/${editingStudent.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await axios.post(`${baseUrl}/student/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            await fetchStudents();
            closeStudentModal();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || error.response?.data?.fullname?.[0] || 'Failed to save student');
        }
    };

    const handleDeleteStudent = (studentId) => {
        Alert.alert('Delete Student', 'Are you sure you want to delete this student?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/student/${studentId}/`);
                        fetchStudents();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete student');
                    }
                },
            },
        ]);
    };

    const openTeacherModal = () => {
        setEditingTeacher(null);
        setTeacherFormData(emptyTeacherForm);
        setShowTeacherModal(true);
    };

    const closeTeacherModal = () => {
        setShowTeacherModal(false);
        setEditingTeacher(null);
        setTeacherFormData(emptyTeacherForm);
    };

    const handleEditTeacher = (teacher) => {
        setEditingTeacher(teacher);
        setTeacherFormData({
            full_name: teacher.full_name || '',
            email: teacher.email || '',
            mobile_no: teacher.mobile_no || '',
            password: '',
            qualification: teacher.qualification || '',
            skills: teacher.skills || '',
        });
        setShowTeacherModal(true);
    };

    const handleTeacherSubmit = async () => {
        try {
            const formData = new FormData();
            formData.append('full_name', teacherFormData.full_name);
            formData.append('email', teacherFormData.email);
            formData.append('mobile_no', teacherFormData.mobile_no);
            formData.append('qualification', teacherFormData.qualification);
            formData.append('skills', teacherFormData.skills);
            if (teacherFormData.password) formData.append('password', teacherFormData.password);

            if (editingTeacher) {
                await axios.put(`${baseUrl}/teacher/${editingTeacher.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await axios.post(`${baseUrl}/teacher/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            await fetchTeachers();
            closeTeacherModal();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || error.response?.data?.full_name?.[0] || 'Failed to save teacher');
        }
    };

    const handleDeleteTeacher = (teacherId) => {
        Alert.alert('Delete Teacher', 'Are you sure you want to delete this teacher?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/teacher/${teacherId}/`);
                        fetchTeachers();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete teacher');
                    }
                },
            },
        ]);
    };

    const handleTeacherApproval = async (teacher, shouldApprove) => {
        try {
            const formData = new FormData();
            formData.append('is_approved', shouldApprove ? 'true' : 'false');
            const response = await axios.post(`${baseUrl}/admin/toggle-teacher/${teacher.id}/`, formData);
            if (response.data?.bool) {
                Alert.alert('Success', response.data?.message || 'Teacher approval status updated.');
                fetchTeachers();
            } else {
                Alert.alert('Update Failed', response.data?.message || 'Could not update teacher approval status.');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update teacher approval status.');
        }
    };

    const openTeacherVerificationDetails = async (teacher) => {
        setVerificationTeacher(teacher);
        setVerificationLoading(true);
        setShowVerificationModal(true);
        try {
            const res = await axios.get(
                `${baseUrl}/admin/teacher/${teacher.id}/verification/?requester_admin_id=${adminId}`
            );
            setVerificationDetail(res.data?.verification || null);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to load verification details.');
            setShowVerificationModal(false);
        } finally {
            setVerificationLoading(false);
        }
    };

    const closeVerificationModal = () => {
        setShowVerificationModal(false);
        setVerificationDetail(null);
        setVerificationTeacher(null);
    };

    const handleVerificationAction = async (teacherId, action, extraParams = {}) => {
        try {
            const payload = new FormData();
            payload.append('requester_admin_id', adminId);
            Object.entries(extraParams).forEach(([k, v]) => payload.append(k, v));

            let url = '';
            if (action === 'approve-id') url = `${baseUrl}/admin/teacher/${teacherId}/verification/review-id/`;
            else if (action === 'approve-bg') url = `${baseUrl}/admin/teacher/${teacherId}/verification/review-background/`;
            else if (action === 'activate') url = `${baseUrl}/admin/teacher/${teacherId}/verification/activate/`;

            const res = await axios.post(url, payload);
            Alert.alert('Success', res.data?.message || 'Updated');
            fetchTeachers();

            const refresh = await axios.get(
                `${baseUrl}/admin/teacher/${teacherId}/verification/?requester_admin_id=${adminId}`
            );
            setVerificationDetail(refresh.data?.verification || null);
        } catch (error) {
            Alert.alert('Action Failed', error.response?.data?.message || 'Please try again.');
        }
    };

    const approvePendingAgreements = async (teacherId) => {
        try {
            const detail = await axios.get(
                `${baseUrl}/admin/teacher/${teacherId}/verification/?requester_admin_id=${adminId}`
            );
            const signatures = (detail.data?.verification?.agreement_signatures || []).filter(
                (item) => item.status === 'in_review' || item.status === 'pending'
            );

            if (!signatures.length) {
                Alert.alert('Info', 'No pending agreement signatures');
                return;
            }

            await Promise.all(
                signatures.map((signature) => {
                    const payload = new FormData();
                    payload.append('requester_admin_id', adminId);
                    payload.append('decision', 'approved');
                    payload.append('notes', 'Approved from admin mobile dashboard');
                    return axios.post(
                        `${baseUrl}/admin/teacher/${teacherId}/verification/review-agreement/${signature.id}/`,
                        payload
                    );
                })
            );

            Alert.alert('Success', 'Pending agreements approved');
            fetchTeachers();
        } catch (error) {
            Alert.alert('Failed', error.response?.data?.message || 'Please try again.');
        }
    };

    const activateTeacherAfterVerification = async (teacherId) => {
        try {
            const payload = new FormData();
            payload.append('requester_admin_id', adminId);
            const res = await axios.post(`${baseUrl}/admin/teacher/${teacherId}/verification/activate/`, payload);
            Alert.alert('Success', res.data?.message || 'Teacher activated');
            fetchTeachers();
        } catch (error) {
            Alert.alert('Activation Failed', error.response?.data?.message || 'Could not activate teacher.');
        }
    };

    const rejectTeacherVerification = async (teacherId) => {
        Alert.alert('Reject Verification', 'Reject this teacher verification?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const payload = new FormData();
                        payload.append('requester_admin_id', adminId);
                        payload.append('reason', 'Rejected by admin review');
                        const res = await axios.post(`${baseUrl}/admin/teacher/${teacherId}/verification/reject/`, payload);
                        Alert.alert('Success', res.data?.message || 'Verification rejected');
                        fetchTeachers();
                    } catch (error) {
                        Alert.alert('Rejection Failed', error.response?.data?.message || 'Could not reject verification.');
                    }
                },
            },
        ]);
    };

    const openSafetyStatusModal = (report) => {
        setSelectedSafetyReport(report);
        setSafetyUpdateStatus(report.status || 'open');
        setSafetyUpdateNotes('');
        setShowSafetyModal(true);
    };

    const submitSafetyReportStatus = async () => {
        if (!selectedSafetyReport) return;
        try {
            const payload = new FormData();
            payload.append('requester_admin_id', adminId);
            payload.append('status', safetyUpdateStatus);
            payload.append('admin_notes', safetyUpdateNotes || '');
            const res = await axios.post(
                `${baseUrl}/admin/safety-report/${selectedSafetyReport.id}/update/`,
                payload
            );
            Alert.alert('Success', res.data?.message || 'Safety report updated');
            setShowSafetyModal(false);
            fetchSafetyReports();
        } catch (error) {
            Alert.alert('Failed', error.response?.data?.message || 'Please try again.');
        }
    };

    const openSchoolModal = () => {
        setEditingSchool(null);
        setSchoolFormData(emptySchoolForm);
        setShowSchoolModal(true);
    };

    const closeSchoolModal = () => {
        setShowSchoolModal(false);
        setEditingSchool(null);
        setSchoolFormData(emptySchoolForm);
    };

    const handleEditSchool = (school) => {
        setEditingSchool(school);
        setSchoolFormData({
            name: school.name || '',
            email: school.email || '',
            phone: school.phone || '',
            address: school.address || '',
            city: school.city || '',
            state: school.state || '',
            country: school.country || 'India',
            website: school.website || '',
            status: school.status || 'trial',
            max_teachers: String(school.max_teachers ?? '10'),
            max_students: String(school.max_students ?? '100'),
            max_courses: String(school.max_courses ?? '50'),
        });
        setShowSchoolModal(true);
    };

    const handleSchoolSubmit = async () => {
        try {
            const formData = new FormData();
            Object.entries(schoolFormData).forEach(([key, value]) => formData.append(key, value));

            if (editingSchool) {
                await axios.put(`${baseUrl}/schools/${editingSchool.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                const response = await axios.post(`${baseUrl}/schools/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (response.data.school_login_email && response.data.school_login_password) {
                    Alert.alert(
                        'School Created',
                        `Email: ${response.data.school_login_email}\nPassword: ${response.data.school_login_password}\n\nSave these credentials now.`
                    );
                }
            }
            fetchSchools();
            closeSchoolModal();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || error.response?.data?.name?.[0] || 'Failed to save school');
        }
    };

    const handleDeleteSchool = (schoolId) => {
        Alert.alert('Delete School', 'Are you sure you want to delete this school?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/schools/${schoolId}/`);
                        fetchSchools();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete school');
                    }
                },
            },
        ]);
    };

    const handleSchoolChangePassword = (school) => {
        if (!school.school_user_id) {
            Alert.alert('No School User', 'This school does not have a login user associated with it.');
            return;
        }
        setPasswordSchool(school);
        setNewSchoolPassword('');
        setShowPasswordModal(true);
    };

    const submitSchoolPasswordChange = async () => {
        if (!passwordSchool || newSchoolPassword.length < 4) {
            Alert.alert('Invalid Password', 'Password must be at least 4 characters.');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('password', newSchoolPassword);
            const response = await axios.post(
                `${baseUrl}/school/change-password/${passwordSchool.school_user_id}/`,
                formData
            );
            if (response.data.bool) {
                Alert.alert('Password Changed', `Password for ${passwordSchool.name} updated successfully.`);
            } else {
                Alert.alert('Error', 'Failed to change password.');
            }
            setShowPasswordModal(false);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to change password.');
        }
    };

    const openMembersModal = async (school) => {
        setMembersSchool(school);
        setShowMembersModal(true);
        setMembersLoading(true);
        setMembersMsg('');
        try {
            const [stRes, ssRes, allTRes, allSRes] = await Promise.all([
                axios.get(`${baseUrl}/schools/${school.id}/teachers/`),
                axios.get(`${baseUrl}/schools/${school.id}/students/`),
                axios.get(`${baseUrl}/teacher/`),
                axios.get(`${baseUrl}/student/`),
            ]);
            setSchoolTeachers(Array.isArray(stRes.data) ? stRes.data : []);
            setSchoolStudents(Array.isArray(ssRes.data) ? ssRes.data : []);
            setAllTeachers(Array.isArray(allTRes.data) ? allTRes.data : []);
            setAllStudents(Array.isArray(allSRes.data) ? allSRes.data : []);
        } catch (error) {
            setMembersMsg('Failed to load school members.');
        } finally {
            setMembersLoading(false);
        }
    };

    const closeMembersModal = () => {
        setShowMembersModal(false);
        setMembersSchool(null);
        setSchoolTeachers([]);
        setSchoolStudents([]);
        fetchSchools();
    };

    const addTeacherToSchool = async (teacherId) => {
        if (!teacherId || !membersSchool) return;
        try {
            await axios.post(`${baseUrl}/schools/${membersSchool.id}/teachers/`, {
                school: membersSchool.id,
                teacher: teacherId,
            });
            const res = await axios.get(`${baseUrl}/schools/${membersSchool.id}/teachers/`);
            setSchoolTeachers(Array.isArray(res.data) ? res.data : []);
            setMembersMsg('Teacher assigned successfully!');
        } catch (error) {
            setMembersMsg('Failed to assign teacher');
        }
    };

    const removeTeacherFromSchool = (recordId) => {
        Alert.alert('Remove Teacher', 'Remove this teacher from school?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/school-teachers/${recordId}/`);
                        setSchoolTeachers((prev) => prev.filter((item) => item.id !== recordId));
                        setMembersMsg('Teacher removed');
                    } catch (error) {
                        setMembersMsg('Failed to remove teacher');
                    }
                },
            },
        ]);
    };

    const addStudentToSchool = async (studentId) => {
        if (!studentId || !membersSchool) return;
        try {
            await axios.post(`${baseUrl}/schools/${membersSchool.id}/students/`, {
                school: membersSchool.id,
                student: studentId,
            });
            const res = await axios.get(`${baseUrl}/schools/${membersSchool.id}/students/`);
            setSchoolStudents(Array.isArray(res.data) ? res.data : []);
            setMembersMsg('Student assigned successfully!');
        } catch (error) {
            setMembersMsg('Failed to assign student');
        }
    };

    const removeStudentFromSchool = (recordId) => {
        Alert.alert('Remove Student', 'Remove this student from school?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/school-students/${recordId}/`);
                        setSchoolStudents((prev) => prev.filter((item) => item.id !== recordId));
                        setMembersMsg('Student removed');
                    } catch (error) {
                        setMembersMsg('Failed to remove student');
                    }
                },
            },
        ]);
    };

    const availableTeachers = useMemo(() => {
        const assignedTeacherIds = schoolTeachers.map((st) => st.teacher?.id || st.teacher);
        return allTeachers.filter((teacher) => !assignedTeacherIds.includes(teacher.id));
    }, [schoolTeachers, allTeachers]);

    const availableStudents = useMemo(() => {
        const assignedStudentIds = schoolStudents.map((ss) => ss.student?.id || ss.student);
        return allStudents.filter((student) => !assignedStudentIds.includes(student.id));
    }, [schoolStudents, allStudents]);

    const getStatusBadgeStyle = (status) => {
        if (status === 'active' || status === 'approved' || status === 'resolved' || status === 'verified') {
            return styles.badgeSuccess;
        }
        if (status === 'trial' || status === 'in_review' || status === 'pending') {
            return styles.badgeWarning;
        }
        if (status === 'suspended' || status === 'rejected' || status === 'expired') {
            return styles.badgeDanger;
        }
        return styles.badgeNeutral;
    };

    const getDocumentUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${mediaBaseUrl}${path}`;
    };

    const openDocument = async (path) => {
        const url = getDocumentUrl(path);
        if (!url) return;
        const supported = await Linking.canOpenURL(url);
        if (supported) Linking.openURL(url);
    };

    const onPressAdd = () => {
        if (activeTab === 'students') openStudentModal();
        if (activeTab === 'teachers') openTeacherModal();
        if (activeTab === 'schools') openSchoolModal();
    };

    if (loading && students.length === 0 && teachers.length === 0 && schools.length === 0) {
        return (
            <View style={styles.loadingWrapper}>
                <LoadingSpinner size="lg" text="Loading users..." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Users Management</Text>
                    {activeTab !== 'minors' && activeTab !== 'safety' && (
                        <TouchableOpacity style={styles.addButton} onPress={onPressAdd}>
                            <Text style={styles.addButtonText}>+ Add New</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                    <View style={styles.tabRow}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                    {tab === 'students'
                                        ? 'Students'
                                        : tab === 'teachers'
                                        ? 'Teachers'
                                        : tab === 'schools'
                                        ? 'Schools'
                                        : tab === 'minors'
                                        ? 'Minor Consents'
                                        : 'Safety Reports'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {activeTab === 'students' && (
                    <>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or email"
                            value={searchTerm}
                            onChangeText={(text) => {
                                setSearchTerm(text);
                                setCurrentPage(1);
                            }}
                        />

                        {students.length ? (
                            students.map((student, index) => (
                                <View key={student.id} style={styles.card}>
                                    <Text style={styles.cardTitle}>{student.fullname}</Text>
                                    <Text style={styles.cardSub}>{student.email}</Text>
                                    <Text style={styles.cardSub}>Username: {student.username || 'N/A'}</Text>
                                    <Text style={styles.cardSub}>Enrolled: {student.enrolled_courses || 0}</Text>
                                    <View style={styles.rowButtons}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.editButton]}
                                            onPress={() => handleEditStudent(student)}
                                        >
                                            <Text style={styles.actionText}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.deleteButton]}
                                            onPress={() => handleDeleteStudent(student.id)}
                                        >
                                            <Text style={styles.actionText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyState}>No students found</Text>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={studentsTotalPages}
                            onChange={setCurrentPage}
                        />
                    </>
                )}

                {activeTab === 'teachers' && (
                    <>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or email"
                            value={searchTerm}
                            onChangeText={(text) => {
                                setSearchTerm(text);
                                setCurrentPage(1);
                            }}
                        />

                        <View style={styles.filterRow}>
                            {['', 'verified', 'in_review', 'unverified', 'rejected', 'expired'].map((filter) => (
                                <TouchableOpacity
                                    key={filter || 'all'}
                                    style={[
                                        styles.chip,
                                        teacherVerificationFilter === filter && styles.chipActive,
                                    ]}
                                    onPress={() => {
                                        setTeacherVerificationFilter(filter);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            teacherVerificationFilter === filter && styles.chipTextActive,
                                        ]}
                                    >
                                        {filter ? filter.replace('_', ' ') : 'all'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {teachers.length ? (
                            teachers.map((teacher) => (
                                <View key={teacher.id} style={styles.card}>
                                    <Text style={styles.cardTitle}>{teacher.full_name}</Text>
                                    <Text style={styles.cardSub}>{teacher.email}</Text>
                                    <View style={styles.badgesRow}>
                                        <View style={[styles.badge, teacher.is_approved ? styles.badgeSuccess : styles.badgeWarning]}>
                                            <Text style={styles.badgeText}>{teacher.is_approved ? 'Approved' : 'Pending'}</Text>
                                        </View>
                                        <View style={[styles.badge, getStatusBadgeStyle(teacher.verification_status)]}>
                                            <Text style={styles.badgeText}>{(teacher.verification_status || 'unverified').replace('_', ' ')}</Text>
                                        </View>
                                        <View style={[styles.badge, teacher.can_teach_minors ? styles.badgeSuccess : styles.badgeNeutral]}>
                                            <Text style={styles.badgeText}>{teacher.can_teach_minors ? 'Minors OK' : 'Minors Blocked'}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardSub}>Mobile: {teacher.mobile_no || 'N/A'}</Text>
                                    <Text style={styles.cardSub}>Courses: {teacher.total_teacher_course || 0}</Text>
                                    <Text style={styles.cardSub}>Students: {teacher.total_teacher_students || 0}</Text>

                                    <View style={styles.rowButtonsWrap}>
                                        <SmallAction
                                            label={teacher.is_approved ? 'Revoke' : 'Approve'}
                                            style={styles.secondaryButton}
                                            onPress={() => handleTeacherApproval(teacher, !teacher.is_approved)}
                                        />
                                        <SmallAction
                                            label="Verify"
                                            style={styles.primaryButton}
                                            onPress={() => openTeacherVerificationDetails(teacher)}
                                        />
                                        <SmallAction
                                            label="ID+"
                                            style={styles.successButton}
                                            onPress={() => handleVerificationAction(teacher.id, 'approve-id', { decision: 'approved' })}
                                        />
                                        <SmallAction
                                            label="BG+"
                                            style={styles.successButton}
                                            onPress={() => handleVerificationAction(teacher.id, 'approve-bg', { decision: 'approved' })}
                                        />
                                        <SmallAction
                                            label="Agr+"
                                            style={styles.infoButton}
                                            onPress={() => approvePendingAgreements(teacher.id)}
                                        />
                                        <SmallAction
                                            label="Activate"
                                            style={styles.successButton}
                                            onPress={() => activateTeacherAfterVerification(teacher.id)}
                                        />
                                        <SmallAction
                                            label="Reject"
                                            style={styles.deleteButton}
                                            onPress={() => rejectTeacherVerification(teacher.id)}
                                        />
                                        <SmallAction
                                            label="Edit"
                                            style={styles.editButton}
                                            onPress={() => handleEditTeacher(teacher)}
                                        />
                                        <SmallAction
                                            label="Delete"
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteTeacher(teacher.id)}
                                        />
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyState}>No teachers found</Text>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={teachersTotalPages}
                            onChange={setCurrentPage}
                        />
                    </>
                )}

                {activeTab === 'schools' && (
                    <>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by school name or email"
                            value={schoolsSearchTerm}
                            onChangeText={(text) => {
                                setSchoolsSearchTerm(text);
                                setCurrentPage(1);
                            }}
                        />

                        {schools.length ? (
                            schools.map((school) => (
                                <View key={school.id} style={styles.card}>
                                    <Text style={styles.cardTitle}>{school.name}</Text>
                                    <Text style={styles.cardSub}>{school.email}</Text>
                                    <Text style={styles.cardSub}>Phone: {school.phone || 'N/A'}</Text>
                                    <Text style={styles.cardSub}>City: {school.city || 'N/A'}</Text>
                                    <View style={[styles.badge, getStatusBadgeStyle(school.status)]}>
                                        <Text style={styles.badgeText}>{(school.status || 'trial').toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.cardSub}>Plan: {school.subscription_plan || 'N/A'}</Text>

                                    <View style={styles.rowButtonsWrap}>
                                        <SmallAction
                                            label="Members"
                                            style={styles.infoButton}
                                            onPress={() => openMembersModal(school)}
                                        />
                                        <SmallAction
                                            label="Password"
                                            style={styles.secondaryButton}
                                            onPress={() => handleSchoolChangePassword(school)}
                                        />
                                        <SmallAction
                                            label="Edit"
                                            style={styles.editButton}
                                            onPress={() => handleEditSchool(school)}
                                        />
                                        <SmallAction
                                            label="Delete"
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteSchool(school.id)}
                                        />
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyState}>No schools found</Text>
                        )}
                    </>
                )}

                {activeTab === 'minors' && (
                    <>
                        <TouchableOpacity style={styles.refreshButton} onPress={fetchMinorsStatus}>
                            <Text style={styles.refreshText}>Refresh</Text>
                        </TouchableOpacity>

                        {minorsLoading ? (
                            <Text style={styles.emptyState}>Loading minors consent data...</Text>
                        ) : minors.length ? (
                            minors.map((minor) => (
                                <View key={minor.student_id} style={styles.card}>
                                    <Text style={styles.cardTitle}>{minor.student_name}</Text>
                                    <Text style={styles.cardSub}>{minor.student_email}</Text>
                                    <Text style={styles.cardSub}>Parent: {minor.parent_name || 'Not linked'}</Text>
                                    <View style={styles.badgesRow}>
                                        <View style={[styles.badge, getStatusBadgeStyle(minor.parent_link_status)]}>
                                            <Text style={styles.badgeText}>Link: {minor.parent_link_status || 'N/A'}</Text>
                                        </View>
                                        <View style={[styles.badge, getStatusBadgeStyle(minor.live_sessions_status)]}>
                                            <Text style={styles.badgeText}>Live: {minor.live_sessions_status || 'N/A'}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardSub}>Auth Mode: {minor.authorization_mode || 'N/A'}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyState}>No minor records found</Text>
                        )}
                    </>
                )}

                {activeTab === 'safety' && (
                    <>
                        <View style={styles.filterRow}>
                            {['', 'open', 'in_review', 'resolved', 'dismissed'].map((status) => (
                                <TouchableOpacity
                                    key={status || 'all'}
                                    style={[styles.chip, safetyStatusFilter === status && styles.chipActive]}
                                    onPress={() => setSafetyStatusFilter(status)}
                                >
                                    <Text style={[styles.chipText, safetyStatusFilter === status && styles.chipTextActive]}>
                                        {status || 'all'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.refreshButtonSmall} onPress={() => fetchSafetyReports()}>
                                <Text style={styles.refreshText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>

                        {safetyLoading ? (
                            <Text style={styles.emptyState}>Loading safety reports...</Text>
                        ) : safetyReports.length ? (
                            safetyReports.map((report) => (
                                <View key={report.id} style={styles.card}>
                                    <Text style={styles.cardTitle}>{report.report_type}</Text>
                                    <View style={[styles.badge, getStatusBadgeStyle(report.status)]}>
                                        <Text style={styles.badgeText}>{report.status}</Text>
                                    </View>
                                    <Text style={styles.cardSub}>Reporter: {report.reported_by_teacher || report.reported_by_student || 'Unknown'}</Text>
                                    <Text style={styles.cardSub}>Target: {report.reported_teacher || report.reported_student || 'N/A'}</Text>
                                    <Text style={styles.cardSub}>
                                        {(report.description || '').length > 120
                                            ? `${report.description.slice(0, 120)}...`
                                            : report.description || 'N/A'}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.primaryButton, styles.singleAction]}
                                        onPress={() => openSafetyStatusModal(report)}
                                    >
                                        <Text style={styles.actionText}>Update Status</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyState}>No safety reports found</Text>
                        )}
                    </>
                )}
            </ScrollView>

            <StudentModal
                visible={showStudentModal}
                onClose={closeStudentModal}
                formData={studentFormData}
                setFormData={setStudentFormData}
                onSubmit={handleStudentSubmit}
                editing={!!editingStudent}
            />

            <TeacherModal
                visible={showTeacherModal}
                onClose={closeTeacherModal}
                formData={teacherFormData}
                setFormData={setTeacherFormData}
                onSubmit={handleTeacherSubmit}
                editing={!!editingTeacher}
            />

            <SchoolModal
                visible={showSchoolModal}
                onClose={closeSchoolModal}
                formData={schoolFormData}
                setFormData={setSchoolFormData}
                onSubmit={handleSchoolSubmit}
                editing={!!editingSchool}
            />

            <MembersModal
                visible={showMembersModal}
                onClose={closeMembersModal}
                schoolName={membersSchool?.name}
                membersLoading={membersLoading}
                membersMsg={membersMsg}
                schoolTeachers={schoolTeachers}
                schoolStudents={schoolStudents}
                availableTeachers={availableTeachers}
                availableStudents={availableStudents}
                onAddTeacher={addTeacherToSchool}
                onRemoveTeacher={removeTeacherFromSchool}
                onAddStudent={addStudentToSchool}
                onRemoveStudent={removeStudentFromSchool}
            />

            <VerificationModal
                visible={showVerificationModal}
                onClose={closeVerificationModal}
                verificationLoading={verificationLoading}
                verificationTeacher={verificationTeacher}
                verificationDetail={verificationDetail}
                onApproveId={() => handleVerificationAction(verificationDetail?.teacher_id, 'approve-id', { decision: 'approved' })}
                onApproveBg={() => handleVerificationAction(verificationDetail?.teacher_id, 'approve-bg', { decision: 'approved' })}
                onApproveAgreements={() => approvePendingAgreements(verificationDetail?.teacher_id)}
                onActivate={() => handleVerificationAction(verificationDetail?.teacher_id, 'activate')}
                onReject={() => rejectTeacherVerification(verificationTeacher?.id)}
                onOpenDoc={openDocument}
            />

            <PasswordModal
                visible={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                school={passwordSchool}
                value={newSchoolPassword}
                onChange={setNewSchoolPassword}
                onSubmit={submitSchoolPasswordChange}
            />

            <SafetyUpdateModal
                visible={showSafetyModal}
                onClose={() => setShowSafetyModal(false)}
                report={selectedSafetyReport}
                status={safetyUpdateStatus}
                setStatus={setSafetyUpdateStatus}
                notes={safetyUpdateNotes}
                setNotes={setSafetyUpdateNotes}
                onSubmit={submitSafetyReportStatus}
            />
        </View>
    );
};

const Pagination = ({ currentPage, totalPages, onChange }) => {
    if (totalPages <= 1) return null;
    return (
        <View style={styles.paginationRow}>
            <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => currentPage > 1 && onChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <Text style={styles.pageText}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.pageCurrent}>{currentPage} / {totalPages}</Text>
            <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => currentPage < totalPages && onChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <Text style={styles.pageText}>Next</Text>
            </TouchableOpacity>
        </View>
    );
};

const SmallAction = ({ label, style, onPress }) => (
    <TouchableOpacity style={[styles.smallAction, style]} onPress={onPress}>
        <Text style={styles.smallActionText}>{label}</Text>
    </TouchableOpacity>
);

const ModalShell = ({ visible, onClose, title, children }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.modalClose}>Close</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView>{children}</ScrollView>
            </View>
        </View>
    </Modal>
);

const StudentModal = ({ visible, onClose, formData, setFormData, onSubmit, editing }) => (
    <ModalShell visible={visible} onClose={onClose} title={editing ? 'Edit Student' : 'Add Student'}>
        <FormField label="Full Name" value={formData.fullname} onChangeText={(value) => setFormData((prev) => ({ ...prev, fullname: value }))} />
        <FormField label="Email" value={formData.email} onChangeText={(value) => setFormData((prev) => ({ ...prev, email: value }))} />
        <FormField label="Username" value={formData.username} onChangeText={(value) => setFormData((prev) => ({ ...prev, username: value }))} />
        <FormField
            label="Interested Categories"
            value={formData.interseted_categories}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, interseted_categories: value }))}
        />
        <FormField
            label={editing ? 'Password (optional)' : 'Password'}
            value={formData.password}
            secureTextEntry
            onChangeText={(value) => setFormData((prev) => ({ ...prev, password: value }))}
        />
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton, styles.modalSubmit]} onPress={onSubmit}>
            <Text style={styles.actionText}>{editing ? 'Update Student' : 'Add Student'}</Text>
        </TouchableOpacity>
    </ModalShell>
);

const TeacherModal = ({ visible, onClose, formData, setFormData, onSubmit, editing }) => (
    <ModalShell visible={visible} onClose={onClose} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <FormField label="Full Name" value={formData.full_name} onChangeText={(value) => setFormData((prev) => ({ ...prev, full_name: value }))} />
        <FormField label="Email" value={formData.email} onChangeText={(value) => setFormData((prev) => ({ ...prev, email: value }))} />
        <FormField label="Mobile" value={formData.mobile_no} onChangeText={(value) => setFormData((prev) => ({ ...prev, mobile_no: value }))} />
        <FormField
            label="Qualification"
            value={formData.qualification}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, qualification: value }))}
        />
        <FormField label="Skills" value={formData.skills} onChangeText={(value) => setFormData((prev) => ({ ...prev, skills: value }))} />
        <FormField
            label={editing ? 'Password (optional)' : 'Password'}
            value={formData.password}
            secureTextEntry
            onChangeText={(value) => setFormData((prev) => ({ ...prev, password: value }))}
        />
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton, styles.modalSubmit]} onPress={onSubmit}>
            <Text style={styles.actionText}>{editing ? 'Update Teacher' : 'Add Teacher'}</Text>
        </TouchableOpacity>
    </ModalShell>
);

const SchoolModal = ({ visible, onClose, formData, setFormData, onSubmit, editing }) => (
    <ModalShell visible={visible} onClose={onClose} title={editing ? 'Edit School' : 'Add School'}>
        <FormField label="Name" value={formData.name} onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))} />
        <FormField label="Email" value={formData.email} onChangeText={(value) => setFormData((prev) => ({ ...prev, email: value }))} />
        <FormField label="Phone" value={formData.phone} onChangeText={(value) => setFormData((prev) => ({ ...prev, phone: value }))} />
        <FormField label="Address" value={formData.address} onChangeText={(value) => setFormData((prev) => ({ ...prev, address: value }))} />
        <FormField label="City" value={formData.city} onChangeText={(value) => setFormData((prev) => ({ ...prev, city: value }))} />
        <FormField label="State" value={formData.state} onChangeText={(value) => setFormData((prev) => ({ ...prev, state: value }))} />
        <FormField label="Country" value={formData.country} onChangeText={(value) => setFormData((prev) => ({ ...prev, country: value }))} />
        <FormField label="Website" value={formData.website} onChangeText={(value) => setFormData((prev) => ({ ...prev, website: value }))} />
        <FormField label="Status" value={formData.status} onChangeText={(value) => setFormData((prev) => ({ ...prev, status: value }))} />
        <FormField
            label="Max Teachers"
            value={String(formData.max_teachers)}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, max_teachers: value }))}
        />
        <FormField
            label="Max Students"
            value={String(formData.max_students)}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, max_students: value }))}
        />
        <FormField
            label="Max Courses"
            value={String(formData.max_courses)}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, max_courses: value }))}
        />
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton, styles.modalSubmit]} onPress={onSubmit}>
            <Text style={styles.actionText}>{editing ? 'Update School' : 'Add School'}</Text>
        </TouchableOpacity>
    </ModalShell>
);

const MembersModal = ({
    visible,
    onClose,
    schoolName,
    membersLoading,
    membersMsg,
    schoolTeachers,
    schoolStudents,
    availableTeachers,
    availableStudents,
    onAddTeacher,
    onRemoveTeacher,
    onAddStudent,
    onRemoveStudent,
}) => (
    <ModalShell visible={visible} onClose={onClose} title={`Manage Members${schoolName ? ` - ${schoolName}` : ''}`}>
        {membersLoading ? (
            <Text style={styles.emptyState}>Loading members...</Text>
        ) : (
            <>
                {!!membersMsg && <Text style={styles.infoText}>{membersMsg}</Text>}

                <Text style={styles.sectionHead}>Assigned Teachers</Text>
                {schoolTeachers.length ? (
                    schoolTeachers.map((item) => (
                        <View key={item.id} style={styles.memberRow}>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{item.teacher?.full_name || 'Teacher'}</Text>
                                <Text style={styles.memberEmail}>{item.teacher?.email || ''}</Text>
                            </View>
                            <SmallAction label="Remove" style={styles.deleteButton} onPress={() => onRemoveTeacher(item.id)} />
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyState}>No teachers assigned</Text>
                )}

                <Text style={styles.sectionHead}>Add Teacher</Text>
                {availableTeachers.length ? (
                    availableTeachers.slice(0, 20).map((teacher) => (
                        <View key={teacher.id} style={styles.memberRow}>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{teacher.full_name}</Text>
                                <Text style={styles.memberEmail}>{teacher.email}</Text>
                            </View>
                            <SmallAction label="Add" style={styles.successButton} onPress={() => onAddTeacher(teacher.id)} />
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyState}>All teachers are assigned</Text>
                )}

                <Text style={styles.sectionHead}>Assigned Students</Text>
                {schoolStudents.length ? (
                    schoolStudents.map((item) => (
                        <View key={item.id} style={styles.memberRow}>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{item.student?.fullname || 'Student'}</Text>
                                <Text style={styles.memberEmail}>{item.student?.email || ''}</Text>
                            </View>
                            <SmallAction label="Remove" style={styles.deleteButton} onPress={() => onRemoveStudent(item.id)} />
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyState}>No students assigned</Text>
                )}

                <Text style={styles.sectionHead}>Add Student</Text>
                {availableStudents.length ? (
                    availableStudents.slice(0, 20).map((student) => (
                        <View key={student.id} style={styles.memberRow}>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{student.fullname}</Text>
                                <Text style={styles.memberEmail}>{student.email}</Text>
                            </View>
                            <SmallAction label="Add" style={styles.successButton} onPress={() => onAddStudent(student.id)} />
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyState}>All students are assigned</Text>
                )}
            </>
        )}
    </ModalShell>
);

const VerificationModal = ({
    visible,
    onClose,
    verificationLoading,
    verificationTeacher,
    verificationDetail,
    onApproveId,
    onApproveBg,
    onApproveAgreements,
    onActivate,
    onReject,
    onOpenDoc,
}) => (
    <ModalShell
        visible={visible}
        onClose={onClose}
        title={`Verification${verificationTeacher?.full_name ? ` - ${verificationTeacher.full_name}` : ''}`}
    >
        {verificationLoading ? (
            <Text style={styles.emptyState}>Loading verification...</Text>
        ) : !verificationDetail ? (
            <Text style={styles.emptyState}>No verification data found</Text>
        ) : (
            <>
                <View style={styles.cardSmall}>
                    <Text style={styles.cardSub}>Overall: {verificationDetail.overall_status || 'N/A'}</Text>
                    <Text style={styles.cardSub}>Teacher Status: {verificationDetail.teacher_verification_status || 'N/A'}</Text>
                    <Text style={styles.cardSub}>Can teach minors: {verificationDetail.can_teach_minors ? 'Yes' : 'No'}</Text>
                </View>

                <Text style={styles.sectionHead}>ID Verification</Text>
                <View style={styles.cardSmall}>
                    <Text style={styles.cardSub}>Status: {verificationDetail.id_verification?.status || 'pending'}</Text>
                    <Text style={styles.cardSub}>Type: {(verificationDetail.id_verification?.document_type || '').replace(/_/g, ' ') || 'N/A'}</Text>
                    {!!verificationDetail.id_verification?.id_document && (
                        <SmallAction
                            label="Open ID Document"
                            style={styles.primaryButton}
                            onPress={() => onOpenDoc(verificationDetail.id_verification?.id_document)}
                        />
                    )}
                </View>

                <Text style={styles.sectionHead}>Background Check</Text>
                <View style={styles.cardSmall}>
                    <Text style={styles.cardSub}>Status: {verificationDetail.background_check?.status || 'pending'}</Text>
                    <Text style={styles.cardSub}>Provider: {verificationDetail.background_check?.provider_name || 'N/A'}</Text>
                    {!!verificationDetail.background_check?.evidence_file && (
                        <SmallAction
                            label="Open Evidence"
                            style={styles.primaryButton}
                            onPress={() => onOpenDoc(verificationDetail.background_check?.evidence_file)}
                        />
                    )}
                </View>

                <Text style={styles.sectionHead}>Agreements</Text>
                <View style={styles.cardSmall}>
                    <Text style={styles.cardSub}>Agreement Status: {verificationDetail.agreement_status || 'N/A'}</Text>
                    <Text style={styles.cardSub}>
                        Signatures: {Array.isArray(verificationDetail.agreement_signatures) ? verificationDetail.agreement_signatures.length : 0}
                    </Text>
                </View>

                <View style={styles.rowButtonsWrap}>
                    <SmallAction label="Approve ID" style={styles.successButton} onPress={onApproveId} />
                    <SmallAction label="Approve BG" style={styles.successButton} onPress={onApproveBg} />
                    <SmallAction label="Approve Agreements" style={styles.infoButton} onPress={onApproveAgreements} />
                    <SmallAction label="Activate" style={styles.successButton} onPress={onActivate} />
                    <SmallAction label="Reject" style={styles.deleteButton} onPress={onReject} />
                </View>
            </>
        )}
    </ModalShell>
);

const PasswordModal = ({ visible, onClose, school, value, onChange, onSubmit }) => (
    <ModalShell visible={visible} onClose={onClose} title="Change School Password">
        <Text style={styles.cardSub}>School: {school?.name || '-'}</Text>
        <Text style={styles.cardSub}>Email: {school?.school_user_email || school?.email || '-'}</Text>
        <FormField label="New Password" value={value} secureTextEntry onChangeText={onChange} />
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton, styles.modalSubmit]} onPress={onSubmit}>
            <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
    </ModalShell>
);

const SafetyUpdateModal = ({ visible, onClose, report, status, setStatus, notes, setNotes, onSubmit }) => (
    <ModalShell visible={visible} onClose={onClose} title="Update Safety Report">
        <Text style={styles.cardSub}>Report Type: {report?.report_type || '-'}</Text>
        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.filterRow}>
            {['open', 'in_review', 'resolved', 'dismissed'].map((option) => (
                <TouchableOpacity
                    key={option}
                    style={[styles.chip, status === option && styles.chipActive]}
                    onPress={() => setStatus(option)}
                >
                    <Text style={[styles.chipText, status === option && styles.chipTextActive]}>{option}</Text>
                </TouchableOpacity>
            ))}
        </View>
        <FormField label="Admin Notes" value={notes} onChangeText={setNotes} multiline />
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton, styles.modalSubmit]} onPress={onSubmit}>
            <Text style={styles.actionText}>Save Update</Text>
        </TouchableOpacity>
    </ModalShell>
);

const FormField = ({ label, value, onChangeText, secureTextEntry, multiline }) => (
    <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
            style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    contentContainer: {
        padding: 14,
        paddingBottom: 30,
    },
    loadingWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a2332',
        flex: 1,
    },
    addButton: {
        backgroundColor: '#4285f4',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    tabScroll: {
        marginBottom: 12,
    },
    tabRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: '#e8edf5',
    },
    tabButtonActive: {
        backgroundColor: '#4285f4',
    },
    tabText: {
        color: '#4b5563',
        fontSize: 12,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#ffffff',
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    chip: {
        backgroundColor: '#eef2f7',
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    chipActive: {
        backgroundColor: '#1d4ed8',
    },
    chipText: {
        fontSize: 11,
        color: '#475569',
        textTransform: 'capitalize',
    },
    chipTextActive: {
        color: '#ffffff',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9eef6',
        padding: 12,
        marginBottom: 10,
    },
    cardSmall: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9eef6',
        padding: 10,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    cardSub: {
        fontSize: 12,
        color: '#475569',
        marginBottom: 3,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
        marginVertical: 4,
    },
    badge: {
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    badgeSuccess: {
        backgroundColor: '#16a34a',
    },
    badgeWarning: {
        backgroundColor: '#f59e0b',
    },
    badgeDanger: {
        backgroundColor: '#dc2626',
    },
    badgeNeutral: {
        backgroundColor: '#64748b',
    },
    rowButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    rowButtonsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    actionButton: {
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallAction: {
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    singleAction: {
        marginTop: 8,
    },
    smallActionText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    editButton: {
        backgroundColor: '#f59e0b',
    },
    deleteButton: {
        backgroundColor: '#dc2626',
    },
    primaryButton: {
        backgroundColor: '#2563eb',
    },
    secondaryButton: {
        backgroundColor: '#64748b',
    },
    successButton: {
        backgroundColor: '#16a34a',
    },
    infoButton: {
        backgroundColor: '#0891b2',
    },
    actionText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    emptyState: {
        textAlign: 'center',
        color: '#94a3b8',
        paddingVertical: 16,
        fontSize: 13,
    },
    paginationRow: {
        marginTop: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    pageButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    pageButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    pageText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    pageCurrent: {
        color: '#334155',
        fontWeight: '700',
    },
    refreshButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    refreshButtonSmall: {
        backgroundColor: '#2563eb',
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    refreshText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: 12,
    },
    modalCard: {
        maxHeight: '92%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
        paddingRight: 8,
    },
    modalClose: {
        color: '#2563eb',
        fontWeight: '700',
        fontSize: 12,
    },
    modalSubmit: {
        marginTop: 8,
        marginBottom: 10,
    },
    fieldWrap: {
        marginBottom: 10,
    },
    fieldLabel: {
        fontSize: 12,
        color: '#334155',
        marginBottom: 4,
        fontWeight: '600',
    },
    fieldInput: {
        borderWidth: 1,
        borderColor: '#dbe2ec',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingVertical: 9,
        paddingHorizontal: 10,
        color: '#1e293b',
    },
    fieldInputMultiline: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    infoText: {
        backgroundColor: '#eff6ff',
        color: '#1e40af',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        fontSize: 12,
    },
    sectionHead: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 10,
        marginBottom: 6,
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 8,
        marginBottom: 6,
    },
    memberInfo: {
        flex: 1,
        marginRight: 8,
    },
    memberName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1e293b',
    },
    memberEmail: {
        fontSize: 11,
        color: '#64748b',
    },
});

export default UsersManagement;
