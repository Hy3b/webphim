CREATE DATABASE IF NOT EXISTS Cinema_DB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Cinema_DB;

CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rooms (
  room_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  total_seats INT,
  PRIMARY KEY (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE seat_types (
  seat_type_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  surcharge DECIMAL(10,2),
  PRIMARY KEY (seat_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE seats (
  seat_id INT NOT NULL AUTO_INCREMENT,
  room_id INT NOT NULL,
  seat_type_id INT NOT NULL,
  row_name CHAR(2) NOT NULL,
  seat_number INT NOT NULL,
  PRIMARY KEY (seat_id),
  CONSTRAINT uq_room_seat UNIQUE (room_id, row_name, seat_number),
  CONSTRAINT fk_seat_room FOREIGN KEY (room_id) REFERENCES rooms (room_id),
  CONSTRAINT fk_seat_type FOREIGN KEY (seat_type_id) REFERENCES seat_types (seat_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE movies (
  movie_id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  poster_url VARCHAR(255),
  banner VARCHAR(255),
  genre VARCHAR(255),
  release_date DATE,
  director VARCHAR(255),
  cast_members VARCHAR(255),
  age_rating VARCHAR(255),
  rating DOUBLE,
  status ENUM('showing','coming') DEFAULT 'showing',
  PRIMARY KEY (movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE showtimes (
  showtime_id INT NOT NULL AUTO_INCREMENT,
  movie_id BIGINT NOT NULL,
  room_id INT NOT NULL,
  start_time DATETIME(6) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (showtime_id),
  CONSTRAINT fk_show_movie FOREIGN KEY (movie_id) REFERENCES movies (movie_id) ON DELETE CASCADE,
  CONSTRAINT fk_show_room FOREIGN KEY (room_id) REFERENCES rooms (room_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bookings (
  booking_id INT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  showtime_id INT NOT NULL,
  booking_date DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','paid','cancelled') DEFAULT 'pending',
  PRIMARY KEY (booking_id),
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_showtime FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE booking_seats (
  id INT NOT NULL AUTO_INCREMENT,
  booking_id INT NOT NULL,
  seat_id INT NOT NULL,
  showtime_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uq_showtime_seat UNIQUE (showtime_id, seat_id),
  CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
  CONSTRAINT fk_bs_seat FOREIGN KEY (seat_id) REFERENCES seats (seat_id),
  CONSTRAINT fk_bs_showtime FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (username, email, password, role) VALUES
('viet123', 'viet123@gmail.com', '$2a$10$hashdemo1', 'ROLE_USER');

INSERT INTO rooms (name, total_seats) VALUES
('Room 1', 50),
('Room 2', 40);

INSERT INTO seat_types (name, surcharge) VALUES
('Standard', 0.00),
('VIP', 20000.00);

INSERT INTO seats (room_id, seat_type_id, row_name, seat_number) VALUES
(1, 1, 'A', 1),
(1, 1, 'A', 2),
(1, 2, 'A', 3),
(1, 1, 'B', 1),
(1, 2, 'B', 2);

INSERT INTO movies
(title, description, duration_minutes, poster_url, banner, genre, release_date, director, cast_members, age_rating, rating, status) VALUES
('MAI', 'Một bộ phim tâm lý xã hội...', 131,
'https://m.media-amazon.com/images/M/MV5BN2E1ZjNmZDctYzEyMi00YjVjLThlZWEtODYyYWZjYjBiNTI2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
'https://homepage.momocdn.net/img/momo-upload-api-240412154407-889899.jpg',
'Tâm lý, Tình cảm', '2024-02-10', 'Trấn Thành', 'Phương Anh Đào, Tuấn Trần', 'T18', 7.5, 'showing'),
('DUNE: PART TWO', 'Hành trình trả thù và định mệnh của Paul Atreides.', 166,
'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc9EW.jpg',
'https://homepage.momocdn.net/img/momo-upload-api-240412154407-889899.jpg',
'Hành động, Viễn tưởng', '2024-03-01', 'Denis Villeneuve', 'Timothée Chalamet, Zendaya', 'T16', 8.8, 'showing');

INSERT INTO showtimes (movie_id, room_id, start_time, base_price) VALUES
(1, 1, '2026-03-05 18:00:00', 90000.00),
(2, 2, '2026-03-05 19:00:00', 80000.00);
