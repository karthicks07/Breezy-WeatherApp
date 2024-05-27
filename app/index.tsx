import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    loadLocation();
  }, []);

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
      minimumInterval: 60 * 60 * 24, // 24 hours
      stopOnTerminate: false,
      startOnBoot: true,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Weather Apppp</Text>
      <Text>Current Location: {location}</Text>
      <TextInput
        style={styles.input}
        value={newLocation}
        onChangeText={(text) => setNewLocation(text)}
        placeholder="Enter new location"
      />
      <Button title="Set Location" onPress={handleSetLocation} />
      {weather && (
        <View style={styles.weatherContainer}>
          <Text style={styles.weatherHeading}>Weather in {weather.name}</Text>
          <Text>Temperature: {(weather.main.temp - 273.15).toFixed(2)}°C</Text>
          <Text>Weather: {weather.weather[0].description}</Text>
          <Text>Humidity: {weather.main.humidity}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  weatherContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
  },
  weatherHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
