import React, { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import AdminSidebar from './AdminSidebar';
import LoadingSpinner from '../shared/LoadingSpinner';

const AdminLayout = ({ children }) => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isMobile = width <= 768;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAdminAuth();
    }, []);

    useEffect(() => {
        if (!isMobile) {
            setSidebarOpen(false);
        }
    }, [isMobile]);

    const checkAdminAuth = async () => {
        try {
            const [status, id] = await Promise.all([
                AsyncStorage.getItem('adminLoginStatus'),
                AsyncStorage.getItem('adminId'),
            ]);

            const ok = status === 'true' && !!id;
            setIsAuthenticated(ok);

            if (!ok) {
                const parentNav = navigation.getParent();
                if (parentNav) {
                    parentNav.reset({ index: 0, routes: [{ name: 'Auth' }] });
                } else {
                    navigation.reset({ index: 0, routes: [{ name: 'AdminLogin' }] });
                }
            }
        } finally {
            setAuthChecked(true);
        }
    };

    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => !prev);
    }, []);

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    const handleMobileNavigation = useCallback(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [isMobile]);

    if (!authChecked) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading admin panel..." />
            </View>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <View style={styles.container}>
            {isMobile ? (
                <View style={styles.mobileHeader}>
                    <TouchableOpacity style={styles.toggleBtn} onPress={toggleSidebar}>
                        <Text style={styles.toggleIcon}>{sidebarOpen ? '✕' : '☰'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.mobileTitle}>Admin Panel</Text>
                </View>
            ) : null}

            <View style={styles.layoutBody}>
                {!isMobile ? (
                    <View style={styles.desktopSidebar}>
                        <AdminSidebar isOpen setIsOpen={setSidebarOpen} isMobile={false} onNavigate={handleMobileNavigation} />
                    </View>
                ) : null}

                {isMobile && sidebarOpen ? (
                    <>
                        <Pressable style={styles.overlay} onPress={closeSidebar} />
                        <View style={styles.mobileSidebarWrap}>
                            <AdminSidebar
                                isOpen={sidebarOpen}
                                setIsOpen={setSidebarOpen}
                                isMobile
                                onNavigate={handleMobileNavigation}
                            />
                        </View>
                    </>
                ) : null}

                <ScrollView contentContainerStyle={styles.mainContent}>
                    {children || <Text style={styles.placeholder}>Admin content goes here.</Text>}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    layoutBody: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
    },
    desktopSidebar: {
        width: 260,
        borderRightWidth: 1,
        borderRightColor: 'rgba(59,130,246,0.1)',
        backgroundColor: '#0f1624',
    },
    mainContent: {
        paddingVertical: 24,
        paddingHorizontal: 24,
    },
    placeholder: {
        color: '#6b7280',
        fontSize: 14,
    },
    mobileHeader: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59,130,246,0.1)',
        paddingHorizontal: 8,
        zIndex: 1200,
    },
    toggleBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleIcon: {
        color: '#3b82f6',
        fontSize: 22,
        fontWeight: '700',
    },
    mobileTitle: {
        marginLeft: 8,
        color: '#1a2332',
        fontSize: 16,
        fontWeight: '600',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1099,
    },
    mobileSidebarWrap: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 280,
        maxWidth: '84%',
        zIndex: 1100,
        backgroundColor: '#0f1624',
    },
});

export default AdminLayout;
