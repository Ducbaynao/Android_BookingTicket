import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Image 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { logoutAsync, refreshMeAsync } from '../../store/authSlice';
import bookingService from '../../services/bookingService';

const AccountScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [bookingCount, setBookingCount] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(refreshMeAsync());
      const loadBookingCount = async () => {
        try {
          const bookings = await bookingService.getMyBookings();
          if (Array.isArray(bookings)) {
            const confirmedBookings = bookings.filter(
              (booking) => String(booking?.status || '').toUpperCase() === 'CONFIRMED'
            );
            setBookingCount(confirmedBookings.length);
            return;
          }
          setBookingCount(0);
        } catch (error) {
          setBookingCount(0);
        }
      };
      loadBookingCount();
    }, [dispatch])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutAsync());
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Edit profile feature will be available soon!');
  };

  const handleNotifications = () => {
    Alert.alert('Coming Soon', 'Notification settings will be available soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Contact us at support@moviebooking.com');
  };

  const handleTerms = () => {
    Alert.alert('Terms of Service', 'Terms and conditions will be shown here.');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be shown here.');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getTierIcon = (tier) => {
    switch(tier) {
      case 'GOLD': return '🥇';
      case 'SILVER': return '🥈';
      case 'BRONZE': return '🥉';
      default: return '🥉';
    }
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'GOLD': return { bg: '#FFF7E6', text: '#D4AF37', border: '#FFD700' };
      case 'SILVER': return { bg: '#F5F5F5', text: '#808080', border: '#C0C0C0' };
      case 'BRONZE': return { bg: '#FFF5F0', text: '#CD7F32', border: '#CD7F32' };
      default: return { bg: '#FFF5F0', text: '#CD7F32', border: '#CD7F32' };
    }
  };

  const getTierName = (tier) => {
    switch(tier) {
      case 'GOLD': return 'Vàng';
      case 'SILVER': return 'Bạc';
      case 'BRONZE': return 'Đồng';
      default: return 'Đồng';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 đ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getNextTierInfo = () => {
    const spending = user?.totalSpending || 0;
    if (spending >= 5000000) {
      return { tier: 'GOLD', message: 'Bạn đã đạt tier cao nhất!', progress: 100 };
    } else if (spending >= 1000000) {
      const remaining = 5000000 - spending;
      const progress = (spending / 5000000) * 100;
      return { tier: 'GOLD', remaining, progress };
    } else {
      const remaining = 1000000 - spending;
      const progress = (spending / 1000000) * 100;
      return { tier: 'SILVER', remaining, progress };
    }
  };

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Text style={styles.menuArrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.name)}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {/* Tier Badge */}
          <View style={[styles.tierBadge, { 
            backgroundColor: getTierColor(user?.loyaltyTier).bg,
            borderColor: getTierColor(user?.loyaltyTier).border 
          }]}>
            <Text style={styles.tierIcon}>{getTierIcon(user?.loyaltyTier)}</Text>
            <Text style={[styles.tierText, { 
              color: getTierColor(user?.loyaltyTier).text 
            }]}>
              Hạng {getTierName(user?.loyaltyTier)}
            </Text>
          </View>
          
          {/* Loyalty Points */}
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsLabel}>💎 Điểm tích lũy</Text>
            <Text style={styles.pointsValue}>{user?.loyaltyPoints || 0} điểm</Text>
          </View>
        </View>

        {/* Spending & Progress Section */}
        <View style={styles.spendingSection}>
          <View style={styles.spendingHeader}>
            <View>
              <Text style={styles.spendingLabel}>Tổng chi tiêu</Text>
              <Text style={styles.spendingValue}>
                {formatCurrency(user?.totalSpending || 0)}
              </Text>
            </View>
            {getNextTierInfo().remaining && (
              <View style={styles.nextTierInfo}>
                <Text style={styles.nextTierLabel}>Lên hạng {getTierName(getNextTierInfo().tier)}</Text>
                <Text style={styles.nextTierValue}>
                  Còn {formatCurrency(getNextTierInfo().remaining)}
                </Text>
              </View>
            )}
          </View>
          
          {/* Progress Bar */}
          {getNextTierInfo().progress < 100 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { 
                  width: `${getNextTierInfo().progress}%`,
                  backgroundColor: getTierColor(getNextTierInfo().tier).border
                }]} />
              </View>
              <Text style={styles.progressText}>
                {getNextTierInfo().progress.toFixed(0)}%
              </Text>
            </View>
          )}
          
          {getNextTierInfo().message && (
            <Text style={styles.maxTierMessage}>{getNextTierInfo().message}</Text>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bookingCount}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="👤"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={handleEditProfile}
          />
          
          <MenuItem
            icon="🔔"
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={handleNotifications}
          />
          
          <MenuItem
            icon="⭐"
            title="My Reviews"
            subtitle="See your movie reviews and ratings"
            onPress={() => Alert.alert('Coming Soon', 'Reviews feature coming soon!')}
          />
          
          <MenuItem
            icon="❤️"
            title="Favorite Movies"
            subtitle="Movies you've marked as favorites"
            onPress={() => Alert.alert('Coming Soon', 'Favorites feature coming soon!')}
          />
        </View>

        {/* App Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>App & Legal</Text>
          
          <MenuItem
            icon="❓"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={handleHelp}
          />
          
          <MenuItem
            icon="📄"
            title="Terms of Service"
            onPress={handleTerms}
          />
          
          <MenuItem
            icon="🔒"
            title="Privacy Policy"
            onPress={handlePrivacy}
          />
          
          <MenuItem
            icon="ℹ️"
            title="App Version"
            subtitle="1.0.0"
            showArrow={false}
          />
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <MenuItem
            icon="🚪"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            danger={true}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MovieBooking Mobile</Text>
          <Text style={styles.footerText}>Made with ❤️</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 12,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 2,
  },
  tierIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pointsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E50914',
  },
  spendingSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  spendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  spendingLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  spendingValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  nextTierInfo: {
    alignItems: 'flex-end',
  },
  nextTierLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  nextTierValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E50914',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 35,
    textAlign: 'right',
  },
  maxTierMessage: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuTitleDanger: {
    color: '#E50914',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  logoutSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
});
