import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { seatService } from '../../services/seatService';

const { width } = Dimensions.get('window');
const SEAT_SIZE = (width - 80) / 10; // 10 seats per row

const SeatSelectionScreen = ({ route, navigation }) => {
  const { movieId, movieTitle, theater, showtime, date } = route.params;
  
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any previous selections when showtime changes
    setSelectedSeats([]);
    loadSeats();
  }, [showtime]);

  // Generate cinema-style seat layout using real API data
  const generateSeatLayout = (apiSeats = []) => {
    if (!apiSeats || apiSeats.length === 0) {
      console.warn('No API seats - generating demo layout');
      return generateDemoSeats();
    }
    
    console.log('=== PROCESSING API SEATS ===');
    console.log('Total API seats:', apiSeats.length);
    console.log('First API seat sample:', JSON.stringify(apiSeats[0], null, 2));
    
    // Map API seats to UI format
    // API returns ShowtimeSeat with nested seat object:
    // { id, seat: { seatRow, seatNumber, seatType }, price, status }
    const mappedSeats = apiSeats.map((apiSeat, index) => {
      // Extract from nested seat object
      const seatData = apiSeat.seat || {};
      const row = seatData.seatRow || 'A';
      const col = seatData.seatNumber || (index + 1);
      const seatNumber = `${row}${col}`;
      
      // Check seat type from nested seatType
      const seatTypeName = seatData.seatType?.name || '';
      const isVIP = seatTypeName.toUpperCase().includes('VIP');
      
      const mappedSeat = {
        id: apiSeat.id || `seat-${row}-${col}-${index}`, // Ensure unique ID for each seat
        seatNumber: seatNumber,
        row: row,
        col: col,
        status: (apiSeat.status === 'booked' || apiSeat.status === 'BOOKED' || 
                 apiSeat.status === 'held' || apiSeat.status === 'HELD' ||
                 apiSeat.status === 'blocked' || apiSeat.status === 'BLOCKED') ? 'BOOKED' : 'AVAILABLE',
        price: apiSeat.price || 75000,
        type: isVIP ? 'VIP' : 'STANDARD',
        originalId: apiSeat.id, // Keep original ID for backend calls if needed
      };
      
      // Debug first few seats
      if (index < 3) {
        console.log(`Seat ${index}:`, {
          raw: apiSeat,
          mapped: mappedSeat
        });
      }
      
      return mappedSeat;
    });
    
    // Debug final results
    const rowCounts = {};
    mappedSeats.forEach(s => {
      rowCounts[s.row] = (rowCounts[s.row] || 0) + 1;
    });
    console.log('Row distribution:', rowCounts);
    console.log('Total mapped seats:', mappedSeats.length);
    console.log('Booked seats:', mappedSeats.filter(s => s.status === 'BOOKED').length);
    
    // Check for duplicate/null IDs
    const ids = mappedSeats.map(s => s.id);
    const nullIds = ids.filter(id => !id || id === null || id === undefined);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    if (nullIds.length > 0) {
      console.warn('⚠️ NULL seat IDs found:', nullIds.length);
    }
    if (duplicateIds.length > 0) {
      console.warn('⚠️ Duplicate seat IDs found:', duplicateIds);
    }
    
    return mappedSeats;
  };
  
  // Generate demo seats (for when API fails)
  const generateDemoSeats = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const cols = 10;
    const demoSeats = [];
    
    rows.forEach((row, rowIndex) => {
      for (let col = 1; col <= cols; col++) {
        demoSeats.push({
          id: `demo-${row}-${col}`, // Unique demo ID for selection
          seatNumber: `${row}${col}`,
          row: row,
          col: col,
          status: 'AVAILABLE',
          price: rowIndex >= 6 ? 95000 : 75000,
          type: rowIndex >= 6 ? 'VIP' : 'STANDARD',
        });
      }
    });
    
    console.log('Generated demo seats with IDs:', demoSeats.slice(0, 3).map(s => s.id));
    return demoSeats;
  };

  const loadSeats = async () => {
    try {
      setLoading(true);
      console.log('Loading seats for showtime:', showtime?.id);
      
      // Try loading real seats from API
      let apiSeats = [];
      try {
        apiSeats = await seatService.getSeatsByShowtime(showtime.id);
        console.log('API returned', apiSeats?.length || 0, 'seats');
      } catch (apiError) {
        console.log('API error, using generated seats:', apiError.message);
      }
      
      // Generate cinema-style layout with API data for booking status
      const layoutSeats = generateSeatLayout(apiSeats || []);
      console.log('Generated layout with', layoutSeats.length, 'seats');
      
      setSeats(layoutSeats);
    } catch (error) {
      console.error('Error loading seats:', error);
      // Fallback to pure generated layout
      setSeats(generateSeatLayout([]));
    } finally {
      setLoading(false);
    }
  };

  const handleSeatPress = (seat) => {
    console.log('=== SEAT PRESS ===');
    console.log('Seat pressed:', seat.id, 'status:', seat.status);
    console.log('Current selectedSeats:', selectedSeats.map(s => s.id));
    
    if (seat.status === 'BOOKED') {
      console.log('Seat is booked, cannot select');
      return;
    }

    if (!seat.id) {
      console.error('Seat has no ID, cannot select');
      return;
    }

    const seatId = seat.id;
    const isAlreadySelected = selectedSeats.find(s => s.id && s.id === seatId);
    
    if (isAlreadySelected) {
      console.log('Deselecting seat:', seatId);
      const newSelectedSeats = selectedSeats.filter((s) => s.id && s.id !== seatId);
      console.log('New selectedSeats after deselect:', newSelectedSeats.map(s => s.id));
      setSelectedSeats(newSelectedSeats);
    } else {
      if (selectedSeats.length >= 10) {
        Alert.alert('Limit Reached', 'You can select maximum 10 seats');
        return;
      }
      console.log('Selecting seat:', seatId);
      const newSelectedSeats = [...selectedSeats, seat];
      console.log('New selectedSeats after select:', newSelectedSeats.map(s => s.id));
      setSelectedSeats(newSelectedSeats);
    }
  };

  const getSeatColor = (seat) => {
    // Debug seat color logic (only log first few to avoid spam)
    if (seat.row === 'A' && seat.col <= 3) {
      console.log(`getSeatColor for seat ${seat.id}:`, {
        seatStatus: seat.status,
        seatType: seat.type,
        isSelected: !!selectedSeats.find(s => s.id && seat.id && s.id === seat.id),
        selectedSeatsCount: selectedSeats.length,
        selectedSeatsIds: selectedSeats.map(s => s.id).join(',')
      });
    }
    
    if (seat.status === 'BOOKED') {
      return '#9CA3AF'; // Gray
    }
    
    // Safe comparison - both IDs must exist and match
    if (seat.id && selectedSeats.find(s => s.id && s.id === seat.id)) {
      return '#DC2626'; // Red (selected)
    }
    
    if (seat.type === 'VIP') {
      return '#F59E0B'; // Orange for VIP
    }
    return '#10B981'; // Green (available)
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => total + (seat.price || showtime?.price || 75000), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Missing Info', 'Please select at least one seat');
      return;
    }

    // Navigate to Payment screen with all booking data
    navigation.navigate('Payment', {
      movieId,
      movieTitle,
      theater,
      showtime,
      date,
      selectedSeats,
      totalAmount: calculateTotal(),
    });
  };

  // Group seats by row for display
  const getSeatsByRow = () => {
    console.log('getSeatsByRow called with seats:', seats.length);
    const rowMap = {};
    seats.forEach(seat => {
      if (!rowMap[seat.row]) {
        rowMap[seat.row] = [];
      }
      rowMap[seat.row].push(seat);
    });
    
    // Sort by column within each row
    Object.keys(rowMap).forEach(row => {
      rowMap[row].sort((a, b) => a.col - b.col);
    });
    
    console.log('rowMap created:', Object.keys(rowMap).length, 'rows');
    return rowMap;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading seats...</Text>
      </View>
    );
  }

  const seatsByRow = getSeatsByRow();
  const rows = Object.keys(seatsByRow).sort();
  
  console.log('Total seats loaded:', seats.length);
  console.log('Rows found:', rows);
  console.log('seatsByRow keys:', Object.keys(seatsByRow));
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Booking Info Header */}
        <View style={styles.section}>
          <View style={styles.bookingInfoCard}>
            <Text style={styles.theaterName}>{theater.name}</Text>
            <Text style={styles.bookingDetail}>
              📅 {date.dayLabel}, {date.date} • 🕐 {showtime.time}
            </Text>
            <Text style={styles.bookingDetail}>
              💺 {showtime.format} • Base: {formatCurrency(showtime.price)}/seat
            </Text>
          </View>
        </View>

        {/* Seat Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Seats</Text>

          {/* Screen indicator */}
          <View style={styles.screenContainer}>
            <View style={styles.screen}>
              <Text style={styles.screenText}>SCREEN</Text>
            </View>
          </View>

          {/* Seat Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>VIP</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#9CA3AF' }]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
          </View>

          {/* Seat Grid */}
          {seats.length === 0 ? (
            <View style={styles.emptySeats}>
              <Text style={styles.emptyText}>No seats available</Text>
            </View>
          ) : (
            <View style={styles.seatGrid}>
              {rows.map((row) => (
                <View key={row} style={styles.seatRow}>
                  <Text style={styles.rowLabel}>{row}</Text>
                  {seatsByRow[row].map((seat, index) => (
                    <TouchableOpacity
                      key={seat.id || `${row}-${seat.col || index}`}
                      style={[
                        styles.seat,
                        { backgroundColor: getSeatColor(seat) },
                      ]}
                      onPress={() => handleSeatPress(seat)}
                      disabled={seat.status === 'BOOKED'}
                    >
                      <Text style={styles.seatText}>{seat.col}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Selected Seats</Text>
            <Text style={styles.summarySeats}>
              {selectedSeats.map(s => s.seatNumber).join(', ')}
            </Text>
            <View style={styles.seatPriceBreakdown}>
              {selectedSeats.map(seat => (
                <View key={seat.id} style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    {seat.seatNumber} {seat.type === 'VIP' ? '(VIP)' : ''}
                  </Text>
                  <Text style={styles.priceValue}>
                    {formatCurrency(seat.price || showtime.price)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Booking Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(calculateTotal())}</Text>
          <Text style={styles.seatCount}>{selectedSeats.length} seat(s)</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedSeats.length === 0 && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmBooking}
          disabled={selectedSeats.length === 0}
        >
          <Text style={styles.confirmButtonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SeatSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  bookingInfoCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  theaterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  bookingDetail: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 4,
  },
  screenContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  screen: {
    width: '80%',
    height: 4,
    backgroundColor: '#E50914',
    borderRadius: 2,
    marginBottom: 8,
  },
  screenText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  seatGrid: {
    alignItems: 'center',
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowLabel: {
    width: 20,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginRight: 8,
  },
  seat: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    margin: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptySeats: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  summarySeats: {
    fontSize: 14,
    color: '#E50914',
    fontWeight: '600',
    marginBottom: 12,
  },
  seatPriceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalContainer: {
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E50914',
  },
  seatCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: '#E50914',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
