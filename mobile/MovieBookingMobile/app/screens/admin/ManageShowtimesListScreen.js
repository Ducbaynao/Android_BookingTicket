import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { cinemaService, roomService, showtimeService } from '../../services/showtimeService';

const ManageShowtimesListScreen = ({ navigation }) => {
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showtimesByRoom, setShowtimesByRoom] = useState({});
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCinemas();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedCinemaId) {
        loadShowtimeData(selectedCinemaId, selectedDate, false);
      }
    }, [selectedCinemaId, selectedDate])
  );

  const formatDateParam = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (date) =>
    date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatTime = (dateTime) =>
    parseApiDateTimeToLocal(dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const getMinutesInDay = (dateTime) => {
    const date = parseApiDateTimeToLocal(dateTime);
    return (date.getHours() * 60) + date.getMinutes();
  };

  const loadCinemas = async () => {
    try {
      setLoading(true);
      const cinemaList = await cinemaService.getAllCinemas();
      const normalized = Array.isArray(cinemaList) ? cinemaList : [];
      setCinemas(normalized);

      if (normalized.length > 0) {
        const firstCinemaId = String(normalized[0].id);
        setSelectedCinemaId(firstCinemaId);
        setSelectedRoomId('ALL');
        await loadShowtimeData(firstCinemaId, selectedDate, false);
      } else {
        setRooms([]);
        setShowtimesByRoom({});
        setSelectedRoomId('ALL');
      }
    } catch (error) {
      console.error('Error loading cinemas:', error);
      Alert.alert('Error', 'Failed to load cinemas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadShowtimeData = async (cinemaId, date, showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const showtimeList = await showtimeService.getAllShowtimes({
        cinemaId,
        date: formatDateParam(date),
      });
      const normalizedShowtimes = Array.isArray(showtimeList) ? showtimeList : [];

      let normalizedRooms = [];
      try {
        const roomList = await roomService.getRoomsByCinema(cinemaId);
        normalizedRooms = Array.isArray(roomList) ? roomList : [];
      } catch (roomError) {
        const allCinemaShowtimes = await showtimeService.getAllShowtimes({ cinemaId });
        const roomMap = new Map();
        const sourceShowtimes = Array.isArray(allCinemaShowtimes) ? allCinemaShowtimes : [];
        sourceShowtimes.forEach((showtime) => {
          const room = showtime?.room;
          if (room?.id && !roomMap.has(String(room.id))) {
            roomMap.set(String(room.id), room);
          }
        });
        normalizedRooms = Array.from(roomMap.values());
      }

      const grouped = normalizedRooms.reduce((acc, room) => {
        const roomShowtimes = normalizedShowtimes
          .filter((showtime) => String(showtime?.room?.id) === String(room.id))
          .sort((a, b) => {
            const minuteDiff = getMinutesInDay(a.startTime) - getMinutesInDay(b.startTime);
            if (minuteDiff !== 0) {
              return minuteDiff;
            }
            return parseApiDateTimeToLocal(a.startTime) - parseApiDateTimeToLocal(b.startTime);
          });
        acc[String(room.id)] = roomShowtimes;
        return acc;
      }, {});

      setRooms(normalizedRooms);
      if (
        selectedRoomId !== 'ALL' &&
        normalizedRooms.every((room) => String(room.id) !== String(selectedRoomId))
      ) {
        setSelectedRoomId('ALL');
      }
      setShowtimesByRoom(grouped);
    } catch (error) {
      console.error('Error loading showtime data:', error);
      Alert.alert('Error', 'Failed to load showtimes');
      setRooms([]);
      setShowtimesByRoom({});
      setSelectedRoomId('ALL');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCinemaChange = async (cinemaId) => {
    setSelectedCinemaId(cinemaId);
    setSelectedRoomId('ALL');
    await loadShowtimeData(cinemaId, selectedDate, true);
  };

  const handleDateChange = async (_, pickedDate) => {
    setShowDatePicker(false);
    if (!pickedDate) {
      return;
    }
    setSelectedDate(pickedDate);
    if (selectedCinemaId) {
      await loadShowtimeData(selectedCinemaId, pickedDate, true);
    }
  };

  const handleDeleteShowtime = (showtime) => {
    Alert.alert('Delete Showtime', 'Are you sure you want to delete this showtime?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await showtimeService.deleteShowtime(showtime.id);
            await loadShowtimeData(selectedCinemaId, selectedDate, false);
            Alert.alert('Success', 'Showtime deleted successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete showtime');
          }
        },
      },
    ]);
  };

  const renderShowtimeChip = (showtime) => (
    <View key={showtime.id} style={styles.showtimeChip}>
      <View style={styles.showtimeChipInfo}>
        <Text style={styles.showtimeTime}>
          {formatTime(showtime.startTime)} - {formatTime(showtime.endTime)}
        </Text>
        <Text style={styles.showtimeMovie} numberOfLines={1}>
          {showtime.movie?.title || 'Unknown Movie'}
        </Text>
        <Text style={styles.showtimePrice}>{showtime.basePrice?.toLocaleString('vi-VN')} đ</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ManageShowtimeForm', { showtimeId: showtime.id })}
        >
          <Icon name="pencil" size={18} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteShowtime(showtime)}>
          <Icon name="delete" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRoomItem = ({ item: room }) => {
    const roomShowtimes = showtimesByRoom[String(room.id)] || [];
    return (
      <View style={styles.roomCard}>
        <Text style={styles.roomTitle}>Room {room.name}</Text>
        {roomShowtimes.length > 0 ? (
          roomShowtimes.map(renderShowtimeChip)
        ) : (
          <Text style={styles.noShowtimesText}>No showtimes for this room on selected date</Text>
        )}
      </View>
    );
  };

  const roomsToRender =
    selectedRoomId === 'ALL'
      ? rooms
      : rooms.filter((room) => String(room.id) === String(selectedRoomId));

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Cinema</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCinemaId}
              onValueChange={(value) => {
                if (value) {
                  handleCinemaChange(String(value));
                }
              }}
              style={styles.picker}
            >
              {cinemas.map((cinema) => (
                <Picker.Item key={cinema.id} label={cinema.name} value={String(cinema.id)} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{formatDateLabel(selectedDate)}</Text>
            <Icon name="calendar" size={18} color="#E50914" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Room</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRoomId}
              onValueChange={(value) => setSelectedRoomId(String(value))}
              style={styles.picker}
            >
              <Picker.Item label="All rooms" value="ALL" />
              {rooms.map((room) => (
                <Picker.Item key={room.id} label={`Room ${room.name}`} value={String(room.id)} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} />
      )}

      <FlatList
        data={roomsToRender}
        renderItem={renderRoomItem}
        keyExtractor={(room) => String(room.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              if (selectedCinemaId) {
                loadShowtimeData(selectedCinemaId, selectedDate, false);
              } else {
                loadCinemas();
              }
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No rooms found for this cinema</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fabButton} onPress={() => navigation.navigate('ManageShowtimeForm')}>
        <Icon name="plus" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  roomCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  showtimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  showtimeChipInfo: {
    flex: 1,
    marginRight: 10,
  },
  showtimeTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  showtimeMovie: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  showtimePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  noShowtimesText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default ManageShowtimesListScreen;
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
