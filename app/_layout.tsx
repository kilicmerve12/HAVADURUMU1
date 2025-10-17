import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await SecureStore.getItemAsync('weatherHistory');
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Geçmiş yüklenemedi:', e);
    }
  };

  const saveHistory = async (newHistory) => {
    try {
      await SecureStore.setItemAsync('weatherHistory', JSON.stringify(newHistory));
    } catch (e) {
      console.log('Geçmiş kaydedilemedi:', e);
    }
  };

  const getWeatherEmoji = (condition) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('rain') || cond.includes('yağmur')) {
      return '🌧️';
    } else if (cond.includes('cloud') || cond.includes('bulut')) {
      return '☁️';
    } else if (cond.includes('sun') || cond.includes('güneş') || cond.includes('clear')) {
      return '☀️';
    } else if (cond.includes('snow') || cond.includes('kar')) {
      return '❄️';
    }
    return '🌤️';
  };

  const getGradientColors = (condition) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('rain') || cond.includes('yağmur')) {
      return ['#4a5568', '#2d3748', '#1a365d'];
    } else if (cond.includes('cloud') || cond.includes('bulut')) {
      return ['#718096', '#4a5568', '#2d3748'];
    } else if (cond.includes('sun') || cond.includes('güneş') || cond.includes('clear')) {
      return ['#4299e1', '#63b3ed', '#fbd38d'];
    }
    return ['#3182ce', '#4299e1', '#63b3ed'];
  };

  const searchWeather = async (searchCity) => {
    if (!searchCity.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=9b083c44e952430b983122109251110&q=${searchCity}&lang=tr`
      );

      if (!response.ok) {
        throw new Error('Şehir bulunamadı');
      }

      const data = await response.json();
      setWeather(data);

      const newHistory = [
        { 
          city: data.location.name, 
          time: new Date().toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        ...searchHistory.filter(h => h.city !== data.location.name)
      ].slice(0, 5);

      setSearchHistory(newHistory);
      saveHistory(newHistory);
    } catch (err) {
      setError('Hava durumu bilgisi alınamadı. Lütfen geçerli bir şehir adı girin.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchWeather(city);
  };

  const handleHistoryClick = (historyCity) => {
    setCity(historyCity);
    searchWeather(historyCity);
  };

  return (
    <LinearGradient
      colors={weather ? getGradientColors(weather.current.condition.text) : ['#3182ce', '#4299e1', '#63b3ed']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Hava Durumu</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Şehir adı girin..."
              placeholderTextColor="#999"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSearch}
              disabled={loading}
            >
              <Text style={styles.buttonText}>🔍 Ara</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          ) : null}

          {weather && !loading ? (
            <View style={styles.weatherCard}>
              <Text style={styles.cityName}>
                {weather.location.name}, {weather.location.country}
              </Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </Text>

              <Text style={styles.emoji}>
                {getWeatherEmoji(weather.current.condition.text)}
              </Text>
              <Text style={styles.temperature}>
                {Math.round(weather.current.temp_c)}°C
              </Text>
              <Text style={styles.condition}>
                {weather.current.condition.text}
              </Text>

              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailEmoji}>💨</Text>
                  <Text style={styles.detailLabel}>Rüzgar</Text>
                  <Text style={styles.detailValue}>{weather.current.wind_kph} km/s</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailEmoji}>💧</Text>
                  <Text style={styles.detailLabel}>Nem</Text>
                  <Text style={styles.detailValue}>{weather.current.humidity}%</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailEmoji}>👁️</Text>
                  <Text style={styles.detailLabel}>Görüş</Text>
                  <Text style={styles.detailValue}>{weather.current.vis_km} km</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailEmoji}>🌡️</Text>
                  <Text style={styles.detailLabel}>Hissedilen</Text>
                  <Text style={styles.detailValue}>{Math.round(weather.current.feelslike_c)}°C</Text>
                </View>
              </View>
            </View>
          ) : null}

          {searchHistory.length > 0 ? (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>🕒 Arama Geçmişi</Text>
              {searchHistory.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => handleHistoryClick(item.city)}
                >
                  <Text style={styles.historyCity}>{item.city}</Text>
                  <Text style={styles.historyTime}>{item.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  searchContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  weatherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
  },
  cityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 80,
    marginVertical: 10,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  condition: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  historyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  historyTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});