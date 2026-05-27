import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import { foodService } from '../../services/foodService';
import { comboService } from '../../services/comboService';

const PaymentScreen = ({ route, navigation }) => {
  const { movieId, movieTitle, theater, showtime, date, selectedSeats, totalAmount } = route.params;
  
  const [snacks, setSnacks] = useState({});
  const [combos, setCombos] = useState({});
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [comboItems, setComboItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFood, setLoadingFood] = useState(true);

  const normalizePriceVnd = (rawPrice) => {
    const parsed = Number(rawPrice || 0);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }
    return parsed < 1000 ? Math.round(parsed * 1000) : Math.round(parsed);
  };

  const getSnackEmoji = (snack) => {
    const category = String(snack?.category || '').toUpperCase();
    const name = String(snack?.name || '').toLowerCase();
    if (category === 'DRINK' || name.includes('cola') || name.includes('water') || name.includes('soda')) {
      return '🥤';
    }
    if (name.includes('popcorn')) {
      return '🍿';
    }
    if (name.includes('nachos')) {
      return '🧀';
    }
    if (name.includes('hot dog')) {
      return '🌭';
    }
    if (name.includes('candy')) {
      return '🍬';
    }
    return '🍿';
  };

  useEffect(() => {
    loadFoodItems();
    loadComboItems();
  }, []);

  const loadFoodItems = async () => {
    try {
      setLoadingFood(true);
      const items = await foodService.getAllFoodItems();
      console.log('Loaded food items:', items);
      setFoodItems(items);
    } catch (error) {
      console.error('Error loading food items:', error);
      // Use mock data as fallback
      const MOCK_SNACKS = [
        { id: 1, name: 'Large Popcorn', price: 50000, category: 'FOOD', available: true },
        { id: 2, name: 'Medium Cola', price: 35000, category: 'DRINK', available: true },
        { id: 3, name: 'Nachos', price: 45000, category: 'FOOD', available: true },
        { id: 4, name: 'Hot Dog', price: 40000, category: 'FOOD', available: true },
        { id: 5, name: 'Candy', price: 25000, category: 'FOOD', available: true },
        { id: 6, name: 'Water', price: 20000, category: 'DRINK', available: true },
      ];
      setFoodItems(MOCK_SNACKS);
    } finally {
      setLoadingFood(false);
    }
  };

  const loadComboItems = async () => {
    try {
      const items = await comboService.getAllCombos();
      setComboItems(Array.isArray(items) ? items : []);
    } catch (error) {
      setComboItems([]);
    }
  };

  const seatTotal = totalAmount || (selectedSeats.reduce((sum, seat) => sum + (seat.price || showtime?.price || 75000), 0));

  const handleAddSnack = (snackId) => {
    setSnacks(prev => ({
      ...prev,
      [snackId]: (prev[snackId] || 0) + 1
    }));
  };

  const handleRemoveSnack = (snackId) => {
    setSnacks(prev => {
      const newSnacks = { ...prev };
      if (newSnacks[snackId] > 1) {
        newSnacks[snackId]--;
      } else {
        delete newSnacks[snackId];
      }
      return newSnacks;
    });
  };

  const handleAddCombo = (comboId) => {
    setCombos(prev => ({
      ...prev,
      [comboId]: (prev[comboId] || 0) + 1
    }));
  };

  const handleRemoveCombo = (comboId) => {
    setCombos(prev => {
      const next = { ...prev };
      if ((next[comboId] || 0) > 1) {
        next[comboId] -= 1;
      } else {
        delete next[comboId];
      }
      return next;
    });
  };

  const calculateSnacksTotal = () => {
    return Object.entries(snacks).reduce((total, [snackId, quantity]) => {
      const snack = foodItems.find(s => s.id === parseInt(snackId));
      return total + (snack ? normalizePriceVnd(snack.price) * quantity : 0);
    }, 0);
  };

  const calculateCombosTotal = () => {
    return Object.entries(combos).reduce((total, [comboId, quantity]) => {
      const combo = comboItems.find(c => c.id === parseInt(comboId, 10));
      return total + (combo ? normalizePriceVnd(combo.comboPrice) * quantity : 0);
    }, 0);
  };

  const calculateSubtotal = () => {
    return seatTotal + calculateSnacksTotal() + calculateCombosTotal();
  };

  const calculateConvenienceFee = () => {
    return Math.round(calculateSubtotal() * 0.05);
  };

  const calculateTax = () => {
    return Math.round(calculateSubtotal() * 0.08);
  };

  const calculatePromoDiscount = () => {
    return promoApplied ? 5000 : 0;
  };

  const calculateTotal = () => {
    const snacksTotal = calculateSnacksTotal();
    const combosTotal = calculateCombosTotal();
    const subtotal = seatTotal + snacksTotal + combosTotal;
    const convenienceFee = Math.round(subtotal * 0.05);
    const tax = Math.round(subtotal * 0.08);
    const discount = promoApplied ? 5000 : 0;
    return subtotal + convenienceFee + tax - discount;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleProceedToPayment = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    
    try {
      console.log('=== BOOKING FLOW START ===');
      console.log('Selected seats:', selectedSeats.map(s => ({ id: s.id, seatNumber: s.seatNumber })));
      console.log('Showtime ID:', showtime?.id);
      
      // Check if using demo seats (when API fails)
      const usingDemoSeats = selectedSeats.some(s => String(s.id).startsWith('demo-'));
      
      if (usingDemoSeats) {
        console.warn('⚠️ Using demo seats - API seat data not available');
        setLoading(false);
        Alert.alert(
          'Chế Độ Demo', 
          'Đang sử dụng dữ liệu ghế demo vì không lấy được thông tin ghế thực từ server.\n\nĐể sử dụng chức năng đầy đủ:\n1. Chạy backend Spring Boot\n2. Chạy populate_showtime_seats.sql trong MySQL\n3. Khởi động lại app',
          [
            { text: 'Quay Lại', style: 'cancel' },
            { 
              text: 'Tiếp Tục Demo', 
              onPress: () => {
                Alert.alert(
                  'Đặt Vé Thành Công (Demo)', 
                  'Trong thực tế, thông tin đặt vé sẽ được lưu vào database và bạn có thể xem trong mục Vé Của Tôi.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }
            }
          ]
        );
        return;
      }
      
      // Validate seat IDs are numbers (ShowtimeSeat IDs from database)
      const seatIds = [...new Set(selectedSeats.map(seat => seat.id))];
      const invalidIds = seatIds.filter(id => typeof id !== 'number' || isNaN(id));
      
      if (invalidIds.length > 0) {
        console.error('Invalid seat IDs:', invalidIds);
        Alert.alert('Error', 'Invalid seat selection. Please go back and reselect seats.');
        setLoading(false);
        return;
      }
      
      // Step 1: Prepare booking data matching backend expectations
      const bookingData = {
        showtimeId: showtime?.id,
        showtimeSeatIds: seatIds, // Array of ShowtimeSeat IDs
        totalAmount: calculateTotal(),
        combos: Object.entries(combos).map(([comboId, quantity]) => ({
          comboId: parseInt(comboId, 10),
          quantity,
        })),
      };
      
      console.log('Booking data to send:', JSON.stringify(bookingData, null, 2));
      
      if (!bookingData.showtimeId) {
        Alert.alert('Error', 'Showtime ID is missing');
        setLoading(false);
        return;
      }
      
      if (!bookingData.showtimeSeatIds || bookingData.showtimeSeatIds.length === 0) {
        Alert.alert('Error', 'Please select at least one seat');
        setLoading(false);
        return;
      }
      
      // Step 2: Create booking
      console.log('Calling bookingService.createBooking...');
      const bookingResponse = await bookingService.createBooking(bookingData);
      console.log('Booking API marker:', bookingResponse?.api);
      
      console.log('Raw response:', bookingResponse);
      console.log('Response type:', typeof bookingResponse);
      console.log('Response keys:', Object.keys(bookingResponse || {}));
      
      // Try to access ID multiple ways
      let bookingId = null;
      
      // Method 1: Direct access
      if (bookingResponse && bookingResponse.id) {
        bookingId = bookingResponse.id;
        console.log('Got ID via direct access:', bookingId);
      }
      
      // Method 2: Bracket notation
      if (!bookingId && bookingResponse && bookingResponse['id']) {
        bookingId = bookingResponse['id'];
        console.log('Got ID via bracket notation:', bookingId);
      }
      
      // Method 3: Parse from stringified version
      if (!bookingId) {
        try {
          const jsonStr = JSON.stringify(bookingResponse);
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.id) {
            bookingId = parsed.id;
            console.log('Got ID via JSON parse:', bookingId);
          }
        } catch (e) {
          console.error('Failed to parse booking response:', e);
        }
      }
      
      // Method 4: Regex fallback
      if (!bookingId) {
        try {
          const str = String(bookingResponse);
          const match = str.match(/"id":(\d+)/);
          if (match && match[1]) {
            bookingId = parseInt(match[1]);
            console.log('Got ID via regex:', bookingId);
          }
        } catch (e) {
          console.error('Regex extraction failed:', e);
        }
      }
      
      if (!bookingId) {
        console.error('No booking ID in response:', bookingResponse);
        Alert.alert('Booking Error', 'Booking created but no ID returned.');
        setLoading(false);
        navigation.goBack();
        return;
      }
      
      console.log('=== BOOKING CREATED SUCCESSFULLY, ID:', bookingId, '===');
      
      // Step 3: Create VNPAY payment URL
      Alert.alert(
        'Proceed to Payment',
        'You will be redirected to VNPAY payment gateway. After payment, return to the app to see your booking status.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setLoading(false);
              navigation.navigate('UserTabs', { screen: 'MyTickets' });
            },
          },
          {
            text: '💳 Pay Now',
            onPress: async () => {
              try {
                console.log('Creating payment URL for booking ID:', bookingId);
                const paymentUrl = await paymentService.createPaymentUrl(bookingId);
                console.log('Payment URL created:', paymentUrl);
                await paymentService.setPendingPaymentBookingId(bookingId);
                
                // Open VNPAY payment page
                await paymentService.openPaymentUrl(paymentUrl);
                setLoading(false);
                
              } catch (error) {
                console.error('Payment URL creation failed:', error);
                Alert.alert(
                  'Payment Error',
                  'Failed to create payment. Your booking is still pending. You can try again from "My Tickets".'
                );
                setLoading(false);
              }
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Booking failed:', error);
      // Show actual error message from API
      const errorMsg = error?.data || error?.message || 'Something went wrong';
      Alert.alert('Booking Failed', `${errorMsg}\n\nPlease choose different seats.`);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Movie Info Card */}
        <View style={styles.movieCard}>
          <View style={styles.movieInfo}>
            <View style={styles.movieTextInfo}>
              <Text style={styles.showtime}>
                {date.dayLabel.toUpperCase()}, {showtime.time}
              </Text>
              <Text style={styles.movieTitle}>{movieTitle}</Text>
              <Text style={styles.movieMeta}>
                {showtime.format} • {theater.name}
              </Text>
              <Text style={styles.theaterLocation}>📍 {theater.address}</Text>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editIcon}>✏️</Text>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.moviePosterContainer}>
              <View style={styles.moviePoster}>
                <Text style={styles.posterPlaceholder}>🎬</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selected Seats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Seats</Text>
          <View style={styles.seatsList}>
            {selectedSeats.map((seat, index) => (
              <View key={index} style={styles.seatBadge}>
                <Text style={styles.seatIcon}>💺</Text>
                <Text style={styles.seatText}>{seat.seatNumber || `${seat.row}${seat.col}`}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Add Snacks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add Snacks</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>🧾 View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.snacksList}>
              {foodItems.map((snack) => {
                const quantity = snacks[snack.id] || 0;
                return (
                  <View key={snack.id} style={styles.snackCard}>
                    <View style={styles.snackIconContainer}>
                      {snack.imageUrl || snack.image ? (
                        <Image
                          source={{ uri: snack.imageUrl || snack.image }}
                          style={styles.snackImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.snackIcon}>{getSnackEmoji(snack)}</Text>
                      )}
                    </View>
                    <Text style={styles.snackName}>{snack.name}</Text>
                    <Text style={styles.snackPrice}>{formatCurrency(normalizePriceVnd(snack.price))}</Text>
                    {quantity > 0 ? (
                      <View style={styles.snackQuantity}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleRemoveSnack(snack.id)}
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleAddSnack(snack.id)}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddSnack(snack.id)}
                      >
                        <Text style={styles.addButtonText}>+</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Payment Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Standard Ticket (x{selectedSeats.length})
              </Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(seatTotal)}
              </Text>
            </View>

            {Object.entries(snacks).map(([snackId, quantity]) => {
              const snack = foodItems.find(s => s.id === parseInt(snackId));
              if (!snack) return null;
              return (
                <View key={snackId} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {snack.name} (x{quantity})
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(normalizePriceVnd(snack.price) * quantity)}
                  </Text>
                </View>
              );
            })}

            {Object.entries(combos).map(([comboId, quantity]) => {
              const combo = comboItems.find(c => c.id === parseInt(comboId, 10));
              if (!combo) return null;
              return (
                <View key={`combo-${comboId}`} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {combo.name} (x{quantity})
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(normalizePriceVnd(combo.comboPrice) * quantity)}
                  </Text>
                </View>
              );
            })}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Convenience Fee</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(calculateConvenienceFee())}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8%)</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(calculateTax())}
              </Text>
            </View>

            {promoApplied && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, styles.promoLabel]}>
                  Promo Code ✓
                </Text>
                <Text style={[styles.summaryValue, styles.promoValue]}>
                  -{formatCurrency(calculatePromoDiscount())}
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(calculateTotal())}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.grandTotalContainer}>
          <Text style={styles.grandTotalLabel}>Grand Total</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(calculateTotal())}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.proceedButton, loading && styles.proceedButtonDisabled]}
          onPress={handleProceedToPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.proceedButtonText}>💳 Proceed to Payment →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  movieCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  movieInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  movieTextInfo: {
    flex: 1,
    marginRight: 12,
  },
  showtime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E50914',
    marginBottom: 8,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  movieMeta: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  theaterLocation: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  editText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  moviePosterContainer: {
    width: 80,
    height: 120,
  },
  moviePoster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholder: {
    fontSize: 32,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#E50914',
    fontWeight: '600',
  },
  seatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  seatIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  seatText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  snacksList: {
    flexDirection: 'row',
  },
  snackCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  snackIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#FFE4E6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  snackIcon: {
    fontSize: 28,
  },
  snackImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  snackName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  snackPrice: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 12,
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: '#E50914',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  snackQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#E50914',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quantityText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  summarySection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  promoLabel: {
    color: '#10B981',
  },
  promoValue: {
    color: '#10B981',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E50914',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  grandTotalLabel: {
    fontSize: 14,
    color: '#374151',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  proceedButton: {
    backgroundColor: '#E50914',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
