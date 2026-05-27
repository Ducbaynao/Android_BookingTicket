import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminOverviewDashboardScreen from '../screens/admin/AdminOverviewDashboardScreen';
import ManageMoviesListScreen from '../screens/admin/ManageMoviesListScreen';
import ManageUsersListScreen from '../screens/admin/ManageUsersListScreen';
import ManageMovieFormScreen from '../screens/admin/ManageMovieFormScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E50914',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminOverviewDashboardScreen}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen 
        name="ManageMovies" 
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
      <Stack.Screen 
        name="ManageUsers" 
        component={ManageUsersListScreen}
        options={{ title: 'Manage Users' }}
      />
    </Stack.Navigator>
  );
}
