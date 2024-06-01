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


const WEATHER_API_KEY = '02b266f0b137e9fc4c1c258b4b8a8ff3'; // Replace with your weather API key
const DEFAULT_LOCATION = 'Chennai';
const FETCH_WEATHER_TASK = 'fetch-weather-task';
const LOCATION_KEY = 'USER_LOCATION';

export default function App() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [time, setTime] = useState(new Date());
  const [loaded] = useFonts({
    poppins: require('../assets/fonts/Poppins-Medium.ttf'),
    poppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
    poppinsmed: require('../assets/fonts/Poppins-Medium.ttf')
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on component unmount
  }, []);

  const formatTime = (date) => {
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
      registerFetchWeatherTask();
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
      {weather && (
        <Text style={{fontFamily:'poppinsmed', fontSize:30, color:'#282828'}}>{weather.weather[0].description.charAt(0).toUpperCase() + weather.weather[0].description.slice(1)}</Text>
      )}
      <Text style={styles.timeText}>{formatTime(time)}</Text>
      <View style={styles.cloudimage}>
        <Image source={require('../assets/clouds/5.png')} resizeMode="contain" style={{height:'100%', width:'100%'}} />
      </View>
      <View style={styles.cityname}>
        <Text style={{fontSize:19, fontFamily:'poppins'}}>Today at {location}</Text>
      </View>
      <View style={styles.details}>
        <View style={styles.temp}>
        {weather && (
          <Text style={{fontFamily:'poppinsmed', fontSize:105, color:'#282828'}}>{(weather.main.temp - 273.15).toFixed(0)}°</Text>
         )}
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
    justifyContent:'center',
    backgroundColor:'#fff'
  },
  innercon:{
    height:'100%',
    width:'97%',
    display:'flex',
    flexDirection:'column',
    alignItems:'center',
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
    backgroundColor:'red'
  },
  cityname:{
    height:40,
    width:'87%',
    backgroundColor:'red',
    display:'flex',
    flexDirection:'row',
    justifyContent:'flex-start',
    alignItems:'center',
  },
  details:{
    height:150,
    width:'87%',
    backgroundColor:'blue',
    display:'flex',
    flexDirection:'row',
    justifyContent:'flex-start',
    alignItems:'center',
  },
  temp:{
    height:'100%',
    width:'55%',
    backgroundColor:'green'
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