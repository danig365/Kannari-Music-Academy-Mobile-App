/**
 * SchoolNavigator — School dashboard screens
 * Mapped from React Router /school/* routes in Main.jsx
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth
import SchoolLogin from '../components/School/SchoolLogin';

// Dashboard screens
import SchoolDashboard from '../components/School/SchoolDashboard';
import SchoolTeachers from '../components/School/SchoolTeachers';
import SchoolStudents from '../components/School/SchoolStudents';
import SchoolGroupClasses from '../components/School/SchoolGroupClasses';
import SchoolGroupDetail from '../components/School/SchoolGroupDetail';
import SchoolLessonAssignments from '../components/School/SchoolLessonAssignments';
import SchoolProgress from '../components/School/SchoolProgress';
import SchoolSettings from '../components/School/SchoolSettings';
import SchoolChatLock from '../components/School/SchoolChatLock';
import SchoolLogout from '../components/School/SchoolLogout';
import SchoolLayout from '../components/School/SchoolLayout';

const Stack = createStackNavigator();

const withSchoolLayout = (Component) => {
  const WrappedScreen = (props) => (
    <SchoolLayout>
      <Component {...props} />
    </SchoolLayout>
  );
  return WrappedScreen;
};

const SchoolDashboardScreen = withSchoolLayout(SchoolDashboard);
const SchoolTeachersScreen = withSchoolLayout(SchoolTeachers);
const SchoolStudentsScreen = withSchoolLayout(SchoolStudents);
const SchoolGroupClassesScreen = withSchoolLayout(SchoolGroupClasses);
const SchoolGroupDetailScreen = withSchoolLayout(SchoolGroupDetail);
const SchoolLessonAssignmentsScreen = withSchoolLayout(SchoolLessonAssignments);
const SchoolProgressScreen = withSchoolLayout(SchoolProgress);
const SchoolSettingsScreen = withSchoolLayout(SchoolSettings);
const SchoolChatLockScreen = withSchoolLayout(SchoolChatLock);
const SchoolLogoutScreen = withSchoolLayout(SchoolLogout);

const SchoolNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Dashboard */}
      <Stack.Screen name="SchoolDashboard" component={SchoolDashboardScreen} />

      {/* Management */}
      <Stack.Screen name="SchoolTeachers" component={SchoolTeachersScreen} />
      <Stack.Screen name="SchoolStudents" component={SchoolStudentsScreen} />
      <Stack.Screen name="SchoolGroupClasses" component={SchoolGroupClassesScreen} />
      <Stack.Screen name="SchoolGroupDetail" component={SchoolGroupDetailScreen} />
      <Stack.Screen name="SchoolLessonAssignments" component={SchoolLessonAssignmentsScreen} />

      {/* Progress & Settings */}
      <Stack.Screen name="SchoolProgress" component={SchoolProgressScreen} />
      <Stack.Screen name="SchoolSettings" component={SchoolSettingsScreen} />
      <Stack.Screen name="SchoolChatLock" component={SchoolChatLockScreen} />
      <Stack.Screen name="SchoolLogout" component={SchoolLogoutScreen} />
    </Stack.Navigator>
  );
};

export default SchoolNavigator;
