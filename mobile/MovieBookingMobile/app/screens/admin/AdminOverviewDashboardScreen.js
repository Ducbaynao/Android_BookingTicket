import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  PanResponder,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { logoutAsync } from '../../store/authSlice';
import adminService from '../../services/adminService';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const LIVE_REFRESH_INTERVAL_MS = 15000;
const CHART_HEIGHT = 180;
const CHART_Y_HIT_THRESHOLD = 70;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  bg:           '#0D0D0D',
  surface:      '#161616',
  surfaceAlt:   '#1E1E1E',
  border:       '#2A2A2A',
  accent:       '#E8192C',
  accentMuted:  'rgba(232,25,44,0.15)',
  accentOrange: '#FF6B35',
  gold:         '#F5A623',
  green:        '#00C48C',
  textPrimary:  '#FFFFFF',
  textSecondary:'#8A8A8A',
  textMuted:    '#555555',
};

// ─── Animated Stat Card ───────────────────────────────────────────────────────
const KPICard = ({ title, value, change, changePositive, icon, color, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      kpiStyles.card,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <View style={[kpiStyles.iconBox, { backgroundColor: `${color}20` }]}>
        <Text style={kpiStyles.icon}>{icon}</Text>
      </View>
      <Text style={kpiStyles.title}>{title}</Text>
      <Text style={[kpiStyles.value, { color }]}>{value}</Text>
      {change !== undefined && (
        <View style={kpiStyles.changeRow}>
          <Text style={{ color: changePositive ? COLORS.green : COLORS.accent, fontSize: 11, fontWeight: '700' }}>
            {changePositive ? '▲' : '▼'} {change}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const kpiStyles = StyleSheet.create({
  card: {
    width: (width - 52) / 3,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon:  { fontSize: 17 },
  title: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 0.4, marginBottom: 5, textTransform: 'uppercase' },
  value: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  changeRow: { flexDirection: 'row', alignItems: 'center' },
});

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, action, onAction }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
    <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
      {title}
    </Text>
    {action && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '600' }}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Movie Row ────────────────────────────────────────────────────────────────
const MovieRow = ({ movie, index }) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const rankColors = ['#F5A623', '#8A8A8A', '#CD7F32'];
  const rankColor  = rankColors[index] || COLORS.textMuted;

  return (
    <View style={movieStyles.row}>
      <View style={[movieStyles.rankBadge, { borderColor: rankColor }]}>
        <Text style={[movieStyles.rankText, { color: rankColor }]}>#{index + 1}</Text>
      </View>
      <View style={movieStyles.info}>
        <Text style={movieStyles.title} numberOfLines={1}>{movie.title}</Text>
        <Text style={movieStyles.sub}>🎫 {movie.bookingCount} tickets</Text>
      </View>
      <View style={movieStyles.right}>
        <Text style={movieStyles.revenue}>{formatCurrency(movie.revenue)}</Text>
      </View>
    </View>
  );
};

const movieStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 12, fontWeight: '800' },
  info:    { flex: 1 },
  title:   { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  sub:     { color: COLORS.textSecondary, fontSize: 12 },
  right:   { alignItems: 'flex-end' },
  revenue: { color: COLORS.green, fontSize: 13, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AdminOverviewDashboardScreen = ({ navigation }) => {
  const dispatch  = useDispatch();
  const { user }  = useSelector((state) => state.auth);

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats,      setStats]      = useState(null);
  const [topMovies,  setTopMovies]  = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);
  const [selectedRevenuePoint, setSelectedRevenuePoint] = useState(null);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const loadDashboardData = useCallback(async (withLoader = true) => {
    try {
      if (withLoader) {
        setLoading(true);
      }
      const [statsData, topMoviesData, revenueData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getTopMovies(5),
        adminService.getRevenueStats(),
      ]);
      setStats(statsData);
      setTopMovies(topMoviesData);
      setRevenueStats(revenueData);
      console.log('Dashboard stats loaded:', statsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      if (withLoader) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData(true);
      const interval = setInterval(() => {
        loadDashboardData(false);
      }, LIVE_REFRESH_INTERVAL_MS);

      return () => clearInterval(interval);
    }, [loadDashboardData])
  );

  const onRefresh = () => { setRefreshing(true); loadDashboardData(false); };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout', style: 'destructive',
          onPress: async () => {
            try { await dispatch(logoutAsync()).unwrap(); }
            catch { Alert.alert('Error', 'Failed to logout. Please try again.'); }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const revenueChart = useMemo(() => {
    const points = Array.isArray(revenueStats?.timeSeries) ? revenueStats.timeSeries : [];
    if (points.length > 0) {
      const dailyMap = new Map();
      points.forEach((point) => {
        const ts = new Date(point.timestamp);
        if (Number.isNaN(ts.getTime())) {
          return;
        }
        const dayKey = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
        const current = dailyMap.get(dayKey) || { revenue: 0, timestamp: new Date(ts.getFullYear(), ts.getMonth(), ts.getDate()).getTime() };
        current.revenue += Number(point.revenue || 0);
        dailyMap.set(dayKey, current);
      });

      const sortedDays = [...dailyMap.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      const timestamps = sortedDays.map(([, value]) => value.timestamp);
      const data = sortedDays.map(([, value]) => value.revenue);
      const safeData = data.length === 1 ? [data[0], data[0]] : data;
      const safeTimestamps = timestamps.length === 1 ? [timestamps[0], timestamps[0]] : timestamps;
      const labelStep = Math.max(1, Math.floor(safeData.length / 6));
      const labels = safeTimestamps.map((ts, idx) => {
        if (idx % labelStep !== 0 && idx !== safeTimestamps.length - 1) {
          return '';
        }
        const d = new Date(ts);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      });

      return { labels, data: safeData, timestamps: safeTimestamps };
    }

    const dailyRevenue = revenueStats?.dailyRevenue || {};
    const sortedDates = Object.keys(dailyRevenue).sort();
    if (sortedDates.length > 0) {
      const timestamps = sortedDates.map((dateStr) => new Date(`${dateStr}T00:00:00`).getTime());
      const data = sortedDates.map((dateStr) => Number(dailyRevenue[dateStr] || 0));
      const safeData = data.length === 1 ? [data[0], data[0]] : data;
      const safeTimestamps = timestamps.length === 1 ? [timestamps[0], timestamps[0]] : timestamps;
      const step = Math.max(1, Math.floor(safeData.length / 6));
      const labels = safeTimestamps.map((ts, idx) => {
        if (idx % step !== 0 && idx !== safeTimestamps.length - 1) {
          return '';
        }
        const d = new Date(ts);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      });
      return { labels, data: safeData, timestamps: safeTimestamps };
    }

    return {
      labels: ['-', '-', '-', '-', '-', '-'],
      data: [0, 0, 0, 0, 0, 0],
      timestamps: [],
    };
  }, [revenueStats]);

  const revenueTrendPercent = useMemo(() => {
    const points = revenueChart.data;
    if (!points || points.length < 2) {
      return 0;
    }
    const first = Number(points[0] || 0);
    const last = Number(points[points.length - 1] || 0);
    if (first <= 0) {
      return last > 0 ? 100 : 0;
    }
    return ((last - first) / first) * 100;
  }, [revenueChart]);

  const chartData = {
    labels: revenueChart.labels,
    datasets: [{
      data: revenueChart.data,
      strokeWidth: 2,
    }],
  };

  const updateSelectedRevenuePoint = useCallback((locationX, locationY, containerWidth, containerHeight) => {
    const points = revenueChart.data || [];
    const timestamps = revenueChart.timestamps || [];
    const safeHeight = containerHeight || CHART_HEIGHT;
    if (!points.length || !timestamps.length || !containerWidth) {
      return;
    }
    if (locationY < 0 || locationY > safeHeight) {
      setSelectedRevenuePoint(null);
      return;
    }
    if (points.length === 1) {
      const selectedDate = new Date(timestamps[0]);
      setSelectedRevenuePoint({
        label: `${selectedDate.toLocaleDateString('vi-VN')} ${selectedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
        value: points[0] || 0,
      });
      return;
    }

    const clampedX = Math.max(0, Math.min(locationX, containerWidth));
    const ratio = clampedX / containerWidth;
    const scaled = ratio * (points.length - 1);
    const leftIndex = Math.max(0, Math.min(Math.floor(scaled), points.length - 1));
    const rightIndex = Math.max(0, Math.min(leftIndex + 1, points.length - 1));
    const t = rightIndex === leftIndex ? 0 : (scaled - leftIndex);
    const interpolatedValue = (points[leftIndex] || 0) + ((points[rightIndex] || 0) - (points[leftIndex] || 0)) * t;
    const interpolatedTimestamp = (timestamps[leftIndex] || 0) + ((timestamps[rightIndex] || 0) - (timestamps[leftIndex] || 0)) * t;
    const selectedDate = new Date(interpolatedTimestamp);
    const minValue = Math.min(...points);
    const maxValue = Math.max(...points);
    const chartRange = maxValue - minValue;
    const plotTop = safeHeight * 0.10;
    const plotBottom = safeHeight * 0.86;
    const plotHeight = Math.max(1, plotBottom - plotTop);
    const normalized = chartRange > 0 ? (interpolatedValue - minValue) / chartRange : 0.5;
    const projectedY = plotBottom - (normalized * plotHeight);
    const isNearLine = Math.abs(locationY - projectedY) <= CHART_Y_HIT_THRESHOLD;

    if (!isNearLine) {
      setSelectedRevenuePoint(null);
      return;
    }

    setSelectedRevenuePoint({
      label: `${selectedDate.toLocaleDateString('vi-VN')} ${selectedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
      value: interpolatedValue,
    });
  }, [revenueChart]);

  const chartPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      updateSelectedRevenuePoint(locationX, locationY, width, CHART_HEIGHT);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      updateSelectedRevenuePoint(locationX, locationY, width, CHART_HEIGHT);
    },
    onPanResponderRelease: () => setSelectedRevenuePoint(null),
    onPanResponderTerminate: () => setSelectedRevenuePoint(null),
  }), [updateSelectedRevenuePoint]);

  const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo:   COLORS.surface,
    decimalPlaces:          0,
    color: (opacity = 1) => `rgba(232, 25, 44, ${opacity})`,
    labelColor: () => COLORS.textMuted,
    propsForDots: { r: '0' },
    propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '' },
    fillShadowGradient:      COLORS.accent,
    fillShadowGradientOpacity: 0.25,
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }} onTouchStart={() => setSelectedRevenuePoint(null)}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.headerMid}>
            <Text style={styles.headerLabel}>DASHBOARD</Text>
            <Text style={styles.headerTitle}>
              {user?.email ? `Welcome, ${user.email.split('@')[0]}` : 'Welcome back, Admin'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutIcon}>⎋</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── KPI Cards ── */}
        <View style={styles.kpiSection}>
          <SectionHeader title="Key Performance Indicators" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <KPICard
              title="Daily Rev."
              value={formatCurrency(stats?.todayRevenue)}
              change="from DB"
              changePositive
              icon="💰"
              color={COLORS.accent}
              delay={0}
            />
            <KPICard
              title="Active Users"
              value={(stats?.activeUsers ?? stats?.totalUsers ?? 0).toLocaleString()}
              change="from DB"
              changePositive
              icon="👥"
              color={COLORS.accentOrange}
              delay={80}
            />
            <KPICard
              title="Bookings"
              value={(stats?.monthlyBookings || 0).toLocaleString()}
              change={`${stats?.totalBookings || 0} total DB`}
              changePositive
              icon="🎫"
              color={COLORS.gold}
              delay={160}
            />
          </View>
        </View>

        {/* ── Revenue Chart ── */}
        <View style={[styles.section, { paddingHorizontal: 0, overflow: 'hidden' }]}>
          <View style={{ paddingHorizontal: 18 }}>
            <SectionHeader title="Monthly Revenue Trend" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.chartBigValue}>{formatCurrency(stats?.totalRevenue)}</Text>
              <View style={styles.trendBadge}>
                <Text style={styles.trendBadgeText}>
                  {`${revenueTrendPercent >= 0 ? '+' : ''}${revenueTrendPercent.toFixed(1)}%`}
                </Text>
              </View>
            </View>
          </View>
          <LineChart
            data={chartData}
            width={width}
            height={CHART_HEIGHT}
            chartConfig={chartConfig}
            bezier
            withInnerLines
            withOuterLines={false}
            withShadow
            onDataPointClick={({ value, index }) => {
              const ts = revenueChart.timestamps?.[index];
              const selectedDate = ts ? new Date(ts) : null;
              setSelectedRevenuePoint({
                label: selectedDate
                  ? `${selectedDate.toLocaleDateString('vi-VN')} ${selectedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                  : (revenueChart.labels?.[index] || '-'),
                value: value || 0,
              });
            }}
            style={{ marginLeft: -6 }}
          />
          <View
            style={styles.chartTouchOverlay}
            {...chartPanResponder.panHandlers}
          />
          {selectedRevenuePoint && (
            <View style={styles.chartTooltip}>
              <Text style={styles.chartTooltipText}>
                X: {selectedRevenuePoint.label}
              </Text>
              <Text style={styles.chartTooltipText}>
                Y: {formatCurrency(selectedRevenuePoint.value)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Top Movies ── */}
        <View style={styles.section}>
          <SectionHeader title="Top Performing Movies" action="View All" />
          {topMovies.length > 0
            ? topMovies.map((movie, i) => <MovieRow key={movie.movieId} movie={movie} index={i} />)
            : <Text style={styles.emptyText}>No data available</Text>
          }
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.section}>
          <SectionHeader title="Quick Stats" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={styles.quickCard}>
              <Text style={styles.quickIcon}>🎬</Text>
              <Text style={styles.quickLabel}>Total Movies</Text>
              <Text style={styles.quickValue}>{stats?.totalMovies || 0}</Text>
            </View>
            <View style={styles.quickCard}>
              <Text style={styles.quickIcon}>💳</Text>
              <Text style={styles.quickLabel}>Avg Booking</Text>
              <Text style={styles.quickValue}>
                {formatCurrency(
                  stats?.totalRevenue && stats?.totalBookings
                    ? stats.totalRevenue / stats.totalBookings
                    : 0
                )}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminOverviewDashboardScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 20,
    gap: 12,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accentMuted,
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText:   { color: COLORS.accent, fontWeight: '800', fontSize: 18 },
  headerMid:    { flex: 1 },
  headerLabel:  { color: COLORS.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle:  { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: `${COLORS.accent}22`, borderWidth: 1,
    borderColor: `${COLORS.accent}66`,
    justifyContent: 'center', alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 18,
    color: COLORS.accent,
    fontWeight: '800',
  },

  // KPI
  kpiSection: {
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  // Section
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Chart
  chartBigValue: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trendBadge: {
    backgroundColor: `${COLORS.accent}20`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${COLORS.accent}40`,
  },
  trendBadgeText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  chartTouchOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CHART_HEIGHT,
  },
  chartTooltip: {
    position: 'absolute',
    top: 64,
    right: 18,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  chartTooltipText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },

  // Quick stats
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickIcon:  { fontSize: 28, marginBottom: 8 },
  quickLabel: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', textAlign: 'center' },

  // Empty
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    paddingVertical: 24,
  },
});
