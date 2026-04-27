import React, { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Sidebar from './Sidebar'
import { Bootstrap } from '../shared/BootstrapIcon'
import LoadingSpinner from '../shared/LoadingSpinner'

const UserLayout = ({ children }) => {
    const navigation = useNavigation()
    const { width } = useWindowDimensions()
    const insets = useSafeAreaInsets()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const isMobile = width <= 768
    const topInset = Platform.OS === 'ios' ? insets.top : 0
    const mobileHeaderHeight = 60 + topInset

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const status = await AsyncStorage.getItem('studentLoginStatus')
                const ok = status === 'true'
                setIsAuthenticated(ok)
                if (!ok) {
                    const parentNav = navigation.getParent()
                    if (parentNav) {
                        parentNav.reset({ index: 0, routes: [{ name: 'Auth' }] })
                    }
                }
            } finally {
                setAuthChecked(true)
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

    if (!authChecked) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading..." />
            </View>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <View style={styles.layout}>
            {isMobile && (
                <View style={[styles.mobileHeader, { height: mobileHeaderHeight, paddingTop: topInset }]}>
                    <TouchableOpacity
                        style={styles.sidebarToggle}
                        onPress={toggleSidebar}
                    >
                        <Bootstrap name="list" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text style={styles.mobileTitle} numberOfLines={1} ellipsizeMode="tail">
                        Kannari Music Academy
                    </Text>
                </View>
            )}

            {isMobile && sidebarOpen && (
                <Pressable style={[styles.sidebarOverlay, { top: mobileHeaderHeight }]} onPress={closeSidebar} />
            )}

            <View
                style={[
                    styles.sidebar,
                    isMobile ? styles.sidebarMobile : styles.sidebarDesktop,
                    isMobile ? { top: mobileHeaderHeight } : null,
                    isMobile && !sidebarOpen ? styles.sidebarClosed : null,
                ]}
            >
                <Sidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isMobile={isMobile}
                    onNavigate={handleMobileNavigation}
                />
            </View>

            <View
                style={[
                    styles.mainContent,
                    isMobile ? styles.mainContentMobile : styles.mainContentDesktop,
                    isMobile ? { marginTop: mobileHeaderHeight, paddingBottom: 16 + insets.bottom } : null,
                ]}
            >
                {children}
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
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
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
        paddingTop: 0,
        paddingBottom: 24,
        paddingHorizontal: 0,
    },
    mainContentMobile: {
        marginTop: 60,
        paddingTop: 0,
        paddingBottom: 16,
        paddingHorizontal: 0,
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
        paddingTop: 0,
    },
    sidebarToggle: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
    },
    mobileTitle: {
        color: '#1a2332',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
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
})

export default UserLayout
