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
import { movieService, genreService } from '../../services/movieService';

const ManageMovieFormScreen = ({ navigation, route }) => {
  const { movieId } = route.params || {};
  const isEditing = !!movieId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    duration: '',
    rating: '',
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    releaseDate: '',
    status: 'SHOWING',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      loadMovieData();
    }
  }, [movieId]);

  const loadMovieData = async () => {
    try {
      setLoading(true);
      const movie = await movieService.getMovieById(movieId);
      setFormData({
        title: movie.title || '',
        description: movie.description || '',
        genre: movie.genre || '',
        duration: movie.duration?.toString() || '',
        rating: movie.rating?.toString() || '',
        posterUrl: movie.posterUrl || '',
        backdropUrl: movie.backdropUrl || '',
        trailerUrl: movie.trailerUrl || '',
        releaseDate: movie.releaseDate || '',
        status: movie.status || 'SHOWING',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load movie data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.duration || isNaN(formData.duration) || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Valid duration is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
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
        ...formData,
        duration: parseInt(formData.duration),
        rating: formData.rating ? parseFloat(formData.rating) : null,
      };

      if (isEditing) {
        await movieService.updateMovie(movieId, payload);
        Alert.alert('Success', 'Movie updated successfully');
      } else {
        await movieService.createMovie(payload);
        Alert.alert('Success', 'Movie created successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving movie:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} movie`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
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
      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={formData.title}
          onChangeText={(value) => updateField('title', value)}
          placeholder="Enter movie title"
          placeholderTextColor="#9CA3AF"
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          value={formData.description}
          onChangeText={(value) => updateField('description', value)}
          placeholder="Enter movie description"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      {/* Genre */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Genre</Text>
        <TextInput
          style={styles.input}
          value={formData.genre}
          onChangeText={(value) => updateField('genre', value)}
          placeholder="e.g., Action, Drama"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Duration & Rating */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>
            Duration (min) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.duration && styles.inputError]}
            value={formData.duration}
            onChangeText={(value) => updateField('duration', value)}
            placeholder="120"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
          {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
        </View>

        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>Rating (0-10)</Text>
          <TextInput
            style={styles.input}
            value={formData.rating}
            onChangeText={(value) => updateField('rating', value)}
            placeholder="8.5"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Status */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Status <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.statusContainer}>
          {['SHOWING', 'COMING_SOON', 'ENDED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                formData.status === status && styles.statusButtonActive,
              ]}
              onPress={() => updateField('status', status)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  formData.status === status && styles.statusButtonTextActive,
                ]}
              >
                {status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Poster URL */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Poster URL</Text>
        <TextInput
          style={styles.input}
          value={formData.posterUrl}
          onChangeText={(value) => updateField('posterUrl', value)}
          placeholder="https://example.com/poster.jpg"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
        />
      </View>

      {/* Backdrop URL */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Backdrop URL</Text>
        <TextInput
          style={styles.input}
          value={formData.backdropUrl}
          onChangeText={(value) => updateField('backdropUrl', value)}
          placeholder="https://example.com/backdrop.jpg"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
        />
      </View>

      {/* Trailer URL */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Trailer URL</Text>
        <TextInput
          style={styles.input}
          value={formData.trailerUrl}
          onChangeText={(value) => updateField('trailerUrl', value)}
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
        />
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
            {isEditing ? 'Update Movie' : 'Create Movie'}
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
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#FFF',
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

export default ManageMovieFormScreen;
