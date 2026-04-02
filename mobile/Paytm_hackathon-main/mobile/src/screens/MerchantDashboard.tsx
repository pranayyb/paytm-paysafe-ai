import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Image } from 'react-native';
import { ArrowLeft, LineChart, TrendingUp, TrendingDown, DollarSign, Store, Activity, AlertTriangle, ChevronRight, BarChart2, Lightbulb, Calendar, Zap } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, PAYTM_DARK_THEME_LIGHT_BLUE, WHITE, SUCCESS_GREEN, ERROR_RED, fonts } from '../styles/theme';

const { width } = Dimensions.get('window');

interface MerchantDashboardProps {
  onBack: () => void;
  token: string | null;
  backendUrl: string;
  isDarkMode?: boolean;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onBack, token, backendUrl, isDarkMode = false }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const bg = isDarkMode ? '#121212' : '#F5F7FA';
  const surface = isDarkMode ? '#1E1E1E' : WHITE;
  const textClr = isDarkMode ? '#FFFFFF' : '#111';
  const textMuted = isDarkMode ? '#AAAAAA' : '#666';
  const themeBlue = isDarkMode ? PAYTM_LIGHT_BLUE : PAYTM_BLUE;

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${backendUrl}/merchant/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {
      console.log('Failed to fetch dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: bg }]}>
        {/* Premium background top for loader screen */}
        <View style={s.topBackground} />
        <ActivityIndicator size="large" color={themeBlue} />
      </View>
    );
  }

  if (!data || !data.merchant) {
    return (
      <View style={[s.center, { backgroundColor: bg }]}>
        <View style={s.topBackground} />
        <Text style={{ color: textClr, fontFamily: fonts.medium, marginTop: 100 }}>Failed to load merchant data.</Text>
        <TouchableOpacity style={s.backBtnFail} onPress={onBack}>
          <Text style={{ color: WHITE, fontFamily: fonts.bold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { merchant, stats, ai_insights, recent_events, daily_chart } = data;

  // Extract last 7 days of revenue to build a mini chart
  const weeklyChartData = (daily_chart || []).slice(-7);
  const maxRevenue = weeklyChartData.reduce((max: number, d: any) => Math.max(max, d.revenue), 1) * 1.2; // Add 20% padding at top

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={s.topBackground} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{merchant.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Main Floating Dashboard Card */}
        <View style={[s.floatingCard, { backgroundColor: surface, shadowColor: isDarkMode ? '#000' : '#CCC' }]}>
          <Text style={[s.sectionSubtitle, { color: textMuted }]}>Today's Revenue</Text>
          <Text style={[s.mainBalance, { color: textClr }]}>₹{stats.today.revenue.toLocaleString()}</Text>
          <View style={s.trendPill}>
            {stats.today.revenue >= stats.yesterday.revenue ?
              <>
                <TrendingUp size={14} color={SUCCESS_GREEN} />
                <Text style={[s.trendText, { color: SUCCESS_GREEN }]}>+{Math.abs(stats.today.revenue - stats.yesterday.revenue)} vs Yesterday</Text>
              </> :
              <>
                <TrendingDown size={14} color={ERROR_RED} />
                <Text style={[s.trendText, { color: ERROR_RED }]}>-{Math.abs(stats.yesterday.revenue - stats.today.revenue)} vs Yesterday</Text>
              </>
            }
          </View>
        </View>

        {/* AI Insights Premium Section */}
        {ai_insights && (
          <View style={[s.aiBanner, { backgroundColor: surface, shadowColor: isDarkMode ? '#000' : '#E8E8E8' }]}>
            <View style={s.aiBannerHeader}>
              <View style={[s.aiIconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,186,242,0.1)' }]}>
                <Activity size={18} color={isDarkMode ? WHITE : themeBlue} />
              </View>
              <Text style={[s.aiBannerTitle, { color: textClr }]}>Advanced AI Insights</Text>
            </View>

            {/* Daily Summary */}
            <Text style={[s.aiSummaryMain, { color: textClr }]}>{ai_insights.daily_summary}</Text>

            {/* Structured Highlights (Bulleted List) */}
            <View style={s.highlightsContainer}>
              {(ai_insights.highlights || []).map((highlight: string, i: number) => (
                <View key={i} style={s.highlightItem}>
                  <View style={[s.highlightDot, { backgroundColor: i % 2 === 0 ? SUCCESS_GREEN : PAYTM_LIGHT_BLUE }]} />
                  <Text style={[s.highlightText, { color: textClr }]}>{highlight}</Text>
                </View>
              ))}
            </View>

            {/* AI Forecast Graph */}
            {ai_insights.insufficient_data ? (
              <View style={[s.aiChartWrapper, { height: 100, justifyContent: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F1F5F9', borderRadius: 12, marginVertical: 10 }]}>
                <Text style={[s.aiDetailLabel, { textAlign: 'center', color: textClr, fontSize: 13, lineHeight: 20 }]}>
                  More data is needed for weekly insights.
                </Text>
              </View>
            ) : (
              ai_insights.forecast_values && (
                <View style={s.aiForecastContainer}>
                  <View style={s.cardHeaderRow}>
                    <Activity size={16} color={themeBlue} />
                    <Text style={[s.aiDetailLabel, { color: textClr, marginLeft: 8 }]}>AI Predicted Revenue (Next 7 Days)</Text>
                  </View>
                  <View style={[s.forecastGraph, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F1F5F9' }]}>
                    {ai_insights.forecast_values.map((val: number, idx: number) => {
                      const maxForecast = Math.max(...ai_insights.forecast_values, 1);
                      const hP = (val / maxForecast) * 65;
                      const label = ai_insights.forecast_labels ? ai_insights.forecast_labels[idx] : `D+${idx + 1}`;
                      return (
                        <View key={idx} style={s.forecastBar}>
                          <Text style={[s.forecastValue, { color: textClr }]}>₹{val > 999 ? `${(val / 1000).toFixed(0)}k` : Math.round(val)}</Text>
                          <View style={[s.forecastFill, { height: `${hP}%`, backgroundColor: themeBlue, opacity: 0.3 + (idx * 0.1) }]} />
                          <Text style={[s.forecastLabel, { color: textMuted }]}>{label.substring(0, 3)}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )
            )}

            {ai_insights.top_recommendation && (
              <View style={[s.aiTipBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
                <View style={s.aiHeaderRow}>
                  <Lightbulb size={16} color={themeBlue} />
                  <Text style={[s.aiTipLabel, { color: isDarkMode ? PAYTM_DARK_THEME_LIGHT_BLUE : PAYTM_BLUE, marginLeft: 8 }]}>Strategy Tip</Text>
                </View>
                <Text style={[s.aiTipText, { color: textClr }]}>{ai_insights.top_recommendation}</Text>
              </View>
            )}

            {ai_insights.risk_alert && ai_insights.risk_alert.toLowerCase() !== 'none' && ai_insights.risk_alert.trim() !== '' && (
              <View style={[s.aiRiskBox, { backgroundColor: 'rgba(211, 47, 47, 0.05)' }]}>
                <AlertTriangle size={14} color="#D32F2F" />
                <Text style={s.aiRiskText}>{ai_insights.risk_alert}</Text>
              </View>
            )}

            {/* NEW GRAPH: Peak Traffic Density */}
            {ai_insights.peak_hours && (
              <View style={s.aiChartWrapper}>
                <View style={s.cardHeaderRow}>
                  <Activity size={16} color={SUCCESS_GREEN} />
                  <Text style={[s.aiDetailLabel, { color: textClr, marginLeft: 8 }]}>Peak Traffic Density</Text>
                </View>
                <View style={s.trafficGrid}>
                  {ai_insights.peak_hours.map((hour: string, idx: number) => {
                    const activity = Math.max(ai_insights.peak_hour_values?.[idx] || 0, 15);
                    return (
                      <View key={idx} style={s.trafficColumn}>
                        <View style={[s.trafficBar, { height: (activity / 100) * 55, backgroundColor: idx === 2 ? SUCCESS_GREEN : themeBlue }]} />
                        <Text style={[s.trafficLabel, { color: textMuted }]}>{hour}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            <Text style={[s.aiFooterText, { color: textMuted }]}>Analyzed by {ai_insights.model}</Text>
          </View>
        )}

        {/* 7-Day Revenue Graph */}
        {weeklyChartData.length > 0 && (
          <View style={[s.card, { backgroundColor: surface, shadowColor: isDarkMode ? '#000' : '#E8E8E8' }]}>
            <View style={s.cardHeaderRow}>
              <BarChart2 size={18} color={PAYTM_LIGHT_BLUE} />
              <Text style={[s.cardTitle, { color: textClr }]}>7-Day Revenue Trends</Text>
            </View>

            <View style={s.graphContainer}>
              {weeklyChartData.map((d: any, idx: number) => {
                const heightPercentage = Math.max((d.revenue / maxRevenue) * 100, 5); // Minimum 5% height
                const isToday = idx === weeklyChartData.length - 1;
                return (
                  <View key={idx} style={s.barColumn}>
                    <Text style={[s.barValue, { color: textMuted, opacity: isToday || d.revenue > 0 ? 1 : 0 }]}>
                      {d.revenue > 0 ? `₹${d.revenue}` : ''}
                    </Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { height: `${heightPercentage}%`, backgroundColor: isToday ? PAYTM_LIGHT_BLUE : '#E0F2FE' }]} />
                    </View>
                    <Text style={[s.barLabel, { color: textMuted, fontFamily: isToday ? fonts.bold : fonts.medium }]}>
                      {d.label.split(' ')[0]} {/* Day number only */}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Lifetime Stats */}
        <View style={s.gridRow}>
          <View style={[s.halfCard, { backgroundColor: surface, shadowColor: isDarkMode ? '#000' : '#E8E8E8' }]}>
            <Text style={[s.halfCardLabel, { color: textMuted }]}>This Month</Text>
            <Text style={[s.halfCardValue, { color: textClr }]}>₹{stats.this_month.revenue.toLocaleString()}</Text>
            <Text style={s.halfCardSub}>{stats.this_month.count} Total TXNs</Text>
          </View>
          <View style={[s.halfCard, { backgroundColor: surface, shadowColor: isDarkMode ? '#000' : '#E8E8E8' }]}>
            <Text style={[s.halfCardLabel, { color: textMuted }]}>All Time</Text>
            <Text style={[s.halfCardValue, { color: textClr }]}>₹{stats.all_time.revenue.toLocaleString()}</Text>
            <Text style={s.halfCardSub}>Lifetime Revenue</Text>
          </View>
        </View>

        {/* Recent Events */}
        <View style={[s.card, { backgroundColor: surface, shadowColor: isDarkMode ? '#000' : '#E8E8E8', marginBottom: 40 }]}>
          <Text style={[s.cardTitle, { color: textClr, marginBottom: 12 }]}>Recent Activity</Text>
          {recent_events && recent_events.length > 0 ? (
            recent_events.map((ev: any, i: number) => (
              <View key={i} style={[s.eventRow, i !== recent_events.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
                <View style={s.eventIconBox}>
                  <DollarSign size={16} color={SUCCESS_GREEN} />
                </View>
                <View style={s.eventBody}>
                  <Text style={[s.eventSender, { color: textClr }]}>{ev.sender || 'Customer'}</Text>
                  <Text style={[s.eventTime, { color: textMuted }]}>
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Paid via {ev.method || 'UPI'}
                  </Text>
                </View>
                <Text style={[s.eventAmount, { color: textClr }]}>+₹{ev.amount}</Text>
              </View>
            ))
          ) : (
            <Text style={[s.noDataText, { color: textMuted }]}>No transactions yet. Spread your QR code!</Text>
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Premium Layout Base
  topBackground: { height: 200, width: '100%', backgroundColor: PAYTM_BLUE, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, position: 'absolute', top: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: WHITE },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  backBtnFail: { marginTop: 20, backgroundColor: PAYTM_BLUE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  // Floating Top Card
  floatingCard: { borderRadius: 24, padding: 24, alignItems: 'center', elevation: 4, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 20 },
  sectionSubtitle: { fontSize: 13, fontFamily: fonts.medium, marginBottom: 8 },
  mainBalance: { fontSize: 36, fontFamily: fonts.bold, letterSpacing: -1, marginBottom: 12 },
  trendPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  trendText: { fontSize: 12, fontFamily: fonts.bold, marginLeft: 6 },

  // Beautiful Dark AI Banner
  // Premium AI Banner Base Style (Dynamic parts handled in component)
  aiBanner: { borderRadius: 24, padding: 20, marginBottom: 20, elevation: 3, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  aiBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiIconBox: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  aiBannerTitle: { fontSize: 16, fontFamily: fonts.bold },
  aiSummaryMain: { fontSize: 14, fontFamily: fonts.bold, lineHeight: 22, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: PAYTM_BLUE, paddingLeft: 12 },
  aiBannerText: { fontSize: 13, fontFamily: fonts.medium, lineHeight: 20 },

  aiTipBox: { padding: 14, borderRadius: 16, marginTop: 14 },
  aiHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  aiTipLabel: { fontSize: 13, fontFamily: fonts.bold },
  aiTipText: { fontSize: 13, fontFamily: fonts.medium, lineHeight: 20 },

  aiDetailedContainer: { marginTop: 10 },
  aiDetailItem: { flexDirection: 'row', marginBottom: 16 },
  aiDetailIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  aiDetailBody: { flex: 1 },
  aiDetailLabel: { fontSize: 11, fontFamily: fonts.bold, marginBottom: 2 },
  aiDetailText: { fontSize: 13, fontFamily: fonts.medium, lineHeight: 18 },

  aiRiskBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: 'rgba(211, 47, 47, 0.2)' },
  aiRiskText: { color: '#D32F2F', fontSize: 12, fontFamily: fonts.bold, marginLeft: 8 },
  aiFooterText: { fontSize: 10, fontFamily: fonts.medium, marginTop: 14, textAlign: 'right' },

  // New Highlights Style
  highlightsContainer: { marginBottom: 10 },
  highlightItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  highlightDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  highlightText: { fontSize: 13, fontFamily: fonts.medium, lineHeight: 18 },

  aiForecastContainer: { marginTop: 20, marginBottom: 10 },
  forecastGraph: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, marginTop: 10, padding: 10, borderRadius: 16 },
  forecastBar: { alignItems: 'center', width: 34 },
  forecastValue: { fontSize: 8, fontFamily: fonts.bold, marginBottom: 4 },
  forecastFill: { width: 10, borderRadius: 5, marginBottom: 4 },
  forecastLabel: { fontSize: 9, fontFamily: fonts.medium },

  // Advanced Visuals
  aiChartWrapper: { marginTop: 22, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 18 },
  progressRow: { marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontFamily: fonts.semiBold },
  progressValue: { fontSize: 11, fontFamily: fonts.bold },
  progressBg: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  trafficGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 75, marginTop: 10 },
  trafficColumn: { alignItems: 'center' },
  trafficBar: { width: 45, borderTopLeftRadius: 8, borderTopRightRadius: 8, opacity: 0.8 },
  trafficLabel: { fontSize: 9, fontFamily: fonts.medium, marginTop: 8 },

  // Generic Card
  card: { borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold, marginLeft: 8 },

  // Custom Bar Graph
  graphContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 10 },
  barColumn: { alignItems: 'center', width: 36 },
  barValue: { fontSize: 9, fontFamily: fonts.semiBold, marginBottom: 6 },
  barTrack: { width: 12, height: 100, backgroundColor: 'transparent', justifyContent: 'flex-end', borderRadius: 6 },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 11, marginTop: 10 },

  // Grids
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  halfCard: { width: (width - 56) / 2, borderRadius: 20, padding: 18, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  halfCardLabel: { fontSize: 12, fontFamily: fonts.medium, marginBottom: 8 },
  halfCardValue: { fontSize: 20, fontFamily: fonts.bold, marginBottom: 4 },
  halfCardSub: { fontSize: 11, fontFamily: fonts.regular, color: PAYTM_LIGHT_BLUE },

  // Events
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  eventIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  eventBody: { flex: 1 },
  eventSender: { fontSize: 15, fontFamily: fonts.semiBold, marginBottom: 4 },
  eventTime: { fontSize: 12, fontFamily: fonts.medium },
  eventAmount: { fontSize: 16, fontFamily: fonts.bold },
  noDataText: { textAlign: 'center', fontSize: 13, fontFamily: fonts.medium, paddingVertical: 20 }
});
