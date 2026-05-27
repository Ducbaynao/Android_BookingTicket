import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTabNavigator from './UserTabNavigator';
import MovieDetailScreen from '../screens/user/MovieDetailScreen';
import ShowtimeScreen from '../screens/user/ShowtimeScreen';
import SeatSelectionScreen from '../screens/user/BookingScreen';
import PaymentScreen from '../screens/user/PaymentScreen';
import BookingConfirmationScreen from '../screens/user/BookingConfirmationScreen';

const Stack = createNativeStackNavigator();

export default function UserStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UserTabs" 
        component={UserTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MovieDetail" 
        component={MovieDetailScreen}
        options={{ 
          title: 'Movie Details',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#DC2626',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="Showtime" 
        component={ShowtimeScreen}
        options={{ 
          title: 'Select Showtime',
          headerStyle: {
            backgroundColor: '#1A1A1A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="SeatSelection" 
        component={SeatSelectionScreen}
        options={{ 
          title: 'Select Seats',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#DC2626',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          title: 'Confirm Booking',
          headerStyle: {
            backgroundColor: '#1A1A1A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="BookingConfirmation" 
        component={BookingConfirmationScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
