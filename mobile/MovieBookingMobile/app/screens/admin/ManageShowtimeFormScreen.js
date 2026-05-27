import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { movieService } from '../../services/movieService';
import { cinemaService, roomService, showtimeService } from '../../services/showtimeService';

const pad2 = (value) => String(value).padStart(2, '0');

const toLocalDateTimeString = (date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};

const parseApiDateTimeToLocal = (value) => {
  if (!value) {
    return new Date();
  }
  if (value instanceof Date) {
    return value;
  }

  const normalized = String(value).replace(' ', 'T');
  const localMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (localMatch) {
    const [, y, m, d, hh, mm, ss = '00'] = localMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const ManageShowtimeFormScreen = ({ navigation, route }) => {
  const { showtimeId } = route.params || {};
  const isEditing = !!showtimeId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [formData, setFormData] = useState({
    movieId: '',
    cinemaId: '',
    roomId: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
    basePrice: '50000',
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load movies and cinemas
      const [moviesData, cinemasData] = await Promise.all([
        movieService.getAllMovies(),
        cinemaService.getAllCinemas(),
      ]);

      setMovies(moviesData.movies || []);
      setCinemas(cinemasData || []);

      // If editing, load showtime data
      if (isEditing) {
        const showtime = await showtimeService.getShowtimeById(showtimeId);
        const nextCinemaId = showtime.room?.cinema?.id?.toString() || '';
        const roomList = nextCinemaId ? await roomService.getRoomsByCinema(nextCinemaId) : [];
        setRooms(Array.isArray(roomList) ? roomList : []);

        setFormData({
          movieId: showtime.movie?.id?.toString() || '',
          cinemaId: nextCinemaId,
          roomId: showtime.room?.id?.toString() || '',
          startTime: parseApiDateTimeToLocal(showtime.startTime),
          endTime: parseApiDateTimeToLocal(showtime.endTime),
          basePrice: showtime.basePrice?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.movieId) {
      newErrors.movieId = 'Please select a movie';
    }

    if (!formData.cinemaId) {
      newErrors.cinemaId = 'Please select a cinema';
    }

    if (!formData.roomId) {
      newErrors.roomId = 'Please select a room';
    }

    if (!formData.basePrice || isNaN(formData.basePrice) || parseFloat(formData.basePrice) <= 0) {
      newErrors.basePrice = 'Please enter valid price';
    }

    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        movie: { id: parseInt(formData.movieId) },
        room: { id: parseInt(formData.roomId) },
        startTime: toLocalDateTimeString(formData.startTime),
        endTime: toLocalDateTimeString(formData.endTime),
        basePrice: parseFloat(formData.basePrice),
      };

      if (isEditing) {
        await showtimeService.updateShowtime(showtimeId, payload);
        Alert.alert('Success', 'Showtime updated successfully');
      } else {
        await showtimeService.createShowtime(payload);
        Alert.alert('Success', 'Showtime created successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving showtime:', error);
      const message =
        error?.data?.message ||
        error?.message ||
        `Failed to ${isEditing ? 'update' : 'create'} showtime`;
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const mergeDate = (base, picked) => {
    const next = new Date(base);
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    return next;
  };

  const mergeTime = (base, picked) => {
    const next = new Date(base);
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    return next;
  };

  const handleCinemaChange = async (cinemaId) => {
    setFormData((prev) => ({ ...prev, cinemaId, roomId: '' }));
    setErrors((prev) => ({ ...prev, cinemaId: null, roomId: null }));
    if (!cinemaId) {
      setRooms([]);
      return;
    }
    try {
      const roomList = await roomService.getRoomsByCinema(cinemaId);
      setRooms(Array.isArray(roomList) ? roomList : []);
    } catch (error) {
      setRooms([]);
      Alert.alert('Error', 'Failed to load rooms');
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Movie Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Movie <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.pickerContainer, errors.movieId && styles.inputError]}>
          <Picker
            selectedValue={formData.movieId}
            onValueChange={(value) => updateField('movieId', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select a movie" value="" />
            {movies.map((movie) => (
              <Picker.Item key={movie.id} label={movie.title} value={movie.id.toString()} />
            ))}
          </Picker>
        </View>
        {errors.movieId && <Text style={styles.errorText}>{errors.movieId}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Cinema <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.pickerContainer, errors.cinemaId && styles.inputError]}>
          <Picker selectedValue={formData.cinemaId} onValueChange={handleCinemaChange} style={styles.picker}>
            <Picker.Item label="Select a cinema" value="" />
            {cinemas.map((cinema) => (
              <Picker.Item key={cinema.id} label={cinema.name} value={String(cinema.id)} />
            ))}
          </Picker>
        </View>
        {errors.cinemaId && <Text style={styles.errorText}>{errors.cinemaId}</Text>}
      </View>

      {/* Room Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Room <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.pickerContainer, errors.roomId && styles.inputError]}>
          <Picker
            selectedValue={formData.roomId}
            onValueChange={(value) => updateField('roomId', value)}
            style={styles.picker}
            enabled={!!formData.cinemaId}
          >
            <Picker.Item label={formData.cinemaId ? 'Select a room' : 'Select cinema first'} value="" />
            {rooms.map((room) => (
              <Picker.Item key={room.id} label={`Room ${room.name}`} value={String(room.id)} />
            ))}
          </Picker>
        </View>
        {errors.roomId && <Text style={styles.errorText}>{errors.roomId}</Text>}
      </View>

      {/* Start Time */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Start Time <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {formData.startTime.toLocaleString('vi-VN')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallDateButton} onPress={() => setShowStartDatePicker(true)}>
          <Text style={styles.smallDateButtonText}>Choose Date</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallDateButton} onPress={() => setShowStartTimePicker(true)}>
          <Text style={styles.smallDateButtonText}>Choose Time</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={formData.startTime}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                updateField('startTime', mergeDate(formData.startTime, selectedDate));
              }
            }}
          />
        )}
        {showStartTimePicker && (
          <DateTimePicker
            value={formData.startTime}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartTimePicker(false);
              if (selectedDate) {
                updateField('startTime', mergeTime(formData.startTime, selectedDate));
              }
            }}
          />
        )}
      </View>

      {/* End Time */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          End Time <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {formData.endTime.toLocaleString('vi-VN')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallDateButton} onPress={() => setShowEndDatePicker(true)}>
          <Text style={styles.smallDateButtonText}>Choose Date</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallDateButton} onPress={() => setShowEndTimePicker(true)}>
          <Text style={styles.smallDateButtonText}>Choose Time</Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePicker
            value={formData.endTime}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                updateField('endTime', mergeDate(formData.endTime, selectedDate));
              }
            }}
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={formData.endTime}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndTimePicker(false);
              if (selectedDate) {
                updateField('endTime', mergeTime(formData.endTime, selectedDate));
              }
            }}
          />
        )}
        {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
      </View>

      {/* Base Price */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Base Price (VND) <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.basePrice && styles.inputError]}
          value={formData.basePrice}
          onChangeText={(value) => updateField('basePrice', value)}
          placeholder="50000"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
        {errors.basePrice && <Text style={styles.errorText}>{errors.basePrice}</Text>}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Update Showtime' : 'Create Showtime'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
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
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#111827',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  smallDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallDateButtonText: {
    color: '#3730A3',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default ManageShowtimeFormScreen;
