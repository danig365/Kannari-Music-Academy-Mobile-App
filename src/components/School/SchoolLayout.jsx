import React, { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native'
import SchoolSidebar from './SchoolSidebar'

const SchoolLayout = ({ children }) => {
    const navigation = useNavigation()
    const { width } = useWindowDimensions()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [schoolLoginStatus, setSchoolLoginStatus] = useState(null)

    const isMobile = width <= 768

    useEffect(() => {
        const checkAuth = async () => {
            const status = await AsyncStorage.getItem('schoolLoginStatus')
            setSchoolLoginStatus(status)
            if (status !== 'true') {
                navigation.navigate('SchoolLogin')
            }
        }
        checkAuth()
    }, [navigation])

    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false)
        }
    }, [isMobile])

    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => !prev)
    }, [])

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false)
    }, [])

    const handleMobileNavigation = useCallback(() => {
        if (isMobile) {
            setSidebarOpen(false)
        }
    }, [isMobile])

    if (schoolLoginStatus !== 'true') {
        return null
    }

    return (
        <View style={styles.layout}>
            {isMobile && (
                <View style={styles.mobileHeader}>
                    <TouchableOpacity
                        style={styles.sidebarToggle}
                        onPress={toggleSidebar}
                    >
                        <Text style={styles.sidebarToggleIcon}>{sidebarOpen ? '✕' : '☰'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.mobileTitle}>School Portal</Text>
                </View>
            )}

            {isMobile && sidebarOpen && (
                <Pressable style={styles.sidebarOverlay} onPress={closeSidebar} />
            )}

            <View
                style={[
                    styles.sidebar,
                    isMobile ? styles.sidebarMobile : styles.sidebarDesktop,
                    isMobile && !sidebarOpen ? styles.sidebarClosed : null,
                ]}
            >
                <SchoolSidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isMobile={isMobile}
                    onNavigate={handleMobileNavigation}
                />
            </View>

            <View style={[styles.mainContent, isMobile ? styles.mainContentMobile : styles.mainContentDesktop]}>
                {children || <Text style={styles.placeholderText}>School content goes here.</Text>}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    layout: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
        minHeight: '100%',
        backgroundColor: '#f8f9fa',
    },
    sidebar: {
        zIndex: 1100,
        overflow: 'hidden',
    },
    sidebarDesktop: {
        width: 260,
    },
    sidebarMobile: {
        position: 'absolute',
        top: 60,
        left: 0,
        width: '84%',
        maxWidth: 320,
        bottom: 0,
    },
    sidebarClosed: {
        width: 0,
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    mainContentDesktop: {
        paddingVertical: 24,
        paddingHorizontal: 24,
    },
    mainContentMobile: {
        marginTop: 60,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    mobileHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#ffffff',
        zIndex: 1200,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
    },
    sidebarToggle: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
    },
    sidebarToggleIcon: {
        color: '#3b82f6',
        fontSize: 22,
        fontWeight: '700',
    },
    mobileTitle: {
        color: '#1a2332',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    sidebarOverlay: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1099,
    },
    placeholderText: {
        color: '#64748b',
        fontSize: 13,
    },
})

export default SchoolLayout
