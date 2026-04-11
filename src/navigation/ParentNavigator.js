/**
 * ParentNavigator — Parent screens
 * Mapped from React Router /parent/* routes in Main.jsx
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth
import ParentLogin from '../components/ParentLogin';

// Dashboard screens
import ParentDashboard from '../components/Parent/ParentDashboard';
import ParentMessages from '../components/Parent/ParentMessages';

// Parental Consent (shared component used from parent route)
import ParentalConsent from '../components/shared/ParentalConsent';

const Stack = createStackNavigator();

const ParentNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Dashboard */}
      <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
      <Stack.Screen name="ParentMessages" component={ParentMessages} />
      <Stack.Screen name="ParentalConsent" component={ParentalConsent} />
    </Stack.Navigator>
  );
};

export default ParentNavigator;
