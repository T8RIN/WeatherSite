CREATE TABLE `users` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `username` varchar(255),
  `email` varchar(255),
  `created_at` datetime
);

CREATE TABLE `locations` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `country` varchar(255),
  `latitude` float,
  `longitude` float
);

CREATE TABLE `favorite_locations` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int,
  `location_id` int
);

CREATE TABLE `min_temperatures` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `location_id` int,
  `record_date` date,
  `temperature` float,
  `source` varchar(255)
);

CREATE TABLE `forecasts` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `location_id` int,
  `weather_type_id` int,
  `forecast_date` date,
  `min_temp` float,
  `max_temp` float
);

CREATE TABLE `weather_types` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `description` varchar(255),
  `icon` varchar(255)
);

CREATE TABLE `max_temperatures` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `location_id` int,
  `record_date` date,
  `temperature` float,
  `source` varchar(255)
);

CREATE TABLE `weather_stations` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `location_id` int,
  `operator` varchar(255),
  `established_year` int
);

ALTER TABLE `favorite_locations` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `favorite_locations` ADD FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`);

ALTER TABLE `min_temperatures` ADD FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`);

ALTER TABLE `forecasts` ADD FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`);

ALTER TABLE `forecasts` ADD FOREIGN KEY (`weather_type_id`) REFERENCES `weather_types` (`id`);

ALTER TABLE `max_temperatures` ADD FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`);

ALTER TABLE `weather_stations` ADD FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`);
