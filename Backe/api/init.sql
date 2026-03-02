CREATE DATABASE Cinema_DB;
USE Cinema_DB;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    phone_number VARCHAR(15),
    role ENUM('admin', 'staff', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    total_seats INT DEFAULT 0
);

CREATE TABLE seat_types (
    seat_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surcharge DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    seat_type_id INT NOT NULL,
    row_name CHAR(2) NOT NULL,
    seat_number INT NOT NULL,
    
    CONSTRAINT fk_seat_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(room_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_seat_type
        FOREIGN KEY (seat_type_id)
        REFERENCES seat_types(seat_type_id),

    -- Chặn trùng ghế trong cùng phòng
    CONSTRAINT uq_room_seat
        UNIQUE (room_id, row_name, seat_number)
);

CREATE TABLE movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    poster_url VARCHAR(255),
    status ENUM('showing', 'coming') DEFAULT 'showing'
);

CREATE TABLE showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    room_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_show_movie
        FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_show_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(room_id)
        ON DELETE CASCADE
);

CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','paid','cancelled') DEFAULT 'pending',

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_booking_showtime
        FOREIGN KEY (showtime_id)
        REFERENCES showtimes(showtime_id)
);

CREATE TABLE booking_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    showtime_id INT NOT NULL,
    seat_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_bs_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bs_showtime
        FOREIGN KEY (showtime_id)
        REFERENCES showtimes(showtime_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bs_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id),

    -- CHẶN TRÙNG GHẾ TRONG CÙNG SUẤT CHIẾU
    CONSTRAINT uq_showtime_seat
        UNIQUE (showtime_id, seat_id)
);