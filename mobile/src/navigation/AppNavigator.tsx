import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

// Import screens (will be created)
import HomeScreen from '../screens/Home';
import ScanScreen from '../screens/Scan';
import HistoryScreen from '../screens/History';
import GraphsScreen from '../screens/Graphs';
import ResourcesScreen from '../screens/Resources';
import HelpScreen from '../screens/Help';
import AccountScreen from '../screens/Account';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'RoadScan' }}
        />
        <Stack.Screen 
          name="Scan" 
          component={ScanScreen}
          options={{ title: 'Scan Road' }}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ title: 'Scan History' }}
        />
        <Stack.Screen 
          name="Graphs" 
          component={GraphsScreen}
          options={{ title: 'Statistics' }}
        />
        <Stack.Screen 
          name="Resources" 
          component={ResourcesScreen}
          options={{ title: 'Resources' }}
        />
        <Stack.Screen 
          name="Help" 
          component={HelpScreen}
          options={{ title: 'Help' }}
        />
        <Stack.Screen 
          name="Account" 
          component={AccountScreen}
          options={{ title: 'Account' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
