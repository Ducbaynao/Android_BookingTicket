import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { movieService } from '../../services/movieService';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

const MovieDetailScreen = ({ route, navigation }) => {
  const { movieId } = route.params;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMovieDetails();
  }, [movieId]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const movieData = await movieService.getMovieById(movieId);
      setMovie(movieData);
    } catch (err) {
      console.error('Error loading movie details:', err);
      setError('Unable to load movie details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading movie details...</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Movie not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Backdrop/Poster Image */}
      <View>
        {movie.backdropUrl || movie.posterUrl ? (
          <Image
            source={{ uri: movie.backdropUrl || movie.posterUrl }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderBackdrop}>
            <Text style={styles.placeholderText}>🎬</Text>
            <Text style={styles.placeholderSubtext}>No Image</Text>
          </View>
        )}
      </View>

      {/* Movie Info */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{movie.title || 'Movie Title'}</Text>

        {/* Meta Info Row */}
        <View style={styles.metaRow}>
          {movie.rating ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {movie.rating.toFixed(1)}</Text>
            </View>
          ) : null}
          {movie.duration ? (
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>⏱️ {movie.duration} min</Text>
            </View>
          ) : null}
          {movie.genre ? (
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>🎭 {movie.genre}</Text>
            </View>
          ) : null}
        </View>

        {/* Release Date */}
        {movie.releaseDate ? (
          <Text style={styles.releaseDate}>
            📅 Release Date: {new Date(movie.releaseDate).toLocaleDateString('en-US')}
          </Text>
        ) : null}

        {/* Description */}
        {movie.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 Plot Summary</Text>
            <Text style={styles.description}>{movie.description}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => {
              navigation.navigate('Showtime', { 
                movieId: movie.id,
                movieTitle: movie.title || 'Movie',
              });
            }}
          >
            <Text style={styles.primaryButtonText}>🎫 Book Tickets</Text>
          </TouchableOpacity>

          {movie.trailerUrl ? (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                // Handle trailer playback
                console.log('Play trailer:', movie.trailerUrl);
              }}
            >
              <Text style={styles.secondaryButtonText}>▶ Watch Trailer</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          {movie.status ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{movie.status}</Text>
            </View>
          ) : null}
          {movie.id ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã phim:</Text>
              <Text style={styles.infoValue}>#{movie.id}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
};

export default MovieDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F7F8FA',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  backdropImage: {
    width: width,
    height: width * 0.6,
    backgroundColor: '#E5E7EB',
  },
  placeholderBackdrop: {
    width: width,
    height: width * 0.6,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  metaBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  releaseDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  actionButtons: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  secondaryButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#DC2626',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  additionalInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});
