create table action_history
(
  id          int auto_increment
        primary key,
  user_email  varchar(255)                        not null,
  action_type varchar(64)                         not null,
  action_time timestamp default CURRENT_TIMESTAMP null,
  details     text                                null
);

create table locations
(
  id        int auto_increment
        primary key,
  name      varchar(255) null,
  country   varchar(255) null,
  latitude  float        null,
  longitude float        null
);

create table max_temperatures
(
  id          int auto_increment
        primary key,
  location_id int   null,
  record_date date  null,
  temperature float null,
  constraint max_temperatures_ibfk_1
    foreign key (location_id) references locations (id)
);

create index location_id
  on max_temperatures (location_id);

create table min_temperatures
(
  id          int auto_increment
        primary key,
  location_id int   null,
  record_date date  null,
  temperature float null,
  constraint min_temperatures_ibfk_1
    foreign key (location_id) references locations (id)
);

create index location_id
  on min_temperatures (location_id);

create table users
(
  id         int auto_increment
        primary key,
  username   varchar(255) null,
  email      varchar(255) null,
  created_at datetime     null,
  password   varchar(255) null
);

create table favorite_locations
(
  id          int auto_increment
        primary key,
  user_id     int null,
  location_id int null,
  constraint favorite_locations_ibfk_1
    foreign key (user_id) references users (id),
  constraint favorite_locations_ibfk_2
    foreign key (location_id) references locations (id)
);

create index location_id
  on favorite_locations (location_id);

create index user_id
  on favorite_locations (user_id);

create definer = `skip-grants user`@`skip-grants host` trigger after_favorite_add
    after insert
    on favorite_locations
    for each row
BEGIN
INSERT INTO action_history (user_email, action_type, details)
VALUES (
         (SELECT email FROM users WHERE id = NEW.user_id),
         'add_favorite',
         CONCAT('Добавил в избранное: location_id=', NEW.location_id)
       );
END;

create definer = `skip-grants user`@`skip-grants host` trigger after_favorite_remove
    after delete
on favorite_locations
    for each row
BEGIN
INSERT INTO action_history (user_email, action_type, details)
VALUES (
         (SELECT email FROM users WHERE id = OLD.user_id),
         'remove_favorite',
         CONCAT('Удалил из избранного: location_id=', OLD.location_id)
       );
END;

create table weather_types
(
  id          int auto_increment
        primary key,
  description varchar(255) null,
  icon        varchar(255) null
);

create table forecasts
(
  id              int auto_increment
        primary key,
  location_id     int                                 null,
  weather_type_id int                                 null,
  forecast_date   date                                null,
  min_temp        float                               null,
  max_temp        float                               null,
  icon            varchar(255)                        null,
  updated_at      timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
  constraint forecasts_ibfk_1
    foreign key (location_id) references locations (id),
  constraint forecasts_ibfk_2
    foreign key (weather_type_id) references weather_types (id)
);

create index location_id
  on forecasts (location_id);

create index weather_type_id
  on forecasts (weather_type_id);

create table hourly_forecasts
(
  id              int auto_increment
        primary key,
  location_id     int                                 not null,
  weather_type_id int                                 not null,
  forecast_time   datetime                            not null,
  temperature     decimal(4, 1)                       not null,
  wind_speed      decimal(4, 1)                       not null,
  humidity        int                                 not null,
  created_at      timestamp default CURRENT_TIMESTAMP null,
  updated_at      timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
  constraint unique_hourly_forecast
    unique (location_id, forecast_time),
  constraint hourly_forecasts_ibfk_1
    foreign key (location_id) references locations (id),
  constraint hourly_forecasts_ibfk_2
    foreign key (weather_type_id) references weather_types (id)
);

create index weather_type_id
  on hourly_forecasts (weather_type_id);

create
definer = `skip-grants user`@`skip-grants host` function get_user_action_count(email varchar(255)) returns int
    deterministic
BEGIN
    DECLARE cnt INT;
SELECT COUNT(*) INTO cnt FROM action_history WHERE user_email = email;
RETURN cnt;
END;

create definer = `skip-grants user`@`skip-grants host` trigger before_user_insert
    before insert
    on users
    for each row
BEGIN
    IF LENGTH(NEW.email) < 6 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email должен содержать минимум 6 символов';
    END IF;
    
    IF NEW.email NOT LIKE '%@%' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email должен содержать символ @';
    END IF;
END;

create definer = `skip-grants user`@`skip-grants host` trigger before_user_update
    before update
    on users
    for each row
BEGIN
    IF LENGTH(NEW.email) < 6 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email должен содержать минимум 6 символов';
    END IF;
    
    IF NEW.email NOT LIKE '%@%' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email должен содержать символ @';
    END IF;
END;

