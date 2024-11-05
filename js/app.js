const searchInput = document.querySelector(".search-input");
const locationButton = document.querySelector(".location-button");
const currentWeatherDiv = document.querySelector(".current-weather");
const hourlyWeather = document.querySelector(".hourly-weather .weather-list");

const API_KEY = "92b64a6d838c43918e6181715240511 "; // API key

const weatherCodes = {
  clear: [1000],
  clouds: [1003, 1006, 1009],
  mist: [1030, 1135, 1147],
  rain: [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1198, 1201, 1240, 1243, 1246, 1273, 1276],
  moderate_heavy_rain: [1186, 1189, 1192, 1195, 1243, 1246],
  snow: [1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282],
  thunder: [1087, 1279, 1282],
  thunder_rain: [1273, 1276],
}

const weatherCodeNames = {
  Ясно: [1000],
  Облачно: [1003, 1006, 1009],
  Туман: [1030, 1135, 1147],
  Додждливо: [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1198, 1201, 1240, 1243, 1246, 1273, 1276],
  Ливень: [1186, 1189, 1192, 1195, 1243, 1246],
  Снег: [1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282],
  Гроза: [1087, 1279, 1282],
  Шторм: [1273, 1276],
}

// Display the hourly forecast for the next 24 hours
const displayHourlyForecast = (hourlyData) => {
  const currentHour = new Date().setMinutes(0, 0, 0);
  const next24Hours = currentHour + 24 * 60 * 60 * 1000;

  // Filter the hourly data to only include the next 24 hours
  const next24HoursData = hourlyData.filter(({ time }) => {
    const forecastTime = new Date(time).getTime();
    return forecastTime >= currentHour && forecastTime <= next24Hours;
  });

  // Generate HTML for each hourly forecast and display it
  hourlyWeather.innerHTML = next24HoursData.map((item) => {
    const temperature = Math.floor(item.temp_c);
    const time = item.time.split(' ')[1].substring(0, 5);
    const weatherIcon = Object.keys(weatherCodes).find(icon => weatherCodes[icon].includes(item.condition.code));

    return `<li class="weather-item">
            <p class="time">${time}</p>
            <img src="img/${weatherIcon}.svg" class="weather-icon">
            <p class="temperature">${temperature}°</p>
          </li>`;
  }).join('');
};

// Fetch and display weather details
const getWeatherDetails = async (API_URL) => {
  window.innerWidth <= 768 && searchInput.blur();
  document.body.classList.remove("show-no-results");

  try {
    // Fetch weather data from the API and parse the response as JSON
    const response = await fetch(API_URL);
    const data = await response.json();

    // Extract current weather details
    const temperature = Math.floor(data.current.temp_c);
    const description = data.current.condition.text;
    const weatherIcon = Object.keys(weatherCodes).find(icon => weatherCodes[icon].includes(data.current.condition.code));

    // Update the current weather display
    currentWeatherDiv.querySelector(".weather-icon").src = `img/${weatherIcon}.svg`;
    currentWeatherDiv.querySelector(".temperature").innerHTML = `${temperature}<span>°C</span>`;
    currentWeatherDiv.querySelector(".description").innerText = Object.keys(weatherCodeNames).find(icon => weatherCodeNames[icon].includes(data.current.condition.code));

    // Combine hourly data from today and tomorrow
    const combinedHourlyData = [...data.forecast?.forecastday[0]?.hour, ...data.forecast?.forecastday[1]?.hour];

    searchInput.value = data.location.name;
    displayHourlyForecast(combinedHourlyData);
  } catch (error) {
    document.body.classList.add("show-no-results");
  }
}

// Set up the weather request for a specific city
const setupWeatherRequest = (cityName) => {
  const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cityName}&days=2`;
  getWeatherDetails(API_URL).then();
}

// Handle user input in the search box
searchInput.addEventListener("keyup", (e) => {
  const cityName = searchInput.value.trim();

  if (e.key === "Enter" && cityName) {
    setupWeatherRequest(cityName);
  }
});

// Get user's coordinates and fetch weather data for the current location
locationButton.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=2`;
      getWeatherDetails(API_URL).then();
      window.innerWidth >= 768 && searchInput.focus();
    },
    () => {
      alert("Доступ к геолокации запрещен, разрешите заново, чтобы пользоваться этой возможностью");
    }
  );
});

document.body.classList.add("show-no-results");
