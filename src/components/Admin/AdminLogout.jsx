import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';

const AdminLogout = () => {
    const { setRole } = useAuth();

    useEffect(() => {
        const logout = async () => {
            await AsyncStorage.removeItem('adminLoginStatus');
            await AsyncStorage.removeItem('adminId');
            await AsyncStorage.removeItem('adminRole');
            await AsyncStorage.removeItem('adminName');
            setRole(null);
        };
        logout();
    }, []);

    return <LoadingSpinner fullScreen size="lg" text="Logging out..." />;
};

export default AdminLogout;
