import translationsJson from './translationsJson.js';

const searchInput = document.querySelector(".search-input");
const locationButton = document.querySelector(".location-button");
const currentWeatherDiv = document.querySelector(".current-weather");
const hourlyWeather = document.querySelector(".day-forecast .weather-list");
const todayButton = document.querySelector(".today-button");
const tomorrowButton = document.querySelector(".tomorrow-button");
const buttonsSection = document.querySelector(".buttons-section");


const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const type = urlParams.get("type");
const city = urlParams.get("city");

if (type === "today") {
  buttonsSection.removeChild(todayButton);
  tomorrowButton.style.borderRadius = "16px"
} else if (type === "tomorrow") {
  buttonsSection.removeChild(tomorrowButton);
  todayButton.style.borderRadius = "16px"
}


const showErrorResult = () => {
  document.body.classList.add("show-no-results");
  const result = document.querySelector(".no-results")
  result.style.transform = "translateY(10%)";
  // noinspection HtmlUnknownTarget
  result.innerHTML = `
    <img src="img/no-result.svg" alt="Результаты не найдены :(" class="icon">
    <h3 class="title">Что-то пошло не так</h3>
    <p class="message">Не удалось получить данные о погоде, убедитесь в правильности написания или попробуйте позже</p>
  `
}

const showEmptyResult = () => {
  document.body.classList.add("show-no-results");
  const result = document.querySelector(".no-results")
  result.style.transform = "";
  // noinspection HtmlUnknownTarget
  result.innerHTML = `
    <img src="img/empty.png" width="30%" style="aspect-ratio: 1" alt="Введите город чтобы увидеть погоду" class="icon">
    <h3 class="title">Введите город чтобы увидеть погоду</h3>
    <p class="message">Так же можно нажать на кнопку геолокации рядом с вводом, чтобы сделать это автоматически</p>
  `
}

const API_KEY = "92b64a6d838c43918e6181715240511 "; // API key

const navigateToTomorrow = () => {
  window.location.href = `index.html?type=tomorrow&city=${searchInput.value}`;
}

const navigateToToday = () => {
  window.location.href = `index.html?type=today&city=${searchInput.value}`;
}

let dropdownData = ""

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

  hourlyWeather.innerHTML = next24HoursData.map((item, index) => {
    const temperature = Math.floor(item.temp_c);
    const time = item.time.split(' ')[1].substring(0, 5);
    const weatherIcon = item.condition.icon.replace("64x64", "128x128");


    const label = `weather-item-${index}`

    return `<li class="weather-item">
            <p class="time">${time}</p>
            <img src="${weatherIcon}" style="scale: 2; width: 32px; transform: translateY(-15%);" class="weather-icon" alt="">
            <p class="temperature">${temperature}°</p>

            <ul class="dropdown-menu ${index}" aria-labelledby="${label}">
              <p class="dropdown-item">Влажность: ${dropdownData ? dropdownData.humidity : item.humidity}%</p>
              <p class="dropdown-item">Скорость ветра: ${item.wind_kph} км/ч</p>
              <p class="dropdown-item">Условия: ${translationsJson.find(translation => translation.code === item.condition.code).languages.find(lang => lang.lang_iso === "ru").night_text}</p>
            </ul>
          </li>`;
  }).join('');

  hourlyWeather.innerHTML += `<li class="weather-item">
            <p style="padding-right: 16px"></p>
          </li>`;

};

const getWeatherDetails = async (API_URL, cityName) => {
  window.innerWidth <= 768 && searchInput.blur();
  document.body.classList.remove("show-no-results");

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    moment.locale("ru");

    if (data.error) {
      showErrorResult();
      return;
    }

    // Формируем структуру для вывода (только текущий день)
    const temperature = Math.floor(data.min_temp);
    currentWeatherDiv.querySelector(".weather-icon").src = data.icon || "img/no-result.svg";
    currentWeatherDiv.querySelector(".temperature").innerHTML = `${temperature}<span>°C</span>`;
    currentWeatherDiv.querySelector(".date").innerText = (type === "tomorrow" ? moment().add(1, "days") : moment()).format('dd, D MMMM');
    currentWeatherDiv.querySelector(".description").innerText = data.description || "Нет описания";
    searchInput.value = cityName;
    // Нет почасового прогноза — просто очищаем список
    hourlyWeather.innerHTML = '';
  } catch (error) {
    console.log(error);
    showErrorResult();
  }
}

const setupWeatherRequest = (cityName) => {
  const API_URL = `/api/weather.php?city=${encodeURIComponent(cityName)}&type=${type || 'today'}`;
  getWeatherDetails(API_URL, cityName).then();
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
      // Для геолокации используем lat,lon как город
      const cityName = `${latitude},${longitude}`;
      setupWeatherRequest(cityName);
      window.innerWidth >= 768 && searchInput.focus();
    },
    () => {
      alert("Доступ к геолокации запрещен, разрешите заново, чтобы пользоваться этой возможностью");
    }
  );
});

todayButton.addEventListener("click", () => {
  navigateToToday();
});

tomorrowButton.addEventListener("click", () => {
  navigateToTomorrow();
});

if (type && type.trim().length > 0) {
  setupWeatherRequest(city);
} else {
  const search = city ? city : searchInput.value;
  if (search && search.length > 0) {
    setupWeatherRequest(search);
  } else {
    showEmptyResult();
  }
}
