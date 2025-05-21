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