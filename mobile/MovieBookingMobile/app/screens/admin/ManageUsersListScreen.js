import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userManagementService } from '../../services/userManagementService';
import { useSelector } from 'react-redux';

const ManageUsersListScreen = ({ navigation }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [bookingsModalVisible, setBookingsModalVisible] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [searchQuery, roleFilter, statusFilter, tierFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userManagementService.getAllUsers(searchQuery, roleFilter, statusFilter, tierFilter);
      const filteredUsers = (data || []).filter((user) => {
        if (!currentUser || !user) {
          return true;
        }
        const sameId = currentUser.id && user.id && Number(currentUser.id) === Number(user.id);
        const sameEmail =
          currentUser.email &&
          user.email &&
          String(currentUser.email).toLowerCase() === String(user.email).toLowerCase();
        return !(sameId || sameEmail);
      });
      setUsers(filteredUsers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, [searchQuery, roleFilter, statusFilter, tierFilter, currentUser?.id, currentUser?.email]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBookingStatusColor = (status = '') => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
      case 'pending_payment':
        return '#FF9800';
      case 'cancelled':
      case 'failed':
      case 'expired':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const loadUserBookings = async (userId, ticketStatus = '') => {
    try {
      setBookingsLoading(true);
      const bookings = await userManagementService.getUserBookings(userId, ticketStatus);
      const sorted = [...bookings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUserBookings(sorted);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user bookings');
      console.error('Load user bookings error:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const openUserBookings = async (user) => {
    setSelectedUser(user);
    setBookingStatusFilter('');
    setBookingsModalVisible(true);
    await loadUserBookings(user.id, '');
  };

  const closeUserBookings = () => {
    setBookingsModalVisible(false);
    setSelectedUser(null);
    setUserBookings([]);
    setBookingStatusFilter('');
  };

  useEffect(() => {
    if (bookingsModalVisible && selectedUser) {
      loadUserBookings(selectedUser.id, bookingStatusFilter);
    }
  }, [bookingStatusFilter]);

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    
    Alert.alert(
      'Confirm Role Change',
      `Change ${user.name}'s role from ${user.role} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await userManagementService.updateUserRole(user.id, newRole);
              Alert.alert('Success', 'User role updated');
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to update role');
              console.error('Update role error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Confirm Delete User',
      `Delete user ${user.name}? Their account will be removed but ticket history will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userManagementService.deleteUser(user.id);
              Alert.alert('Success', 'User deleted');
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
              console.error('Delete user error:', error);
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    (() => {
      const isCurrentAdmin =
        currentUser &&
        item &&
        ((currentUser.id && item.id && Number(currentUser.id) === Number(item.id)) ||
          (currentUser.email && item.email && String(currentUser.email).toLowerCase() === String(item.email).toLowerCase()));
      return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userDate}>
            Joined: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
          <Text style={styles.userTier}>
            Tier: {item.loyaltyTier || 'BRONZE'} • Points: {item.loyaltyPoints || 0}
          </Text>
        </View>
        <View style={styles.badges}>
          <View style={[
            styles.badge,
            item.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser
          ]}>
            <Text style={styles.badgeText}>{item.role}</Text>
          </View>
          <View style={[
            styles.badge,
            item.status === 'ACTIVE' ? styles.badgeActive : styles.badgeBlocked
          ]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.roleButton]}
          onPress={() => handleToggleRole(item)}
          disabled={isCurrentAdmin}
        >
          <Icon name="account-convert" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            {isCurrentAdmin ? 'Cannot edit self' : (item.role === 'ADMIN' ? 'Make User' : 'Make Admin')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.bookingButton]}
          onPress={() => openUserBookings(item)}
        >
          <Icon name="ticket-confirmation" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>View Bookings</Text>
        </TouchableOpacity>
      </View>

      {!isCurrentAdmin && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteUser(item)}
          >
            <Icon name="delete" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Delete User</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
      );
    })()
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Filter:</Text>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            roleFilter === '' && styles.filterChipActive
          ]}
          onPress={() => setRoleFilter('')}
        >
          <Text style={[
            styles.filterChipText,
            roleFilter === '' && styles.filterChipTextActive
          ]}>
            All Roles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            roleFilter === 'USER' && styles.filterChipActive
          ]}
          onPress={() => setRoleFilter('USER')}
        >
          <Text style={[
            styles.filterChipText,
            roleFilter === 'USER' && styles.filterChipTextActive
          ]}>
            Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            roleFilter === 'ADMIN' && styles.filterChipActive
          ]}
          onPress={() => setRoleFilter('ADMIN')}
        >
          <Text style={[
            styles.filterChipText,
            roleFilter === 'ADMIN' && styles.filterChipTextActive
          ]}>
            Admins
          </Text>
        </TouchableOpacity>
      </View>

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
            statusFilter === 'ACTIVE' && styles.filterChipActive
          ]}
          onPress={() => setStatusFilter('ACTIVE')}
        >
          <Text style={[
            styles.filterChipText,
            statusFilter === 'ACTIVE' && styles.filterChipTextActive
          ]}>
            Active
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Tier:</Text>

        <TouchableOpacity
          style={[
            styles.filterChip,
            tierFilter === '' && styles.filterChipActive
          ]}
          onPress={() => setTierFilter('')}
        >
          <Text style={[
            styles.filterChipText,
            tierFilter === '' && styles.filterChipTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {['BRONZE', 'SILVER', 'GOLD'].map((tier) => (
          <TouchableOpacity
            key={tier}
            style={[
              styles.filterChip,
              tierFilter === tier && styles.filterChipActive
            ]}
            onPress={() => setTierFilter(tier)}
          >
            <Text style={[
              styles.filterChipText,
              tierFilter === tier && styles.filterChipTextActive
            ]}>
              {tier}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.resultCount}>
        {users.length} user{users.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-off" size={64} color="#666" />
            <Text style={styles.emptyText}>No users found</Text>
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

      <Modal
        visible={bookingsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeUserBookings}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedUser ? `${selectedUser.name}'s bookings` : 'User bookings'}
            </Text>
            <TouchableOpacity onPress={closeUserBookings}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Ticket status:</Text>
            {['', 'confirmed', 'pending', 'cancelled'].map((status) => (
              <TouchableOpacity
                key={status || 'all'}
                style={[
                  styles.filterChip,
                  bookingStatusFilter === status && styles.filterChipActive
                ]}
                onPress={() => setBookingStatusFilter(status)}
              >
                <Text style={[
                  styles.filterChipText,
                  bookingStatusFilter === status && styles.filterChipTextActive
                ]}>
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {bookingsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E50914" />
              <Text style={styles.loadingText}>Loading bookings...</Text>
            </View>
          ) : (
            <FlatList
              data={userBookings}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="ticket-outline" size={64} color="#666" />
                  <Text style={styles.emptyText}>No bookings found</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.bookingCard}>
                  <View style={styles.bookingTop}>
                    <Text style={styles.bookingId}>Booking #{item.id}</Text>
                    <View style={[
                      styles.bookingStatusBadge,
                      { backgroundColor: getBookingStatusColor(item.status) }
                    ]}>
                      <Text style={styles.badgeText}>{(item.status || '').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.bookingMovie}>{item.movieTitle || 'Unknown movie'}</Text>
                  <Text style={styles.bookingMeta}>
                    {item.cinemaName || 'Unknown cinema'} - {item.roomName || 'Unknown room'}
                  </Text>
                  <Text style={styles.bookingMeta}>Showtime: {formatDateTime(item.showtime)}</Text>
                  <Text style={styles.bookingMeta}>Booked: {formatDateTime(item.createdAt)}</Text>
                  <Text style={styles.bookingAmount}>
                    Total: {formatCurrency(item.totalAmount)}
                  </Text>
                </View>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginTop: 8,
  },
  userCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#666',
  },
  userTier: {
    fontSize: 12,
    color: '#D1B464',
    marginTop: 4,
  },
  badges: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeAdmin: {
    backgroundColor: '#9C27B0',
  },
  badgeUser: {
    backgroundColor: '#2196F3',
  },
  badgeActive: {
    backgroundColor: '#4CAF50',
  },
  badgeBlocked: {
    backgroundColor: '#F44336',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  roleButton: {
    backgroundColor: '#2196F3',
  },
  bookingButton: {
    marginTop: 8,
    backgroundColor: '#7C4DFF',
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: '#B00020',
  },
  actionButtonText: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  bookingCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bookingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    color: '#999',
    fontSize: 12,
  },
  bookingStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingMovie: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  bookingMeta: {
    color: '#B3B3B3',
    fontSize: 13,
    marginBottom: 4,
  },
  bookingAmount: {
    color: '#E50914',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default ManageUsersListScreen;
