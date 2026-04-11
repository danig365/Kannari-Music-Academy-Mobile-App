import React, { useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../shared/LoadingSpinner'

const UserLogout = () => {
    const { setRole } = useAuth();

    useEffect(() => {
        const logout = async () => {
            await AsyncStorage.removeItem('studentLoginStatus');
            await AsyncStorage.removeItem('studentId');
            setRole(null);
        };
        logout();
    }, []);

    return <LoadingSpinner fullScreen size="lg" text="Logging out..." />
}

export default UserLogout
