import translationsJson from './translationsJson.js';

const searchInput = document.querySelector(".search-input");
const locationButton = document.querySelector(".location-button");
const currentWeatherDiv = document.querySelector(".current-weather");
const hourlyWeather = document.querySelector(".day-forecast .weather-list");
const todayButton = document.querySelector(".today-button");
const tomorrowButton = document.querySelector(".tomorrow-button");


const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const type = urlParams.get("type");
const city = urlParams.get("city");

const API_KEY = "92b64a6d838c43918e6181715240511 "; // API key

const navigateToTomorrow = () => {
  window.location.href = `index.html?type=tomorrow&city=${searchInput.value}`;
}

const navigateToToday = () => {
  window.location.href = `index.html?type=today&city=${searchInput.value}`;
}

const displayHourlyForecast = (hourlyData) => {
  const currentHour = new Date().setMinutes(0, 0, 0)
  const next24Hours = currentHour + 24 * 60 * 60 * 1000;

  let next24HoursData;

  if (type === "tomorrow") {
    next24HoursData = hourlyData
  } else {
    next24HoursData = hourlyData.filter(({time}) => {
      const forecastTime = new Date(time).getTime();
      return forecastTime >= currentHour && forecastTime <= next24Hours;
    });
  }

  hourlyWeather.innerHTML = next24HoursData.map((item) => {
    const temperature = Math.floor(item.temp_c);
    const time = item.time.split(' ')[1].substring(0, 5);
    const weatherIcon = item.condition.icon.replace("64x64", "128x128")

    return `<li class="weather-item">
            <p class="time">${time}</p>
            <img src="${weatherIcon}" class="weather-icon" alt="">
            <p class="temperature">${temperature}°</p>
          </li>`;
  }).join('');
};

const getWeatherDetails = async (API_URL) => {
  window.innerWidth <= 768 && searchInput.blur();
  document.body.classList.remove("show-no-results");

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    moment.locale("ru");

    if (type === "today" || type !== "tomorrow") {
      const temperature = Math.floor(data.current.temp_c);

      currentWeatherDiv.querySelector(".weather-icon").src = data.current.condition.icon.replace("64x64", "128x128");
      currentWeatherDiv.querySelector(".temperature").innerHTML = `${temperature}<span>°C</span>`;
      currentWeatherDiv.querySelector(".date").innerText = moment().format('dd, D MMMM, h:mm');

      currentWeatherDiv.querySelector(".description").innerText = translationsJson.find(translation => translation.code === data.current.condition.code).languages.find(lang => lang.lang_iso === "ru").night_text;

      const combinedHourlyData = [...data.forecast?.forecastday[0]?.hour, ...data.forecast?.forecastday[1]?.hour];

      searchInput.value = data.location.name;
      displayHourlyForecast(combinedHourlyData);
    } else {
      const current = data.forecast.forecastday[1]
      const temperature = Math.floor(current.hour[0].temp_c);

      currentWeatherDiv.querySelector(".weather-icon").src = current.hour[0].condition.icon.replace("64x64", "128x128");
      currentWeatherDiv.querySelector(".temperature").innerHTML = `${temperature}<span>°C</span>`;
      currentWeatherDiv.querySelector(".date").innerText = moment().add(1, "days").format('dd, D MMMM');

      currentWeatherDiv.querySelector(".description").innerText = translationsJson.find(translation => translation.code === current.hour[0].condition.code).languages.find(lang => lang.lang_iso === "ru").night_text;

      const combinedHourlyData = [...data.forecast?.forecastday[1]?.hour, ...data.forecast?.forecastday[2]?.hour];

      searchInput.value = data.location.name;
      displayHourlyForecast(combinedHourlyData);
    }
  } catch (error) {
    console.log(error);
    document.body.classList.add("show-no-results");
  }
}

const setupWeatherRequest = (cityName) => {
  const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cityName}&days=3`;
  getWeatherDetails(API_URL).then();
}

searchInput.addEventListener("keyup", (e) => {
  const cityName = searchInput.value.trim();

  if (e.key === "Enter" && cityName) {
    setupWeatherRequest(cityName);
  }
});

locationButton.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const {latitude, longitude} = position.coords;
      const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=2`;
      getWeatherDetails(API_URL).then();
      window.innerWidth >= 768 && searchInput.focus();
    },
    () => {
      alert("Доступ к геолокации запрещен, разрешите заново, чтобы пользоваться этой возможностью");
    }
  );
});

todayButton.addEventListener("click", () => {
  navigateToToday()
});

tomorrowButton.addEventListener("click", () => {
  navigateToTomorrow();
});

if (type && type.trim().length > 0) {
  setupWeatherRequest(city)
} else {
  document.body.classList.add("show-no-results");
}
