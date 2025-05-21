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
  console.log('Hourly data:', hourlyData);
  
  const currentHour = new Date().setMinutes(0, 0, 0)
  const next24Hours = currentHour + 24 * 60 * 60 * 1000;

  let next24HoursData;

  if (type === "tomorrow") {
    next24HoursData = hourlyData
  } else {
    next24HoursData = hourlyData.filter(({forecast_time}) => {
      const forecastTime = new Date(forecast_time).getTime();
      return forecastTime >= currentHour && forecastTime <= next24Hours;
    });
  }

  console.log('Filtered hourly data:', next24HoursData);

  hourlyWeather.innerHTML = next24HoursData.map((item, index) => {
    const temperature = Math.floor(item.temperature);
    const time = new Date(item.forecast_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const weatherIcon = item.icon.replace("64x64", "128x128");

    const label = `weather-item-${index}`

    return `<li class="weather-item">
            <p class="time">${time}</p>
            <img src="${weatherIcon}" style="scale: 2; width: 32px; transform: translateY(-15%);" class="weather-icon" alt="">
            <p class="temperature">${temperature}°</p>

            <ul class="dropdown-menu ${index}" aria-labelledby="${label}">
              <p class="dropdown-item">Влажность: ${item.humidity}%</p>
              <p class="dropdown-item">Скорость ветра: ${item.wind_speed} км/ч</p>
              <p class="dropdown-item">Условия: ${item.description}</p>
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
    // Обновляем состояние кнопки избранного
    updateFavoriteBtn(cityName);
    // Отображаем почасовой прогноз
    if (data.hourly) {
      displayHourlyForecast(data.hourly);
    }
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
  if (searchInput.value.trim()) updateFavoriteBtn(searchInput.value.trim());
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

// --- ИЗБРАННОЕ ---
const addFavoriteBtn = document.getElementById('addFavoriteBtn');
const showFavoritesBtn = document.getElementById('showFavoritesBtn');
const favoritesListDiv = document.getElementById('favorites-list');
const favoritesUl = document.getElementById('favoritesUl');

let currentLocationId = null;

// Получить id локации по названию (или lat/lon)
async function getLocationId(cityName) {
  const resp = await fetch(`/api/weather.php?city=${encodeURIComponent(cityName)}`);
  const data = await resp.json();
  if (data && data.location_id) return data.location_id;
  if (data && data.locationId) return data.locationId;
  if (data && data.id) return data.id;
  return null;
}

// Проверить, есть ли город в избранном
async function isFavorite(locationId) {
  const resp = await fetch('/api/favorites.php?action=list');
  const data = await resp.json();
  if (!data.success) return false;
  return data.favorites.some(fav => fav.id == locationId);
}

function updateFavoriteBtnVisibility() {
  const userEmail = document.cookie.includes('userEmail=');
  const show = userEmail && !document.body.classList.contains('show-no-results');
  addFavoriteBtn.style.display = show ? '' : 'none';
}
searchInput && searchInput.addEventListener('input', updateFavoriteBtnVisibility);
window.addEventListener('DOMContentLoaded', updateFavoriteBtnVisibility);

// Обновить состояние кнопки избранного
async function updateFavoriteBtn(cityName) {
  updateFavoriteBtnVisibility();
  if (!cityName) return;
  const userEmail = document.cookie.includes('userEmail=');
  if (!userEmail) return;
  const locationId = await getLocationId(cityName);
  currentLocationId = locationId;
  if (!locationId) {
    addFavoriteBtn.disabled = true;
    addFavoriteBtn.classList.remove('active');
    return;
  }
  addFavoriteBtn.disabled = false;
  const fav = await isFavorite(locationId);
  addFavoriteBtn.classList.toggle('active', fav);
  addFavoriteBtn.title = fav ? 'Удалить из избранного' : 'Добавить в избранное';
}

// Функция для отображения уведомлений
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span class="material-symbols-rounded icon">${type === 'success' ? 'check_circle' : 'error'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Добавить/удалить из избранного
addFavoriteBtn && addFavoriteBtn.addEventListener('click', async () => {
  if (!currentLocationId) return;
  const fav = await isFavorite(currentLocationId);
  const formData = new FormData();
  formData.append('location_id', currentLocationId);
  const response = await fetch(`/api/favorites.php?action=${fav ? 'remove' : 'add'}`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  if (data.success) {
    showNotification(
      fav ? 'Город удален из избранного' : 'Город добавлен в избранное',
      fav ? 'error' : 'success'
    );
  } else {
    showNotification(data.error || 'Произошла ошибка', 'error');
  }
  updateFavoriteBtn(searchInput.value.trim());
  if (showFavoritesBtn) loadFavorites();
});

// Открыть/закрыть список избранного
let favoritesOpen = false;
showFavoritesBtn && showFavoritesBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  favoritesOpen = !favoritesOpen;
  if (favoritesOpen) {
    loadFavorites();
    favoritesListDiv.style.display = 'block';
    setTimeout(() => favoritesListDiv.classList.add('show'), 10);
  } else {
    favoritesListDiv.classList.remove('show');
    setTimeout(() => favoritesListDiv.style.display = 'none', 200);
  }
});
favoritesListDiv.addEventListener('click', e => e.stopPropagation());
document.body.addEventListener('click', () => {
  if (favoritesOpen) {
    favoritesListDiv.classList.remove('show');
    setTimeout(() => favoritesListDiv.style.display = 'none', 200);
    favoritesOpen = false;
  }
});

// Загрузить избранные города
async function loadFavorites() {
  const resp = await fetch('/api/favorites.php?action=list');
  const data = await resp.json();
  favoritesUl.innerHTML = '';
  if (!data.success || !data.favorites.length) {
    favoritesUl.innerHTML = '<li style="padding: 12px; color: #888;">Нет избранных городов</li>';
    return;
  }
  data.favorites.forEach(fav => {
    const li = document.createElement('li');
    li.style.padding = '10px 16px';
    li.style.cursor = 'pointer';
    li.style.borderBottom = '1px solid #eee';
    li.textContent = fav.name + (fav.country ? ', ' + fav.country : '');
    li.addEventListener('click', () => {
      window.location.href = `index.html?city=${encodeURIComponent(fav.name)}`;
    });
    favoritesUl.appendChild(li);
  });
}

// При загрузке страницы — если есть город, обновить кнопку избранного
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const city = params.get('city');
  if (city) updateFavoriteBtn(city);
});

// Функция для загрузки и отображения температурных рекордов в popup
async function loadTemperatureRecords(cityName) {
  const recordsDiv = document.getElementById('temperature-records-popup');
  const maxUl = document.getElementById('maxTemps');
  const minUl = document.getElementById('minTemps');
  if (!recordsDiv || !maxUl || !minUl) return;
  maxUl.innerHTML = '';
  minUl.innerHTML = '';
  try {
    const resp = await fetch(`/api/temperature_records.php?city=${encodeURIComponent(cityName)}`);
    const data = await resp.json();
    if (data.error) return;
    if (data.max.length === 0 && data.min.length === 0) return;
    data.max.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.record_date}: ${item.temperature}°C`;
      maxUl.appendChild(li);
    });
    data.min.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.record_date}: ${item.temperature}°C`;
      minUl.appendChild(li);
    });
  } catch (e) {
    // ничего не делаем
  }
}

// Обработчики для popup
const showTempBtn = document.getElementById('showTempRecordsBtn');
const tempPopup = document.getElementById('temperature-records-popup');
const closeTempBtn = document.getElementById('closeTempRecordsBtn');

if (showTempBtn && tempPopup && closeTempBtn) {
  showTempBtn.addEventListener('click', () => {
    const cityName = searchInput.value.trim() || city;
    loadTemperatureRecords(cityName);
    tempPopup.style.display = '';
  });
  closeTempBtn.addEventListener('click', () => {
    tempPopup.style.display = 'none';
  });
  // Закрытие по клику вне popup
  window.addEventListener('click', (e) => {
    if (tempPopup.style.display !== 'none' && !tempPopup.contains(e.target) && e.target !== showTempBtn) {
      tempPopup.style.display = 'none';
    }
  });
}

// Функция для обработки ошибок регистрации/входа
function handleAuthError(error) {
  showNotification(error.replace("<>: 1644 ", "") || 'Произошла ошибка', 'error');
}

const showAvgTempBtn = document.getElementById('showAvgTempBtn');
if (showAvgTempBtn) {
  showAvgTempBtn.addEventListener('click', async () => {
    const cityName = searchInput.value.trim() || city;
    const locationId = await getLocationId(cityName);
    const date = new Date().toISOString().slice(0, 10); // сегодня
    const resp = await fetch(`/api/weather.php?action=avg_temp&location_id=${locationId}&date=${date}`);
    const data = await resp.json();
    if (data.success) {
      showNotification(
        data.avg_temp
          ? `Средняя температура за сутки: <b>${data.avg_temp}°C</b>`
          : 'Нет данных для расчёта средней температуры',
        data.avg_temp ? 'success' : 'error'
      );
    } else {
      showNotification('Ошибка при получении данных', 'error');
    }
  });
}