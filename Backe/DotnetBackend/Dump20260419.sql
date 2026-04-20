-- MySQL dump 10.13  Distrib 8.0.44, for macos15 (arm64)
--
-- Host: 127.0.0.1    Database: webphim
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__EFMigrationsHistory`
--

DROP TABLE IF EXISTS `__EFMigrationsHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__EFMigrationsHistory` (
  `MigrationId` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductVersion` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`MigrationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__EFMigrationsHistory`
--

LOCK TABLES `__EFMigrationsHistory` WRITE;
/*!40000 ALTER TABLE `__EFMigrationsHistory` DISABLE KEYS */;
INSERT INTO `__EFMigrationsHistory` VALUES ('20260319072213_InitialCreate','9.0.14'),('20260416181331_AddMovieSoftDelete','9.0.15'),('20260417171542_AddShowtimeDraftStatus','9.0.15'),('20260417173310_AddMovieDraftStatus','9.0.15');
/*!40000 ALTER TABLE `__EFMigrationsHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_seats`
--

DROP TABLE IF EXISTS `booking_seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_seats` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `showtime_id` int NOT NULL,
  `seat_id` int NOT NULL,
  `Price` decimal(10,2) NOT NULL,
  `is_checked_in` tinyint(1) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `uq_showtime_seat` (`showtime_id`,`seat_id`),
  KEY `IX_booking_seats_booking_id` (`booking_id`),
  KEY `IX_booking_seats_seat_id` (`seat_id`),
  CONSTRAINT `FK_booking_seats_bookings_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_booking_seats_seats_seat_id` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`seat_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_booking_seats_showtimes_showtime_id` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`showtime_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_seats`
--

LOCK TABLES `booking_seats` WRITE;
/*!40000 ALTER TABLE `booking_seats` DISABLE KEYS */;
INSERT INTO `booking_seats` VALUES (1,1,1,11,100000.00,0),(4,3,2,11,100000.00,0),(6,5,19,28,10000.00,0),(11,10,19,32,10000.00,0),(13,12,19,33,10000.00,0),(32,31,29,3,10000.00,0),(34,33,38,3,10000.00,0),(35,34,38,4,10000.00,0),(40,39,39,3,10000.00,0),(41,40,39,4,10000.00,0),(42,41,39,5,10000.00,0),(43,42,40,3,10000.00,0),(44,42,40,4,10000.00,0),(46,44,40,1,10000.00,0),(47,44,40,2,10000.00,0);
/*!40000 ALTER TABLE `booking_seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `showtime_id` int NOT NULL,
  PRIMARY KEY (`booking_id`),
  KEY `IX_bookings_order_id` (`order_id`),
  KEY `IX_bookings_showtime_id` (`showtime_id`),
  CONSTRAINT `FK_bookings_orders_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_bookings_showtimes_showtime_id` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`showtime_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,1,1),(2,2,1),(3,3,2),(4,4,3),(5,5,19),(6,6,19),(7,7,19),(8,8,19),(9,9,19),(10,10,19),(11,11,19),(12,12,19),(13,13,15),(14,14,19),(15,15,19),(16,16,21),(17,17,21),(18,18,21),(19,19,21),(20,20,21),(21,21,21),(22,22,21),(23,23,21),(24,24,21),(25,25,21),(26,26,21),(27,27,22),(28,28,19),(29,29,22),(30,30,29),(31,31,29),(32,32,38),(33,33,38),(34,34,38),(35,35,38),(36,36,39),(37,37,39),(38,38,39),(39,39,39),(40,40,39),(41,41,39),(42,42,40),(43,43,40),(44,44,40);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movies`
--

DROP TABLE IF EXISTS `movies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movies` (
  `movie_id` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Duration` int DEFAULT NULL,
  `trailer_duration_minutes` int NOT NULL,
  `poster_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Banner` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Genre` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `release_date` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Director` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `cast_members` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `age_rating` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Rating` double NOT NULL,
  `Status` enum('draft','showing','coming') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`movie_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movies`
--

LOCK TABLES `movies` WRITE;
/*!40000 ALTER TABLE `movies` DISABLE KEYS */;
INSERT INTO `movies` VALUES (1,'Dune: Part Two','Hành trình...',166,10,'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg','https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg','Hành động, Viễn tưởng','2024-03-01','Denis Villeneuve','Timothée Chalamet','T13',8.5,'showing',1),(2,'Kung Fu Panda 4','Gấu Po...',94,10,'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg','https://image.tmdb.org/t/p/original/nLBRD7UPR6GjmWQp6ASAfCTaWKX.jpg','Hoạt hình, Hài hước','2024-03-08','Mike Mitchell','Jack Black, Awkwafina','P',7.2,'showing',1),(3,'Godzilla x Kong: The New Empire','Hai quái thú...',115,10,'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg','https://image.tmdb.org/t/p/original/fsSGGBMia81KAFuukQ4JOMIWYAQ.jpg','Hành động, Viễn tưởng','2024-03-29','Adam Wingard','Rebecca Hall','T13',6.8,'coming',1),(4,'the boys','mấy thằng bệnh ',100,10,'https://gamek.vn/gap-go-the-seven-phien-ban-ti-tien-cua-justice-league-trong-series-the-boys-20190803213721828.chn','https://www.google.com/imgres?q=the%20boys&imgurl=https%3A%2F%2Fmotchille.im%2Fwp-content%2Fuploads%2F2026%2F04%2Fsieu-anh-hung-pha-hoai-phan-5-29605-thumb.webp&imgrefurl=https%3A%2F%2Fmotchille.im%2Fphim%2Fthe-boys-phan-5&docid=HCLev3XyzSN7TM&tbnid=eO1Cka-94HZ0tM&vet=12ahUKEwiw067-qfWTAxWQp1YBHRFGCiIQnPAOegQIHxAB..i&w=2000&h=3000&hcb=2&itg=1&ved=2ahUKEwiw067-qfWTAxWQp1YBHRFGCiIQnPAOegQIHxAB','Hành động','2026-04-17','Hanh','Long','C18',0,'showing',0),(5,'your name','cuộc sống tình yêu của Hanh\n',90,10,'https://product.hstatic.net/200000287623/product/your_name_ln_-_bia1_cec970998b494761a56d632db3efd55d.jpg','https://nld.mediacdn.vn/2017/your-name-1484296118422.jpg','Hoạt hình','2026-04-17','Hiêpk','Hanh, bạn gái của Hanh','C16',0,'showing',1),(6,'your name','ádasd',90,10,'https://nld.mediacdn.vn/2017/your-name-1484296118422.jpg','https://nld.mediacdn.vn/2017/your-name-1484296118422.jpg','Kinh dị','2026-04-17','Hanh','hanh','C16',0,'showing',0),(7,'the boy','mấy thằng bệnh',90,10,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLLZdeoHeARE26jvV_POr9NSfDHdqRFLUDyA&s','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLLZdeoHeARE26jvV_POr9NSfDHdqRFLUDyA&s','Khoa học viễn tưởng','2026-04-17','HIẹp','hanh','C18',0,'showing',0);
/*!40000 ALTER TABLE `movies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `order_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `user_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `final_amount` decimal(10,2) NOT NULL,
  `Status` enum('pending','paid','cancelled','expired','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `expired_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `IX_orders_order_code` (`order_code`),
  KEY `IX_orders_user_id` (`user_id`),
  CONSTRAINT `FK_orders_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'CINEMA-PAID-001',3,100000.00,0.00,100000.00,'paid','SEPAY','2026-04-17 11:49:28.000000','2026-04-16 09:49:28.000000','2026-04-16 11:49:28.000000'),(2,'CINEMA-PEND-002',4,200000.00,0.00,200000.00,'cancelled','SEPAY','2026-04-16 11:58:28.000000','2026-04-16 11:49:28.000000','2026-04-18 13:34:45.700410'),(3,'CINEMA-EXPD-003',3,160000.00,0.00,160000.00,'expired','SEPAY','2026-04-16 11:44:28.000000','2026-04-16 11:34:28.000000','2026-04-16 11:49:28.000000'),(4,'CINEMA-CNCL-004',4,125000.00,0.00,125000.00,'cancelled','SEPAY','2026-04-16 11:19:28.000000','2026-04-16 10:49:28.000000','2026-04-16 11:49:28.000000'),(5,'DH5',1,10000.00,0.00,10000.00,'paid','QR','2026-04-17 18:00:30.214470','2026-04-17 17:50:30.214663','2026-04-18 02:03:00.470306'),(6,'DH6',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 18:00:43.436995','2026-04-17 17:50:43.437031','2026-04-18 13:34:45.705886'),(7,'DH7',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 19:07:58.149042','2026-04-17 18:57:58.149252','2026-04-18 13:34:45.706349'),(8,'DH8',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 19:14:53.674245','2026-04-17 19:04:53.674277','2026-04-18 13:34:45.708520'),(9,'DH9',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 19:16:12.289999','2026-04-17 19:06:12.290014','2026-04-18 13:34:45.709511'),(10,'DH10',1,10000.00,0.00,10000.00,'paid','QR','2026-04-17 19:20:02.285565','2026-04-17 19:10:02.285573','2026-04-18 02:12:17.958788'),(11,'DH11',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 19:24:28.191929','2026-04-17 19:14:28.191956','2026-04-18 13:34:45.709786'),(12,'DH12',1,10000.00,0.00,10000.00,'paid','QR','2026-04-17 19:29:25.965621','2026-04-17 19:19:25.965650','2026-04-18 02:23:16.220999'),(13,'DH13',1,1000000.00,0.00,1000000.00,'cancelled','QR','2026-04-17 19:35:20.611097','2026-04-17 19:25:20.611165','2026-04-18 13:34:45.710315'),(14,'DH14',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 19:35:47.468935','2026-04-17 19:25:47.468973','2026-04-18 13:34:45.710588'),(15,'DH15',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 19:37:12.165749','2026-04-17 19:27:12.165935','2026-04-18 13:34:45.710795'),(16,'DH16',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 19:45:14.705270','2026-04-17 19:35:14.705399','2026-04-18 13:34:45.710933'),(17,'DH17',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-17 20:13:07.434183','2026-04-17 20:03:07.434211','2026-04-18 13:34:45.711228'),(18,'DH18',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 04:51:49.190977','2026-04-18 04:41:49.190997','2026-04-18 13:34:45.711876'),(19,'DH19',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 05:14:08.660942','2026-04-18 05:04:08.661143','2026-04-18 13:34:45.712238'),(20,'DH20',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 05:26:09.270390','2026-04-18 05:16:09.270608','2026-04-18 13:34:45.712537'),(21,'DH21',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 06:45:20.839130','2026-04-18 06:35:20.839229','2026-04-18 13:45:21.788100'),(22,'DH22',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 06:45:26.340274','2026-04-18 06:35:26.340276','2026-04-18 13:45:26.831900'),(23,'DH23',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 06:45:30.168567','2026-04-18 06:35:30.168570','2026-04-18 13:45:31.901980'),(24,'DH24',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 06:50:55.049023','2026-04-18 06:40:55.049199','2026-04-18 13:50:55.720369'),(25,'DH25',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 06:55:52.422954','2026-04-18 06:45:52.423111','2026-04-18 13:55:52.506868'),(26,'DH26',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 07:03:00.485955','2026-04-18 06:53:00.485971','2026-04-18 14:03:05.362970'),(27,'DH27',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 07:09:31.867003','2026-04-18 06:59:31.867012','2026-04-18 14:09:33.571808'),(28,'DH28',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 07:26:35.773434','2026-04-18 07:16:35.773451','2026-04-18 14:26:40.376730'),(29,'DH29',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 07:26:59.382437','2026-04-18 07:16:59.382474','2026-04-18 14:27:00.540735'),(30,'DH30',1,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 07:39:10.677471','2026-04-18 07:29:10.677498','2026-04-18 14:39:15.656974'),(31,'DH31',1,10000.00,0.00,10000.00,'paid','QR','2026-04-18 07:50:16.671038','2026-04-18 07:40:16.671210','2026-04-18 14:50:12.498045'),(32,'DH32',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 08:31:10.067883','2026-04-18 08:21:10.067921','2026-04-18 15:40:21.463234'),(33,'DH33',5,10000.00,0.00,10000.00,'paid','QR','2026-04-18 08:57:35.783255','2026-04-18 08:47:35.783433','2026-04-18 15:51:35.363274'),(34,'DH34',1,10000.00,0.00,10000.00,'paid','QR','2026-04-18 09:14:01.626759','2026-04-18 09:04:01.626965','2026-04-18 16:06:15.290756'),(35,'DH35',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 11:10:01.609285','2026-04-18 11:00:01.609705','2026-04-18 18:10:05.924458'),(36,'DH36',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 16:47:21.832006','2026-04-18 16:37:21.832222','2026-04-18 23:41:28.163490'),(37,'DH37',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 23:51:36.154526','2026-04-18 23:41:36.154644','2026-04-18 23:51:38.282181'),(38,'DH38',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-18 23:55:43.683555','2026-04-18 23:45:43.683557','2026-04-18 23:55:45.220046'),(39,'DH39',5,10000.00,0.00,10000.00,'paid','QR','2026-04-19 00:06:06.740279','2026-04-18 23:56:06.740322','2026-04-18 23:56:18.730343'),(40,'DH40',5,10000.00,0.00,10000.00,'paid','QR','2026-04-19 00:09:56.033914','2026-04-18 23:59:56.034103','2026-04-19 00:01:46.117375'),(41,'DH41',5,10000.00,0.00,10000.00,'paid','QR','2026-04-19 00:18:32.508271','2026-04-19 00:08:32.508282','2026-04-19 00:08:54.978507'),(42,'DH42',5,20000.00,0.00,20000.00,'paid','QR','2026-04-19 00:19:14.523487','2026-04-19 00:09:14.523504','2026-04-19 00:09:26.143630'),(43,'DH43',5,10000.00,0.00,10000.00,'cancelled','QR','2026-04-19 00:25:13.556098','2026-04-19 00:15:13.556124','2026-04-19 00:36:44.496261'),(44,'DH44',5,20000.00,0.00,20000.00,'paid','QR','2026-04-19 00:27:50.476830','2026-04-19 00:17:50.476861','2026-04-19 00:18:03.077456');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `room_id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `total_seats` int DEFAULT NULL,
  `Status` enum('active','maintenance') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'Phòng 1 (2D Standard)',25,'active'),(2,'Phòng 2 (3D Premium)',25,'active'),(3,'Phòng 3 (IMAX)',25,'maintenance');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat_types`
--

DROP TABLE IF EXISTS `seat_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seat_types` (
  `seat_type_id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Surcharge` decimal(10,2) NOT NULL,
  PRIMARY KEY (`seat_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat_types`
--

LOCK TABLES `seat_types` WRITE;
/*!40000 ALTER TABLE `seat_types` DISABLE KEYS */;
INSERT INTO `seat_types` VALUES (1,'Normal',0.00),(2,'VIP',20000.00),(3,'Couple',50000.00);
/*!40000 ALTER TABLE `seat_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `seat_id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `seat_type_id` int NOT NULL,
  `row_name` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `seat_number` int NOT NULL,
  PRIMARY KEY (`seat_id`),
  UNIQUE KEY `uq_room_seat` (`room_id`,`row_name`,`seat_number`),
  KEY `IX_seats_seat_type_id` (`seat_type_id`),
  CONSTRAINT `FK_seats_rooms_room_id` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_seats_seat_types_seat_type_id` FOREIGN KEY (`seat_type_id`) REFERENCES `seat_types` (`seat_type_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
INSERT INTO `seats` VALUES (1,1,1,'A',1),(2,1,1,'A',2),(3,1,1,'A',3),(4,1,1,'A',4),(5,1,1,'A',5),(6,1,1,'B',1),(7,1,1,'B',2),(8,1,1,'B',3),(9,1,1,'B',4),(10,1,1,'B',5),(11,1,2,'C',1),(12,1,2,'C',2),(13,1,2,'C',3),(14,1,2,'C',4),(15,1,2,'C',5),(16,1,2,'D',1),(17,1,2,'D',2),(18,1,2,'D',3),(19,1,2,'D',4),(20,1,2,'D',5),(21,1,3,'E',1),(22,1,3,'E',2),(23,1,3,'E',3),(24,1,3,'E',4),(25,1,3,'E',5),(26,2,1,'A',1),(27,2,1,'A',2),(28,2,1,'A',3),(29,2,1,'A',4),(30,2,1,'A',5),(31,2,1,'B',1),(32,2,1,'B',2),(33,2,1,'B',3),(34,2,1,'B',4),(35,2,1,'B',5),(36,2,2,'C',1),(37,2,2,'C',2),(38,2,2,'C',3),(39,2,2,'C',4),(40,2,2,'C',5),(41,2,2,'D',1),(42,2,2,'D',2),(43,2,2,'D',3),(44,2,2,'D',4),(45,2,2,'D',5),(46,2,3,'E',1),(47,2,3,'E',2),(48,2,3,'E',3),(49,2,3,'E',4),(50,2,3,'E',5);
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `showtimes`
--

DROP TABLE IF EXISTS `showtimes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `showtimes` (
  `showtime_id` int NOT NULL AUTO_INCREMENT,
  `movie_id` int NOT NULL,
  `room_id` int NOT NULL,
  `start_time` datetime(6) NOT NULL,
  `end_time` datetime(6) DEFAULT NULL,
  `buffer_time_minutes` int NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `Status` enum('draft','active','cancelled','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `batch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`showtime_id`),
  KEY `IX_showtimes_movie_id` (`movie_id`),
  KEY `IX_showtimes_room_id` (`room_id`),
  CONSTRAINT `FK_showtimes_movies_movie_id` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`movie_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_showtimes_rooms_room_id` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `showtimes`
--

LOCK TABLES `showtimes` WRITE;
/*!40000 ALTER TABLE `showtimes` DISABLE KEYS */;
INSERT INTO `showtimes` VALUES (1,4,1,'2026-04-17 08:00:00.000000','2026-04-17 09:55:00.000000',15,80000.00,'cancelled','BATCH1'),(2,1,1,'2026-04-18 08:49:28.000000','2026-04-18 11:49:28.000000',15,80000.00,'cancelled','BATCH1'),(3,2,2,'2026-04-17 09:49:28.000000','2026-04-17 11:49:28.000000',15,75000.00,'cancelled','BATCH2'),(4,1,1,'2026-04-16 06:49:28.000000','2026-04-16 09:49:28.000000',15,80000.00,'completed','BATCH1'),(5,4,2,'2026-04-17 13:00:00.000000','2026-04-17 14:55:00.000000',15,7500.00,'cancelled',NULL),(6,4,1,'2026-04-17 10:10:00.000000','2026-04-17 11:50:00.000000',15,80000.00,'cancelled',NULL),(7,4,1,'2026-04-17 12:05:00.000000','2026-04-17 13:45:00.000000',15,80000.00,'cancelled',NULL),(8,4,1,'2026-04-17 14:00:00.000000','2026-04-17 15:40:00.000000',15,80000.00,'cancelled',NULL),(9,4,1,'2026-04-17 15:55:00.000000','2026-04-17 17:35:00.000000',15,80000.00,'cancelled',NULL),(10,4,1,'2026-04-17 17:50:00.000000','2026-04-17 19:30:00.000000',15,80000.00,'cancelled',NULL),(11,4,1,'2026-04-17 19:45:00.000000','2026-04-17 21:25:00.000000',15,80000.00,'cancelled',NULL),(12,4,1,'2026-04-17 08:00:00.000000','2026-04-17 09:40:00.000000',15,1000000.00,'cancelled',NULL),(13,4,1,'2026-04-17 09:55:00.000000','2026-04-17 11:35:00.000000',15,1000000.00,'cancelled',NULL),(14,4,1,'2026-04-17 11:50:00.000000','2026-04-17 13:30:00.000000',15,1000000.00,'cancelled',NULL),(15,4,1,'2026-04-17 13:45:00.000000','2026-04-17 15:25:00.000000',15,1000000.00,'active',NULL),(16,4,1,'2026-04-17 15:40:00.000000','2026-04-17 17:20:00.000000',15,1000000.00,'active',NULL),(17,4,1,'2026-04-17 17:35:00.000000','2026-04-17 19:15:00.000000',15,1000000.00,'active',NULL),(18,4,1,'2026-04-17 19:30:00.000000','2026-04-17 21:10:00.000000',15,1000000.00,'cancelled',NULL),(19,1,2,'2026-04-17 08:00:00.000000','2026-04-17 10:46:00.000000',15,10000.00,'active',NULL),(20,1,2,'2026-04-17 11:01:00.000000','2026-04-17 13:47:00.000000',15,10000.00,'cancelled',NULL),(21,1,2,'2026-04-17 14:02:00.000000','2026-04-17 16:48:00.000000',15,10000.00,'active',NULL),(22,1,2,'2026-04-17 17:03:00.000000','2026-04-17 19:49:00.000000',15,10000.00,'active',NULL),(23,1,2,'2026-04-17 20:04:00.000000','2026-04-17 22:50:00.000000',15,10000.00,'cancelled',NULL),(24,1,1,'2026-04-17 08:00:00.000000','2026-04-17 10:46:00.000000',15,500000.00,'draft',NULL),(25,1,2,'2026-04-17 11:01:00.000000','2026-04-17 13:47:00.000000',15,5000000.00,'draft',NULL),(26,1,2,'2026-04-17 20:04:00.000000','2026-04-17 22:50:00.000000',15,5000000.00,'draft',NULL),(27,6,3,'2026-04-17 08:00:00.000000','2026-04-17 09:45:00.000000',15,1000000.00,'active',NULL),(28,1,1,'2026-04-18 12:04:28.000000','2026-04-18 14:50:28.000000',15,10000.00,'cancelled',NULL),(29,1,1,'2026-04-18 15:05:28.000000','2026-04-18 17:51:28.000000',15,10000.00,'cancelled',NULL),(30,1,1,'2026-04-18 18:06:28.000000','2026-04-18 20:52:28.000000',15,10000.00,'cancelled',NULL),(31,7,1,'2026-04-18 08:00:00.000000','2026-04-18 09:30:00.000000',15,10000.00,'active',NULL),(32,7,1,'2026-04-18 09:45:00.000000','2026-04-18 11:15:00.000000',15,10000.00,'active',NULL),(33,7,1,'2026-04-18 11:30:00.000000','2026-04-18 13:00:00.000000',15,10000.00,'active',NULL),(34,7,1,'2026-04-18 13:15:00.000000','2026-04-18 14:45:00.000000',15,10000.00,'active',NULL),(35,7,1,'2026-04-18 15:00:00.000000','2026-04-18 16:30:00.000000',15,10000.00,'draft',NULL),(36,7,1,'2026-04-18 16:45:00.000000','2026-04-18 18:15:00.000000',15,10000.00,'draft',NULL),(37,7,1,'2026-04-18 18:30:00.000000','2026-04-18 20:00:00.000000',15,10000.00,'draft',NULL),(38,7,1,'2026-04-18 20:15:00.000000','2026-04-18 21:45:00.000000',15,10000.00,'active',NULL),(39,7,1,'2026-04-19 08:00:00.000000','2026-04-19 09:30:00.000000',15,10000.00,'active',NULL),(40,7,1,'2026-04-19 09:45:00.000000','2026-04-19 11:15:00.000000',15,10000.00,'active',NULL),(41,7,1,'2026-04-19 11:30:00.000000','2026-04-19 13:00:00.000000',15,10000.00,'active',NULL),(42,7,1,'2026-04-19 13:15:00.000000','2026-04-19 14:45:00.000000',15,10000.00,'active',NULL),(43,7,1,'2026-04-19 15:00:00.000000','2026-04-19 16:30:00.000000',15,10000.00,'active',NULL),(44,7,1,'2026-04-19 16:45:00.000000','2026-04-19 18:15:00.000000',15,10000.00,'active',NULL),(45,7,1,'2026-04-19 18:30:00.000000','2026-04-19 20:00:00.000000',15,10000.00,'active',NULL),(46,7,1,'2026-04-19 20:15:00.000000','2026-04-19 21:45:00.000000',15,10000.00,'active',NULL);
/*!40000 ALTER TABLE `showtimes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `phone_number` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Role` enum('admin','staff','customer') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `IX_users_Email` (`Email`),
  UNIQUE KEY `IX_users_Username` (`Username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$11$pnhI69OGmiL3.EtCh4cl1ud6vN7dKLZXmYuX4lCRFx.5DPzqEClfW','admin@cinema.vn','Admin System','0900000001','admin','2026-04-16 11:49:28.000000'),(2,'staff01','$2a$11$pnhI69OGmiL3.EtCh4cl1ud6vN7dKLZXmYuX4lCRFx.5DPzqEClfW','staff@cinema.vn','Nhan Vien 01','0900000002','staff','2026-04-16 11:49:28.000000'),(3,'customer1','$2a$11$pnhI69OGmiL3.EtCh4cl1ud6vN7dKLZXmYuX4lCRFx.5DPzqEClfW','khach1@gmail.com','Nguyen Van A','0912345601','customer','2026-04-16 11:49:28.000000'),(4,'customer2','$2a$11$pnhI69OGmiL3.EtCh4cl1ud6vN7dKLZXmYuX4lCRFx.5DPzqEClfW','khach2@gmail.com','Tran Thi B','0912345602','customer','2026-04-16 11:49:28.000000'),(5,'nh.hoanganh74@gmail.com','$2a$11$sai7eQqSErclpoikx0PMvuXwjMDQBmr1bloB5dByq3.JnEoWl14oC','nh.hoanganh74@gmail.com','Nguyễn Hữu Hoàng Anh','0912163785','customer','2026-04-17 20:02:44.224587');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-19 17:34:13
