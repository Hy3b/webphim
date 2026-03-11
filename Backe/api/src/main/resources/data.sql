USE Cinema_DB;

-- 1. Create a test user
INSERT IGNORE INTO users (username, password_hash, email, full_name, phone_number, role)
VALUES ('testuser', '$2a$10$dummyhash...', 'user@test.com', 'Test User', '0123456789', 'customer');

-- 2. Create movies (Dữ liệu thật để test UI đẹp)
INSERT IGNORE INTO movies (title, description, duration_minutes, poster_url, status, banner, genre, release_date, director, cast_members, age_rating, rating)
VALUES 
('Mai', 'Trấn Thành đạo diễn bộ phim tình cảm gia đình...', 131, 'https://upload.wikimedia.org/wikipedia/vi/8/87/Mai_2024_poster.jpg', 'showing', 'https://kenh14cdn.com/203336854389633024/2024/2/15/photo-1-17079932155601344585154.jpg', 'Tình Cảm, Tâm Lý', '2024-02-10', 'Trấn Thành', 'Phương Anh Đào, Tuấn Trần', 'T18', 8.5),
('Gặp Lại Chị Bầu', 'Phúc tình cờ quay về quá khứ và gặp mẹ mình...', 113, 'https://upload.wikimedia.org/wikipedia/vi/a/a3/G%E1%BA%B7p_L%E1%BA%A1i_Ch%E1%BB%8B_B%E1%BA%A7u_poster.jpg', 'showing', 'https://vtv1.mediacdn.vn/2024/1/15/glcb-1705307223793615309320.jpg', 'Hài, Gia Đình', '2024-02-10', 'Nhất Trung', 'Anh Tú, Diệu Nhi', 'T13', 7.2),
('Dune: Part Two', 'Paul Atreides unites with...', 166, 'https://upload.wikimedia.org/wikipedia/vi/f/f4/Dune_part_2_poster.jpg', 'showing', 'https://static1.colliderimages.com/wordpress/wp-content/uploads/2023/12/dune-2-poster-social-featured.jpg', 'Hành động, Viễn tưởng', '2024-03-01', 'Denis Villeneuve', 'Timothée Chalamet, Zendaya', 'T13', 8.8),
('Kung Fu Panda 4', 'Po must train a new warrior...', 94, 'https://upload.wikimedia.org/wikipedia/vi/9/90/Kung_Fu_Panda_4_poster.jpg', 'showing', 'https://assets-prd.ignimgs.com/2023/12/13/kungfupanda4-blogroll-1702484758764.jpg', 'Hoạt hình, Hài', '2024-03-08', 'Mike Mitchell', 'Jack Black', 'P', 7.5);

-- 3. Create a room
INSERT IGNORE INTO rooms (name, total_seats)
VALUES ('Room 1', 15);

-- 4. Create seat types
INSERT IGNORE INTO seat_types (name, surcharge)
VALUES 
('Normal', 0.00),
('VIP', 20000.00),
('Couple', 50000.00);

-- 5. Create seats for Room 1
INSERT IGNORE INTO seats (room_id, seat_type_id, row_name, seat_number)
VALUES
-- Row A (Normal, type=1)
(1, 1, 'A', 1), (1, 1, 'A', 2), (1, 1, 'A', 3), (1, 1, 'A', 4), (1, 1, 'A', 5),
-- Row B (Normal, type=1)
(1, 1, 'B', 6), (1, 1, 'B', 7), (1, 1, 'B', 8), (1, 1, 'B', 9), (1, 1, 'B', 10),
-- Row C (VIP, type=2)
(1, 2, 'C', 11), (1, 2, 'C', 12), (1, 2, 'C', 13), (1, 2, 'C', 14), (1, 2, 'C', 15);

-- 6. Create showtimes cho cả 4 phim
INSERT IGNORE INTO showtimes (movie_id, room_id, start_time, base_price)
VALUES 
(1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), 90000.00), -- Phim Mai
(2, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), 85000.00), -- Chi Bau
(3, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), 100000.00), -- Dune 2
(4, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), 75000.00); -- Kung Fu Panda 4
