// app/admin/AdminTabsScreen.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';

import AdminDashboard from './AdminDashboard';
import AdminBatchesScreen from './AdminBatchesScreen';
import AdminRepsScreen from './AdminRepsScreen';
import AdminBusScreen from './AdminBusScreen';
import AdminProfileScreen from './AdminProfileScreen';

const Tab = createBottomTabNavigator();
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TAB_ICONS: Record<string, MaterialIconName> = {
  Overview: 'grid-view',
  Batches: 'account-tree',
  Reps: 'group',
  Bus: 'directions-bus',
  Logout: 'logout',
};

export default function AdminTabsScreen() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <MaterialIcons
            name={TAB_ICONS[route.name]}
            size={focused ? 26 : 22}
            color={color}
          />
        ),
        tabBarLabel: ({ focused }) => (
          <Text style={{
            fontSize: FONTS.sizes.xs,
            color: focused ? COLORS.primary : COLORS.textMuted,
            fontWeight: focused ? '700' : '400',
            marginBottom: 8,
          }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: COLORS.border, height: 80, paddingTop: 8},
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      })}
    >
      <Tab.Screen name="Overview" component={AdminDashboard} />
      <Tab.Screen name="Batches" component={AdminBatchesScreen} />
      <Tab.Screen name="Reps" component={AdminRepsScreen} />
      <Tab.Screen name="Bus" component={AdminBusScreen} />
      <Tab.Screen name="Logout" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
}
