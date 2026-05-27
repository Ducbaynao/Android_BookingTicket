import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AdminOverviewDashboardScreen from '../screens/admin/AdminOverviewDashboardScreen';
import ManageMoviesListScreen from '../screens/admin/ManageMoviesListScreen';
import ManageMovieFormScreen from '../screens/admin/ManageMovieFormScreen';
import ManageUsersListScreen from '../screens/admin/ManageUsersListScreen';
import ManageShowtimesListScreen from '../screens/admin/ManageShowtimesListScreen';
import ManageShowtimeFormScreen from '../screens/admin/ManageShowtimeFormScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ============ STACK NAVIGATORS FOR EACH TAB ============

// Overview Stack (Dashboard only)
const OverviewStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#E50914' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <Stack.Screen 
      name="AdminDashboard" 
      component={AdminOverviewDashboardScreen}
      options={{ headerShown: false }} // Dashboard has its own header
    />
  </Stack.Navigator>
);

// Movies Stack (List + Form)
const MoviesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#E50914' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <Stack.Screen 
      name="ManageMoviesList" 
      component={ManageMoviesListScreen}
      options={{ title: 'Manage Movies' }}
    />
    <Stack.Screen 
      name="ManageMovieForm" 
      component={ManageMovieFormScreen}
      options={({ route }) => ({
        title: route.params?.movieId ? 'Edit Movie' : 'Add Movie'
      })}
    />
  </Stack.Navigator>
);

// Showtimes Stack (List + Form)
const ShowtimesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#E50914' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <Stack.Screen 
      name="ManageShowtimesList" 
      component={ManageShowtimesListScreen}
      options={{ title: 'Manage Showtimes' }}
    />
    <Stack.Screen 
      name="ManageShowtimeForm" 
      component={ManageShowtimeFormScreen}
      options={({ route }) => ({
        title: route.params?.showtimeId ? 'Edit Showtime' : 'Add Showtime'
      })}
    />
  </Stack.Navigator>
);

// Users Stack
const UsersStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#E50914' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <Stack.Screen 
      name="ManageUsersList" 
      component={ManageUsersListScreen}
      options={{ title: 'Manage Users' }}
    />
  </Stack.Navigator>
);

// ============ MAIN TAB NAVIGATOR ============

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161616',
          borderTopWidth: 1,
          borderTopColor: '#2A2A2A',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#E50914',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
        },
      }}
    >
      <Tab.Screen 
        name="Overview" 
        component={OverviewStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Movies" 
        component={MoviesStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="movie-open" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Showtimes" 
        component={ShowtimesStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={UsersStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
