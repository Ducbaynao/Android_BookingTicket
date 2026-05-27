import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { movieService, genreService } from '../../services/movieService';

const RATINGS = [
  { label: 'All', value: 0 },
  { label: '7+', value: 7 },
  { label: '8+', value: 8 },
  { label: '9+', value: 9 },
];

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    loadAllMovies();
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const genreList = await genreService.getAllGenres();
      setGenres(genreList);
    } catch (err) {
      console.error('Error loading genres:', err);
      // Fallback to hardcoded genres if API fails
      setGenres(['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation']);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      performSearch();
    }, 500); // Debounce 500ms

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, selectedGenre, selectedRating]);

  const loadAllMovies = async () => {
    try {
      setLoading(true);
      const response = await movieService.getAllMovies();
      setMovies(response.movies || []);
      setFilteredMovies(response.movies || []);
    } catch (err) {
      console.error('Error loading movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      let results = [];

      // If search query exists, search by keyword
      if (searchQuery.trim()) {
        const response = await movieService.searchMovies(searchQuery.trim());
        results = response.movies || [];
      } else if (selectedGenre !== 'All') {
        // If no search but genre selected, filter by genre
        const response = await movieService.getMoviesByGenre(selectedGenre);
        results = response.movies || [];
      } else {
        // Otherwise get all movies
        const response = await movieService.getAllMovies();
        results = response.movies || [];
      }

      // Apply local filters for rating
      if (selectedRating > 0) {
        results = results.filter(movie => movie.rating && movie.rating >= selectedRating);
      }

      // Apply local genre filter if searching by keyword
      if (searchQuery.trim() && selectedGenre !== 'All') {
        results = results.filter(movie => 
          movie.genre && movie.genre.toLowerCase().includes(selectedGenre.toLowerCase())
        );
      }

      setFilteredMovies(results);
    } catch (err) {
      console.error('Error searching movies:', err);
      setFilteredMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedRating(0);
  };

  const openMovieDetail = (movieId) => {
    if (!movieId) return;
    movieService.selectMovieForRecommendation(movieId).catch(() => {});
    navigation.navigate('MovieDetail', { movieId });
  };

  const renderGenreChip = (genre) => {
    const isSelected = selectedGenre === genre;
    return (
      <TouchableOpacity
        key={genre}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setSelectedGenre(genre)}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {genre}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRatingChip = (rating) => {
    const isSelected = selectedRating === rating.value;
    return (
      <TouchableOpacity
        key={rating.value}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setSelectedRating(rating.value)}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          ⭐ {rating.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMovieCard = ({ item }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => openMovieDetail(item.id)}
    >
      {item.posterUrl ? (
        <Image
          source={{ uri: item.posterUrl }}
          style={styles.moviePoster}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderPoster}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.movieMeta}>
          {item.genre && (
            <Text style={styles.genreText} numberOfLines={1}>
              {item.genre}
            </Text>
          )}
          {(item.rating !== null && item.rating !== undefined) && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {(item.duration !== null && item.duration !== undefined) && (
          <Text style={styles.durationText}>{item.duration} mins</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>
            {showFilters ? '▲ Filters' : '▼ Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Section */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterSection}
          >
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Genre:</Text>
              <View style={styles.chipContainer}>
                {renderGenreChip('All')}
                {genres.map(renderGenreChip)}
              </View>
            </View>
          </ScrollView>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterSection}
          >
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Rating:</Text>
              <View style={styles.chipContainer}>
                {RATINGS.map(renderRatingChip)}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={handleClearSearch}
          >
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {loading ? 'Searching...' : `${filteredMovies.length} movies found`}
        </Text>
      </View>

      {/* Results List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : filteredMovies.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.emptyText}>No movies found</Text>
          <Text style={styles.emptySubtext}>
            Try different search terms or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMovies}
          renderItem={renderMovieCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.movieList}
        />
      )}
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    paddingHorizontal: 8,
  },
  filterButton: {
    backgroundColor: '#E50914',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterSection: {
    maxHeight: 80,
  },
  filterGroup: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#E50914',
  },
  chipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#E50914',
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  movieList: {
    padding: 8,
  },
  movieCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moviePoster: {
    width: '100%',
    height: 240,
    backgroundColor: '#E5E7EB',
  },
  placeholderPoster: {
    width: '100%',
    height: 240,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    height: 40,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  genreText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  durationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
