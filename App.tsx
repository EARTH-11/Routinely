// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { getStudentSession, getRepSession, getAdminSession } from './lib/auth';
import { COLORS } from './constants/theme';

import SectionPickerScreen from './app/student/SectionPickerScreen';
import StudentTabsScreen from './app/student/StudentTabsScreen';
import LoginScreen from './app/auth/LoginScreen';
import AdminTabsScreen from './app/admin/AdminTabsScreen';
import RepTabsScreen from './app/rep/RepTabsScreen';

export type RootStackParamList = {
  SectionPicker: undefined;
  StudentTabs: { session: any };
  Login: undefined;
  AdminTabs: undefined;
  RepTabs: { session: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [initialParams, setInitialParams] = useState<any>(undefined);

  useEffect(() => {
    async function checkSession() {
      const adminSession = await getAdminSession();
      if (adminSession) {
        setInitialRoute('AdminTabs');
        return;
      }
      const repSession = await getRepSession();
      if (repSession) {
        setInitialParams({ session: repSession });
        setInitialRoute('RepTabs');
        return;
      }
      const studentSession = await getStudentSession();
      if (studentSession) {
        setInitialParams({ session: studentSession });
        setInitialRoute('StudentTabs');
        return;
      }
      setInitialRoute('SectionPicker');
    }
    checkSession();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="SectionPicker" component={SectionPickerScreen} />
        <Stack.Screen name="StudentTabs" component={StudentTabsScreen} initialParams={initialParams} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminTabs" component={AdminTabsScreen} />
        <Stack.Screen name="RepTabs" component={RepTabsScreen} initialParams={initialParams} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
});
