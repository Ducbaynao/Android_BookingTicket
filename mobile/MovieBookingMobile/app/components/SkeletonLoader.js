import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const SkeletonLoader = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: fadeAnim,
        },
        style,
      ]}
    />
  );
};

// Skeleton preset components for different content types
export const MovieCardSkeleton = () => (
  <View style={styles.movieCard}>
    <SkeletonLoader width={150} height={200} borderRadius={8} />
    <View style={styles.movieInfo}>
      <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="60%" height={14} />
    </View>
  </View>
);

export const ShowtimeSkeleton = () => (
  <View style={styles.showtime}>
    <SkeletonLoader width={60} height={60} borderRadius={30} />
    <View style={styles.showtimeInfo}>
      <SkeletonLoader width="70%" height={16} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="50%" height={14} />
    </View>
  </View>
);

export const BookingCardSkeleton = () => (
  <View style={styles.bookingCard}>
    <SkeletonLoader width={80} height={120} borderRadius={8} />
    <View style={styles.bookingInfo}>
      <SkeletonLoader width="90%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="70%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="50%" height={14} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  movieCard: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  movieInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  showtime: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  showtimeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  bookingCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginVertical: 8,
    borderRadius: 8,
  },
  bookingInfo: {
    marginLeft: 12,
    flex: 1,
  },
});

export default SkeletonLoader;