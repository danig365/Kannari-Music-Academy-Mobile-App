/**
 * AdminNavigator — Admin panel screens
 * Mapped from React Router /admin-panel/* routes in Main.jsx
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth
import AdminLogin from '../components/Admin/AdminLogin';

// Dashboard screens
import AdminDashboard from '../components/Admin/AdminDashboard';
import UsersManagement from '../components/Admin/UsersManagement';
import SubscriptionsManagement from '../components/Admin/SubscriptionsManagement';
import AdminLessonManagement from '../components/Admin/AdminLessonManagement';
import CourseAnalytics from '../components/Admin/CourseAnalytics';
import AdminGamesAnalytics from '../components/Admin/AdminGamesAnalytics';
import AuditLogsDashboard from '../components/Admin/AuditLogsDashboard';
import ActivityLogs from '../components/Admin/ActivityLogs';
import AdminSettings from '../components/Admin/AdminSettings';
import AdminLayout from '../components/Admin/AdminLayout';

const Stack = createStackNavigator();

const withAdminLayout = (Component) => {
  const WrappedScreen = (props) => (
    <AdminLayout>
      <Component {...props} />
    </AdminLayout>
  );
  return WrappedScreen;
};

const AdminDashboardScreen = withAdminLayout(AdminDashboard);
const UsersManagementScreen = withAdminLayout(UsersManagement);
const SubscriptionsManagementScreen = withAdminLayout(SubscriptionsManagement);
const AdminLessonManagementScreen = withAdminLayout(AdminLessonManagement);
const CourseAnalyticsScreen = withAdminLayout(CourseAnalytics);
const AdminGamesAnalyticsScreen = withAdminLayout(AdminGamesAnalytics);
const AuditLogsDashboardScreen = withAdminLayout(AuditLogsDashboard);
const ActivityLogsScreen = withAdminLayout(ActivityLogs);
const AdminSettingsScreen = withAdminLayout(AdminSettings);

const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Dashboard */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />

      {/* Management */}
      <Stack.Screen name="UsersManagement" component={UsersManagementScreen} />
      <Stack.Screen name="SubscriptionsManagement" component={SubscriptionsManagementScreen} />
      <Stack.Screen name="AdminLessonManagement" component={AdminLessonManagementScreen} />
      <Stack.Screen name="CourseAnalytics" component={CourseAnalyticsScreen} />
      <Stack.Screen name="AdminGamesAnalytics" component={AdminGamesAnalyticsScreen} />

      {/* Logs */}
      <Stack.Screen name="AuditLogsDashboard" component={AuditLogsDashboardScreen} />
      <Stack.Screen name="ActivityLogs" component={ActivityLogsScreen} />

      {/* Settings */}
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
