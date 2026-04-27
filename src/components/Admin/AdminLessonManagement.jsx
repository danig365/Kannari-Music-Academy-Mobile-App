import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import { API_BASE_URL, SITE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const siteUrl = String(SITE_URL || '').replace(/\/$/, '');

const getCourseImageUrl = (image) => {
    if (!image) return '';
    if (typeof image !== 'string') return '';
    if (image.startsWith('http')) return image;
    const normalizedPath = image.replace(/^\/+/, '');
    return `${siteUrl}/${normalizedPath}`;
};

const accessLevels = ['free', 'basic', 'standard', 'premium', 'unlimited'];

const lessonTemplates = [
    {
        id: 'video_lesson',
        name: 'Video Lesson',
        defaults: {
            content_type: 'video',
            objectives: '• Watch the full video\n• Take notes on key concepts\n• Practice the techniques shown',
            is_preview: false,
            is_locked: false,
        },
    },
    {
        id: 'practice_session',
        name: 'Practice Session',
        defaults: {
            content_type: 'audio',
            objectives: '• Listen to the demo\n• Practice slowly\n• Increase speed gradually',
            is_preview: false,
            is_locked: false,
        },
    },
    {
        id: 'theory_reading',
        name: 'Theory & Reading',
        defaults: {
            content_type: 'pdf',
            objectives: '• Read the material\n• Highlight key concepts\n• Complete exercises',
            is_preview: false,
            is_locked: false,
        },
    },
    {
        id: 'free_preview',
        name: 'Free Preview',
        defaults: {
            content_type: 'video',
            objectives: '• Preview course quality\n• Understand teaching style',
            is_preview: true,
            is_locked: false,
        },
    },
    {
        id: 'blank',
        name: 'Blank Lesson',
        defaults: {
            content_type: 'video',
            objectives: '',
            is_preview: false,
            is_locked: false,
        },
    },
];

const emptyCourseForm = {
    title: '',
    description: '',
    category: '',
    teacher: '',
    techs: '',
    featured_img: null,
    required_access_level: 'free',
};

const emptyModuleForm = {
    title: '',
    description: '',
    order: '0',
};

const emptyLessonForm = {
    title: '',
    description: '',
    content_type: 'video',
    file: null,
    youtube_url: '',
    duration_seconds: '0',
    objectives: '',
    is_preview: false,
    is_locked: false,
    is_premium: false,
    required_access_level: 'free',
};

const emptyDownloadableForm = {
    title: '',
    file_type: 'pdf',
    file: null,
    description: '',
    order: '0',
};

const AdminLessonManagement = ({
    userType = 'admin',
    teacherId = null,
    basePath = '/admin-panel/lesson-management',
    pageTitle = 'Course Management',
    showTeacherSelect = true,
    showAnalytics = true,
}) => {
    const { width } = useWindowDimensions();
    const isCompactScreen = width < 768;
    const [effectiveTeacherId, setEffectiveTeacherId] = useState(teacherId);

    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [expandedModules, setExpandedModules] = useState({});

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [savingCourse, setSavingCourse] = useState(false);
    const [courseFormData, setCourseFormData] = useState(emptyCourseForm);

    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);

    const [showModuleModal, setShowModuleModal] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [moduleFormData, setModuleFormData] = useState(emptyModuleForm);

    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [currentModuleId, setCurrentModuleId] = useState(null);
    const [duplicateContext, setDuplicateContext] = useState(null);
    const [lessonFormData, setLessonFormData] = useState(emptyLessonForm);
    const [uploading, setUploading] = useState(false);

    const [showDownloadablesModal, setShowDownloadablesModal] = useState(false);
    const [currentLessonForDownloads, setCurrentLessonForDownloads] = useState(null);
    const [downloadables, setDownloadables] = useState([]);
    const [loadingDownloadables, setLoadingDownloadables] = useState(false);
    const [showAddDownloadableForm, setShowAddDownloadableForm] = useState(false);
    const [downloadableFormData, setDownloadableFormData] = useState(emptyDownloadableForm);
    const [savingDownloadable, setSavingDownloadable] = useState(false);

    const getTeacherFromCourse = (course) => {
        return (
            course?.teacher?.id ??
            course?.teacher_id ??
            course?.teacher ??
            course?.instructor?.id ??
            course?.instructor_id ??
            course?.instructor ??
            null
        );
    };

    const canManageCourse = (course) => {
        if (userType !== 'teacher') return true;
        if (!effectiveTeacherId) return false;
        const ownerId = getTeacherFromCourse(course);
        return String(ownerId) === String(effectiveTeacherId);
    };

    const ensureTeacherCanManageCourse = (course, actionLabel = 'manage this course') => {
        if (userType !== 'teacher') return true;
        if (canManageCourse(course)) return true;

        Alert.alert('Access denied', `You can only ${actionLabel} for your own courses.`);
        return false;
    };

    useEffect(() => {
        const init = async () => {
            if (!teacherId && userType === 'teacher') {
                const storedTeacherId = await AsyncStorage.getItem('teacherId');
                setEffectiveTeacherId(storedTeacherId);
            }
        };
        init();
    }, [teacherId, userType]);

    useEffect(() => {
        if (userType === 'teacher' && !effectiveTeacherId) {
            setCourses([]);
            setLoading(false);
            return;
        }

        fetchCourses();
        fetchCategories();
        if (showTeacherSelect) fetchTeachers();
    }, [effectiveTeacherId, userType, showTeacherSelect]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            let response;
            if (userType === 'teacher' && effectiveTeacherId) {
                response = await axios.get(`${baseUrl}/teacher-course/${effectiveTeacherId}`);
            } else {
                response = await axios.get(`${baseUrl}/course/`);
            }
            const list = response.data?.results || response.data || [];
            const normalized = Array.isArray(list) ? list : [];

            if (userType === 'teacher') {
                const ownCourses = normalized.filter((course) => canManageCourse(course));
                setCourses(ownCourses);
            } else {
                setCourses(normalized);
            }
        } catch (error) {
            setCourses([]);
            Alert.alert('Error', 'Failed to fetch courses.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${baseUrl}/category/`);
            const list = response.data?.results || response.data || [];
            setCategories(Array.isArray(list) ? list : []);
        } catch (error) {
            setCategories([]);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await axios.get(`${baseUrl}/admin/teachers/`);
            const list = response.data?.results || response.data || [];
            setTeachers(Array.isArray(list) ? list : []);
        } catch (error) {
            setTeachers([]);
        }
    };

    const fetchCourseStructure = async (courseId) => {
        if (!courseId) return;
        try {
            setLoading(true);
            const response = await axios.get(`${baseUrl}/admin/course/${courseId}/modules/`);
            const payload = response.data || {};

            const modules = payload.modules || payload.chapters || [];
            const normalizedModules = modules.map((moduleItem) => ({
                ...moduleItem,
                lessons: moduleItem.lessons || moduleItem.videos || [],
            }));

            setCourseData({
                ...(payload.course || selectedCourse || {}),
                modules: normalizedModules,
            });

            const expanded = {};
            normalizedModules.forEach((moduleItem) => {
                expanded[moduleItem.id] = true;
            });
            setExpandedModules(expanded);
        } catch (error) {
            try {
                const fallback = await axios.get(`${baseUrl}/course-chapters/${courseId}`);
                const modules = fallback.data || [];
                const normalizedModules = (Array.isArray(modules) ? modules : []).map((moduleItem) => ({
                    ...moduleItem,
                    lessons: moduleItem.lessons || moduleItem.videos || [],
                }));
                setCourseData({ ...(selectedCourse || {}), modules: normalizedModules });
            } catch (fallbackError) {
                setCourseData({ ...(selectedCourse || {}), modules: [] });
                Alert.alert('Error', 'Failed to fetch course structure.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = (course) => {
        if (!ensureTeacherCanManageCourse(course, 'view modules')) {
            return;
        }

        setSelectedCourse(course);
        fetchCourseStructure(course.id);
    };

    const toggleModuleExpand = (moduleId) => {
        setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            if (userType === 'teacher' && !canManageCourse(course)) {
                return false;
            }

            const title = (course.title || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            const categoryTitle =
                typeof course.category === 'object'
                    ? course.category?.title || ''
                    : String(course.category || '');
            const matchesSearch = !search || title.includes(search);
            const matchesCategory = !selectedCategory || String(course.category) === selectedCategory || categoryTitle === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [courses, searchTerm, selectedCategory, userType, effectiveTeacherId]);

    const openAddCourseModal = () => {
        setEditingCourse(null);
        setCourseFormData({
            ...emptyCourseForm,
            teacher: userType === 'teacher' ? String(effectiveTeacherId || '') : '',
        });
        setShowCourseModal(true);
    };

    const openEditCourseModal = (course) => {
        if (!ensureTeacherCanManageCourse(course, 'edit')) {
            return;
        }

        setEditingCourse(course);
        setCourseFormData({
            title: course.title || '',
            description: course.description || '',
            category: course.category?.id ? String(course.category.id) : String(course.category || ''),
            teacher:
                course.teacher?.id
                    ? String(course.teacher.id)
                    : course.teacher
                    ? String(course.teacher)
                    : userType === 'teacher'
                    ? String(effectiveTeacherId || '')
                    : '',
            techs: course.techs || '',
            featured_img: null,
            required_access_level: course.required_access_level || 'free',
        });
        setShowCourseModal(true);
    };

    const closeCourseModal = () => {
        setShowCourseModal(false);
        setEditingCourse(null);
        setCourseFormData(emptyCourseForm);
        setShowNewCategoryInput(false);
        setNewCategoryName('');
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Validation', 'Category name is required.');
            return;
        }
        try {
            setSavingCategory(true);
            const response = await axios.post(`${baseUrl}/category/`, {
                title: newCategoryName.trim(),
                description: `${newCategoryName.trim()} category`,
            });
            const created = response.data;
            setCategories((prev) => [created, ...prev]);
            setCourseFormData((prev) => ({ ...prev, category: String(created.id) }));
            setNewCategoryName('');
            setShowNewCategoryInput(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to create category.');
        } finally {
            setSavingCategory(false);
        }
    };

    const pickCourseImage = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
        if (result.canceled) return;
        const file = result.assets?.[0];
        if (!file) return;
        setCourseFormData((prev) => ({ ...prev, featured_img: file }));
    };

    const buildFilePart = (asset) => ({
        uri: asset.uri,
        name: asset.name || `upload-${Date.now()}`,
        type: asset.mimeType || 'application/octet-stream',
    });

    const handleCourseSubmit = async () => {
        if (!courseFormData.title.trim()) {
            Alert.alert('Validation', 'Course title is required.');
            return;
        }

        try {
            setSavingCourse(true);
            const formData = new FormData();
            formData.append('title', courseFormData.title);
            formData.append('description', courseFormData.description || '');

            if (courseFormData.category) {
                formData.append('category_name', courseFormData.category);
            }

            const selectedTeacherId =
                userType === 'teacher' ? String(effectiveTeacherId || '') : courseFormData.teacher;
            if (selectedTeacherId) {
                formData.append('teacher', selectedTeacherId);
            }

            formData.append('techs', courseFormData.techs || '');
            formData.append('required_access_level', courseFormData.required_access_level || 'free');

            if (courseFormData.featured_img) {
                formData.append('featured_img', buildFilePart(courseFormData.featured_img));
            }

            if (editingCourse) {
                await axios.patch(`${baseUrl}/admin/course/${editingCourse.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await axios.post(`${baseUrl}/admin/course/create/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            closeCourseModal();
            fetchCourses();
        } catch (error) {
            Alert.alert('Error', 'Failed to save course.');
        } finally {
            setSavingCourse(false);
        }
    };

    const handleDeleteCourse = (courseId) => {
        const targetCourse = courses.find((course) => String(course.id) === String(courseId));
        if (!ensureTeacherCanManageCourse(targetCourse, 'delete')) {
            return;
        }

        Alert.alert('Delete Course', 'Are you sure you want to delete this course?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.post(`${baseUrl}/admin/delete-course/${courseId}/`);
                        if (selectedCourse?.id === courseId) {
                            setSelectedCourse(null);
                            setCourseData(null);
                        }
                        fetchCourses();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete course.');
                    }
                },
            },
        ]);
    };

    const openAddModuleModal = () => {
        if (!selectedCourse) {
            Alert.alert('Select Course', 'Please select a course first.');
            return;
        }
        setEditingModule(null);
        setModuleFormData({ ...emptyModuleForm, order: String(courseData?.modules?.length || 0) });
        setShowModuleModal(true);
    };

    const openEditModuleModal = (module) => {
        setEditingModule(module);
        setModuleFormData({
            title: module.title || '',
            description: module.description || '',
            order: String(module.order ?? 0),
        });
        setShowModuleModal(true);
    };

    const handleModuleSubmit = async () => {
        if (!moduleFormData.title.trim() || !selectedCourse) {
            Alert.alert('Validation', 'Module title is required.');
            return;
        }
        try {
            const payload = {
                title: moduleFormData.title,
                description: moduleFormData.description || '',
                order: parseInt(moduleFormData.order, 10) || 0,
                course: selectedCourse.id,
            };

            if (editingModule) {
                await axios.put(`${baseUrl}/admin/module/${editingModule.id}/`, payload);
            } else {
                await axios.post(`${baseUrl}/admin/modules/`, payload);
            }

            setShowModuleModal(false);
            setEditingModule(null);
            setModuleFormData(emptyModuleForm);
            fetchCourseStructure(selectedCourse.id);
        } catch (error) {
            Alert.alert('Error', 'Failed to save module.');
        }
    };

    const handleDeleteModule = (moduleId) => {
        Alert.alert('Delete Module', 'Are you sure you want to delete this module?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/admin/module/${moduleId}/`);
                        fetchCourseStructure(selectedCourse.id);
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete module.');
                    }
                },
            },
        ]);
    };

    const openAddLessonModal = (moduleId) => {
        setCurrentModuleId(moduleId);
        setEditingLesson(null);
        setDuplicateContext(null);
        setLessonFormData(emptyLessonForm);
        setShowTemplateSelector(true);
    };

    const selectTemplate = (template) => {
        setLessonFormData((prev) => ({ ...prev, ...template.defaults }));
        setShowTemplateSelector(false);
        setShowLessonModal(true);
    };

    const skipTemplateSelection = () => {
        setShowTemplateSelector(false);
        setShowLessonModal(true);
    };

    const openEditLessonModal = (lesson, moduleId, duplicationMeta = null) => {
        setCurrentModuleId(moduleId);
        setEditingLesson(duplicationMeta ? null : lesson);
        setDuplicateContext(duplicationMeta);
        setLessonFormData({
            title: duplicationMeta ? `${lesson.title} (Copy)` : lesson.title || '',
            description: lesson.description || '',
            content_type: lesson.content_type || 'video',
            file: null,
            youtube_url: lesson.youtube_url || '',
            duration_seconds: String(lesson.duration_seconds || 0),
            objectives: lesson.objectives || '',
            is_preview: !!lesson.is_preview,
            is_locked: !!lesson.is_locked,
            is_premium: !!lesson.is_premium,
            required_access_level: lesson.required_access_level || 'free',
        });
        setShowLessonModal(true);
    };

    const pickLessonFile = async () => {
        const pickType =
            lessonFormData.content_type === 'video'
                ? 'video/*'
                : lessonFormData.content_type === 'audio'
                ? 'audio/*'
                : lessonFormData.content_type === 'pdf'
                ? 'application/pdf'
                : '*/*';

        const result = await DocumentPicker.getDocumentAsync({ type: pickType, copyToCacheDirectory: true });
        if (result.canceled) return;
        const file = result.assets?.[0];
        if (!file) return;

        setLessonFormData((prev) => ({ ...prev, file }));
    };

    const handleLessonSubmit = async () => {
        if (!lessonFormData.title.trim() || !currentModuleId) {
            Alert.alert('Validation', 'Lesson title is required.');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('title', lessonFormData.title);
            formData.append('description', lessonFormData.description || '');
            formData.append('content_type', lessonFormData.content_type);
            formData.append('module', String(currentModuleId));
            formData.append('objectives', lessonFormData.objectives || '');
            formData.append('is_preview', lessonFormData.is_preview ? 'true' : 'false');
            formData.append('is_locked', lessonFormData.is_locked ? 'true' : 'false');
            formData.append('is_premium', lessonFormData.is_premium ? 'true' : 'false');
            formData.append('required_access_level', lessonFormData.required_access_level || 'free');
            formData.append('youtube_url', lessonFormData.youtube_url || '');
            formData.append('duration_seconds', String(parseInt(lessonFormData.duration_seconds, 10) || 0));

            if (lessonFormData.file) {
                formData.append('file', buildFilePart(lessonFormData.file));
            }

            if (editingLesson) {
                await axios.put(`${baseUrl}/admin/lesson/${editingLesson.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await axios.post(`${baseUrl}/admin/module/${currentModuleId}/lessons/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            setShowLessonModal(false);
            setEditingLesson(null);
            setDuplicateContext(null);
            setLessonFormData(emptyLessonForm);
            fetchCourseStructure(selectedCourse.id);
        } catch (error) {
            Alert.alert('Error', 'Failed to save lesson.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteLesson = (lessonId) => {
        Alert.alert('Delete Lesson', 'Are you sure you want to delete this lesson?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/admin/lesson/${lessonId}/`);
                        fetchCourseStructure(selectedCourse.id);
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete lesson.');
                    }
                },
            },
        ]);
    };

    const handleDuplicateLesson = (lesson, moduleId) => {
        openEditLessonModal(lesson, moduleId, { duplicate: true });
    };

    const getDownloadableRequestParams = () => {
        if (userType === 'teacher' && effectiveTeacherId) {
            return `?requester_type=teacher&requester_id=${effectiveTeacherId}`;
        }
        return `?requester_type=admin`;
    };

    const openDownloadablesModal = async (lesson) => {
        setCurrentLessonForDownloads(lesson);
        setShowDownloadablesModal(true);
        setLoadingDownloadables(true);
        setShowAddDownloadableForm(false);
        setDownloadableFormData(emptyDownloadableForm);

        try {
            const response = await axios.get(
                `${baseUrl}/lesson/${lesson.id}/downloadables/${getDownloadableRequestParams()}`
            );
            const list = response.data?.results || response.data || [];
            setDownloadables(Array.isArray(list) ? list : []);
        } catch (error) {
            setDownloadables([]);
            Alert.alert('Error', 'Failed to load downloadable resources.');
        } finally {
            setLoadingDownloadables(false);
        }
    };

    const closeDownloadablesModal = () => {
        setShowDownloadablesModal(false);
        setCurrentLessonForDownloads(null);
        setDownloadables([]);
        setShowAddDownloadableForm(false);
        setDownloadableFormData(emptyDownloadableForm);
    };

    const pickDownloadableFile = async () => {
        const typeMap = {
            pdf: 'application/pdf',
            doc: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            audio: 'audio/*',
            image: 'image/*',
            zip: 'application/zip',
            other: '*/*',
        };

        const result = await DocumentPicker.getDocumentAsync({
            type: typeMap[downloadableFormData.file_type] || '*/*',
            copyToCacheDirectory: true,
        });

        if (result.canceled) return;
        const file = result.assets?.[0];
        if (!file) return;

        setDownloadableFormData((prev) => ({ ...prev, file }));
    };

    const handleDownloadableSubmit = async () => {
        if (!currentLessonForDownloads || !downloadableFormData.title.trim() || !downloadableFormData.file) {
            Alert.alert('Validation', 'Title and file are required.');
            return;
        }

        try {
            setSavingDownloadable(true);
            const formData = new FormData();
            formData.append('lesson', String(currentLessonForDownloads.id));
            formData.append('title', downloadableFormData.title);
            formData.append('file_type', downloadableFormData.file_type || 'pdf');
            formData.append('description', downloadableFormData.description || '');
            formData.append('order', String(parseInt(downloadableFormData.order, 10) || 0));
            formData.append('file', buildFilePart(downloadableFormData.file));

            await axios.post(`${baseUrl}/lesson/${currentLessonForDownloads.id}/downloadables/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setDownloadableFormData(emptyDownloadableForm);
            setShowAddDownloadableForm(false);
            openDownloadablesModal(currentLessonForDownloads);
        } catch (error) {
            Alert.alert('Error', 'Failed to upload downloadable resource.');
        } finally {
            setSavingDownloadable(false);
        }
    };

    const handleDeleteDownloadable = (downloadableId) => {
        Alert.alert('Delete Resource', 'Delete this downloadable resource?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/downloadable/${downloadableId}/`);
                        if (currentLessonForDownloads) {
                            openDownloadablesModal(currentLessonForDownloads);
                        }
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete downloadable resource.');
                    }
                },
            },
        ]);
    };

    if (loading && !courses.length && !courseData) {
        return (
            <View style={styles.loadingWrapper}>
                <LoadingSpinner size="lg" text="Loading lesson management..." />
            </View>
        );
    }

    const totalModules = courseData?.modules?.length || 0;
    const totalLessons = (courseData?.modules || []).reduce(
        (sum, moduleItem) => sum + (moduleItem.lessons?.length || 0),
        0
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>{pageTitle}</Text>
                        <Text style={styles.subText}>Manage courses, modules, lessons and resources</Text>
                        <Text style={styles.pathText}>{basePath}</Text>
                    </View>
                    <TouchableOpacity style={styles.primaryButton} onPress={openAddCourseModal}>
                        <Text style={styles.primaryButtonText}>+ New Course</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard title="Courses" value={courses.length} />
                    <StatCard title="Modules" value={totalModules} />
                    <StatCard title="Lessons" value={totalLessons} />
                </View>

                <View style={styles.filterCard}>
                    <TextInput
                        style={styles.input}
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        <View style={styles.categoryRow}>
                            <CategoryChip
                                active={!selectedCategory}
                                title="All"
                                onPress={() => setSelectedCategory('')}
                            />
                            {categories.map((category) => (
                                <CategoryChip
                                    key={category.id}
                                    active={String(selectedCategory) === String(category.id)}
                                    title={category.title || `Category ${category.id}`}
                                    onPress={() => setSelectedCategory(String(category.id))}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <Text style={styles.sectionTitle}>Courses</Text>
                {filteredCourses.length ? (
                    filteredCourses.map((course) => {
                        const isSelected = selectedCourse?.id === course.id;
                        const canManage = canManageCourse(course);
                        return (
                            <TouchableOpacity
                                key={course.id}
                                style={[styles.courseCard, isSelected && styles.selectedCard]}
                                onPress={() => handleCourseSelect(course)}
                            >
                                {course.featured_img ? (
                                    <Image
                                        source={{ uri: getCourseImageUrl(course.featured_img) }}
                                        style={styles.courseThumbnail}
                                    />
                                ) : null}
                                <Text style={styles.courseTitle}>{course.title}</Text>
                                <Text style={styles.courseMeta} numberOfLines={2}>
                                    {course.description || 'No description'}
                                </Text>
                                <Text style={styles.courseMeta}>
                                    Category: {course.category?.title || course.category || 'N/A'}
                                </Text>
                                {canManage ? (
                                    <View style={styles.rowActionWrap}>
                                        <ActionButton label="Edit" tone="info" onPress={() => openEditCourseModal(course)} />
                                        <ActionButton
                                            label="Delete"
                                            tone="danger"
                                            onPress={() => handleDeleteCourse(course.id)}
                                        />
                                    </View>
                                ) : null}
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <EmptyState title="No courses found" subtitle="Create your first course to get started." />
                )}

                {selectedCourse && (
                    <>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionHeaderTitle} numberOfLines={2}>
                                Modules in {selectedCourse.title}
                            </Text>
                            <TouchableOpacity style={styles.sectionHeaderAction} onPress={openAddModuleModal}>
                                <Text style={styles.buttonText}>+ Module</Text>
                            </TouchableOpacity>
                        </View>

                        {showAnalytics && (
                            <Text style={styles.analyticsText}>
                                Analytics enabled: module completion and lesson usage can be tracked per course.
                            </Text>
                        )}

                        {(courseData?.modules || []).length ? (
                            (courseData.modules || []).map((moduleItem, idx) => {
                                const expanded = !!expandedModules[moduleItem.id];
                                return (
                                    <View key={moduleItem.id} style={styles.moduleCard}>
                                        <TouchableOpacity
                                            style={styles.moduleHeader}
                                            onPress={() => toggleModuleExpand(moduleItem.id)}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.moduleTitle}>
                                                    {idx + 1}. {moduleItem.title}
                                                </Text>
                                                <Text style={styles.moduleMeta}>
                                                    {(moduleItem.lessons || []).length} lessons
                                                </Text>
                                            </View>
                                            <View style={styles.rowActionWrap}>
                                                <ActionButton
                                                    label="+ Lesson"
                                                    tone="success"
                                                    onPress={() => openAddLessonModal(moduleItem.id)}
                                                />
                                                <ActionButton
                                                    label="Edit"
                                                    tone="info"
                                                    onPress={() => openEditModuleModal(moduleItem)}
                                                />
                                                <ActionButton
                                                    label="Del"
                                                    tone="danger"
                                                    onPress={() => handleDeleteModule(moduleItem.id)}
                                                />
                                            </View>
                                        </TouchableOpacity>

                                        {expanded && (
                                            <View style={styles.lessonListWrap}>
                                                {(moduleItem.lessons || []).length ? (
                                                    (moduleItem.lessons || []).map((lessonItem) => (
                                                        <View key={lessonItem.id} style={styles.lessonItem}>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.lessonTitle}>{lessonItem.title}</Text>
                                                                <Text style={styles.lessonMeta}>
                                                                    Type: {lessonItem.content_type || 'video'}
                                                                </Text>
                                                                <Text style={styles.lessonMeta}>
                                                                    Access: {lessonItem.required_access_level || 'free'}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.rowActionWrap}>
                                                                <ActionButton
                                                                    label="Res"
                                                                    tone="info"
                                                                    onPress={() => openDownloadablesModal(lessonItem)}
                                                                />
                                                                <ActionButton
                                                                    label="Dup"
                                                                    tone="warning"
                                                                    onPress={() =>
                                                                        handleDuplicateLesson(lessonItem, moduleItem.id)
                                                                    }
                                                                />
                                                                <ActionButton
                                                                    label="Edit"
                                                                    tone="info"
                                                                    onPress={() =>
                                                                        openEditLessonModal(lessonItem, moduleItem.id)
                                                                    }
                                                                />
                                                                <ActionButton
                                                                    label="Del"
                                                                    tone="danger"
                                                                    onPress={() => handleDeleteLesson(lessonItem.id)}
                                                                />
                                                            </View>
                                                        </View>
                                                    ))
                                                ) : (
                                                    <Text style={styles.emptyInline}>No lessons yet</Text>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <EmptyState
                                title="No modules yet"
                                subtitle="Add your first module to begin organizing lessons."
                            />
                        )}
                    </>
                )}
            </ScrollView>

            <CourseModal
                visible={showCourseModal}
                onClose={closeCourseModal}
                editingCourse={editingCourse}
                isCompactScreen={isCompactScreen}
                courseFormData={courseFormData}
                setCourseFormData={setCourseFormData}
                categories={categories}
                teachers={teachers}
                userType={userType}
                showTeacherSelect={showTeacherSelect}
                showNewCategoryInput={showNewCategoryInput}
                setShowNewCategoryInput={setShowNewCategoryInput}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
                savingCategory={savingCategory}
                savingCourse={savingCourse}
                onCreateCategory={handleCreateCategory}
                onPickImage={pickCourseImage}
                onSubmit={handleCourseSubmit}
            />

            <SimpleModal
                visible={showModuleModal}
                title={editingModule ? 'Edit Module' : 'Add Module'}
                onClose={() => {
                    setShowModuleModal(false);
                    setEditingModule(null);
                    setModuleFormData(emptyModuleForm);
                }}
            >
                <Field
                    label="Title"
                    value={moduleFormData.title}
                    onChangeText={(value) => setModuleFormData((prev) => ({ ...prev, title: value }))}
                />
                <Field
                    label="Description"
                    value={moduleFormData.description}
                    multiline
                    onChangeText={(value) => setModuleFormData((prev) => ({ ...prev, description: value }))}
                />
                <Field
                    label="Order"
                    value={moduleFormData.order}
                    keyboardType="numeric"
                    onChangeText={(value) => setModuleFormData((prev) => ({ ...prev, order: value }))}
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleModuleSubmit}>
                    <Text style={styles.primaryButtonText}>{editingModule ? 'Update' : 'Create'} Module</Text>
                </TouchableOpacity>
            </SimpleModal>

            <SimpleModal
                visible={showTemplateSelector}
                title="Choose Lesson Template"
                onClose={() => setShowTemplateSelector(false)}
            >
                {lessonTemplates.map((template) => (
                    <TouchableOpacity
                        key={template.id}
                        style={styles.templateCard}
                        onPress={() => selectTemplate(template)}
                    >
                        <Text style={styles.templateTitle}>{template.name}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.secondaryButton} onPress={skipTemplateSelection}>
                    <Text style={styles.buttonText}>Skip Template</Text>
                </TouchableOpacity>
            </SimpleModal>

            <SimpleModal
                visible={showLessonModal}
                title={editingLesson ? 'Edit Lesson' : duplicateContext ? 'Duplicate Lesson' : 'Add Lesson'}
                onClose={() => {
                    setShowLessonModal(false);
                    setEditingLesson(null);
                    setDuplicateContext(null);
                    setLessonFormData(emptyLessonForm);
                }}
            >
                <Field
                    label="Title"
                    value={lessonFormData.title}
                    onChangeText={(value) => setLessonFormData((prev) => ({ ...prev, title: value }))}
                />
                <Field
                    label="Description"
                    value={lessonFormData.description}
                    multiline
                    onChangeText={(value) => setLessonFormData((prev) => ({ ...prev, description: value }))}
                />

                <HorizontalOptions
                    label="Content Type"
                    value={lessonFormData.content_type}
                    options={['video', 'audio', 'pdf', 'image']}
                    onSelect={(value) => setLessonFormData((prev) => ({ ...prev, content_type: value }))}
                />

                <TouchableOpacity style={styles.infoButton} onPress={pickLessonFile}>
                    <Text style={styles.buttonText}>
                        {lessonFormData.file ? `File: ${lessonFormData.file.name}` : 'Pick Lesson File'}
                    </Text>
                </TouchableOpacity>

                <Field
                    label="YouTube URL"
                    value={lessonFormData.youtube_url}
                    onChangeText={(value) => setLessonFormData((prev) => ({ ...prev, youtube_url: value }))}
                />

                <Field
                    label="Duration (seconds)"
                    value={lessonFormData.duration_seconds}
                    keyboardType="numeric"
                    onChangeText={(value) =>
                        setLessonFormData((prev) => ({ ...prev, duration_seconds: value }))
                    }
                />

                <Field
                    label="Objectives"
                    value={lessonFormData.objectives}
                    multiline
                    onChangeText={(value) => setLessonFormData((prev) => ({ ...prev, objectives: value }))}
                />

                <HorizontalOptions
                    label="Required Access"
                    value={lessonFormData.required_access_level}
                    options={accessLevels}
                    onSelect={(value) =>
                        setLessonFormData((prev) => ({ ...prev, required_access_level: value }))
                    }
                />

                <SwitchRow
                    label="Preview"
                    value={lessonFormData.is_preview}
                    onChange={(value) => setLessonFormData((prev) => ({ ...prev, is_preview: value }))}
                />
                <SwitchRow
                    label="Locked"
                    value={lessonFormData.is_locked}
                    onChange={(value) => setLessonFormData((prev) => ({ ...prev, is_locked: value }))}
                />
                <SwitchRow
                    label="Premium"
                    value={lessonFormData.is_premium}
                    onChange={(value) => setLessonFormData((prev) => ({ ...prev, is_premium: value }))}
                />

                <TouchableOpacity
                    style={[styles.primaryButton, uploading && styles.disabledButton]}
                    onPress={handleLessonSubmit}
                    disabled={uploading}
                >
                    <Text style={styles.primaryButtonText}>
                        {uploading ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
                    </Text>
                </TouchableOpacity>
            </SimpleModal>

            <SimpleModal
                visible={showDownloadablesModal}
                title={
                    currentLessonForDownloads
                        ? `Resources: ${currentLessonForDownloads.title}`
                        : 'Lesson Resources'
                }
                onClose={closeDownloadablesModal}
            >
                {loadingDownloadables ? (
                    <Text style={styles.emptyInline}>Loading resources...</Text>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.successButton}
                            onPress={() => setShowAddDownloadableForm((prev) => !prev)}
                        >
                            <Text style={styles.buttonText}>
                                {showAddDownloadableForm ? 'Cancel Add' : '+ Add Resource'}
                            </Text>
                        </TouchableOpacity>

                        {showAddDownloadableForm && (
                            <View style={styles.formBox}>
                                <Field
                                    label="Title"
                                    value={downloadableFormData.title}
                                    onChangeText={(value) =>
                                        setDownloadableFormData((prev) => ({ ...prev, title: value }))
                                    }
                                />
                                <HorizontalOptions
                                    label="Type"
                                    value={downloadableFormData.file_type}
                                    options={['pdf', 'doc', 'audio', 'image', 'zip', 'other']}
                                    onSelect={(value) =>
                                        setDownloadableFormData((prev) => ({ ...prev, file_type: value }))
                                    }
                                />
                                <TouchableOpacity style={styles.infoButton} onPress={pickDownloadableFile}>
                                    <Text style={styles.buttonText}>
                                        {downloadableFormData.file
                                            ? `File: ${downloadableFormData.file.name}`
                                            : 'Pick Resource File'}
                                    </Text>
                                </TouchableOpacity>
                                <Field
                                    label="Description"
                                    value={downloadableFormData.description}
                                    multiline
                                    onChangeText={(value) =>
                                        setDownloadableFormData((prev) => ({ ...prev, description: value }))
                                    }
                                />
                                <Field
                                    label="Order"
                                    value={downloadableFormData.order}
                                    keyboardType="numeric"
                                    onChangeText={(value) =>
                                        setDownloadableFormData((prev) => ({ ...prev, order: value }))
                                    }
                                />
                                <TouchableOpacity
                                    style={[styles.primaryButton, savingDownloadable && styles.disabledButton]}
                                    onPress={handleDownloadableSubmit}
                                    disabled={savingDownloadable}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        {savingDownloadable ? 'Uploading...' : 'Upload Resource'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {downloadables.length ? (
                            downloadables.map((item) => (
                                <View key={item.id} style={styles.downloadItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.downloadTitle}>{item.title}</Text>
                                        <Text style={styles.downloadMeta}>
                                            {item.file_type || 'file'} • order {item.order ?? 0}
                                        </Text>
                                    </View>
                                    <ActionButton
                                        label="Delete"
                                        tone="danger"
                                        onPress={() => handleDeleteDownloadable(item.id)}
                                    />
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyInline}>No resources yet.</Text>
                        )}
                    </>
                )}
            </SimpleModal>
        </View>
    );
};

const StatCard = ({ title, value }) => (
    <View style={styles.statCard}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
    </View>
);

const CategoryChip = ({ title, active, onPress }) => (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{title}</Text>
    </TouchableOpacity>
);

const ActionButton = ({ label, tone = 'info', onPress }) => {
    const toneStyle =
        tone === 'danger'
            ? styles.actionBtnDanger
            : tone === 'success'
            ? styles.actionBtnSuccess
            : tone === 'warning'
            ? styles.actionBtnWarning
            : styles.actionBtnInfo;

    return (
        <TouchableOpacity style={[styles.smallBtn, toneStyle]} onPress={onPress}>
            <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
    );
};

const Field = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }) => (
    <View style={styles.formFieldWrap}>
        {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
        <TextInput
            style={[styles.input, multiline && styles.multilineInput]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            multiline={multiline}
            keyboardType={keyboardType}
        />
    </View>
);

const HorizontalOptions = ({ label, value, options, onSelect, wrapOnCompact = false }) => (
    <View style={styles.formFieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {wrapOnCompact ? (
            <View style={styles.optionsWrapMobile}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[styles.optionChip, value === option && styles.optionChipActive]}
                        onPress={() => onSelect(option)}
                    >
                        <Text
                            style={[styles.optionChipText, value === option && styles.optionChipTextActive]}
                        >
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        ) : (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.optionsScrollContent}
            >
                <View style={styles.optionsRow}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[styles.optionChip, value === option && styles.optionChipActive]}
                            onPress={() => onSelect(option)}
                        >
                            <Text
                                style={[styles.optionChipText, value === option && styles.optionChipTextActive]}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        )}
    </View>
);

const SwitchRow = ({ label, value, onChange }) => (
    <View style={styles.switchRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Switch value={value} onValueChange={onChange} />
    </View>
);

const EmptyState = ({ title, subtitle }) => (
    <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
);

const SimpleModal = ({ visible, title, onClose, children }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <View style={styles.modalHead}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={styles.modalBodyContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </ScrollView>
            </View>
        </View>
    </Modal>
);

const CourseModal = ({
    visible,
    onClose,
    editingCourse,
    isCompactScreen = false,
    courseFormData,
    setCourseFormData,
    categories,
    teachers,
    userType,
    showTeacherSelect,
    showNewCategoryInput,
    setShowNewCategoryInput,
    newCategoryName,
    setNewCategoryName,
    savingCategory,
    savingCourse,
    onCreateCategory,
    onPickImage,
    onSubmit,
}) => (
    <SimpleModal visible={visible} title={editingCourse ? 'Edit Course' : 'New Course'} onClose={onClose}>
        <Field
            label="Title"
            value={courseFormData.title}
            onChangeText={(value) => setCourseFormData((prev) => ({ ...prev, title: value }))}
        />
        <Field
            label="Description"
            value={courseFormData.description}
            multiline
            onChangeText={(value) => setCourseFormData((prev) => ({ ...prev, description: value }))}
        />

        <HorizontalOptions
            label="Category"
            value={courseFormData.category}
            options={categories.map((category) => String(category.id))}
            onSelect={(value) => setCourseFormData((prev) => ({ ...prev, category: value }))}
                    wrapOnCompact={isCompactScreen}
        />
        <Text style={styles.smallHelp}>
            Selected category:{' '}
            {categories.find((category) => String(category.id) === String(courseFormData.category))?.title ||
                'None'}
        </Text>

        <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowNewCategoryInput((prev) => !prev)}
        >
            <Text style={styles.buttonText}>
                {showNewCategoryInput ? 'Cancel New Category' : '+ New Category'}
            </Text>
        </TouchableOpacity>

        {showNewCategoryInput && (
            <View style={styles.formBox}>
                <Field
                    label="Category Name"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                />
                <TouchableOpacity
                    style={[styles.successButton, savingCategory && styles.disabledButton]}
                    onPress={onCreateCategory}
                    disabled={savingCategory}
                >
                    <Text style={styles.buttonText}>{savingCategory ? 'Saving...' : 'Create Category'}</Text>
                </TouchableOpacity>
            </View>
        )}

        {showTeacherSelect && userType === 'admin' && (
            <HorizontalOptions
                label="Teacher"
                value={courseFormData.teacher}
                options={teachers.map((teacher) => String(teacher.id))}
                onSelect={(value) => setCourseFormData((prev) => ({ ...prev, teacher: value }))}
                wrapOnCompact={isCompactScreen}
            />
        )}
        {showTeacherSelect && userType === 'admin' && (
            <Text style={styles.smallHelp}>
                Selected teacher:{' '}
                {teachers.find((teacher) => String(teacher.id) === String(courseFormData.teacher))
                    ?.full_name || 'None'}
            </Text>
        )}

        <Field
            label="Music Tools / Techniques Covered"
            value={courseFormData.techs}
            onChangeText={(value) => setCourseFormData((prev) => ({ ...prev, techs: value }))}
        />

        <HorizontalOptions
            label="Required Access"
            value={courseFormData.required_access_level}
            options={accessLevels}
            onSelect={(value) =>
                setCourseFormData((prev) => ({ ...prev, required_access_level: value }))
            }
            wrapOnCompact={isCompactScreen}
        />

        <TouchableOpacity style={styles.infoButton} onPress={onPickImage}>
            <Text style={styles.buttonText}>
                {courseFormData.featured_img
                    ? `Image: ${courseFormData.featured_img.name}`
                    : 'Pick Featured Image'}
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.primaryButton, savingCourse && styles.disabledButton]}
            onPress={onSubmit}
            disabled={savingCourse}
        >
            <Text style={styles.primaryButtonText}>
                {savingCourse ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
            </Text>
        </TouchableOpacity>
    </SimpleModal>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    content: {
        padding: 14,
        paddingBottom: 32,
    },
    loadingWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a2332',
    },
    subText: {
        marginTop: 2,
        fontSize: 12,
        color: '#6b7280',
    },
    pathText: {
        marginTop: 2,
        fontSize: 11,
        color: '#9ca3af',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statCard: {
        backgroundColor: '#fff',
        width: '32%',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingVertical: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a2332',
    },
    statLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#6b7280',
    },
    filterCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 10,
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 14,
        fontSize: 14,
        color: '#1f2937',
    },
    multilineInput: {
        minHeight: 112,
        textAlignVertical: 'top',
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        backgroundColor: '#e5e7eb',
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    chipActive: {
        backgroundColor: '#4285f4',
    },
    chipText: {
        color: '#374151',
        fontSize: 11,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#fff',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a2332',
        marginBottom: 8,
    },
    courseCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
        marginBottom: 10,
    },
    courseThumbnail: {
        width: '100%',
        height: 160,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#e5e7eb',
    },
    selectedCard: {
        borderColor: '#4285f4',
        borderWidth: 2,
    },
    courseTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1f2937',
    },
    courseMeta: {
        marginTop: 4,
        fontSize: 12,
        color: '#6b7280',
    },
    rowActionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6,
        marginBottom: 8,
    },
    sectionHeaderTitle: {
        flex: 1,
        minWidth: 0,
        fontSize: 16,
        fontWeight: '700',
        color: '#1a2332',
        marginBottom: 0,
    },
    sectionHeaderAction: {
        backgroundColor: '#16a34a',
        borderRadius: 8,
        paddingVertical: 7,
        paddingHorizontal: 10,
        marginLeft: 'auto',
    },
    analyticsText: {
        fontSize: 11,
        color: '#0284c7',
        marginBottom: 8,
    },
    moduleCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10,
        overflow: 'hidden',
    },
    moduleHeader: {
        padding: 10,
        backgroundColor: '#f8fafc',
    },
    moduleTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
    },
    moduleMeta: {
        marginTop: 2,
        fontSize: 11,
        color: '#6b7280',
    },
    lessonListWrap: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    lessonItem: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    lessonTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    lessonMeta: {
        marginTop: 2,
        fontSize: 11,
        color: '#6b7280',
    },
    emptyInline: {
        fontSize: 12,
        color: '#9ca3af',
        paddingVertical: 8,
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
    },
    emptySubtitle: {
        marginTop: 6,
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
    },
    smallBtn: {
        minWidth: 84,
        height: 40,
        borderRadius: 10,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    actionBtnInfo: {
        backgroundColor: '#0284c7',
    },
    actionBtnSuccess: {
        backgroundColor: '#16a34a',
    },
    actionBtnWarning: {
        backgroundColor: '#f59e0b',
    },
    actionBtnDanger: {
        backgroundColor: '#dc2626',
    },
    primaryButton: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        marginBottom: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    successButton: {
        backgroundColor: '#16a34a',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    infoButton: {
        backgroundColor: '#0284c7',
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 10,
        marginTop: 4,
        marginBottom: 8,
    },
    warningButton: {
        backgroundColor: '#f59e0b',
        borderRadius: 8,
        paddingVertical: 7,
        paddingHorizontal: 10,
    },
    dangerButton: {
        backgroundColor: '#dc2626',
        borderRadius: 8,
        paddingVertical: 7,
        paddingHorizontal: 10,
    },
    secondaryButton: {
        backgroundColor: '#6b7280',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginTop: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    modalCard: {
        maxHeight: '92%',
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
    },
    modalBody: {
        flexGrow: 0,
        width: '100%',
    },
    modalBodyContent: {
        paddingBottom: 12,
    },
    modalHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        flex: 1,
        paddingRight: 8,
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    closeText: {
        color: '#2563eb',
        fontWeight: '700',
        fontSize: 14,
    },
    formFieldWrap: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        marginBottom: 8,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 2,
        paddingRight: 6,
    },
    optionsScrollContent: {
        paddingRight: 12,
    },
    optionsWrapMobile: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionChip: {
        backgroundColor: '#e5e7eb',
        borderRadius: 999,
        paddingVertical: 9,
        paddingHorizontal: 14,
        marginRight: 8,
    },
    optionChipActive: {
        backgroundColor: '#2563eb',
    },
    optionChipText: {
        color: '#374151',
        fontSize: 13,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    optionChipTextActive: {
        color: '#fff',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    templateCard: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    templateTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1f2937',
    },
    formBox: {
        marginTop: 2,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    smallHelp: {
        marginTop: -2,
        marginBottom: 10,
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
    },
    downloadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
    },
    downloadTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1f2937',
    },
    downloadMeta: {
        marginTop: 2,
        fontSize: 11,
        color: '#6b7280',
    },
});

export default AdminLessonManagement;
