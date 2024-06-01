import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: {
    description: string;
  }[];
}

const { width, height } = Dimensions.get('window');

const WEATHER_API_KEY = '02b266f0b137e9fc4c1c258b4b8a8ff3'; // Replace with your weather API key
const DEFAULT_LOCATION = 'Chennai';
const FETCH_WEATHER_TASK = 'fetch-weather-task';
const LOCATION_KEY = 'USER_LOCATION';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [loaded] = useFonts({
    poppins: require('../assets/fonts/Poppins-Medium.ttf'),
    poppinsBold: require('../assets/fonts/Poppins-Bold.ttf')
  });

  useEffect(() => {
    if (loaded) {
      loadLocation();
    }
  }, [loaded]);

  useEffect(() => {
    if (location) {
      fetchWeather(location);
      registerFetchWeatherTask();
      scheduleDailyNotification();
      saveLocation(location);
    }
  }, [location]);

  const loadLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(LOCATION_KEY);
      if (savedLocation) {
        setLocation(savedLocation);
      }
    } catch (error) {
      console.error('Failed to load location from storage', error);
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
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${loc}&appid=${WEATHER_API_KEY}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetLocation = () => {
    setLocation(newLocation);
    setNewLocation('');
  };

  const scheduleDailyNotification = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Weather Update',
        body: `Check out the weather for ${location}!`,
      },
      trigger: {
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
  };

  const registerFetchWeatherTask = async () => {
    if (TaskManager.isTaskDefined(FETCH_WEATHER_TASK)) {
      await BackgroundFetch.unregisterTaskAsync(FETCH_WEATHER_TASK);
    }

    TaskManager.defineTask(FETCH_WEATHER_TASK, async () => {
      try {
        await fetchWeather(location);

        if (weather) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Weather in ${weather.name}`,
              body: `Temp: ${(weather.main.temp - 273.15).toFixed(2)}°C, ${weather.weather[0].description}, Humidity: ${weather.main.humidity}%`,
            },
            trigger: null,
          });
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error(error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    await BackgroundFetch.registerTaskAsync(FETCH_WEATHER_TASK, {
      minimumInterval: 60 * 60 * 24,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  };

  if (!loaded) {
    return null; // Or a loading indicator component
  }

  return (
    <View style={styles.maincontainer}>
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
          <Image style={{height:20, width:20}} source={require('../assets/clouds/searchIcon.png')}/>
        </TouchableOpacity>
      </View>
        <Text style={{fontSize:20, fontFamily:'poppins'}}>{location}</Text>
        {weather &&(
          <Text style={{fontFamily:'poppinsBold', fontSize:40, fontWeight:500}}>{(weather.main.temp - 273.15).toFixed(2)}°C</Text>
        )
        }
        <Image source={require('../assets/clouds/5.png')} style={{height:179, width:200}}/>
        {weather &&(
          <Text style={{fontFamily:'poppins', fontSize:35}}>{weather.weather[0].description}</Text>
        )
        }
        <View style={styles.details}>
          <View style={styles.humcon}>
            <Image source={require('../assets/clouds/humidityIcon.png')} style={{height:25,width:25}}/>
            {weather &&(
             <Text style={{fontFamily:'poppins', fontSize:18, fontWeight:500}}>{(weather.main.humidity)}%</Text>
            )
             }
          </View>
          <View>
          {weather &&(
              <Text style={{fontFamily:'poppins', fontSize:18}}>Feels Like {(weather.main.temp - 278.15).toFixed(2)}°C</Text>
            )
            }
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  maincontainer: {
    height: '100%',
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
  innercon:{
    height:'88%',
    width:'97%',
    backgroundColor:'blue',
    display:'flex',
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'center',
  },
  heading: {
    fontFamily: 'poppins',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    fontFamily: 'poppins',
    height: 50,
    width: '80%',
    backgroundColor:'#d3d3d3',
    marginBottom: 10,
    paddingLeft: 20,
    borderRadius:50,
    marginTop:8
  },
  weatherContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
  },
  weatherHeading: {
    fontFamily: 'poppins',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchcontainer:{
    backgroundColor:'red',
    height:70,
    width:'95%',
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    gap:10
  },
  search:{
    height:50,
    width:50,
    borderRadius:50,
    backgroundColor:'#d3d3d3',
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
  },
  details:{
    height:20,
    width:'85%',
    display:'flex',
    flexDirection:'row',
    justifyContent:'space-between'
  },
  humcon:{
    display:'flex',
    flexDirection:'row',
    justifyContent:'space-between',
  }
});



// <Text style={styles.heading}>Weather App</Text>
//         <Text>Current Location: {location}</Text>
//         <TextInput
//           style={styles.input}
//           value={newLocation}
//           onChangeText={(text) => setNewLocation(text)}
//           placeholder="Enter new location"
//         />
//         <Button title="Set Location" onPress={handleSetLocation} />
//         {weather && (
//           <View style={styles.weatherContainer}>
//             <Text style={styles.weatherHeading}>Weather in {weather.name}</Text>
//             <Text>Temperature: {(weather.main.temp - 273.15).toFixed(2)}°C</Text>
//             <Text>Weather: {weather.weather[0].description}</Text>
//             <Text>Humidity: {weather.main.humidity}%</Text>
//           </View>
//         )}