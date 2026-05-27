import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';

const MyTicketsScreen = () => {
  const PENDING_EXPIRE_MS = 15 * 60 * 1000;
  const [tickets, setTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('UPCOMING'); // UPCOMING, PAST
  const [loading, setLoading] = useState(true);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh tickets when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 MyTickets screen focused, reloading...');
      loadTickets();
    }, [])
  );

  const loadTickets = async () => {
    try {
      console.log('=== LOADING TICKETS ===');
      let bookings = await bookingService.getMyBookings();
      
      // FIX: If response is string, try to parse it as JSON
      if (typeof bookings === 'string') {
        try {
          bookings = JSON.parse(bookings);
          console.log('Parsed string response to JSON successfully');
        } catch (e) {
          console.error('Failed to parse string response:', e);
          setTickets([]);
          setLoading(false);
          return;
        }
      }
      
      console.log(`✅ SUCCESS: Loaded ${bookings?.length || 0} tickets`);
      
      // Ensure bookings is an array
      const ticketsArray = Array.isArray(bookings) ? bookings : [];
      setTickets(ticketsArray);
    } catch (error) {
      console.error('❌ ERROR LOADING TICKETS:', error.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isPast = date < now;
    
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    return {
      formatted: date.toLocaleDateString('en-US', options),
      isPast,
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status || '').toUpperCase();
    switch (normalizedStatus) {
      case 'CONFIRMED':
        return '#10B981'; // green
      case 'PENDING_PAYMENT':
      case 'PENDING':
      case 'INIT':
        return '#F59E0B'; // amber
      case 'USED':
        return '#6B7280'; // gray
      case 'CANCELLED':
      case 'FAILED':
        return '#EF4444'; // red
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    const normalizedStatus = (status || '').toUpperCase();
    switch (normalizedStatus) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING_PAYMENT':
      case 'PENDING':
      case 'INIT':
        return 'Pending Payment';
      case 'USED':
        return 'Used';
      case 'CANCELLED':
        return 'Cancelled';
      case 'FAILED':
        return 'Payment Failed';
      default:
        return status;
    }
  };

  const isPendingPaymentStatus = (status) => {
    const normalizedStatus = (status || '').toUpperCase();
    return normalizedStatus === 'PENDING_PAYMENT' || normalizedStatus === 'PENDING' || normalizedStatus === 'INIT';
  };

  const getPendingRemainingMs = (ticket) => {
    const createdAt = ticket?.createdAt || ticket?.created_at || ticket?.bookingDate;
    if (!createdAt) {
      return 0;
    }
    const createdAtMs = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtMs)) {
      return 0;
    }
    return Math.max(0, createdAtMs + PENDING_EXPIRE_MS - nowTs);
  };

  const formatRemainingTime = (remainingMs) => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const renderBarcode = (rawValue) => {
    const value = String(rawValue || '').replace(/[^0-9A-Za-z]/g, '').slice(-12) || '000000000000';
    const bars = value.split('').flatMap((ch) => {
      const code = ch.charCodeAt(0);
      return [
        1 + (code % 3),
        1,
        2 + (code % 2),
        1,
      ];
    });

    return (
      <View style={styles.barcodeWrap}>
        <View style={styles.barcodeBarsRow}>
          {bars.map((width, index) => (
            <View
              key={`bar-${index}`}
              style={[
                styles.barcodeBar,
                { width, opacity: index % 2 === 0 ? 1 : 0 },
              ]}
            />
          ))}
        </View>
        <Text style={styles.barcodeCodeText}>{value}</Text>
      </View>
    );
  };

  const filteredTickets = Array.isArray(tickets) ? tickets.filter((ticket) => {
    // Handle different date field possibilities
    const showtimeDate = ticket.showtime?.startTime || ticket.showtime?.start_time;
    
    if (!showtimeDate) {
      console.log(`❌ Ticket ${ticket.id}: No valid showtime date`);
      return false; // Skip tickets without valid date
    }
    
    // Check if showtime has passed (movie already shown)
    const showtime = new Date(showtimeDate);
    const now = new Date();
    const hasMovieBeenShown = showtime < now;
    
    const status = (ticket.status || '').toUpperCase();
    if (selectedTab === 'UPCOMING' && isPendingPaymentStatus(status)) {
      const remainingMs = getPendingRemainingMs(ticket);
      if (remainingMs <= 0) {
        return false;
      }
    }
    
    let shouldShow = false;
    
    if (selectedTab === 'UPCOMING') {
      // UPCOMING: Movies that haven't been shown yet AND not cancelled
      shouldShow = !hasMovieBeenShown && status !== 'CANCELLED';
    } else {
      // PAST: Movies that have been shown OR cancelled tickets
      shouldShow = hasMovieBeenShown || status === 'CANCELLED';
    }
      
    console.log(`🎬 Ticket ${ticket.id}: showtime=${showtimeDate}, hasBeenShown=${hasMovieBeenShown}, status=${status}, tab=${selectedTab}, show=${shouldShow}`);
    return shouldShow;
  }) : [];
  
  console.log(`📊 Filter Result: ${filteredTickets.length}/${tickets.length} tickets for ${selectedTab} tab`);

  const renderTicketCard = ({ item }) => {
    // Handle different date field possibilities
    const showtimeDate = item.showtime?.startTime || item.showtime?.start_time || item.showtime;
    const { formatted: dateFormatted, isPast } = formatDate(showtimeDate);

    return (
      <TouchableOpacity style={styles.ticketCard}>
        <View style={styles.ticketContent}>
          {/* Movie Poster */}
          <Image
            source={{ 
              uri: item.showtime?.movie?.poster || 
                   item.showtime?.movie?.posterUrl || 
                   item.movie?.poster ||
                   'https://via.placeholder.com/80x120?text=Movie'
            }}
            style={styles.ticketPoster}
            resizeMode="cover"
          />

          {/* Ticket Details */}
          <View style={styles.ticketDetails}>
            <Text style={styles.movieTitle} numberOfLines={2}>
              {item.showtime?.movie?.title || item.movie?.title || 'Unknown Movie'}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎬</Text>
              <Text style={styles.infoText}>
                {item.showtime?.room?.cinema?.name || item.theater || 'Unknown Theater'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoText}>{dateFormatted}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💺</Text>
              <Text style={styles.infoText}>
                {item.showtime?.room?.name || item.screen || 'Hall 1'} • Seats: {
                  // New simple format from backend
                  item.seats?.map(seat => 
                    `${seat.seatRow}${seat.seatNumber}`
                  ).join(', ') ||
                  // Fallback to old format
                  item.bookingSeats?.map(bs => 
                    `${bs.showtimeSeat?.seat?.seatRow}${bs.showtimeSeat?.seat?.seatNumber}`
                  ).join(', ') ||
                  'N/A'
                }
              </Text>
            </View>

            {Array.isArray(item.combos) && item.combos.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🍱</Text>
                <Text style={styles.infoText}>
                  {item.combos
                    .map(combo => `${combo.name} x${combo.quantity}`)
                    .join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.ticketFooter}>
              <Text style={styles.bookingCode}>#{item.qrCode || item.bookingCode || item.id}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.totalAmount}>
              {formatCurrency(item.totalAmount || item.total_amount || 0)}
            </Text>
          </View>
        </View>

        {/* QR Code for CONFIRMED / Payment Button for PENDING */}
        {(() => {
          const showtime = new Date(showtimeDate);
          const now = new Date();
          const hasMovieBeenShown = showtime < now;
          const isUpcoming = !hasMovieBeenShown;
          const bookingStatus = item.status?.toUpperCase();
          const remainingMs = isPendingPaymentStatus(bookingStatus) ? getPendingRemainingMs(item) : 0;
          const remainingTime = formatRemainingTime(remainingMs);
          
          // Only show for upcoming movies
          if (!isUpcoming) {
            return null;
          }
          
          // CONFIRMED: Show barcode block
          if (bookingStatus === 'CONFIRMED') {
            const bookingCode = item.qrCode || item.bookingCode || item.id;
            return (
              <View style={styles.barcodeSection}>
                {renderBarcode(bookingCode)}
                <Text style={styles.barcodeHintText}>Show this at the entrance</Text>
              </View>
            );
          }
          
          // Pending payment: show payment button
          if (isPendingPaymentStatus(bookingStatus)) {
            if (remainingMs <= 0) {
              return null;
            }
            return (
              <View style={styles.paymentSection}>
                <TouchableOpacity
                  style={styles.paymentButton}
                  onPress={async () => {
                    try {
                      Alert.alert(
                        'Tiếp tục thanh toán',
                        'Bạn có muốn thanh toán cho booking này?',
                        [
                          { text: 'Hủy', style: 'cancel' },
                          {
                            text: 'Thanh toán',
                            onPress: async () => {
                              try {
                                const paymentUrl = await paymentService.createPaymentUrl(item.id);
                                await paymentService.setPendingPaymentBookingId(item.id);
                                await paymentService.openPaymentUrl(paymentUrl);
                              } catch (error) {
                                Alert.alert('Lỗi', 'Không thể tạo link thanh toán. Vui lòng thử lại.');
                              }
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      console.error('Payment button error:', error);
                    }
                  }}
                >
                  <Text style={styles.paymentButtonText}>💳 Thanh toán ngay</Text>
                </TouchableOpacity>
                <Text style={styles.pendingText}>Vé chưa thanh toán</Text>
                <Text style={styles.countdownText}>Giữ ghế còn: {remainingTime}</Text>
              </View>
            );
          }
          
          return null;
        })()}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'UPCOMING' && styles.tabActive]}
            onPress={() => setSelectedTab('UPCOMING')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'UPCOMING' && styles.tabTextActive,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'PAST' && styles.tabActive]}
            onPress={() => setSelectedTab('PAST')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'PAST' && styles.tabTextActive,
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyText}>No tickets found</Text>
          <Text style={styles.emptySubtext}>
            {selectedTab === 'UPCOMING'
              ? 'No upcoming movie showtimes. Book tickets to see them here!'
              : 'No past movie showtimes or cancelled bookings.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.ticketList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#E50914']}
              tintColor="#E50914"
            />
          }
        />
      )}
    </View>
  );
};

export default MyTicketsScreen;

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
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#E50914',
  },
  ticketList: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketContent: {
    flexDirection: 'row',
    padding: 16,
  },
  ticketPoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  ticketDetails: {
    flex: 1,
    marginLeft: 16,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  bookingCode: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E50914',
  },
  barcodeSection: {
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#FFF7ED',
  },
  barcodeWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  barcodeBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 58,
  },
  barcodeBar: {
    height: 58,
    backgroundColor: '#111827',
    marginHorizontal: 1,
  },
  barcodeCodeText: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#111827',
  },
  barcodeHintText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  paymentSection: {
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  paymentButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pendingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  countdownText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
