USE Cinema_DB;

-- 1. Create a test user
INSERT INTO users (username, password_hash, email, full_name, phone_number, role)
VALUES ('testuser', '$2a$10$dummyhash...', 'user@test.com', 'Test User', '0123456789', 'customer');

-- 2. Create movies
INSERT INTO movies (title, description, duration_minutes, poster_url, status)
VALUES 
('Dune: Part Two', 'Paul Atreides unites with...', 166, 'https://example.com/dune2.jpg', 'showing'),
('Kung Fu Panda 4', 'Po must train a new warrior...', 94, 'https://example.com/kfp4.jpg', 'showing');

-- 3. Create a room
INSERT INTO rooms (name, total_seats)
VALUES ('Room 1', 15);

-- 4. Create seat types
INSERT INTO seat_types (name, surcharge)
VALUES 
('Normal', 0.00),
('VIP', 20000.00),
('Couple', 50000.00);

-- 5. Create seats for Room 1
INSERT INTO seats (room_id, seat_type_id, row_name, seat_number)
VALUES
-- Row A (Normal, type=1)
(1, 1, 'A', 1), (1, 1, 'A', 2), (1, 1, 'A', 3), (1, 1, 'A', 4), (1, 1, 'A', 5),
-- Row B (Normal, type=1)
(1, 1, 'B', 6), (1, 1, 'B', 7), (1, 1, 'B', 8), (1, 1, 'B', 9), (1, 1, 'B', 10),
-- Row C (VIP, type=2)
(1, 2, 'C', 11), (1, 2, 'C', 12), (1, 2, 'C', 13), (1, 2, 'C', 14), (1, 2, 'C', 15);

-- 6. Create showtimes
INSERT INTO showtimes (movie_id, room_id, start_time, base_price)
VALUES 
(1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), 50000.00), -- Tomorrow
(2, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), 50000.00); -- The day after tomorrow
