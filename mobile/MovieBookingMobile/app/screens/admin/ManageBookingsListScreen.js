import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { bookingManagementService } from '../../services/bookingManagementService';

const ManageBookingsListScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingManagementService.getAllBookings(statusFilter);
      setBookings(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
      console.error('Load bookings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [statusFilter]);

  const handleCancelBooking = async (booking) => {
    if (booking.status.toLowerCase() === 'cancelled') {
      Alert.alert('Info', 'This booking is already cancelled');
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      `Cancel booking #${booking.id} for ${booking.movieTitle}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingManagementService.cancelBooking(booking.id);
              Alert.alert('Success', 'Booking cancelled');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
              console.error('Cancel booking error:', error);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingId}>Booking #{item.id}</Text>
          <Text style={styles.movieTitle}>{item.movieTitle}</Text>
          <Text style={styles.cinemaInfo}>
            <Icon name="theater" size={14} color="#999" /> {item.cinemaName} - {item.roomName}
          </Text>
          <Text style={styles.showtimeInfo}>
            <Icon name="clock-outline" size={14} color="#999" /> {formatDateTime(item.showtime)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.userInfo}>
        <Icon name="account" size={16} color="#999" />
        <Text style={styles.userName}> {item.userName}</Text>
        <Text style={styles.userEmail}> ({item.userEmail})</Text>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Seats:</Text>
          <Text style={styles.detailValue}>{item.seatCount} seat{item.seatCount > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValueBold}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booked:</Text>
          <Text style={styles.detailValue}>{formatDateTime(item.createdAt)}</Text>
        </View>
      </View>

      {item.status.toLowerCase() !== 'cancelled' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelBooking(item)}
        >
          <Icon name="close-circle" size={18} color="#fff" />
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Status:</Text>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === '' && styles.filterChipActive
          ]}
          onPress={() => setStatusFilter('')}
        >
          <Text style={[
            styles.filterChipText,
            statusFilter === '' && styles.filterChipTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === 'confirmed' && styles.filterChipActive
          ]}
          onPress={() => setStatusFilter('confirmed')}
        >
          <Text style={[
            styles.filterChipText,
            statusFilter === 'confirmed' && styles.filterChipTextActive
          ]}>
            Confirmed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === 'pending' && styles.filterChipActive
          ]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[
            styles.filterChipText,
            statusFilter === 'pending' && styles.filterChipTextActive
          ]}>
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === 'cancelled' && styles.filterChipActive
          ]}
          onPress={() => setStatusFilter('cancelled')}
        >
          <Text style={[
            styles.filterChipText,
            statusFilter === 'cancelled' && styles.filterChipTextActive
          ]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.resultCount}>
        {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="ticket-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E50914']}
            tintColor="#E50914"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterLabel: {
    color: '#fff',
    fontSize: 14,
    marginRight: 12,
    fontWeight: '600',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#E50914',
  },
  filterChipText: {
    color: '#999',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultCount: {
    color: '#999',
    fontSize: 14,
  },
  bookingCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  cinemaInfo: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  showtimeInfo: {
    fontSize: 14,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userEmail: {
    color: '#999',
    fontSize: 12,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
  },
  detailValueBold: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
});

export default ManageBookingsListScreen;
