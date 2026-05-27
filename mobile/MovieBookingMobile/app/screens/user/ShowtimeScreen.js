import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import showtimeService from '../../services/showtimeService';

// Mock data - will be replaced with API
const MOCK_DATES = [
  { id: 1, date: '2026-04-02', dayLabel: 'Wed', dayNum: 2 },
  { id: 2, date: '2026-04-03', dayLabel: 'Thu', dayNum: 3 },
  { id: 3, date: '2026-04-04', dayLabel: 'Fri', dayNum: 4 },
  { id: 4, date: '2026-04-05', dayLabel: 'Sat', dayNum: 5 },
  { id: 5, date: '2026-04-06', dayLabel: 'Sun', dayNum: 6 },
  { id: 6, date: '2026-04-07', dayLabel: 'Mon', dayNum: 7 },
  { id: 7, date: '2026-04-08', dayLabel: 'Tue', dayNum: 8 },
];

const MOCK_THEATERS = [
  {
    id: 1,
    name: 'CGV Vincom Center',
    address: '72 Lê Thánh Tôn, District 1',
    type: 'IMAX',
    showtimes: [
      { id: 1, time: '10:30', price: 75000, format: 'STANDARD' },
      { id: 2, time: '13:15', price: 90000, format: 'IMAX' },
      { id: 3, time: '16:00', price: 75000, format: 'STANDARD' },
      { id: 4, time: '19:30', price: 90000, format: 'IMAX' },
      { id: 5, time: '22:00', price: 75000, format: 'STANDARD' },
    ],
  },
  {
    id: 2,
    name: 'Lotte Cinema Diamond Plaza',
    address: '34 Lê Duẩn, District 1',
    type: '3D',
    showtimes: [
      { id: 6, time: '11:00', price: 70000, format: 'STANDARD' },
      { id: 7, time: '14:30', price: 85000, format: '3D' },
      { id: 8, time: '17:45', price: 70000, format: 'STANDARD' },
      { id: 9, time: '21:00', price: 85000, format: '3D' },
    ],
  },
  {
    id: 3,
    name: 'BHD Star Cineplex',
    address: '3/2 Street, District 10',
    type: 'STANDARD',
    showtimes: [
      { id: 10, time: '12:15', price: 65000, format: 'STANDARD' },
      { id: 11, time: '15:30', price: 65000, format: 'STANDARD' },
      { id: 12, time: '18:45', price: 80000, format: 'GOLD CLASS' },
      { id: 13, time: '22:00', price: 65000, format: 'STANDARD' },
    ],
  },
];

