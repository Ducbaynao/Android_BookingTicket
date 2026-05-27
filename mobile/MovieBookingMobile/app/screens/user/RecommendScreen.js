import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { movieService } from '../../services/movieService';

const FALLBACK_POSTER = 'https://via.placeholder.com/400x600?text=Movie';

const normalizeRecommendations = (payload) => {
  if (Array.isArray(payload?.movies)) return payload.movies;
  if (Array.isArray(payload)) return payload;
  return [];
};

const RecommendScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenreId, setSelectedGenreId] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadRecommendations = useCallback(async () => {
    try {
      const recommendationResponse = await movieService.getRecommendedMovies(10);
      const recommendationItems = normalizeRecommendations(recommendationResponse);

      if (!recommendationItems.length) {
        setMovies([]);
        return;
      }

      const detailResults = await Promise.all(
        recommendationItems.map(async (item) => {
          try {
            const detail = await movieService.getMovieById(item.movieId);
            return {
              ...item,
              ...detail,
              id: item.movieId,
            };
          } catch {
            return {
              ...item,
              id: item.movieId,
            };
          }
        })
      );

      setMovies(detailResults);
    } catch (error) {
      setMovies([]);
      setErrorMessage(error?.message || 'Failed to load recommendations');
    }
  }, []);

  const loadScreenData = useCallback(
    async (showFullLoader = false) => {
      try {
        if (showFullLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        setErrorMessage('');

        const genresResponse = await movieService.getRecommendationGenres();
        setGenres(Array.isArray(genresResponse?.genres) ? genresResponse.genres : []);
        await loadRecommendations();
      } catch (error) {
        setErrorMessage(error?.message || 'Failed to load recommendation data');
      } finally {
        if (showFullLoader) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [loadRecommendations]
  );

  useEffect(() => {
    loadScreenData(true);
  }, [loadScreenData]);

  useFocusEffect(
    useCallback(() => {
      loadScreenData(false);
    }, [loadScreenData])
  );

  const filteredMovies = useMemo(() => {
    if (selectedGenreId === 'all') {
      return [...movies];
    }
    const selectedGenre = genres.find((g) => String(g.id) === String(selectedGenreId));
    const selectedName = String(selectedGenre?.name || '').toLowerCase();
    return movies.filter((movie) => String(movie?.genre || '').toLowerCase().includes(selectedName));
  }, [movies, selectedGenreId, genres]);

  const featuredMovie = filteredMovies[0];
  const recommendedList = filteredMovies.slice(1);

  const getMatchPercent = (movie) => {
    const score = Number(movie?.score || 0);
    if (score <= 0) return 70;
    return Math.max(70, Math.min(99, Math.round(score * 100)));
  };

  const formatDuration = (duration) => {
    const mins = Number(duration || 0);
    if (!mins) return 'N/A';
    const hours = Math.floor(mins / 60);
    const remain = mins % 60;
    return `${hours}h${remain ? `${remain}m` : ''}`;
  };

  const openMovieDetail = (movie) => {
    movieService.selectMovieForRecommendation(movie.id).catch(() => {});
    navigation.navigate('MovieDetail', { movieId: movie.id, movie });
  };

  const handleGenrePress = async (genreId) => {
    try {
      setSelectedGenreId(genreId);
      if (genreId === 'all') {
        await loadRecommendations();
        return;
      }
      await movieService.selectRecommendationGenres([Number(genreId)]);
      await loadRecommendations();
    } catch (error) {
      setErrorMessage(error?.message || 'Cannot update your genre preference');
    }
  };

  const renderRecommendCard = ({ item }) => {
    const match = getMatchPercent(item);
    return (
      <View style={styles.recommendCard}>
        <Image source={{ uri: item?.posterUrl || FALLBACK_POSTER }} style={styles.recommendPoster} resizeMode="cover" />
        <View style={styles.recommendInfo}>
          <View style={styles.recommendTopRow}>
            <Text numberOfLines={1} style={styles.recommendTitle}>{item?.title || 'Untitled'}</Text>
            <View style={styles.matchBadgeSmall}>
              <Text style={styles.matchBadgeTextSmall}>{match}% MATCH</Text>
            </View>
          </View>
          <Text style={styles.recommendMeta} numberOfLines={1}>
            {item?.genre || 'Unknown'} • {formatDuration(item?.duration)}
          </Text>
          <View style={styles.recommendBottomRow}>
            <Text style={styles.ratingText}>⭐ {Number(item?.rating || 0).toFixed(1)}</Text>
            <TouchableOpacity onPress={() => openMovieDetail(item)}>
              <Text style={styles.bookTicketText}>🎟 Book Ticket →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.topIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>For You</Text>
        <TouchableOpacity onPress={() => loadScreenData(false)}>
          <Text style={styles.topIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FF1E1E" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadScreenData(false)}
              tintColor="#FF1E1E"
              colors={['#FF1E1E']}
              progressBackgroundColor="#1A0204"
            />
          }
        >
          <Text style={styles.heading}>Movies for You</Text>
          <Text style={styles.subheading}>Based on your recent watchlist</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
            <TouchableOpacity
              style={[styles.genreChip, selectedGenreId === 'all' && styles.genreChipActive]}
              onPress={() => handleGenrePress('all')}
            >
              <Text style={[styles.genreChipText, selectedGenreId === 'all' && styles.genreChipTextActive]}>All</Text>
            </TouchableOpacity>
            {genres.map((genre) => {
              const active = String(selectedGenreId) === String(genre.id);
              return (
                <TouchableOpacity
                  key={genre.id}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => handleGenrePress(genre.id)}
                >
                  <Text style={[styles.genreChipText, active && styles.genreChipTextActive]}>{genre.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {featuredMovie ? (
            <View style={styles.featureCard}>
              <Image source={{ uri: featuredMovie?.posterUrl || FALLBACK_POSTER }} style={styles.featureImage} />
              <View style={styles.featureOverlay}>
                <View style={styles.trendingTag}>
                  <Text style={styles.trendingText}>🔥 TRENDING #1</Text>
                </View>
                <View style={styles.featureBottom}>
                  <Text style={styles.featureTitle}>{featuredMovie?.title || 'Untitled'}</Text>
                  <Text style={styles.featureMeta}>
                    {featuredMovie?.releaseYear || '2024'} • {featuredMovie?.genre || 'Unknown'} • {formatDuration(featuredMovie?.duration)}
                  </Text>
                  <View style={styles.featureActions}>
                    <Text style={styles.matchCircle}>{getMatchPercent(featuredMovie)}%</Text>
                    <Text style={styles.matchLabel}>Match</Text>
                    <TouchableOpacity style={styles.bookNowButton} onPress={() => openMovieDetail(featuredMovie)}>
                      <Text style={styles.bookNowText}>🎟 Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Recommended for You</Text>
          {filteredMovies.length === 0 ? (
            <Text style={styles.emptyRecommendText}>
              Chưa có dữ liệu gợi ý. Hãy chọn thể loại bạn thích hoặc xem/chọn thêm phim.
            </Text>
          ) : null}
          <FlatList
            data={recommendedList}
            renderItem={renderRecommendCard}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </ScrollView>
      )}
    </View>
  );
};

export default RecommendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0204',
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3B0A0F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
  },
  subheading: {
    marginTop: 6,
    color: '#BDB7B7',
    fontSize: 20,
  },
  genreScroll: {
    marginTop: 16,
    marginBottom: 16,
  },
  genreChip: {
    borderWidth: 1,
    borderColor: '#4B141B',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#2A0A0F',
  },
  genreChipActive: {
    backgroundColor: '#FF1E1E',
    borderColor: '#FF1E1E',
  },
  genreChipText: {
    color: '#DFDBDB',
    fontSize: 15,
    fontWeight: '700',
  },
  genreChipTextActive: {
    color: '#FFFFFF',
  },
  featureCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4B141B',
    marginBottom: 20,
  },
  featureImage: {
    width: '100%',
    height: 380,
  },
  featureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
    justifyContent: 'space-between',
    padding: 14,
  },
  trendingTag: {
    alignSelf: 'flex-end',
    backgroundColor: '#200A0D',
    borderColor: '#77222C',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  trendingText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  featureBottom: {
    marginTop: 'auto',
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  featureMeta: {
    marginTop: 6,
    color: '#E7E2E2',
    fontSize: 18,
  },
  featureActions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCircle: {
    color: '#FFFFFF',
    borderColor: '#FF1E1E',
    borderWidth: 3,
    borderRadius: 999,
    width: 52,
    height: 52,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '800',
    fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  matchLabel: {
    color: '#25D37B',
    marginLeft: 10,
    fontSize: 26,
    fontWeight: '800',
    marginRight: 'auto',
  },
  bookNowButton: {
    backgroundColor: '#FF1E1E',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  bookNowText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  errorText: {
    color: '#FF9A9A',
    fontSize: 14,
    marginBottom: 10,
  },
  emptyRecommendText: {
    color: '#D9D6D6',
    fontSize: 14,
    marginBottom: 12,
  },
  recommendCard: {
    backgroundColor: '#2B0A0F',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#4B141B',
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
  },
  recommendPoster: {
    width: 92,
    height: 132,
    borderRadius: 12,
    backgroundColor: '#3D3D3D',
  },
  recommendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recommendTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 8,
  },
  matchBadgeSmall: {
    backgroundColor: '#113D20',
    borderWidth: 1,
    borderColor: '#1B7D3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  matchBadgeTextSmall: {
    color: '#59F08F',
    fontSize: 11,
    fontWeight: '800',
  },
  recommendMeta: {
    marginTop: 6,
    color: '#C7C2C2',
    fontSize: 14,
  },
  recommendBottomRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingText: {
    color: '#F6C146',
    fontWeight: '700',
    fontSize: 15,
  },
  bookTicketText: {
    color: '#FF2B2B',
    fontWeight: '800',
    fontSize: 16,
  },
});
