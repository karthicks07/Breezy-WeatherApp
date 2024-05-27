import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

// Define the type for the weather data
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

export default function App() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    fetchWeather(location);
  }, [location]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Weather App</Text>
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