const ShowtimeScreen = ({ route, navigation }) => {
  const movieId = route?.params?.movieId;
  const movieTitle = route?.params?.movieTitle || 'Movie';

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState([]);

  const pad2 = (value) => String(value).padStart(2, '0');

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    return `${year}-${month}-${day}`;
  };

  const parseApiDateTimeToLocal = (value) => {
    if (!value) {
      return new Date();
    }
    const normalized = String(value).replace(' ', 'T');
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [, y, m, d, hh, mm, ss = '00'] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
    }
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  useEffect(() => {
    initializeDates();
  }, [movieId]);

  useEffect(() => {
    if (selectedDate && movieId) {
      loadShowtimes();
    }
  }, [selectedDate, movieId]);

  const initializeDates = () => {
    // Generate next 7 days
    const dateArray = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dateArray.push({
        id: i + 1,
        date: formatLocalDate(date),
        dayLabel: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNum: date.getDate(),
      });
    }
    setDates(dateArray);
    setSelectedDate(dateArray[0]); // Select today by default
  };

  const loadShowtimes = async () => {
    try {
      setLoading(true);
      console.log('Loading showtimes for movie:', movieId, 'date:', selectedDate?.date);
      
      const showtimesData = await showtimeService.getShowtimes({ 
        movieId: movieId,
        date: selectedDate?.date  // Add date filter
      });
      
      console.log('Loaded showtimes:', showtimesData);
      setShowtimes(showtimesData);
      
      // Group showtimes by theater
      const theaterMap = {};
      showtimesData.forEach(showtime => {
        const cinemaName = showtime.room?.cinema?.name || 'Unknown Theater';
        const cinemaId = showtime.room?.cinema?.id;
        
        if (!theaterMap[cinemaId]) {
          theaterMap[cinemaId] = {
            id: cinemaId,
            name: cinemaName,
            address: showtime.room?.cinema?.address || 'Unknown Address',
            type: 'STANDARD',
            showtimes: []
          };
        }
        
        theaterMap[cinemaId].showtimes.push({
          id: showtime.id,
          time: parseApiDateTimeToLocal(showtime.startTime).toLocaleTimeString('en', {
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          price: showtime.basePrice,
          format: 'STANDARD',
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          movieId: showtime.movie?.id,
          roomId: showtime.room?.id,
        });
      });
      
      setTheaters(Object.values(theaterMap));
      
    } catch (error) {
      console.error('Error loading showtimes:', error);
      Alert.alert('Error', 'Failed to load showtimes');
      // Fallback to empty array
      setTheaters([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleSelectSeats = () => {
    if (!selectedShowtime || !selectedTheater) {
      Alert.alert('Missing Selection', 'Please select a showtime');
      return;
    }

    navigation.navigate('SeatSelection', {
      movieId,
      movieTitle,
      theater: selectedTheater,
      showtime: selectedShowtime,
      date: selectedDate,
    });
  };

  const handleShowtimePress = (theater, showtime) => {
    setSelectedTheater(theater);
    setSelectedShowtime(showtime);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Date Selection */}
        <View style={styles.dateSection}>
          <Text style={styles.monthLabel}>April 2026</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateContainer}>
              {dates.map((date) => (
                <TouchableOpacity
                  key={date.id}
                  style={[
                    styles.dateCard,
                    selectedDate?.id === date.id && styles.dateCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedShowtime(null);
                    setSelectedTheater(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      selectedDate.id === date.id && styles.dayLabelSelected,
                    ]}
                  >
                    {date.dayLabel}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      selectedDate.id === date.id && styles.dayNumSelected,
                    ]}
                  >
                    {date.dayNum}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Theater List */}
        <View style={styles.theaterList}>
          {loading ? (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={{marginTop: 10, fontSize: 16, color: '#666'}}>Loading showtimes...</Text>
            </View>
          ) : theaters.length === 0 ? (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
              <Text style={{fontSize: 16, color: '#666'}}>No showtimes available for this movie</Text>
            </View>
          ) : (
            theaters.map((theater) => (
            <View key={theater.id} style={styles.theaterCard}>
              {/* Theater Header */}
              <View style={styles.theaterHeader}>
                <View style={styles.theaterInfo}>
                  <Text style={styles.theaterName}>{theater.name}</Text>
                  <View style={styles.addressRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.theaterAddress}>{theater.address}</Text>
                  </View>
                  {theater.type !== 'STANDARD' && (
                    <View style={styles.typeRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{theater.type}</Text>
                      </View>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.favoriteButton}>
                  <Text style={styles.favoriteIcon}>🤍</Text>
                </TouchableOpacity>
              </View>

              {/* Showtimes */}
              <View style={styles.showtimesContainer}>
                {theater.showtimes.map((showtime) => {
                  const isSelected =
                    selectedShowtime?.id === showtime.id &&
                    selectedTheater?.id === theater.id;

                  return (
                    <TouchableOpacity
                      key={showtime.id}
                      style={[
                        styles.showtimeButton,
                        isSelected && styles.showtimeButtonSelected,
                      ]}
                      onPress={() => handleShowtimePress(theater, showtime)}
                    >
                      <Text
                        style={[
                          styles.showtimeTime,
                          isSelected && styles.showtimeTimeSelected,
                        ]}
                      >
                        {showtime.time}
                      </Text>
                      <Text
                        style={[
                          styles.showtimePrice,
                          isSelected && styles.showtimePriceSelected,
                        ]}
                      >
                        {formatCurrency(showtime.price)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Format Info */}
              {theater.showtimes.some((s) => s.format !== 'STANDARD') && (
                <View style={styles.formatInfo}>
                  <Text style={styles.formatLabel}>
                    Format: {theater.showtimes[0].format}
                  </Text>
                </View>
              )}
            </View>
          ))
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.selectSeatsButton,
            (!selectedShowtime || !selectedTheater) && styles.selectSeatsButtonDisabled,
          ]}
          onPress={handleSelectSeats}
          disabled={!selectedShowtime || !selectedTheater}
        >
          <Text style={styles.selectSeatsButtonText}>Select Seats →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ShowtimeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  dateSection: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  dateCard: {
    width: 60,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  dayLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayLabelSelected: {
    color: '#FFFFFF',
  },
  dayNum: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayNumSelected: {
    color: '#FFFFFF',
  },
  theaterList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  theaterCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  theaterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  theaterInfo: {
    flex: 1,
  },
  theaterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  theaterAddress: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  typeRow: {
    flexDirection: 'row',
  },
  typeBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  showtimesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  showtimeButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  showtimeButtonSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  showtimeTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  showtimeTimeSelected: {
    color: '#FFFFFF',
  },
  showtimePrice: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  showtimePriceSelected: {
    color: '#FFFFFF',
  },
  formatInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  formatLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  selectSeatsButton: {
    backgroundColor: '#E50914',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectSeatsButtonDisabled: {
    backgroundColor: '#374151',
  },
  selectSeatsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
