import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { movieService, genreService } from '../../services/movieService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with margins
const RATINGS = [
  { label: 'All', value: 0 },
  { label: '7+', value: 7 },
  { label: '8+', value: 8 },
  { label: '9+', value: 9 },
];

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for testing (temporarily replace API calls)
  const mockMovies = [
    {
      id: 1,
      title: 'Avengers: Endgame',
      genre: 'Action, Adventure',
      rating: 8.4,
      posterUrl: null
    },
    {
      id: 2,
      title: 'Spider-Man: No Way Home',
      genre: 'Action, Adventure',
      rating: 8.7,
      posterUrl: null
    },
    {
      id: 3,
      title: 'The Batman',
      genre: 'Action, Crime',
      rating: 7.8,
      posterUrl: null
    },
    {
      id: 4,
      title: 'Top Gun: Maverick',
      genre: 'Action, Drama',
      rating: 8.3,
      posterUrl: null
    }
  ];

  useEffect(() => {
    console.log('HomeScreen mounted, loading movies...');
    loadMovies();
    loadGenres();
  }, []);

  useEffect(() => {
    const filtered = applyFilters(movies, searchQuery, selectedGenres, selectedRating);
    const hasFilters = !!searchQuery.trim() || selectedGenres.length > 0 || selectedRating > 0;
    setSearchResults(filtered);
    setIsSearchMode(hasFilters);
  }, [movies, searchQuery, selectedGenres, selectedRating]);

  const loadMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading all movies...');
      
      const response = await movieService.getAllMovies();
      console.log('Movies API response:', response);
      
      // Handle different response formats
      let movieData = [];
      if (Array.isArray(response)) {
        movieData = response;
      } else if (response.movies) {
        movieData = response.movies;
      } else if (response.data) {
        movieData = response.data;
      }
      
      console.log('Processed movies:', movieData.length, 'items');
      setMovies(movieData);
      
    } catch (err) {
      console.error('Error loading movies:', err);
      setError(err);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data...');
      setMovies(mockMovies);
    } finally {
      setLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      const genreResponse = await genreService.getAllGenres();
      const rawGenres = Array.isArray(genreResponse?.genres)
        ? genreResponse.genres
        : Array.isArray(genreResponse)
          ? genreResponse
          : [];
      const genreNames = rawGenres
        .map((g) => (typeof g === 'string' ? g : g?.name))
        .filter(Boolean);
      setGenres(genreNames);
    } catch (err) {
      console.error('Error loading genres:', err);
      setGenres(['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation']);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadMovies();
    await loadGenres();
    setRefreshing(false);
  };

  // Search functionality - search in both API movies and local results
  const [searchResults, setSearchResults] = useState([]);

  const applyFilters = (list, query, genresSelected, rating) => {
    return list.filter(movie => {
      const movieTitle = movie.title?.toLowerCase() || '';
      const movieGenre = [
        movie.genre,
        ...(Array.isArray(movie.genres) ? movie.genres : []),
      ]
        .filter(Boolean)
        .join(', ')
        .toLowerCase();
      const queryMatch = !query.trim() || movieTitle.includes(query.toLowerCase()) || movieGenre.includes(query.toLowerCase());
      const genreMatch = genresSelected.length === 0
        || genresSelected.every((genre) => movieGenre.includes(String(genre).toLowerCase()));
      const ratingMatch = rating <= 0 || (movie.rating && Number(movie.rating) >= rating);
      return queryMatch && genreMatch && ratingMatch;
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const renderGenreChip = (genre) => {
    const isAllChip = genre === 'All';
    const isSelected = isAllChip ? selectedGenres.length === 0 : selectedGenres.includes(genre);
    return (
      <TouchableOpacity
        key={genre}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => {
          if (isAllChip) {
            setSelectedGenres([]);
            return;
          }
          setSelectedGenres((prev) =>
            prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
          );
        }}
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

  const handleMoviePress = (movie) => {
    movieService.selectMovieForRecommendation(movie.id).catch(() => {});
    navigation.navigate('MovieDetail', { movieId: movie.id, movie });
  };

  const handleRetry = () => {
    loadMovies();
    loadGenres();
  };

  const currentMovies = isSearchMode ? searchResults : movies;
  const currentLoading = loading; // Remove searchLoading since we don't have it
  const currentError = error; // Remove searchError since we don't have it

  const renderMovieCard = ({ item: movie }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => handleMoviePress(movie)}
      activeOpacity={0.8}
    >
      <View style={styles.posterContainer}>
        {movie.posterUrl ? (
          <Image
            source={{ uri: movie.posterUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderPoster}>
            <Icon name="movie" size={40} color="#666" />
          </View>
        )}
      </View>
      
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {movie.title || 'Untitled Movie'}
        </Text>
        
        <View style={styles.movieMeta}>
          {movie.genre ? (
            <Text style={styles.movieGenre} numberOfLines={1}>
              {movie.genre}
            </Text>
          ) : null}
          
          {movie.rating ? (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#DC2626" />
              <Text style={styles.rating}>{Number(movie.rating).toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => handleMoviePress(movie)}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="theaters" size={64} color="#DC2626" />
          <Text style={styles.emptyTitle}>
            {isSearchMode ? 'No movies found' : 'No movies yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isSearchMode 
              ? 'No results for current search/filter'
              : 'Movies will appear here when available'
            }
          </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color="#DC2626" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>
        {currentError?.message || 'Failed to load movies'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (currentLoading && currentMovies.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon name="movie" size={32} color="#DC2626" />
            <Text style={styles.headerTitle}>Movie Hot</Text>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton}>
            <Icon name="search" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>
            {showFilters ? '▲ Filters' : '▼ Filters'}
          </Text>
        </TouchableOpacity>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="movie" size={32} color="#DC2626" />
          <Text style={styles.headerTitle}>Movie Hot</Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterButtonText}>
          {showFilters ? '▲ Filters' : '▼ Filters'}
        </Text>
      </TouchableOpacity>

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

        </View>
      )}

      {currentError ? (
        renderErrorState()
      ) : currentMovies.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={currentMovies}
          renderItem={renderMovieCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={['#DC2626']}
              tintColor="#DC2626"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  searchButton: {
    padding: 4,
  },
  filterButton: {
    backgroundColor: '#DC2626',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSection: {
    maxHeight: 78,
  },
  filterGroup: {
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: 13,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#DC2626',
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  movieCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    height: 320, // Fixed height for consistency
  },
  posterContainer: {
    width: '100%',
    height: 200, // Fixed poster height
    backgroundColor: '#F3F4F6',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  placeholderPoster: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  movieInfo: {
    padding: 12,
    flex: 1, // Take remaining space (120px = 320 - 200)
    justifyContent: 'space-between',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  movieMeta: {
    flex: 1,
  },
  movieGenre: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 2,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  // Error state
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
