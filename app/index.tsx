import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
  };
  rain: {
    one: number;
  };
  weather: {
    description: string;
  }[];
  wind: {
    speed: number;
  };
}

const WEATHER_API_KEY = '02b266f0b137e9fc4c1c258b4b8a8ff3';
const DEFAULT_LOCATION = 'Namakkal';
const LOCATION_KEY = 'USER_LOCATION';


const weatherImages = {
  clear: require('../assets/clouds/clear.png'),
  rain: require('../assets/clouds/rain.png'),
  thunderstorm: require('../assets/clouds/thunderstorm.png'),
  scattered_clouds: require('../assets/clouds/scattered_clouds.png'),
  few_clouds: require('../assets/clouds/few_clouds.png'),
  broken_clouds: require('../assets/clouds/broken_clouds.png'),
  wind: require('../assets/clouds/wind.png'),
  hot: require('../assets/clouds/hot.png'),
  light: require('../assets/clouds/light.png'),
};

const getWeatherImage = (description: string) => {
  if (description.includes('clear')) return weatherImages.clear;
  if (description.includes('rain')) return weatherImages.rain;
  if (description.includes('thunderstorm')) return weatherImages.thunderstorm;
  if (description.includes('scattered')) return weatherImages.scattered_clouds;
  if (description.includes('few')) return weatherImages.few_clouds;
  if (description.includes('broken')) return weatherImages.broken_clouds;
  if (description.includes('wind')) return weatherImages.wind;
  if (description.includes('hot')) return weatherImages.hot;
  if (description.includes('light')) return weatherImages.light;
  // Add other conditions as needed
  return weatherImages.clear; // Default image
};

export default function App() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [loaded] = useFonts({
    poppins: require('../assets/fonts/Poppins-Medium.ttf'),
    poppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
    poppinsmed: require('../assets/fonts/Poppins-Medium.ttf'),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date(time.getTime() + 3600 * 1000);
      setTime(newTime);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    return `${hours}:00`;
  };

  useEffect(() => {
    if (loaded) {
      loadLocation();
    }
  }, [loaded]);

  useEffect(() => {
    if (location) {
      fetchWeather(location);
      saveLocation(location);
    }
  }, [location]);

  const loadLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(LOCATION_KEY);
      if (savedLocation) {
        setLocation(savedLocation);
      } else {
        setLocation(DEFAULT_LOCATION);
      }
    } catch (error) {
      console.error('Failed to load location from storage', error);
      setLocation(DEFAULT_LOCATION);
    }
  };

  const saveLocation = async (loc: string) => {
    try {
      await AsyncStorage.setItem(LOCATION_KEY, loc);
    } catch (error) {
      console.error('Failed to save location to storage', error);
    }
  };

  const fetchWeather = async (loc: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${loc}&appid=${WEATHER_API_KEY}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetLocation = () => {
    setLocation(newLocation);
    setNewLocation('');
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchWeather(location)
      .then(() => setRefreshing(false))
      .catch((error) => {
        console.error('Failed to refresh data:', error);
        setRefreshing(false);
      });
  }, [location]);

  if (!loaded) {
    return null;
  }

  return (
    <View style={styles.maincontainer}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.innercon}>
          <View style={{ height: 50 }} />
          <View style={styles.searchcontainer}>
            <TextInput
              style={styles.input}
              value={newLocation}
              onChangeText={(text) => setNewLocation(text)}
              placeholder="Enter your location🌤️"
            />
            <TouchableOpacity style={styles.search} onPress={handleSetLocation}>
              <Image style={{ height: 20, width: 20 }} source={require('../assets/clouds/searchIcon.png')} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <>
              {weather && (
                <Text style={{ fontFamily: 'poppinsmed', fontSize: 30, color: '#282828' }}>
                  {weather.weather[0].description.charAt(0).toUpperCase() + weather.weather[0].description.slice(1)}
                </Text>
              )}

              <View style={styles.cloudimage}>
              {weather && (
                <Image
                source={getWeatherImage(weather.weather[0].description)}
                resizeMode="contain"
                style={{ height: '100%', width: '100%' }}
              />
              )}
              </View>
              <View style={styles.cityname}>
                <Text style={{ fontSize: 19, fontFamily: 'poppins' }}>Today at {location},</Text>
              </View>
              <View style={styles.details}>
                <View style={styles.temp}>
                  {weather && (
                    <Text style={{ fontFamily: 'poppinsmed', fontSize: 105, color: '#282828' }}>
                      {(weather.main.temp - 273.15).toFixed(0)}°
                    </Text>
                  )}
                </View>
                <View style={styles.others}>
                  <View style={styles.humidity}>
                    <Text style={{ fontFamily: 'poppins', fontSize: 13 }}>Humidity</Text>
                    <View style={styles.image}>
                      <Image source={require('../assets/clouds/humidityIcon.png')} resizeMode="contain" style={{ height: '100%', width: '100%' }} />
                    </View>
                    {weather && (
                      <Text style={{ fontFamily: 'poppins', fontSize: 13, color: '#282828' }}>{weather.main.humidity}%</Text>
                    )}
                  </View>
                  <View style={styles.humidity}>
                    <Text style={{ fontFamily: 'poppins', fontSize: 13 }}>Wind</Text>
                    <View style={styles.image}>
                      <Image source={require('../assets/clouds/wind.png')} resizeMode="contain" style={{ height: '100%', width: '100%' }} />
                    </View>
                    {weather && (
                      <Text style={{ fontFamily: 'poppins', fontSize: 13, color: '#282828' }}>{weather.wind.speed}m/s</Text>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.feels}>
                <View style={styles.feel1}>
                  <View style={styles.cityname}>
                    {weather && (
                      <Text style={{ fontSize: 19, fontFamily: 'poppins' }}>Feels like {(weather.main.feels_like - 273.15).toFixed(0)}°</Text>
                    )}
                  </View>
                </View>
                <View style={styles.feel2}>
                  <Image source={require('../assets/clouds/human.png')} resizeMode="contain" style={{ height: '100%', width: '100%' }} />
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  maincontainer: {
    height: '100%',
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#fff'
  },
  innercon:{
    height:'100%',
    width:'97%',
    display:'flex',
    flexDirection:'column',
    alignItems:'center',
    gap:13
  },
  input: {
    fontFamily: 'poppins',
    height: 50,
    width: '80%',
    backgroundColor:'#fff',
    marginBottom: 10,
    paddingLeft: 20,
    borderRadius:50,
    marginTop:8,
    elevation: 3,
  },
  searchcontainer:{
    height:70,
    width:'95%',
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    gap:10,
  },
  search:{
    height:50,
    width:50,
    borderRadius:50,
    backgroundColor:'#90B5FC',
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
  },
  cloudimage:{
    height:290,
    width:290,
  },
  cityname:{
    height:50,
    width:'87%',
    display:'flex',
    flexDirection:'row',
    justifyContent:'flex-start',
    alignItems:'flex-end'
  },
  details:{
    height:150,
    width:'87%',

    display:'flex',
    flexDirection:'row',
    justifyContent:'flex-start',
    alignItems:'center',
  },
  temp:{
    height:'100%',
    width:'55%',
  },
  others:{
    height:'100%',
    width:'45%',
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    gap:10
  },
  humidity:{
    height:80,
    width:60,
    display:'flex',
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'center',
  },
  image:{
    height:40,
    width:40,
  },
  feels:{
    marginTop:-20,
    height:110,
    width:'87%',
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
  },
  feel1:{
    height:'100%',
    width:'60%',
  },
  feel2:{
    height:'100%',
    width:'40%',
  }
});
