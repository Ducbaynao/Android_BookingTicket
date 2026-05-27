import React, { useCallback, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Linking, AppState } from 'react-native';
import { checkAuthStatus } from '../store/authSlice';
import AuthStack from './AuthStack';
import UserStack from './UserStack';
import AdminTabNavigator from './AdminTabNavigator';
import paymentService from '../services/paymentService';

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const navigationRef = useRef(null);
  const isHandlingDeepLinkRef = useRef(false);

  const navigateToMyTickets = useCallback(() => {
    if (!navigationRef.current) {
      return;
    }

    navigationRef.current.navigate('UserTabs', {
      screen: 'MyTickets',
    });
  }, []);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    const processPaymentDeepLink = async (url) => {
      if (!url || isHandlingDeepLinkRef.current) {
        return;
      }

      const parsed = paymentService.parsePaymentDeepLink(url);
      if (!parsed) {
        return;
      }

      const bookingIdFromUrl = Number(parsed.bookingId);
      const bookingId = bookingIdFromUrl || (await paymentService.getPendingPaymentBookingId());
      if (!bookingId) {
        return;
      }

      isHandlingDeepLinkRef.current = true;
      try {
        const status = await paymentService.getPaymentStatus(bookingId);

        if (status?.isSuccess) {
          await paymentService.clearPendingPaymentBookingId();
          setTimeout(() => {
            navigateToMyTickets();
          }, 300);
        } else {
          if (status?.isFinal) {
            await paymentService.clearPendingPaymentBookingId();
          }
        }
      } catch (err) {
        console.error('Payment status check error:', err);
      } finally {
        isHandlingDeepLinkRef.current = false;
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => {
      processPaymentDeepLink(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        processPaymentDeepLink(url);
      }
    });

    return () => sub.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState !== 'active' || isHandlingDeepLinkRef.current) {
        return;
      }

      const pendingBookingId = await paymentService.getPendingPaymentBookingId();
      if (!pendingBookingId) {
        return;
      }

      isHandlingDeepLinkRef.current = true;
      try {
        const status = await paymentService.getPaymentStatus(pendingBookingId);
        if (status?.isSuccess) {
          await paymentService.clearPendingPaymentBookingId();
          setTimeout(() => {
            navigateToMyTickets();
          }, 300);
          return;
        }

        if (status?.isFinal) {
          await paymentService.clearPendingPaymentBookingId();
        }
      } catch (err) {
        console.error('Payment status check on app active error:', err);
      } finally {
        isHandlingDeepLinkRef.current = false;
      }
    });

    return () => sub.remove();
  }, [navigateToMyTickets]);

  const getActiveNavigator = () => {
    if (!isAuthenticated) {
      return <AuthStack />;
    }
    
    if (role === 'ADMIN') {
      return <AdminTabNavigator />;
    }
    
    return <UserStack />;
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {getActiveNavigator()}
    </NavigationContainer>
  );
}
