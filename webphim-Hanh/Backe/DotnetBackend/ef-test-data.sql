SET SQL_SAFE_UPDATES = 0;

DELETE FROM BookingSeats;
DELETE FROM Bookings;
DELETE FROM Orders;
DELETE FROM Showtimes;
DELETE FROM Seats;
DELETE FROM SeatTypes;
DELETE FROM Rooms;
DELETE FROM Movies;
DELETE FROM Users;

ALTER TABLE BookingSeats AUTO_INCREMENT = 1;
ALTER TABLE Bookings AUTO_INCREMENT = 1;
ALTER TABLE Orders AUTO_INCREMENT = 1;
ALTER TABLE Showtimes AUTO_INCREMENT = 1;
ALTER TABLE Seats AUTO_INCREMENT = 1;
ALTER TABLE SeatTypes AUTO_INCREMENT = 1;
ALTER TABLE Rooms AUTO_INCREMENT = 1;
ALTER TABLE Movies AUTO_INCREMENT = 1;
ALTER TABLE Users AUTO_INCREMENT = 1;

INSERT INTO Users (Username, PasswordHash, Email, FullName, PhoneNumber, Role, CreatedAt) VALUES
('admin',     '$2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q', 'admin@cinema.vn',   'Admin System',  '0900000001', 'admin',    NOW()),
('staff01',   '$2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q', 'staff@cinema.vn',   'Nhan Vien 01',  '0900000002', 'staff',    NOW()),
('customer1', '$2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q', 'khach1@gmail.com',  'Nguyen Van A',  '0912345601', 'customer', NOW()),
('customer2', '$2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q', 'khach2@gmail.com',  'Tran Thi B',    '0912345602', 'customer', NOW());

INSERT INTO Movies (Title, Description, Duration, Poster, Banner, Genre, ReleaseDate, Director, CastMembers, AgeRating, Rating, Status) VALUES
('Dune: Part Two', 'Hành trình...', 166, 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg', 'Hành động, Viễn tưởng', '2024-03-01', 'Denis Villeneuve', 'Timothée Chalamet', 'T13', 8.5, 'showing'),
('Kung Fu Panda 4', 'Gấu Po...', 94, 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg', 'https://image.tmdb.org/t/p/original/nLBRD7UPR6GjmWQp6ASAfCTaWKX.jpg', 'Hoạt hình, Hài hước', '2024-03-08', 'Mike Mitchell', 'Jack Black, Awkwafina', 'P', 7.2, 'showing'),
('Godzilla x Kong: The New Empire', 'Hai quái thú...', 115, 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg', 'https://image.tmdb.org/t/p/original/fsSGGBMia81KAFuukQ4JOMIWYAQ.jpg', 'Hành động, Viễn tưởng', '2024-03-29', 'Adam Wingard', 'Rebecca Hall', 'T13', 6.8, 'coming');

INSERT INTO Rooms (Name, TotalSeats, Status) VALUES
('Phòng 1 (2D Standard)', 25, 'active'),
('Phòng 2 (3D Premium)',  25, 'active'),
('Phòng 3 (IMAX)',        25, 'maintenance');

INSERT INTO SeatTypes (Name, Surcharge) VALUES
('Normal', 0), ('VIP', 20000), ('Couple', 50000);

INSERT INTO Seats (RoomId, SeatTypeId, RowName, SeatNumber) VALUES
(1, 1, 'A', 1), (1, 1, 'A', 2), (1, 1, 'A', 3), (1, 1, 'A', 4), (1, 1, 'A', 5),
(1, 1, 'B', 1), (1, 1, 'B', 2), (1, 1, 'B', 3), (1, 1, 'B', 4), (1, 1, 'B', 5),
(1, 2, 'C', 1), (1, 2, 'C', 2), (1, 2, 'C', 3), (1, 2, 'C', 4), (1, 2, 'C', 5),
(1, 2, 'D', 1), (1, 2, 'D', 2), (1, 2, 'D', 3), (1, 2, 'D', 4), (1, 2, 'D', 5),
(1, 3, 'E', 1), (1, 3, 'E', 2), (1, 3, 'E', 3), (1, 3, 'E', 4), (1, 3, 'E', 5),
(2, 1, 'A', 1), (2, 1, 'A', 2), (2, 1, 'A', 3), (2, 1, 'A', 4), (2, 1, 'A', 5),
(2, 1, 'B', 1), (2, 1, 'B', 2), (2, 1, 'B', 3), (2, 1, 'B', 4), (2, 1, 'B', 5),
(2, 2, 'C', 1), (2, 2, 'C', 2), (2, 2, 'C', 3), (2, 2, 'C', 4), (2, 2, 'C', 5),
(2, 2, 'D', 1), (2, 2, 'D', 2), (2, 2, 'D', 3), (2, 2, 'D', 4), (2, 2, 'D', 5),
(2, 3, 'E', 1), (2, 3, 'E', 2), (2, 3, 'E', 3), (2, 3, 'E', 4), (2, 3, 'E', 5);

INSERT INTO Showtimes (MovieId, RoomId, StartTime, EndTime, BufferTimeMinutes, BasePrice, Status, BatchId) VALUES
(1, 1, DATE_ADD(NOW(), INTERVAL 20 HOUR),  DATE_ADD(NOW(), INTERVAL 23 HOUR), 15, 80000.00, 'active', 'BATCH1'),
(1, 1, DATE_ADD(NOW(), INTERVAL 45 HOUR),  DATE_ADD(NOW(), INTERVAL 48 HOUR), 15, 80000.00, 'active', 'BATCH1'),
(2, 2, DATE_ADD(NOW(), INTERVAL 22 HOUR),  DATE_ADD(NOW(), INTERVAL 24 HOUR), 15, 75000.00, 'active', 'BATCH2'),
(1, 1, DATE_SUB(NOW(), INTERVAL 5 HOUR),   DATE_SUB(NOW(), INTERVAL 2 HOUR), 15, 80000.00, 'completed', 'BATCH1');

INSERT INTO Orders (OrderCode, UserId, TotalAmount, DiscountAmount, FinalAmount, Status, PaymentMethod, ExpiredAt, CreatedAt, UpdatedAt) VALUES
('CINEMA-PAID-001', 3, 100000.00, 0.00, 100000.00, 'paid', 'SEPAY', DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW()),
('CINEMA-PEND-002', 4, 200000.00, 0.00, 200000.00, 'pending', 'SEPAY', DATE_ADD(NOW(), INTERVAL 9 MINUTE), NOW(), NOW()),
('CINEMA-EXPD-003', 3, 160000.00, 0.00, 160000.00, 'expired', 'SEPAY', DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE), NOW()),
('CINEMA-CNCL-004', 4, 125000.00, 0.00, 125000.00, 'cancelled', 'SEPAY', DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW());

INSERT INTO Bookings (OrderId, ShowtimeId) VALUES
(1, 1), (2, 1), (3, 2), (4, 3);

INSERT INTO BookingSeats (BookingId, ShowtimeId, SeatId, Price, IsCheckedIn) VALUES
(1, 1, 11, 100000.00, 0),
(2, 1, 12, 100000.00, 0),
(2, 1, 13, 100000.00, 0),
(3, 2, 11, 100000.00, 0),
(4, 3, 46, 125000.00, 0);
