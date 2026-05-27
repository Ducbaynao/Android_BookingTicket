import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const BookingConfirmationScreen = ({ route, navigation }) => {
  const {
    movieTitle,
    theater,
    showtime,
    date,
    selectedSeats,
    snacks = {},
    total,
    bookingId,
  } = route.params;

  const handleViewTicket = () => {
    // Navigate to MyTickets screen
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'UserTabs',
          state: {
            routes: [{ name: 'MyTickets' }],
          },
        },
      ],
    });
  };

  const handleBackToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'UserTabs' }],
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successMessage}>
          Your transaction was completed successfully.{'\n'}
          Your seats are reserved.
        </Text>

        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Movie Info */}
          <View style={styles.movieInfoSection}>
            <View style={styles.moviePoster}>
              <Text style={styles.posterPlaceholder}>🎬</Text>
            </View>
            <View style={styles.movieDetails}>
              <Text style={styles.movieTitle}>{movieTitle}</Text>
              <Text style={styles.movieGenre}>
                {showtime.format} • Sci-Fi/Adventure
              </Text>
              <Text style={styles.movieShowtime}>
                🗓️ {date.dayLabel}, {date.dateLabel} • {showtime.time}
              </Text>
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>CINEMA</Text>
              <Text style={styles.detailValue}>{theater.name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>HALL</Text>
              <Text style={styles.detailValue}>Hall {theater.hall || 1}</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>SEATS</Text>
              <Text style={styles.detailValue}>
                {selectedSeats.join(', ')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>BOOKING ID</Text>
              <Text style={styles.detailValue}>{bookingId}</Text>
            </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCode}>
              {/* Simple QR-like pattern */}
              <View style={styles.qrPattern}>
                <View style={[styles.qrSquare, { backgroundColor: '#1A1A1A' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#1A1A1A' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <View style={styles.qrPattern}>
                <View style={[styles.qrSquare, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#1A1A1A' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#1A1A1A' }]} />
              </View>
              <View style={styles.qrPattern}>
                <View style={[styles.qrSquare, { backgroundColor: '#1A1A1A' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#1A1A1A' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <View style={styles.qrPattern}>
                <View style={[styles.qrSquare, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#1A1A1A' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.qrSquare, { backgroundColor: '#1A1A1A' }]} />
              </View>
            </View>
            <Text style={styles.qrLabel}>SCAN AT ENTRANCE</Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.viewTicketButton}
          onPress={handleViewTicket}
        >
          <Text style={styles.ticketIcon}>🎫</Text>
          <Text style={styles.viewTicketButtonText}>View Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={handleBackToHome}
        >
          <Text style={styles.backToHomeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default BookingConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  ticketCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  movieInfoSection: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  moviePoster: {
    width: 70,
    height: 100,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  posterPlaceholder: {
    fontSize: 32,
  },
  movieDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  movieGenre: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  movieShowtime: {
    fontSize: 13,
    color: '#E50914',
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  qrCode: {
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  qrPattern: {
    flexDirection: 'row',
    flex: 1,
  },
  qrSquare: {
    flex: 1,
    margin: 1,
  },
  qrLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 1,
  },
  viewTicketButton: {
    width: '100%',
    backgroundColor: '#E50914',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  ticketIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  viewTicketButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backToHomeButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  backToHomeButtonText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
