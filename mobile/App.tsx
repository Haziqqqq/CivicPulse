import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Text } from 'react-native'
import HomeScreen from './screens/HomeScreen'
import ReportScreen from './screens/ReportScreen'
import MyReportsScreen from './screens/MyReportsScreen'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#f5f0e8' },
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          tabBarStyle: {
            backgroundColor: '#f5f0e8',
            borderTopColor: '#e2ddd6',
            paddingBottom: 8,
            paddingTop: 8,
            height: 64,
          },
          tabBarActiveTintColor: '#e63329',
          tabBarInactiveTintColor: '#9a9486',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        }}
      >
        <Tab.Screen
          name="Map"
          component={HomeScreen}
          options={{
            title: 'Live Map',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>🗺️</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Report"
          component={ReportScreen}
          options={{
            title: 'Report Issue',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📷</Text>
            ),
          }}
        />
        <Tab.Screen
          name="MyReports"
          component={MyReportsScreen}
          options={{
            title: 'My Reports',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📋</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}