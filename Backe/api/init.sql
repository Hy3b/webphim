CREATE DATABASE IF NOT EXISTS Cinema_DB;
USE Cinema_DB;

CREATE TABLE users (
    user_id integer not null auto_increment,
    created_at datetime(6),
    phone_number varchar(15),
    username varchar(50) not null,
    email varchar(100) not null,
    full_name varchar(100),
    password_hash varchar(255) not null,
    role enum('admin', 'staff', 'customer') default 'customer',
    primary key (user_id),
    constraint UK_username unique (username),
    constraint UK_email unique (email)
) engine=InnoDB;

CREATE TABLE rooms (
    room_id integer not null auto_increment,
    total_seats integer,
    name varchar(50) not null,
    status enum('active', 'maintenance') default 'active',
    primary key (room_id)
) engine=InnoDB;

CREATE TABLE seat_types (
    seat_type_id integer not null auto_increment,
    surcharge decimal(10,2),
    name varchar(50) not null,
    primary key (seat_type_id)
) engine=InnoDB;

CREATE TABLE seats (
    room_id integer not null,
    seat_id integer not null auto_increment,
    seat_number integer not null,
    seat_type_id integer not null,
    row_name char(2) not null,
    primary key (seat_id),
    constraint uq_room_seat unique (room_id, row_name, seat_number),
    constraint fk_seat_room foreign key (room_id) references rooms (room_id),
    constraint fk_seat_type foreign key (seat_type_id) references seat_types (seat_type_id)
) engine=InnoDB;

CREATE TABLE movies (
    duration_minutes integer not null,
    trailer_duration_minutes integer default 10,
    rating float(53),
    movie_id bigint not null auto_increment,
    title varchar(200) not null,
    age_rating varchar(255),
    banner varchar(255),
    cast_members varchar(255),
    description TEXT,
    director varchar(255),
    genre varchar(255),
    poster_url varchar(255),
    release_date varchar(255),
    status enum('showing', 'coming') default 'showing',
    primary key (movie_id)
) engine=InnoDB;

CREATE TABLE showtimes (
    base_price decimal(10,2) not null,
    room_id integer not null,
    showtime_id integer not null auto_increment,
    movie_id bigint not null,
    start_time datetime(6) not null,
    end_time datetime(6),
    buffer_time_minutes integer default 15,
    status enum('active', 'cancelled', 'completed') default 'active',
    batch_id varchar(100),
    primary key (showtime_id),
    constraint fk_show_movie foreign key (movie_id) references movies (movie_id),
    constraint fk_show_room foreign key (room_id) references rooms (room_id)
) engine=InnoDB;

CREATE TABLE bookings (
    booking_id integer not null auto_increment,
    showtime_id integer not null,
    total_amount decimal(10,2) not null,
    user_id integer not null,
    booking_date datetime(6),
    status enum('pending','paid','cancelled') default 'pending',
    primary key (booking_id),
    constraint fk_booking_showtime foreign key (showtime_id) references showtimes (showtime_id),
    constraint fk_booking_user foreign key (user_id) references users (user_id)
) engine=InnoDB;

CREATE TABLE booking_seats (
    id integer not null auto_increment,
    booking_id integer not null,
    price decimal(10,2) not null,
    seat_id integer not null,
    showtime_id integer not null,
    primary key (id),
    constraint uq_showtime_seat unique (showtime_id, seat_id),
    constraint fk_bs_booking foreign key (booking_id) references bookings (booking_id),
    constraint fk_bs_seat foreign key (seat_id) references seats (seat_id),
    constraint fk_bs_showtime foreign key (showtime_id) references showtimes (showtime_id)
) engine=InnoDB;