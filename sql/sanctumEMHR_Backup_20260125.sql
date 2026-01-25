/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: localhost    Database: sanctumEMHR
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointment_categories`
--

DROP TABLE IF EXISTS `appointment_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `default_duration` int(11) DEFAULT 60,
  `is_billable` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category_type` enum('client','clinic','holiday') DEFAULT 'client' COMMENT 'Client=billable encounter, Clinic=internal time, Holiday=closure',
  `requires_cpt_selection` tinyint(1) DEFAULT 0 COMMENT 'Show CPT dropdown when scheduling',
  `blocks_availability` tinyint(1) DEFAULT 0 COMMENT 'Blocks provider availability',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment_categories`
--

LOCK TABLES `appointment_categories` WRITE;
/*!40000 ALTER TABLE `appointment_categories` DISABLE KEYS */;
INSERT INTO `appointment_categories` VALUES
(1,'Individual Therapy','Individual psychotherapy session','#3B82F6',50,1,1,1,'2026-01-24 18:28:12','2026-01-24 18:28:12','client',1,0),
(2,'Family Therapy','Family psychotherapy session','#10B981',60,1,1,2,'2026-01-24 18:28:12','2026-01-24 18:28:12','client',1,0),
(3,'Group Therapy','Group psychotherapy session','#8B5CF6',90,1,1,3,'2026-01-24 18:28:12','2026-01-24 18:28:12','client',1,0),
(4,'Initial Intake','Initial evaluation and assessment','#F59E0B',90,1,1,4,'2026-01-24 18:28:12','2026-01-24 18:28:12','client',1,0),
(5,'Crisis Intervention','Crisis intervention session','#EF4444',50,1,1,5,'2026-01-24 18:28:12','2026-01-24 18:28:12','client',1,0),
(6,'Staff Meeting','Internal staff meeting','#6B7280',60,0,1,10,'2026-01-24 18:28:12','2026-01-24 18:28:12','clinic',0,1),
(7,'Supervision','Clinical supervision','#06B6D4',60,0,1,11,'2026-01-24 18:28:12','2026-01-24 19:21:37','clinic',0,1),
(8,'Training','Staff training session','#84CC16',120,0,1,12,'2026-01-24 18:28:12','2026-01-24 18:28:12','clinic',0,1),
(9,'Holiday','Office closed for holiday','#DC2626',480,0,0,20,'2026-01-24 18:28:12','2026-01-24 19:02:18','holiday',0,1),
(10,'Vacation','Provider vacation/time off','#F97316',480,0,1,21,'2026-01-24 18:28:12','2026-01-24 19:22:05','holiday',0,1),
(11,'Out of Office','Provider out of office','#A855F7',480,0,1,22,'2026-01-24 18:28:12','2026-01-24 19:21:46','holiday',0,1);
/*!40000 ALTER TABLE `appointment_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointment_recurrence`
--

DROP TABLE IF EXISTS `appointment_recurrence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_recurrence` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_appointment_id` bigint(20) unsigned NOT NULL,
  `recurrence_pattern` enum('daily','weekly','biweekly','monthly') NOT NULL,
  `recurrence_count` int(11) DEFAULT NULL,
  `recurrence_end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `parent_appointment_id` (`parent_appointment_id`),
  CONSTRAINT `appointment_recurrence_ibfk_1` FOREIGN KEY (`parent_appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment_recurrence`
--

LOCK TABLES `appointment_recurrence` WRITE;
/*!40000 ALTER TABLE `appointment_recurrence` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointment_recurrence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `provider_id` bigint(20) unsigned NOT NULL,
  `facility_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `start_datetime` timestamp NOT NULL,
  `end_datetime` timestamp NOT NULL,
  `duration` int(11) DEFAULT NULL,
  `status` enum('scheduled','confirmed','arrived','in_session','completed','cancelled','no_show') DEFAULT 'scheduled',
  `appointment_type` varchar(50) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `reminder_sent` tinyint(1) DEFAULT 0,
  `reminder_sent_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cpt_code_id` int(11) DEFAULT NULL COMMENT 'CPT code used for this appointment',
  `modifier_id` int(11) DEFAULT NULL COMMENT 'Billing modifier (override provider default)',
  `billing_fee` decimal(10,2) DEFAULT NULL COMMENT 'Actual fee charged for this appointment',
  `fee_type` enum('cpt','custom','pro-bono','none') DEFAULT 'none' COMMENT 'How fee was determined',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `cancelled_by` (`cancelled_by`),
  KEY `created_by` (`created_by`),
  KEY `idx_client` (`client_id`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_facility` (`facility_id`),
  KEY `idx_start_datetime` (`start_datetime`),
  KEY `idx_status` (`status`),
  KEY `idx_cpt_code` (`cpt_code_id`),
  KEY `idx_modifier` (`modifier_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`),
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`),
  CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`category_id`) REFERENCES `appointment_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `appointments_ibfk_6` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `event_type` varchar(50) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` bigint(20) unsigned DEFAULT NULL,
  `action_description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=160 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES
(1,NULL,'user_created','user',1,'New user created',NULL,NULL,NULL,NULL,'2026-01-16 21:47:16'),
(2,NULL,'login','user',1,'Successful login','104.8.162.101','curl/7.88.1',NULL,NULL,'2026-01-16 21:50:04'),
(3,NULL,'login','user',1,'Successful login','104.8.162.101','curl/7.88.1',NULL,NULL,'2026-01-16 21:53:44'),
(4,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 01:14:49'),
(5,2,'login','user',2,'Successful login',NULL,NULL,NULL,NULL,'2026-01-18 01:14:55'),
(6,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 01:17:31'),
(7,2,'login','user',2,'Successful login',NULL,NULL,NULL,NULL,'2026-01-18 01:18:28'),
(8,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 01:19:52'),
(9,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 01:30:33'),
(10,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 01:35:15'),
(11,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 01:39:12'),
(12,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 01:41:11'),
(13,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 13:14:14'),
(14,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 13:14:43'),
(15,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 13:25:45'),
(16,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 13:29:20'),
(17,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 14:10:17'),
(18,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 14:15:00'),
(19,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 14:18:43'),
(20,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 14:30:31'),
(21,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 14:51:00'),
(22,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 19:18:14'),
(23,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 19:24:05'),
(24,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 19:34:59'),
(25,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 19:54:26'),
(26,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-18 20:01:55'),
(27,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 01:23:34'),
(28,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 03:36:48'),
(29,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:31:03'),
(30,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:38:34'),
(31,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:38:56'),
(32,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:39:53'),
(33,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:47:52'),
(34,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:48:05'),
(35,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:51:01'),
(36,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:51:26'),
(37,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:55:59'),
(38,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 14:56:11'),
(39,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:01:15'),
(40,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:01:32'),
(41,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:06:29'),
(42,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:30:56'),
(43,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:33:32'),
(44,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:36:44'),
(45,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:37:05'),
(46,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:38:13'),
(47,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:39:49'),
(48,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:41:18'),
(49,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:42:17'),
(50,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:42:37'),
(51,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 15:43:41'),
(52,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 15:44:39'),
(53,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:47:08'),
(54,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 15:47:59'),
(55,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:19:04'),
(56,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:25:17'),
(57,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:36:23'),
(58,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:39:25'),
(59,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:41:52'),
(60,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 18:42:44'),
(61,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:42:58'),
(62,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 18:45:27'),
(63,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 18:45:59'),
(64,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 18:46:05'),
(65,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:46:19'),
(66,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 18:47:34'),
(67,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:49:50'),
(68,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:52:34'),
(69,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 18:53:05'),
(70,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2026-01-19 18:55:34'),
(71,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:56:34'),
(72,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 18:57:35'),
(73,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 19:01:47'),
(74,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 19:08:34'),
(75,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 20:20:05'),
(76,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 20:34:12'),
(77,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 20:36:20'),
(78,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 20:46:04'),
(79,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-19 20:52:50'),
(80,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:23:12'),
(81,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:37:38'),
(82,9,'login_failed','user',9,'Failed login for username: staff.davis. Reason: Invalid password','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:46:56'),
(83,9,'login_failed','user',9,'Failed login for username: staff.davis. Reason: Invalid password','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:47:03'),
(84,8,'login_failed','user',8,'Failed login for username: staff.jones. Reason: Invalid password','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:47:14'),
(85,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:47:21'),
(86,9,'login_failed','user',9,'Failed login for username: staff.davis. Reason: Invalid password','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:48:06'),
(87,8,'login_failed','user',8,'Failed login for username: staff.jones. Reason: Invalid password','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:49:04'),
(88,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:49:10'),
(89,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 12:54:33'),
(90,2,'login','user',2,'Successful login','74.62.87.72','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 21:13:56'),
(91,2,'login','user',2,'Successful login','74.62.87.72','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 21:44:12'),
(92,2,'login','user',2,'Successful login','74.62.87.72','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 22:23:00'),
(93,2,'login','user',2,'Successful login','74.62.87.72','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-20 22:36:41'),
(94,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:23:14'),
(95,9,'login_failed','user',9,'Failed login for username: staff.davis. Reason: Invalid password','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:23:38'),
(96,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:24:09'),
(97,9,'password_change','user',9,'Password changed','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:24:22'),
(98,9,'password_change','user',9,'Password changed','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:25:02'),
(99,9,'login_failed','user',9,'Failed login for username: staff.davis. Reason: Account locked due to too many failed attempts','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:25:32'),
(100,9,'login_failed','user',9,'Failed login for username: rdavis. Reason: Account locked','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:26:48'),
(101,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:27:33'),
(102,9,'password_change','user',9,'Password changed','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:27:52'),
(103,9,'login_failed','user',9,'Failed login for username: rdavis. Reason: Account locked','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:28:18'),
(104,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:28:51'),
(105,9,'login_failed','user',9,'Failed login for username: rdavis. Reason: Account locked','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:36:39'),
(106,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:36:48'),
(107,9,'password_change','user',9,'Password changed','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:37:06'),
(108,9,'login_failed','user',9,'Failed login for username: rdavis. Reason: Account locked','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:37:16'),
(109,9,'login_failed','user',9,'Failed login for username: rdavis. Reason: Account locked','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:41:47'),
(110,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:41:53'),
(111,9,'password_change','user',9,'Password changed','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:42:08'),
(112,10,'user_created','user',10,'New user created','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:42:54'),
(113,10,'login','user',10,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:43:11'),
(114,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:58:13'),
(115,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:58:41'),
(116,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:59:37'),
(117,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 13:59:43'),
(118,10,'password_change','user',10,'Password changed','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:01:58'),
(119,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:08:07'),
(120,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:08:11'),
(121,9,'login_failed','user',9,'Failed login for username: rdavis. Reason: Account locked due to too many failed attempts','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:10:22'),
(122,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:12:04'),
(123,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:30:41'),
(124,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:36:06'),
(125,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:42:25'),
(126,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 14:42:36'),
(127,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 15:01:55'),
(128,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-23 15:46:27'),
(129,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 14:16:42'),
(130,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 14:18:14'),
(131,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 14:18:30'),
(132,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 15:04:27'),
(133,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 15:04:38'),
(134,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 15:29:16'),
(135,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 15:29:22'),
(136,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 16:11:04'),
(137,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 16:13:42'),
(138,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 16:17:50'),
(139,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',NULL,NULL,'2026-01-24 16:21:54'),
(140,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:06:58'),
(141,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:09:11'),
(142,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:10:50'),
(143,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:20:20'),
(144,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:21:02'),
(145,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:21:49'),
(146,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:26:52'),
(147,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:29:07'),
(148,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 18:37:37'),
(149,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 19:03:02'),
(150,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 19:20:37'),
(151,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 19:34:47'),
(152,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 20:11:55'),
(153,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 21:28:10'),
(154,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 21:33:33'),
(155,2,'login','user',2,'Successful login','192.168.1.80','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-24 22:37:02'),
(156,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-25 13:19:53'),
(157,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-25 13:31:28'),
(158,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-25 13:56:56'),
(159,2,'login','user',2,'Successful login','172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',NULL,NULL,'2026-01-25 14:05:58');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing_modifiers`
--

DROP TABLE IF EXISTS `billing_modifiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_modifiers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `description` varchar(255) NOT NULL,
  `modifier_type` enum('telehealth','clinician','administrative','mh-specific') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_type` (`modifier_type`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_modifiers`
--

LOCK TABLES `billing_modifiers` WRITE;
/*!40000 ALTER TABLE `billing_modifiers` DISABLE KEYS */;
INSERT INTO `billing_modifiers` VALUES
(1,'95','Telehealth (Synchronous)','telehealth',1,10,'2026-01-24 16:02:01','2026-01-24 16:02:01'),
(2,'93','Telehealth (Audio Only)','telehealth',1,20,'2026-01-24 16:02:01','2026-01-24 16:02:01'),
(3,'GT','Telehealth (Legacy)','telehealth',1,30,'2026-01-24 16:02:01','2026-01-24 16:02:01'),
(4,'AH','Clinical Psychologist (LP)','clinician',1,40,'2026-01-24 16:02:01','2026-01-24 18:06:16'),
(5,'AJ','Clinical Social Worker','clinician',1,50,'2026-01-24 16:02:01','2026-01-24 16:02:01'),
(6,'HO','Master\'s Level Therapist','clinician',1,60,'2026-01-24 16:02:01','2026-01-24 16:02:01'),
(7,'HN','Licensed Clinical Mental Health Counselor','clinician',1,70,'2026-01-24 16:02:01','2026-01-24 16:02:01'),
(16,'HA','Child/Adolescent Program','mh-specific',1,160,'2026-01-24 16:02:01','2026-01-24 16:02:01'),
(17,'HQ','Group Setting','mh-specific',1,170,'2026-01-24 16:02:01','2026-01-24 16:02:01');
/*!40000 ALTER TABLE `billing_modifiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing_transactions`
--

DROP TABLE IF EXISTS `billing_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `encounter_id` bigint(20) unsigned DEFAULT NULL,
  `provider_id` bigint(20) unsigned NOT NULL,
  `facility_id` bigint(20) unsigned NOT NULL,
  `transaction_date` date NOT NULL,
  `service_date` date NOT NULL,
  `cpt_code` varchar(10) NOT NULL,
  `icd_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`icd_codes`)),
  `billed_amount` decimal(10,2) NOT NULL,
  `allowed_amount` decimal(10,2) DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `adjustment_amount` decimal(10,2) DEFAULT 0.00,
  `balance` decimal(10,2) DEFAULT NULL,
  `units` int(11) DEFAULT 1,
  `insurance_provider_id` bigint(20) unsigned DEFAULT NULL,
  `claim_number` varchar(50) DEFAULT NULL,
  `claim_status` enum('pending','submitted','paid','denied','appealed') DEFAULT 'pending',
  `billing_status` enum('unbilled','billed','paid','partial_paid','denied','written_off') DEFAULT 'unbilled',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `facility_id` (`facility_id`),
  KEY `insurance_provider_id` (`insurance_provider_id`),
  KEY `idx_client` (`client_id`),
  KEY `idx_encounter` (`encounter_id`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_service_date` (`service_date`),
  KEY `idx_status` (`billing_status`),
  KEY `idx_claim_status` (`claim_status`),
  CONSTRAINT `billing_transactions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `billing_transactions_ibfk_2` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `billing_transactions_ibfk_3` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`),
  CONSTRAINT `billing_transactions_ibfk_4` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`),
  CONSTRAINT `billing_transactions_ibfk_5` FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_transactions`
--

LOCK TABLES `billing_transactions` WRITE;
/*!40000 ALTER TABLE `billing_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `billing_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_cpt_codes`
--

DROP TABLE IF EXISTS `category_cpt_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_cpt_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `cpt_code_id` int(11) NOT NULL,
  `is_default` tinyint(1) DEFAULT 0 COMMENT 'Default CPT for this category',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_cpt` (`category_id`,`cpt_code_id`),
  KEY `cpt_code_id` (`cpt_code_id`),
  CONSTRAINT `category_cpt_codes_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `appointment_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `category_cpt_codes_ibfk_2` FOREIGN KEY (`cpt_code_id`) REFERENCES `cpt_codes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_cpt_codes`
--

LOCK TABLES `category_cpt_codes` WRITE;
/*!40000 ALTER TABLE `category_cpt_codes` DISABLE KEYS */;
INSERT INTO `category_cpt_codes` VALUES
(6,2,7,0,'2026-01-24 19:23:04'),
(7,2,8,0,'2026-01-24 19:23:04'),
(8,4,2,0,'2026-01-24 19:23:22'),
(9,3,46,0,'2026-01-24 19:23:31'),
(10,5,6,0,'2026-01-24 19:24:33'),
(11,1,3,0,'2026-01-24 19:25:08'),
(12,1,4,0,'2026-01-24 19:25:08'),
(13,1,5,0,'2026-01-24 19:25:08'),
(14,1,6,0,'2026-01-24 19:25:08');
/*!40000 ALTER TABLE `category_cpt_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claims`
--

DROP TABLE IF EXISTS `claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `claims` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `insurance_provider_id` bigint(20) unsigned NOT NULL,
  `claim_number` varchar(50) DEFAULT NULL,
  `submission_date` date DEFAULT NULL,
  `service_from_date` date NOT NULL,
  `service_to_date` date NOT NULL,
  `total_billed` decimal(10,2) NOT NULL,
  `total_paid` decimal(10,2) DEFAULT 0.00,
  `status` enum('draft','ready','submitted','accepted','rejected','paid','appealed') DEFAULT 'draft',
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `claim_number` (`claim_number`),
  KEY `idx_client` (`client_id`),
  KEY `idx_provider` (`insurance_provider_id`),
  KEY `idx_claim_number` (`claim_number`),
  KEY `idx_status` (`status`),
  CONSTRAINT `claims_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `claims_ibfk_2` FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claims`
--

LOCK TABLES `claims` WRITE;
/*!40000 ALTER TABLE `claims` DISABLE KEYS */;
/*!40000 ALTER TABLE `claims` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_contacts`
--

DROP TABLE IF EXISTS `client_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_contacts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `relationship` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_emergency_contact` tinyint(1) DEFAULT 0,
  `is_authorized_contact` tinyint(1) DEFAULT 0,
  `can_receive_information` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client` (`client_id`),
  CONSTRAINT `client_contacts_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_contacts`
--

LOCK TABLES `client_contacts` WRITE;
/*!40000 ALTER TABLE `client_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_employers`
--

DROP TABLE IF EXISTS `client_employers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_employers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `employer_name` varchar(200) NOT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client` (`client_id`),
  CONSTRAINT `client_employers_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_employers`
--

LOCK TABLES `client_employers` WRITE;
/*!40000 ALTER TABLE `client_employers` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_employers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_flags`
--

DROP TABLE IF EXISTS `client_flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_flags` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `flag_type` enum('alert','warning','note','risk') NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_client` (`client_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_severity` (`severity`),
  CONSTRAINT `client_flags_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_flags_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_flags`
--

LOCK TABLES `client_flags` WRITE;
/*!40000 ALTER TABLE `client_flags` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_flags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_insurance`
--

DROP TABLE IF EXISTS `client_insurance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_insurance` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `insurance_provider_id` bigint(20) unsigned NOT NULL,
  `priority` enum('primary','secondary','tertiary') NOT NULL,
  `policy_number` varchar(50) NOT NULL,
  `group_number` varchar(50) DEFAULT NULL,
  `subscriber_relationship` enum('self','spouse','child','other') NOT NULL,
  `subscriber_name` varchar(200) DEFAULT NULL,
  `subscriber_dob` date DEFAULT NULL,
  `subscriber_ssn_encrypted` varchar(255) DEFAULT NULL,
  `subscriber_sex` enum('male','female','other') DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `copay_amount` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client` (`client_id`),
  KEY `idx_provider` (`insurance_provider_id`),
  KEY `idx_priority` (`priority`),
  CONSTRAINT `client_insurance_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_insurance_ibfk_2` FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_insurance`
--

LOCK TABLES `client_insurance` WRITE;
/*!40000 ALTER TABLE `client_insurance` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_insurance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `preferred_name` varchar(100) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `sex` enum('male','female','other','unknown') NOT NULL,
  `gender_identity` varchar(50) DEFAULT NULL,
  `sexual_orientation` varchar(50) DEFAULT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `ssn_encrypted` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_home` varchar(20) DEFAULT NULL,
  `phone_mobile` varchar(20) DEFAULT NULL,
  `phone_work` varchar(20) DEFAULT NULL,
  `preferred_contact_method` enum('phone','email','text','mail') DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  `county` varchar(100) DEFAULT NULL,
  `emergency_contact_name` varchar(200) DEFAULT NULL,
  `emergency_contact_relation` varchar(50) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `primary_provider_id` bigint(20) unsigned DEFAULT NULL,
  `facility_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('active','inactive','discharged','deceased') DEFAULT 'active',
  `primary_language` varchar(50) DEFAULT 'English',
  `needs_interpreter` tinyint(1) DEFAULT 0,
  `ethnicity` varchar(100) DEFAULT NULL,
  `race` varchar(100) DEFAULT NULL,
  `portal_access` tinyint(1) DEFAULT 0,
  `portal_username` varchar(100) DEFAULT NULL,
  `intake_date` date DEFAULT NULL,
  `discharge_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `payment_type` enum('insurance','self-pay','pro-bono') DEFAULT 'insurance' COMMENT 'How client pays for services',
  `custom_session_fee` decimal(10,2) DEFAULT NULL COMMENT 'Negotiated rate for self-pay/pro-bono clients',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `portal_username` (`portal_username`),
  KEY `idx_last_name` (`last_name`),
  KEY `idx_dob` (`date_of_birth`),
  KEY `idx_status` (`status`),
  KEY `idx_provider` (`primary_provider_id`),
  KEY `idx_facility` (`facility_id`),
  KEY `idx_marital_status` (`marital_status`),
  FULLTEXT KEY `idx_name_search` (`first_name`,`last_name`,`preferred_name`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`primary_provider_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `clients_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES
(1,'29950dd6-f40f-11f0-9ab0-26465fc4acb1','Michael','Anderson','James',NULL,'1985-03-15','male','male','heterosexual',NULL,NULL,'michael.anderson@email.test','555-0101','555-0102',NULL,NULL,'123 Main Street',NULL,'Portland','OR','97201',NULL,'Susan Anderson','Spouse','555-0103',4,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(2,'2995138f-f40f-11f0-9ab0-26465fc4acb1','Emily','Martinez','Rose',NULL,'1992-07-22','female','female','bisexual',NULL,NULL,'emily.martinez@email.test','555-0201','555-0202',NULL,NULL,'456 Oak Avenue',NULL,'Portland','OR','97202',NULL,'Carlos Martinez','Father','555-0203',4,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(3,'299515aa-f40f-11f0-9ab0-26465fc4acb1','Christopher','Taylor',NULL,NULL,'1978-11-08','male','male','homosexual',NULL,NULL,'chris.taylor@email.test','555-0301','555-0302',NULL,NULL,'789 Pine Road',NULL,'Portland','OR','97203',NULL,'Mark Stevens','Partner','555-0303',5,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(4,'29951705-f40f-11f0-9ab0-26465fc4acb1','Sarah','Wilson','Lynn',NULL,'1988-05-30','female','female','heterosexual',NULL,NULL,'sarah.wilson@email.test','555-0401','555-0402',NULL,NULL,'321 Elm Street',NULL,'Portland','OR','97204',NULL,'David Wilson','Spouse','555-0403',5,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(5,'29951843-f40f-11f0-9ab0-26465fc4acb1','Alex','Thompson','Jordan',NULL,'1995-09-12','other','non_binary','pansexual',NULL,NULL,'alex.thompson@email.test','555-0501','555-0502',NULL,NULL,'654 Maple Drive',NULL,'Portland','OR','97205',NULL,'Jamie Thompson','Sibling','555-0503',6,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(6,'2995198d-f40f-11f0-9ab0-26465fc4acb1','Jessica','Garcia','Marie',NULL,'1990-02-18','female','female','heterosexual',NULL,NULL,'jessica.garcia@email.test','555-0601','555-0602',NULL,NULL,'987 Cedar Lane',NULL,'Portland','OR','97206',NULL,'Miguel Garcia','Brother','555-0603',6,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(7,'29951ab0-f40f-11f0-9ab0-26465fc4acb1','Daniel','Lee','Robert',NULL,'1982-12-25','male','male','heterosexual',NULL,NULL,'daniel.lee@email.test','555-0701','555-0702',NULL,NULL,'147 Birch Court',NULL,'Portland','OR','97207',NULL,'Michelle Lee','Spouse','555-0703',7,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(8,'29951be0-f40f-11f0-9ab0-26465fc4acb1','Rachel','White','Ann',NULL,'1986-08-05','female','female','lesbian',NULL,NULL,'rachel.white@email.test','555-0801','555-0802',NULL,NULL,'258 Spruce Avenue',NULL,'Portland','OR','97208',NULL,'Laura White','Partner','555-0803',7,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(9,'29951d12-f40f-11f0-9ab0-26465fc4acb1','Kevin','Harris','Paul',NULL,'1993-04-17','male','male','heterosexual',NULL,NULL,'kevin.harris@email.test','555-0901','555-0902',NULL,NULL,'369 Willow Street',NULL,'Portland','OR','97209',NULL,'Linda Harris','Mother','555-0903',4,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL),
(10,'29951e36-f40f-11f0-9ab0-26465fc4acb1','Amanda','Clark','Grace',NULL,'1991-06-28','female','female','heterosexual',NULL,NULL,'amanda.clark@email.test','555-1001','555-1002',NULL,NULL,'741 Ash Boulevard',NULL,'Portland','OR','97210',NULL,'James Clark','Father','555-1003',5,NULL,'active','English',0,NULL,NULL,0,NULL,NULL,NULL,'2026-01-18 01:44:00','2026-01-18 01:44:00',NULL,'insurance',NULL);
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinical_note_addendums`
--

DROP TABLE IF EXISTS `clinical_note_addendums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinical_note_addendums` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `clinical_note_id` bigint(20) unsigned NOT NULL,
  `addendum_text` text NOT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `added_by` bigint(20) unsigned NOT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `added_by` (`added_by`),
  KEY `idx_note` (`clinical_note_id`),
  CONSTRAINT `clinical_note_addendums_ibfk_1` FOREIGN KEY (`clinical_note_id`) REFERENCES `clinical_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clinical_note_addendums_ibfk_2` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinical_note_addendums`
--

LOCK TABLES `clinical_note_addendums` WRITE;
/*!40000 ALTER TABLE `clinical_note_addendums` DISABLE KEYS */;
/*!40000 ALTER TABLE `clinical_note_addendums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinical_notes`
--

DROP TABLE IF EXISTS `clinical_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinical_notes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `note_uuid` varchar(36) NOT NULL,
  `patient_id` bigint(20) unsigned NOT NULL,
  `created_by` bigint(20) unsigned NOT NULL,
  `appointment_id` bigint(20) unsigned DEFAULT NULL,
  `billing_id` bigint(20) unsigned DEFAULT NULL,
  `encounter_id_legacy` bigint(20) unsigned DEFAULT NULL COMMENT 'DEPRECATED: Use appointment_id',
  `client_id_legacy` bigint(20) unsigned DEFAULT NULL COMMENT 'DEPRECATED: Use patient_id',
  `provider_id_legacy` bigint(20) unsigned DEFAULT NULL COMMENT 'DEPRECATED: Use created_by',
  `note_type` varchar(50) NOT NULL,
  `template_type` varchar(50) DEFAULT 'BIRP',
  `service_date` date NOT NULL,
  `service_duration` int(11) DEFAULT NULL COMMENT 'Duration in minutes',
  `service_location` varchar(100) DEFAULT NULL,
  `behavior_problem` text DEFAULT NULL COMMENT 'Behavior or presenting problem',
  `intervention` text DEFAULT NULL COMMENT 'Intervention provided',
  `response` text DEFAULT NULL COMMENT 'Client response to intervention',
  `subjective_legacy` text DEFAULT NULL COMMENT 'DEPRECATED: Use behavior_problem',
  `objective_legacy` text DEFAULT NULL COMMENT 'DEPRECATED: Use intervention',
  `assessment_legacy` text DEFAULT NULL COMMENT 'DEPRECATED: Use response',
  `plan` text DEFAULT NULL,
  `risk_present` tinyint(1) DEFAULT 0,
  `mental_status_exam` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mental_status_exam`)),
  `symptoms_reported` text DEFAULT NULL COMMENT 'Symptoms reported by client',
  `symptoms_observed` text DEFAULT NULL COMMENT 'Symptoms observed by clinician',
  `clinical_justification` text DEFAULT NULL COMMENT 'Justification for diagnosis',
  `differential_diagnosis` text DEFAULT NULL COMMENT 'Differential diagnoses considered',
  `severity_specifiers` varchar(200) DEFAULT NULL,
  `functional_impairment` text DEFAULT NULL,
  `duration_of_symptoms` varchar(200) DEFAULT NULL,
  `previous_diagnoses` text DEFAULT NULL,
  `supervisor_review_required` tinyint(1) DEFAULT 0,
  `supervisor_reviewed_at` timestamp NULL DEFAULT NULL,
  `supervisor_reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `supervisor_comments` text DEFAULT NULL,
  `last_autosave_at` timestamp NULL DEFAULT NULL,
  `risk_assessment` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`risk_assessment`)),
  `goals_addressed` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Treatment goals addressed in session' CHECK (json_valid(`goals_addressed`)),
  `interventions_selected` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Specific interventions used' CHECK (json_valid(`interventions_selected`)),
  `client_presentation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Client presentation indicators' CHECK (json_valid(`client_presentation`)),
  `diagnosis_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ICD-10 diagnosis codes' CHECK (json_valid(`diagnosis_codes`)),
  `presenting_concerns` text DEFAULT NULL,
  `clinical_observations` text DEFAULT NULL,
  `treatment_interventions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`treatment_interventions`)),
  `treatment_goals` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`treatment_goals`)),
  `progress_indicators` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`progress_indicators`)),
  `status` enum('draft','pending_review','signed','amended') DEFAULT 'draft',
  `signed_at` timestamp NULL DEFAULT NULL,
  `signed_by` bigint(20) unsigned DEFAULT NULL,
  `signature_data` text DEFAULT NULL,
  `amended_at` timestamp NULL DEFAULT NULL,
  `amendment_reason` text DEFAULT NULL,
  `billing_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`billing_codes`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `note_uuid` (`note_uuid`),
  KEY `signed_by` (`signed_by`),
  KEY `idx_encounter` (`encounter_id_legacy`),
  KEY `idx_client` (`client_id_legacy`),
  KEY `idx_provider` (`provider_id_legacy`),
  KEY `idx_status` (`status`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_appointment_id` (`appointment_id`),
  KEY `idx_billing_id` (`billing_id`),
  KEY `idx_risk_present` (`risk_present`),
  KEY `idx_supervisor_review` (`supervisor_review_required`),
  KEY `idx_supervisor_reviewed_by` (`supervisor_reviewed_by`),
  FULLTEXT KEY `idx_content` (`subjective_legacy`,`objective_legacy`,`assessment_legacy`,`plan`),
  CONSTRAINT `clinical_notes_ibfk_1` FOREIGN KEY (`encounter_id_legacy`) REFERENCES `encounters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clinical_notes_ibfk_2` FOREIGN KEY (`client_id_legacy`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clinical_notes_ibfk_3` FOREIGN KEY (`provider_id_legacy`) REFERENCES `users` (`id`),
  CONSTRAINT `clinical_notes_ibfk_4` FOREIGN KEY (`signed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinical_notes`
--

LOCK TABLES `clinical_notes` WRITE;
/*!40000 ALTER TABLE `clinical_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `clinical_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinical_settings`
--

DROP TABLE IF EXISTS `clinical_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinical_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_type` varchar(20) DEFAULT 'string',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `clinical_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinical_settings`
--

LOCK TABLES `clinical_settings` WRITE;
/*!40000 ALTER TABLE `clinical_settings` DISABLE KEYS */;
INSERT INTO `clinical_settings` VALUES
(1,'default_note_template','BIRP','string','2026-01-19 20:48:11',NULL),
(2,'require_supervisor_review','false','boolean','2026-01-19 20:48:11',NULL),
(3,'auto_lock_notes_after_days','7','string','2026-01-19 20:48:11',NULL),
(4,'allow_post_signature_edits','true','boolean','2026-01-19 20:48:11',NULL);
/*!40000 ALTER TABLE `clinical_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cpt_codes`
--

DROP TABLE IF EXISTS `cpt_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cpt_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `type` varchar(20) DEFAULT 'CPT4',
  `description` text DEFAULT NULL,
  `standard_duration_minutes` int(11) DEFAULT 50,
  `standard_fee` decimal(10,2) DEFAULT NULL COMMENT 'Standard insurance billing rate',
  `is_active` tinyint(1) DEFAULT 1,
  `is_addon` tinyint(1) DEFAULT 0,
  `requires_primary_code` varchar(10) DEFAULT NULL COMMENT 'For add-on codes, which primary CPT required',
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_category` (`category`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cpt_codes`
--

LOCK TABLES `cpt_codes` WRITE;
/*!40000 ALTER TABLE `cpt_codes` DISABLE KEYS */;
INSERT INTO `cpt_codes` VALUES
(1,'00000','Non-Billable','CPT4','Non-Billable',50,0.00,1,0,NULL,0,'2026-01-24 15:59:08','2026-01-24 16:11:30'),
(2,'90791','Intake','CPT4','Intake Interview',60,150.00,1,0,NULL,10,'2026-01-24 15:59:08','2026-01-24 15:59:08'),
(3,'90832','Individual Therapy','CPT4','Psychotherapy 16–37 min',30,100.00,1,0,NULL,20,'2026-01-24 15:59:08','2026-01-24 15:59:08'),
(4,'90834','Individual Therapy','CPT4','Psychotherapy 45–50 min',50,150.00,1,0,NULL,30,'2026-01-24 15:59:08','2026-01-24 15:59:08'),
(5,'90837','Individual Therapy','CPT4','Psychotherapy 54+ min',60,180.00,1,0,NULL,40,'2026-01-24 15:59:08','2026-01-24 15:59:08'),
(6,'90839','Individual Therapy','CPT4','Psychotherapy – Crisis',60,200.00,1,0,NULL,50,'2026-01-24 15:59:08','2026-01-24 15:59:08'),
(7,'90846','Family Therapy','CPT4','Family Therapy (w/o patient)',50,150.00,1,0,NULL,60,'2026-01-24 15:59:08','2026-01-24 15:59:08'),
(8,'90847','Family Therapy','CPT4','Family Therapy (w/ patient)',50,150.00,1,0,NULL,70,'2026-01-24 15:59:08','2026-01-24 15:59:08'),
(46,'90853','Group Therapy','CPT4','Group Therapy - 60 min',60,75.00,1,0,NULL,0,'2026-01-24 16:18:40','2026-01-24 19:23:59');
/*!40000 ALTER TABLE `cpt_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diagnoses`
--

DROP TABLE IF EXISTS `diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `diagnoses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `encounter_id` bigint(20) unsigned DEFAULT NULL,
  `code` varchar(20) NOT NULL,
  `code_type` enum('ICD10','ICD11','DSM5') DEFAULT 'ICD10',
  `description` text NOT NULL,
  `diagnosis_date` date NOT NULL,
  `resolution_date` date DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `diagnosed_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `encounter_id` (`encounter_id`),
  KEY `diagnosed_by` (`diagnosed_by`),
  KEY `idx_client` (`client_id`),
  KEY `idx_code` (`code`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `diagnoses_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `diagnoses_ibfk_2` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `diagnoses_ibfk_3` FOREIGN KEY (`diagnosed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diagnoses`
--

LOCK TABLES `diagnoses` WRITE;
/*!40000 ALTER TABLE `diagnoses` DISABLE KEYS */;
/*!40000 ALTER TABLE `diagnoses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diagnostic_codes`
--

DROP TABLE IF EXISTS `diagnostic_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `diagnostic_codes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `code_type` enum('ICD10','ICD11','DSM5','CPT') NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `effective_date` date DEFAULT NULL,
  `termination_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_type` (`code_type`),
  KEY `idx_active` (`is_active`),
  FULLTEXT KEY `idx_description` (`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diagnostic_codes`
--

LOCK TABLES `diagnostic_codes` WRITE;
/*!40000 ALTER TABLE `diagnostic_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `diagnostic_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_categories`
--

DROP TABLE IF EXISTS `document_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `description` text DEFAULT NULL,
  `lft` int(11) NOT NULL,
  `rght` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_lft` (`lft`),
  KEY `idx_rght` (`rght`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `document_categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `document_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_categories`
--

LOCK TABLES `document_categories` WRITE;
/*!40000 ALTER TABLE `document_categories` DISABLE KEYS */;
INSERT INTO `document_categories` VALUES
(1,'Client Information',NULL,NULL,0,0,1,0,'2026-01-18 14:13:07','2026-01-24 15:30:02'),
(2,'Client Insurance Card',1,NULL,0,0,1,0,'2026-01-18 14:13:18','2026-01-18 14:13:18'),
(3,'Client Portal',NULL,NULL,0,0,1,0,'2026-01-24 15:30:53','2026-01-24 15:30:53'),
(4,'Records (Received)',1,NULL,0,0,1,0,'2026-01-24 15:31:10','2026-01-24 15:57:08'),
(5,'Financial',NULL,NULL,0,0,1,0,'2026-01-24 15:31:29','2026-01-24 15:31:29'),
(6,'Invoices/Receipts (Self-Pay)',5,NULL,0,0,1,0,'2026-01-24 15:31:50','2026-01-24 15:31:50'),
(7,'Client Communications',NULL,NULL,0,0,1,0,'2026-01-24 15:38:02','2026-01-24 15:38:02'),
(8,'Releases of Information (ROI\'s)',7,NULL,0,0,1,0,'2026-01-24 15:38:20','2026-01-24 15:38:20'),
(9,'From Client',3,NULL,0,0,1,0,'2026-01-24 15:39:37','2026-01-24 15:39:37'),
(10,'For Client',3,NULL,0,0,1,0,'2026-01-24 15:39:45','2026-01-24 15:39:45'),
(11,'Records Requests (Sent)',1,NULL,0,0,1,0,'2026-01-24 15:56:55','2026-01-24 15:56:55');
/*!40000 ALTER TABLE `document_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `document_date` date DEFAULT NULL,
  `uploaded_by` bigint(20) unsigned DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_client` (`client_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_uploaded_at` (`uploaded_at`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `document_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encounters`
--

DROP TABLE IF EXISTS `encounters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `encounters` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `provider_id` bigint(20) unsigned NOT NULL,
  `facility_id` bigint(20) unsigned NOT NULL,
  `appointment_id` bigint(20) unsigned DEFAULT NULL,
  `encounter_date` date NOT NULL,
  `encounter_datetime` timestamp NOT NULL,
  `encounter_type` varchar(50) NOT NULL,
  `chief_complaint` text DEFAULT NULL,
  `status` enum('open','signed','billed','archived') DEFAULT 'open',
  `signed_at` timestamp NULL DEFAULT NULL,
  `signed_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `facility_id` (`facility_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `signed_by` (`signed_by`),
  KEY `idx_client` (`client_id`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_date` (`encounter_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `encounters_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `encounters_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`),
  CONSTRAINT `encounters_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`),
  CONSTRAINT `encounters_ibfk_4` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `encounters_ibfk_5` FOREIGN KEY (`signed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encounters`
--

LOCK TABLES `encounters` WRITE;
/*!40000 ALTER TABLE `encounters` DISABLE KEYS */;
/*!40000 ALTER TABLE `encounters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facilities`
--

DROP TABLE IF EXISTS `facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `facilities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `facility_type` varchar(50) DEFAULT NULL,
  `facility_type_id` bigint(20) unsigned DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `fax` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  `mailing_address_line1` varchar(255) DEFAULT NULL,
  `mailing_address_line2` varchar(255) DEFAULT NULL,
  `mailing_city` varchar(100) DEFAULT NULL,
  `mailing_state` varchar(2) DEFAULT NULL,
  `mailing_zip` varchar(10) DEFAULT NULL,
  `mailing_same_as_physical` tinyint(1) DEFAULT 1,
  `billing_address_line1` varchar(255) DEFAULT NULL,
  `billing_address_line2` varchar(255) DEFAULT NULL,
  `billing_city` varchar(100) DEFAULT NULL,
  `billing_state` varchar(2) DEFAULT NULL,
  `billing_zip` varchar(10) DEFAULT NULL,
  `billing_same_as_physical` tinyint(1) DEFAULT 1,
  `billing_location` tinyint(1) DEFAULT 0,
  `service_location` tinyint(1) DEFAULT 1,
  `accepts_assignment` tinyint(1) DEFAULT 1,
  `primary_business_entity` tinyint(1) DEFAULT 0,
  `color` varchar(7) DEFAULT '#99FFFF',
  `notes` text DEFAULT NULL,
  `attn` varchar(100) DEFAULT NULL,
  `tax_id` varchar(20) DEFAULT NULL,
  `facility_npi` varchar(15) DEFAULT NULL,
  `pos_code` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_primary` tinyint(1) DEFAULT 0,
  `business_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`business_hours`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_active` (`is_active`),
  KEY `idx_facility_type_id` (`facility_type_id`),
  KEY `idx_billing_location` (`billing_location`),
  KEY `idx_service_location` (`service_location`),
  CONSTRAINT `fk_facilities_facility_type` FOREIGN KEY (`facility_type_id`) REFERENCES `facility_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facilities`
--

LOCK TABLES `facilities` WRITE;
/*!40000 ALTER TABLE `facilities` DISABLE KEYS */;
INSERT INTO `facilities` VALUES
(1,'Default',NULL,NULL,'262-345-7229',NULL,'sacwan@sacwan.org',NULL,'11514 N Port',NULL,'Mequon','WI',NULL,'11514 N Port',NULL,'Mequon','WI',NULL,1,'11514 N Port',NULL,'Mequon','WI',NULL,1,1,1,1,1,'#26a269',NULL,NULL,NULL,NULL,'11',1,0,NULL,'2026-01-18 13:19:46','2026-01-18 14:18:54');
/*!40000 ALTER TABLE `facilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facility_types`
--

DROP TABLE IF EXISTS `facility_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `facility_types` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facility_types`
--

LOCK TABLES `facility_types` WRITE;
/*!40000 ALTER TABLE `facility_types` DISABLE KEYS */;
INSERT INTO `facility_types` VALUES
(1,'Main Office','Primary practice location',1,1,'2026-01-18 14:06:09','2026-01-18 14:06:09'),
(2,'Satellite Office','Additional practice location',1,2,'2026-01-18 14:06:09','2026-01-18 14:06:09'),
(3,'Telehealth Location','Virtual/telehealth services location',1,3,'2026-01-18 14:06:09','2026-01-18 14:06:09'),
(4,'Laboratory','Laboratory services',1,4,'2026-01-18 14:06:09','2026-01-18 14:06:09'),
(5,'Imaging Center','Diagnostic imaging services',1,5,'2026-01-18 14:06:09','2026-01-18 14:06:09'),
(6,'Administrative Office','Administrative/billing office only',1,6,'2026-01-18 14:06:09','2026-01-18 14:06:09'),
(7,'Hospital','Hospital-based practice',1,7,'2026-01-18 14:06:09','2026-01-18 14:06:09'),
(8,'Clinic','Outpatient clinic',1,8,'2026-01-18 14:06:09','2026-01-18 14:06:09');
/*!40000 ALTER TABLE `facility_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_submissions`
--

DROP TABLE IF EXISTS `form_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_submissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `encounter_id` bigint(20) unsigned DEFAULT NULL,
  `form_type` varchar(100) NOT NULL,
  `form_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`form_data`)),
  `submitted_by` bigint(20) unsigned DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('draft','submitted','reviewed','archived') DEFAULT 'draft',
  `reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `submitted_by` (`submitted_by`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_client` (`client_id`),
  KEY `idx_encounter` (`encounter_id`),
  KEY `idx_form_type` (`form_type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `form_submissions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_submissions_ibfk_2` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `form_submissions_ibfk_3` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `form_submissions_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_submissions`
--

LOCK TABLES `form_submissions` WRITE;
/*!40000 ALTER TABLE `form_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurance_providers`
--

DROP TABLE IF EXISTS `insurance_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_providers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `payer_id` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `fax` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  `claims_address` text DEFAULT NULL,
  `claims_phone` varchar(20) DEFAULT NULL,
  `claims_email` varchar(255) DEFAULT NULL,
  `insurance_type` enum('commercial','medicare','medicaid','tricare','self_pay','other') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_payer_id` (`payer_id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurance_providers`
--

LOCK TABLES `insurance_providers` WRITE;
/*!40000 ALTER TABLE `insurance_providers` DISABLE KEYS */;
/*!40000 ALTER TABLE `insurance_providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intervention_library`
--

DROP TABLE IF EXISTS `intervention_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `intervention_library` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `intervention_name` varchar(100) NOT NULL,
  `intervention_tier` int(11) NOT NULL,
  `modality` varchar(50) DEFAULT NULL,
  `is_system_intervention` tinyint(1) DEFAULT 1,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `intervention_name` (`intervention_name`),
  KEY `idx_tier` (`intervention_tier`),
  KEY `idx_modality` (`modality`),
  KEY `idx_active` (`is_active`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `intervention_library_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intervention_library`
--

LOCK TABLES `intervention_library` WRITE;
/*!40000 ALTER TABLE `intervention_library` DISABLE KEYS */;
INSERT INTO `intervention_library` VALUES
(1,'Psychoeducation',1,NULL,1,NULL,1,1,'2026-01-19 20:48:11'),
(2,'Cognitive restructuring / reframing',1,NULL,1,NULL,2,1,'2026-01-19 20:48:11'),
(3,'Behavioral activation',1,NULL,1,NULL,3,1,'2026-01-19 20:48:11'),
(4,'Grounding techniques',1,NULL,1,NULL,4,1,'2026-01-19 20:48:11'),
(5,'Mindfulness / breathing exercises',1,NULL,1,NULL,5,1,'2026-01-19 20:48:11'),
(6,'Emotional regulation skills',1,NULL,1,NULL,6,1,'2026-01-19 20:48:11'),
(7,'Coping skills training',1,NULL,1,NULL,7,1,'2026-01-19 20:48:11'),
(8,'Safety planning',1,NULL,1,NULL,8,1,'2026-01-19 20:48:11'),
(9,'Supportive counseling',1,NULL,1,NULL,9,1,'2026-01-19 20:48:11'),
(10,'Validation / normalization',1,NULL,1,NULL,10,1,'2026-01-19 20:48:11'),
(11,'Motivational interviewing',1,NULL,1,NULL,11,1,'2026-01-19 20:48:11'),
(12,'Treatment plan review / goal alignment',1,NULL,1,NULL,12,1,'2026-01-19 20:48:11'),
(13,'Thought records',2,'CBT',1,NULL,1,1,'2026-01-19 20:48:11'),
(14,'Cognitive distortions identification',2,'CBT',1,NULL,2,1,'2026-01-19 20:48:11'),
(15,'Exposure planning',2,'CBT',1,NULL,3,1,'2026-01-19 20:48:11'),
(16,'Distress tolerance skills',2,'DBT',1,NULL,1,1,'2026-01-19 20:48:11'),
(17,'Interpersonal effectiveness skills',2,'DBT',1,NULL,2,1,'2026-01-19 20:48:11'),
(18,'Chain analysis',2,'DBT',1,NULL,3,1,'2026-01-19 20:48:11'),
(19,'Values clarification',2,'ACT',1,NULL,1,1,'2026-01-19 20:48:11'),
(20,'Cognitive defusion',2,'ACT',1,NULL,2,1,'2026-01-19 20:48:11'),
(21,'Acceptance strategies',2,'ACT',1,NULL,3,1,'2026-01-19 20:48:11'),
(22,'Resourcing / stabilization',2,'EMDR',1,NULL,1,1,'2026-01-19 20:48:11'),
(23,'Bilateral stimulation',2,'EMDR',1,NULL,2,1,'2026-01-19 20:48:11'),
(24,'Target identification',2,'EMDR',1,NULL,3,1,'2026-01-19 20:48:11'),
(25,'Parts identification',2,'IFS',1,NULL,1,1,'2026-01-19 20:48:11'),
(26,'Unblending',2,'IFS',1,NULL,2,1,'2026-01-19 20:48:11'),
(27,'Self-energy access',2,'IFS',1,NULL,3,1,'2026-01-19 20:48:11'),
(28,'Miracle question',2,'Solution-Focused',1,NULL,1,1,'2026-01-19 20:48:11'),
(29,'Scaling questions',2,'Solution-Focused',1,NULL,2,1,'2026-01-19 20:48:11'),
(30,'Exception finding',2,'Solution-Focused',1,NULL,3,1,'2026-01-19 20:48:11'),
(31,'Suicide risk assessment',3,NULL,1,NULL,1,1,'2026-01-19 20:48:11'),
(32,'Crisis de-escalation',3,NULL,1,NULL,2,1,'2026-01-19 20:48:11'),
(33,'Safety contracting',3,NULL,1,NULL,3,1,'2026-01-19 20:48:11'),
(34,'Emergency resource coordination',3,NULL,1,NULL,4,1,'2026-01-19 20:48:11'),
(35,'Lethal means counseling',3,NULL,1,NULL,5,1,'2026-01-19 20:48:11'),
(36,'Coordination of care',4,NULL,1,NULL,1,1,'2026-01-19 20:48:11'),
(37,'Documentation review',4,NULL,1,NULL,2,1,'2026-01-19 20:48:11'),
(38,'Referral discussion',4,NULL,1,NULL,3,1,'2026-01-19 20:48:11'),
(39,'Medication adherence discussion',4,NULL,1,NULL,4,1,'2026-01-19 20:48:11'),
(40,'Homework assignment',4,NULL,1,NULL,5,1,'2026-01-19 20:48:11');
/*!40000 ALTER TABLE `intervention_library` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `from_user_id` bigint(20) unsigned NOT NULL,
  `to_user_id` bigint(20) unsigned NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message_body` text NOT NULL,
  `related_client_id` bigint(20) unsigned DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `parent_message_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `parent_message_id` (`parent_message_id`),
  KEY `idx_from_user` (`from_user_id`),
  KEY `idx_to_user` (`to_user_id`),
  KEY `idx_client` (`related_client_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`related_client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `messages_ibfk_4` FOREIGN KEY (`parent_message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `notification_type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text DEFAULT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_allocations`
--

DROP TABLE IF EXISTS `payment_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_allocations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` bigint(20) unsigned NOT NULL,
  `billing_transaction_id` bigint(20) unsigned NOT NULL,
  `allocated_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payment` (`payment_id`),
  KEY `idx_transaction` (`billing_transaction_id`),
  CONSTRAINT `payment_allocations_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_allocations_ibfk_2` FOREIGN KEY (`billing_transaction_id`) REFERENCES `billing_transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_allocations`
--

LOCK TABLES `payment_allocations` WRITE;
/*!40000 ALTER TABLE `payment_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `billing_transaction_id` bigint(20) unsigned DEFAULT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','check','credit_card','insurance','other') NOT NULL,
  `payment_source` enum('patient','insurance','other') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `check_number` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `processed_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `processed_by` (`processed_by`),
  KEY `idx_client` (`client_id`),
  KEY `idx_transaction` (`billing_transaction_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`billing_transaction_id`) REFERENCES `billing_transactions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reference_lists`
--

DROP TABLE IF EXISTS `reference_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reference_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `list_type` varchar(50) NOT NULL COMMENT 'Type of list: sexual-orientation, gender-identity, marital-status, etc.',
  `name` varchar(100) NOT NULL COMMENT 'Display name of the item',
  `description` text DEFAULT NULL COMMENT 'Optional description or clarification',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Whether this item is active and should appear in selection lists',
  `sort_order` int(11) NOT NULL DEFAULT 0 COMMENT 'Sort order within list type',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type_name` (`list_type`,`name`),
  KEY `idx_list_type` (`list_type`),
  KEY `idx_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reference lists for clinical and demographic data';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reference_lists`
--

LOCK TABLES `reference_lists` WRITE;
/*!40000 ALTER TABLE `reference_lists` DISABLE KEYS */;
INSERT INTO `reference_lists` VALUES
(1,'sexual-orientation','Heterosexual','Attracted to opposite sex',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(2,'sexual-orientation','Gay','Attracted to same sex',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(3,'sexual-orientation','Lesbian','Woman attracted to women',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(4,'sexual-orientation','Bisexual','Attracted to both sexes',1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(5,'sexual-orientation','Pansexual','Attracted to all genders',1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(6,'sexual-orientation','Asexual','Limited or no sexual attraction',1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(7,'sexual-orientation','Queer','Non-heterosexual orientation',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(8,'sexual-orientation','Questioning','Exploring sexual orientation',1,8,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(9,'sexual-orientation','Other','Other sexual orientation',1,9,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(10,'sexual-orientation','Prefer not to say',NULL,1,10,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(11,'gender-identity','Male','Identifies as male',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(12,'gender-identity','Female','Identifies as female',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(13,'gender-identity','Transgender Male','Assigned female at birth, identifies as male',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(14,'gender-identity','Transgender Female','Assigned male at birth, identifies as female',1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(15,'gender-identity','Non-binary','Gender identity outside male/female binary',1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(16,'gender-identity','Genderqueer','Gender identity that is not exclusively male or female',1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(17,'gender-identity','Genderfluid','Gender identity that varies over time',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(18,'gender-identity','Agender','Without gender identity',1,8,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(19,'gender-identity','Two-Spirit','Indigenous gender identity',1,9,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(20,'gender-identity','Other','Other gender identity',1,10,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(21,'gender-identity','Prefer not to say',NULL,1,11,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(22,'pronouns','He/Him/His',NULL,1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(23,'pronouns','She/Her/Hers',NULL,1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(24,'pronouns','They/Them/Theirs',NULL,1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(28,'pronouns','Other','Other pronouns',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(29,'pronouns','Prefer not to say',NULL,1,8,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(30,'marital-status','Single','Never married',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(31,'marital-status','Married','Currently married',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(32,'marital-status','Domestic Partnership','In domestic partnership',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(33,'marital-status','Separated','Legally separated',1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(34,'marital-status','Divorced','Legally divorced',1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(35,'marital-status','Widowed','Spouse deceased',1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(36,'marital-status','Other','Other marital status',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(37,'client-status','Active','Currently receiving services',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(38,'client-status','Inactive','Not currently receiving services',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(39,'client-status','On Hold','Temporarily paused services',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(40,'client-status','Waitlist','Awaiting intake or services',1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(41,'client-status','Discharged','Completed or terminated services',1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(42,'ethnicity','Hispanic or Latino',NULL,1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(43,'ethnicity','Not Hispanic or Latino',NULL,1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(44,'ethnicity','American Indian or Alaska Native',NULL,1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(45,'ethnicity','Asian',NULL,1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(46,'ethnicity','Black or African American',NULL,1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(47,'ethnicity','Native Hawaiian or Pacific Islander',NULL,1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(48,'ethnicity','White',NULL,1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(49,'ethnicity','Two or More Races',NULL,1,8,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(50,'ethnicity','Other',NULL,1,9,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(51,'ethnicity','Prefer not to say',NULL,1,10,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(52,'insurance-type','Commercial','Private health insurance',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(53,'insurance-type','Medicare','Federal health insurance',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(54,'insurance-type','Medicaid','State health insurance',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(56,'insurance-type','Tricare','Military health insurance',1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(57,'insurance-type','VA Benefits','Veterans Affairs benefits',1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(58,'insurance-type','Self-Pay','No insurance, paying out of pocket',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(59,'insurance-type','Sliding Scale','Income-based fee',1,8,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(60,'insurance-type','Other','Other insurance type',1,9,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(61,'referral-source','Self-Referral','Client self-referred',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(62,'referral-source','Family/Friend','Referred by family or friend',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(63,'referral-source','Primary Care Physician','Referred by PCP',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(64,'referral-source','Psychiatrist','Referred by psychiatrist',1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(65,'referral-source','Therapist/Counselor','Referred by another therapist',1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(66,'referral-source','School','Referred by school counselor/staff',1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(67,'referral-source','Court/Legal','Court-ordered or legal system',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(68,'referral-source','Hospital/Emergency','Hospital or emergency services',1,8,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(69,'referral-source','Employee Assistance Program','Referred by EAP',1,9,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(70,'referral-source','Insurance Provider','Insurance referral',1,10,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(71,'referral-source','Online Search','Found via internet search',1,11,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(72,'referral-source','Social Media','Found via social media',1,12,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(73,'referral-source','Community Organization','Referred by community org',1,13,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(74,'referral-source','Other','Other referral source',1,14,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(75,'treatment-modality','CBT','Cognitive Behavioral Therapy',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(76,'treatment-modality','DBT','Dialectical Behavior Therapy',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(77,'treatment-modality','ACT','Acceptance and Commitment Therapy',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(78,'treatment-modality','EMDR','Eye Movement Desensitization and Reprocessing',1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(79,'treatment-modality','Psychodynamic','Psychodynamic therapy',1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(80,'treatment-modality','Humanistic','Humanistic/Person-centered therapy',1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(81,'treatment-modality','Motivational Interviewing','MI approach',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(82,'treatment-modality','Family Systems','Family therapy approach',1,8,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(83,'treatment-modality','Solution-Focused','Solution-focused brief therapy',1,9,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(84,'treatment-modality','Narrative Therapy','Narrative approach',1,10,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(85,'treatment-modality','Mindfulness-Based','Mindfulness-based interventions',1,11,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(86,'treatment-modality','Trauma-Focused','Trauma-focused therapy',1,12,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(87,'treatment-modality','Integrative','Integrated approach',1,13,'2026-01-19 12:36:00','2026-01-20 16:04:11'),
(88,'treatment-modality','Other','Other modality',1,14,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(89,'discharge-reason','Treatment goals achieved','Successfully completed treatment',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(90,'discharge-reason','Client request','Client chose to discontinue',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(91,'discharge-reason','Mutual agreement','Agreed to end services',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(92,'discharge-reason','Client no-show','Client stopped attending',1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(93,'discharge-reason','Administrative discharge','Discharged for administrative reasons',1,5,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(94,'discharge-reason','Transfer to another provider','Transferring care',1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(95,'discharge-reason','Moved out of area','Client relocated',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(96,'discharge-reason','Insurance/financial reasons','Unable to continue due to payment',1,8,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(97,'discharge-reason','Other','Other discharge reason',1,9,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(98,'calendar-category','Individual Therapy','1:1 therapy session',1,1,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(99,'calendar-category','Group Therapy','Group therapy session',1,2,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(100,'calendar-category','Family Therapy','Family/couples session',1,3,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(101,'calendar-category','Intake/Assessment','Initial intake or assessment',1,4,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(103,'calendar-category','Crisis','Crisis intervention',1,6,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(104,'calendar-category','Case Management','Case management services',1,7,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(106,'calendar-category','Testing','Psychological testing',1,9,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(107,'calendar-category','Consultation','Consultation appointment',1,10,'2026-01-19 12:36:00','2026-01-19 12:36:00'),
(108,'calendar-category','Administrative','Administrative meeting',1,11,'2026-01-19 12:36:00','2026-01-19 12:36:00');
/*!40000 ALTER TABLE `reference_lists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_last_activity` (`last_activity`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES
('10a5pg80bft41sa0709g3du56q',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:1;full_name|s:20:\"System Administrator\";login_time|i:1768747860;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"ken.nelan@sacwan.net\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:1;}',1768747973,'172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','2026-01-18 14:51:00'),
('1v910kq0hkda0g5augoc4o45st',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:0;full_name|s:20:\"System Administrator\";login_time|i:1768700471;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"admin@mindline.local\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:0;}',1768700806,'172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','2026-01-18 01:41:11'),
('68mrnje7t4dn3u9ac3pr4ra86k',NULL,'',1769174732,'172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','2026-01-23 13:25:32'),
('75668oa3te0ujs8alpo71eppdm',NULL,'',1769175399,'172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','2026-01-23 13:36:39'),
('aq0hpccmatmdgua3cajab7qgvi',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:1;full_name|s:20:\"System Administrator\";login_time|i:1769349958;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"ken.nelan@sacwan.net\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:1;}',1769350229,'172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0','2026-01-25 14:05:58'),
('bb78f36q6hqf41drvvjhdii102',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:1;full_name|s:20:\"System Administrator\";login_time|i:1768848365;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"ken.nelan@sacwan.net\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:1;}',1768848369,'172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','2026-01-19 18:46:05'),
('d1pcp251lurpo4d51ekmss2li0',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:1;full_name|s:20:\"System Administrator\";login_time|i:1768848934;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"ken.nelan@sacwan.net\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:1;}',1768849688,'172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','2026-01-19 18:55:34'),
('g0nmh66igu1iac09s64gduhldn',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:1;full_name|s:20:\"System Administrator\";login_time|i:1769290090;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"ken.nelan@sacwan.net\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:1;}',1769290187,'172.59.99.0','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0','2026-01-24 21:28:10'),
('gf5d5kr1nab5rmuqqnjv5kplv7',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:0;full_name|s:20:\"System Administrator\";login_time|i:1768742054;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"admin@mindline.local\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:0;}',1768742060,'172.59.99.0','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','2026-01-18 13:14:14'),
('hhmh24v6p3b72nk4bqsec4fqf8',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:1;full_name|s:20:\"System Administrator\";login_time|i:1768837479;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"ken.nelan@sacwan.net\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:1;}',1768837479,'172.59.99.0','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','2026-01-19 15:44:39'),
('s03fcgqhmep8vob3osoup9c09h',2,'user_id|i:2;username|s:5:\"admin\";user_type|s:5:\"admin\";is_provider|i:1;full_name|s:20:\"System Administrator\";login_time|i:1769294222;user|a:7:{s:2:\"id\";i:2;s:8:\"username\";s:5:\"admin\";s:10:\"first_name\";s:6:\"System\";s:9:\"last_name\";s:13:\"Administrator\";s:5:\"email\";s:20:\"ken.nelan@sacwan.net\";s:9:\"user_type\";s:5:\"admin\";s:11:\"is_provider\";i:1;}',1769294332,'192.168.1.80','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0','2026-01-24 22:37:02');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_lists`
--

DROP TABLE IF EXISTS `settings_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings_lists` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `list_id` varchar(50) NOT NULL,
  `option_id` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_default` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_list_option` (`list_id`,`option_id`),
  KEY `idx_list_id` (`list_id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_lists`
--

LOCK TABLES `settings_lists` WRITE;
/*!40000 ALTER TABLE `settings_lists` DISABLE KEYS */;
INSERT INTO `settings_lists` VALUES
(1,'therapy_modality','cbt','Cognitive Behavioral Therapy (CBT)',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(2,'therapy_modality','dbt','Dialectical Behavior Therapy (DBT)',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(3,'therapy_modality','psychodynamic','Psychodynamic Therapy',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(4,'therapy_modality','humanistic','Humanistic Therapy',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(5,'therapy_modality','emdr','EMDR (Eye Movement Desensitization)',NULL,1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(6,'therapy_modality','exposure','Exposure Therapy',NULL,1,0,60,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(7,'therapy_modality','family','Family Therapy',NULL,1,0,70,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(8,'therapy_modality','couples','Couples Therapy',NULL,1,0,80,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(9,'therapy_modality','group','Group Therapy',NULL,1,0,90,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(10,'therapy_modality','play','Play Therapy',NULL,1,0,100,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(11,'therapy_modality','art','Art Therapy',NULL,1,0,110,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(12,'therapy_modality','mindfulness','Mindfulness-Based Therapy',NULL,1,0,120,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(13,'therapy_modality','act','Acceptance and Commitment Therapy (ACT)',NULL,1,0,130,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(14,'therapy_modality','solution_focused','Solution-Focused Brief Therapy',NULL,1,0,140,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(15,'therapy_modality','motivational','Motivational Interviewing',NULL,1,0,150,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(16,'therapy_modality','trauma_focused','Trauma-Focused Therapy',NULL,1,0,160,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(17,'therapy_modality','other','Other',NULL,1,0,999,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(18,'treatment_goal_category','mood','Mood Regulation',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(19,'treatment_goal_category','anxiety','Anxiety Management',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(20,'treatment_goal_category','depression','Depression Management',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(21,'treatment_goal_category','trauma','Trauma Processing',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(22,'treatment_goal_category','relationships','Relationship Skills',NULL,1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(23,'treatment_goal_category','communication','Communication Skills',NULL,1,0,60,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(24,'treatment_goal_category','coping','Coping Strategies',NULL,1,0,70,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(25,'treatment_goal_category','self_esteem','Self-Esteem/Self-Worth',NULL,1,0,80,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(26,'treatment_goal_category','anger','Anger Management',NULL,1,0,90,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(27,'treatment_goal_category','substance','Substance Use',NULL,1,0,100,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(28,'treatment_goal_category','eating','Eating Behaviors',NULL,1,0,110,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(29,'treatment_goal_category','sleep','Sleep Hygiene',NULL,1,0,120,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(30,'treatment_goal_category','stress','Stress Management',NULL,1,0,130,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(31,'treatment_goal_category','family','Family Dynamics',NULL,1,0,140,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(32,'treatment_goal_category','work_school','Work/School Functioning',NULL,1,0,150,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(33,'treatment_goal_category','social','Social Skills',NULL,1,0,160,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(34,'treatment_goal_category','other','Other',NULL,1,0,999,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(35,'risk_level','none','No Risk','No identified risk',1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(36,'risk_level','low','Low Risk','Minimal risk factors present',1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(37,'risk_level','moderate','Moderate Risk','Some risk factors present',1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(38,'risk_level','high','High Risk','Significant risk factors',1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(39,'risk_level','imminent','Imminent Risk','Immediate intervention required',1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(40,'appointment_type','intake','Initial Intake/Assessment','90-minute initial evaluation',1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(41,'appointment_type','individual_60','Individual Therapy (60 min)','Standard individual session',1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(42,'appointment_type','individual_45','Individual Therapy (45 min)','Brief individual session',1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(43,'appointment_type','individual_90','Individual Therapy (90 min)','Extended individual session',1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(44,'appointment_type','couples','Couples Therapy','60-90 minute couples session',1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(45,'appointment_type','family','Family Therapy','60-90 minute family session',1,0,60,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(46,'appointment_type','group','Group Therapy','Group therapy session',1,0,70,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(47,'appointment_type','medication','Medication Management','Psychiatric medication review',1,0,80,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(48,'appointment_type','crisis','Crisis Intervention','Emergency/crisis appointment',1,0,90,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(49,'appointment_type','follow_up','Follow-Up','Brief follow-up appointment',1,0,100,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(50,'appointment_type','telehealth','Telehealth Session','Video/phone session',1,0,110,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(51,'appointment_type','testing','Psychological Testing','Assessment/testing session',1,0,120,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(52,'mse_appearance','well_groomed','Well-groomed',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(53,'mse_appearance','disheveled','Disheveled',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(54,'mse_appearance','appropriate','Appropriate dress',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(55,'mse_appearance','inappropriate','Inappropriate dress',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(56,'mse_behavior','cooperative','Cooperative',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(57,'mse_behavior','uncooperative','Uncooperative',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(58,'mse_behavior','agitated','Agitated',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(59,'mse_behavior','calm','Calm',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(60,'mse_behavior','withdrawn','Withdrawn',NULL,1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(61,'mse_mood','euthymic','Euthymic (normal)',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(62,'mse_mood','depressed','Depressed',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(63,'mse_mood','anxious','Anxious',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(64,'mse_mood','angry','Angry/Irritable',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(65,'mse_mood','elevated','Elevated',NULL,1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(66,'mse_mood','labile','Labile',NULL,1,0,60,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(67,'mse_affect','appropriate','Appropriate',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(68,'mse_affect','flat','Flat',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(69,'mse_affect','blunted','Blunted',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(70,'mse_affect','constricted','Constricted',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(71,'mse_affect','labile','Labile',NULL,1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(72,'mse_thought_process','logical','Logical/Coherent',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(73,'mse_thought_process','tangential','Tangential',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(74,'mse_thought_process','circumstantial','Circumstantial',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(75,'mse_thought_process','disorganized','Disorganized',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(76,'mse_thought_process','racing','Racing thoughts',NULL,1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(77,'mse_insight','good','Good',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(78,'mse_insight','fair','Fair',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(79,'mse_insight','poor','Poor',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(80,'mse_insight','absent','Absent',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(81,'mse_judgment','good','Good',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(82,'mse_judgment','fair','Fair',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(83,'mse_judgment','poor','Poor',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(84,'mse_judgment','impaired','Impaired',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(85,'progress_indicator','significant_improvement','Significant Improvement',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(86,'progress_indicator','moderate_improvement','Moderate Improvement',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(87,'progress_indicator','minimal_improvement','Minimal Improvement',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(88,'progress_indicator','no_change','No Change',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(89,'progress_indicator','regression','Regression/Decline',NULL,1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(90,'note_type','progress_note','Progress Note','Standard therapy session note',1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(91,'note_type','intake','Intake Assessment','Initial evaluation',1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(92,'note_type','psychiatric_eval','Psychiatric Evaluation','Comprehensive psychiatric assessment',1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(93,'note_type','treatment_plan','Treatment Plan','Treatment planning document',1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(94,'note_type','discharge_summary','Discharge Summary','Summary at end of treatment',1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(95,'note_type','crisis_note','Crisis Note','Emergency/crisis documentation',1,0,60,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(96,'note_type','phone_note','Phone Contact Note','Telephone contact documentation',1,0,70,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(97,'note_type','collateral','Collateral Contact','Contact with family/others',1,0,80,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(98,'note_type','supervision','Supervision Note','Clinical supervision documentation',1,0,90,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(99,'discharge_reason','goals_met','Treatment Goals Met',NULL,1,0,10,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(100,'discharge_reason','mutual','Mutual Agreement',NULL,1,0,20,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(101,'discharge_reason','client_request','Client Request',NULL,1,0,30,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(102,'discharge_reason','no_show','Repeated No-Shows',NULL,1,0,40,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(103,'discharge_reason','non_payment','Non-Payment',NULL,1,0,50,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(104,'discharge_reason','relocation','Client Relocated',NULL,1,0,60,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(105,'discharge_reason','higher_level','Referred to Higher Level of Care',NULL,1,0,70,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(106,'discharge_reason','other','Other',NULL,1,0,999,'2026-01-16 21:35:39','2026-01-16 21:35:39'),
(107,'rooms','office1','Office 1','Main therapy office',1,1,1,'2026-01-24 18:28:24','2026-01-24 18:28:24'),
(108,'rooms','office2','Office 2','Secondary therapy office',1,0,2,'2026-01-24 18:28:24','2026-01-24 18:28:24'),
(109,'rooms','office3','Office 3','Group therapy room',1,0,3,'2026-01-24 18:28:24','2026-01-24 18:28:24'),
(110,'rooms','telehealth','Telehealth','Virtual/remote session',1,0,4,'2026-01-24 18:28:24','2026-01-24 18:28:24'),
(111,'rooms','conference','Conference Room','Large meeting space',1,0,5,'2026-01-24 18:28:24','2026-01-24 18:28:24');
/*!40000 ALTER TABLE `settings_lists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','integer','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_editable` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_key` (`setting_key`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES
(1,'schedule_start','9','string',NULL,NULL,'2026-01-18 13:47:34','2026-01-24 15:54:49',1),
(2,'schedule_end','17','string',NULL,NULL,'2026-01-18 13:47:34','2026-01-24 15:54:49',1),
(3,'calendar_interval','30','string',NULL,NULL,'2026-01-18 13:47:34','2026-01-24 15:54:49',1),
(4,'calendar_view_type','week','string',NULL,NULL,'2026-01-18 13:47:34','2026-01-24 15:54:49',1),
(5,'event_color','1','string',NULL,NULL,'2026-01-18 13:47:34','2026-01-24 15:54:49',1),
(6,'docs_see_entire_calendar','1','string',NULL,NULL,'2026-01-18 13:47:34','2026-01-24 15:54:49',1),
(7,'security.max_login_attempts','5','integer','Maximum number of failed login attempts before account is locked','security','2026-01-23 14:25:59','2026-01-23 14:25:59',1),
(8,'security.lockout_duration_minutes','30','integer','Duration in minutes that an account remains locked after maximum failed attempts','security','2026-01-23 14:25:59','2026-01-23 14:25:59',1),
(9,'security.password_min_length','8','integer','Minimum password length required','security','2026-01-23 14:25:59','2026-01-23 14:25:59',1),
(10,'security.require_password_uppercase','1','boolean','Require at least one uppercase letter in passwords','security','2026-01-23 14:25:59','2026-01-23 14:25:59',1),
(11,'security.require_password_lowercase','1','boolean','Require at least one lowercase letter in passwords','security','2026-01-23 14:25:59','2026-01-23 14:25:59',1),
(12,'security.require_password_number','1','boolean','Require at least one number in passwords','security','2026-01-23 14:25:59','2026-01-23 14:25:59',1),
(13,'security.require_password_special','1','boolean','Require at least one special character in passwords','security','2026-01-23 14:25:59','2026-01-23 14:25:59',1),
(14,'security.session_timeout_minutes','480','integer','Session timeout in minutes (0 = no timeout)','security','2026-01-23 14:25:59','2026-01-23 14:25:59',1),
(23,'security.failed_attempts_expiration_hours','24','integer','Hours after which failed login attempts are reset (0 = never expire)','security','2026-01-23 14:42:20','2026-01-23 14:42:20',1);
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treatment_goals`
--

DROP TABLE IF EXISTS `treatment_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `treatment_goals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint(20) unsigned NOT NULL,
  `provider_id` bigint(20) unsigned NOT NULL,
  `goal_text` text NOT NULL,
  `goal_category` varchar(50) DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `progress_level` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `achieved_at` timestamp NULL DEFAULT NULL,
  `discontinued_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `treatment_goals_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `treatment_goals_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatment_goals`
--

LOCK TABLES `treatment_goals` WRITE;
/*!40000 ALTER TABLE `treatment_goals` DISABLE KEYS */;
/*!40000 ALTER TABLE `treatment_goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_favorite_interventions`
--

DROP TABLE IF EXISTS `user_favorite_interventions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_favorite_interventions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `intervention_id` bigint(20) unsigned NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_intervention` (`user_id`,`intervention_id`),
  KEY `idx_user` (`user_id`),
  KEY `intervention_id` (`intervention_id`),
  CONSTRAINT `user_favorite_interventions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_favorite_interventions_ibfk_2` FOREIGN KEY (`intervention_id`) REFERENCES `intervention_library` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_favorite_interventions`
--

LOCK TABLES `user_favorite_interventions` WRITE;
/*!40000 ALTER TABLE `user_favorite_interventions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_favorite_interventions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_role_assignments`
--

DROP TABLE IF EXISTS `user_role_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role_assignments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  `assigned_by` bigint(20) unsigned DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `user_role_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_role_assignments_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_role_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role_assignments`
--

LOCK TABLES `user_role_assignments` WRITE;
/*!40000 ALTER TABLE `user_role_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_role_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_supervisors`
--

DROP TABLE IF EXISTS `user_supervisors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_supervisors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `supervisor_id` bigint(20) unsigned NOT NULL,
  `relationship_type` enum('direct','clinical','administrative') DEFAULT 'direct',
  `started_at` date NOT NULL,
  `ended_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_supervisor` (`supervisor_id`),
  CONSTRAINT `user_supervisors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_supervisors_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_supervisors`
--

LOCK TABLES `user_supervisors` WRITE;
/*!40000 ALTER TABLE `user_supervisors` DISABLE KEYS */;
INSERT INTO `user_supervisors` VALUES
(1,10,2,'direct','2026-01-23',NULL,'2026-01-23 14:01:58','2026-01-23 14:01:58'),
(2,10,7,'direct','2026-01-23',NULL,'2026-01-23 14:01:58','2026-01-23 14:01:58');
/*!40000 ALTER TABLE `user_supervisors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `title` varchar(50) DEFAULT NULL,
  `suffix` varchar(20) DEFAULT NULL,
  `user_type` enum('admin','provider','staff','billing') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_provider` tinyint(1) DEFAULT 0,
  `is_supervisor` tinyint(1) DEFAULT 0,
  `portal_user` tinyint(1) DEFAULT 0,
  `npi` varchar(15) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `license_state` varchar(2) DEFAULT NULL,
  `dea_number` varchar(20) DEFAULT NULL,
  `federal_tax_id` varchar(20) DEFAULT NULL,
  `ein` varchar(20) DEFAULT NULL,
  `ssn` varchar(11) DEFAULT NULL,
  `taxonomy` varchar(20) DEFAULT NULL,
  `facility_id` bigint(20) unsigned DEFAULT NULL,
  `supervisor_id` bigint(20) unsigned DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `fax` varchar(20) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `password_changed_at` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `last_failed_login_at` timestamp NULL DEFAULT NULL,
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `default_modifier_id` int(11) DEFAULT NULL COMMENT 'Default billing modifier based on credentials',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_user_type` (`user_type`),
  KEY `idx_is_provider` (`is_provider`),
  KEY `idx_active` (`is_active`),
  KEY `idx_facility_id` (`facility_id`),
  KEY `idx_supervisor_id` (`supervisor_id`),
  KEY `idx_is_supervisor` (`is_supervisor`),
  KEY `idx_portal_user` (`portal_user`),
  KEY `idx_last_failed_login` (`last_failed_login_at`),
  KEY `idx_default_modifier` (`default_modifier_id`),
  CONSTRAINT `fk_users_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(2,'f83b6467-7a7e-46a2-8b96-7fb6032f2b78','admin','ken.nelan@sacwan.net','$2y$10$Vsi27QUnr3asgisRipjanuWcxSMUy6odd51lrRjwPbdLawph225C2','System','Administrator',NULL,NULL,NULL,'admin',1,1,1,1,NULL,'7251-125',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,'414-477-9887',NULL,NULL,'2026-01-25 14:05:58','2026-01-18 00:48:47',0,NULL,NULL,'2026-01-18 00:48:47','2026-01-25 14:05:58',NULL,NULL),
(3,'2fa37a93-f40d-11f0-9ab0-26465fc4acb1','sadmin','admin@mindline.test','$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV','Sarah','Administrator',NULL,NULL,NULL,'admin',1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-18 01:29:51','2026-01-23 14:20:49',NULL,NULL),
(4,'2fa37f82-f40d-11f0-9ab0-26465fc4acb1','dsmith','jsmith@mindline.test','$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV','John','Smith',NULL,NULL,NULL,'provider',1,1,1,1,'1234567890',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-18 01:29:51','2026-01-23 14:20:04',NULL,NULL),
(5,'2fa380c3-f40d-11f0-9ab0-26465fc4acb1','mjohnson','mjohnson@mindline.test','$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV','Maria','Johnson',NULL,NULL,NULL,'provider',1,1,0,1,'1234567891',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-18 01:29:51','2026-01-23 14:20:36',NULL,NULL),
(6,'2fa381c4-f40d-11f0-9ab0-26465fc4acb1','dwilliams','dwilliams@mindline.test','$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV','David','Williams',NULL,NULL,NULL,'provider',1,1,0,0,'1234567892',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-18 01:29:51','2026-01-23 14:20:25',NULL,NULL),
(7,'2fa382c1-f40d-11f0-9ab0-26465fc4acb1','jbrown','jbrown@mindline.test','$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV','Jennifer','Brown',NULL,NULL,NULL,'provider',1,1,1,1,'1234567893',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-18 01:29:51','2026-01-23 14:21:00','2026-01-18 13:26:33',NULL),
(8,'2fa383b9-f40d-11f0-9ab0-26465fc4acb1','ajones','ajones@mindline.test','$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV','Alice','Jones',NULL,NULL,NULL,'staff',1,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-18 01:29:51','2026-01-23 14:18:42',NULL,NULL),
(9,'2fa384b4-f40d-11f0-9ab0-26465fc4acb1','rdavis','rdavis@mindline.test','$2y$12$HOagThaUANaQ4nW4zRCIUeS992pvA887aK8Sv20fybfqD5yGpJjHK','Robert','Davis',NULL,NULL,NULL,'staff',1,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-23 13:42:08',0,NULL,NULL,'2026-01-18 01:29:51','2026-01-23 14:13:18',NULL,NULL),
(10,'106c0e5e-b87c-470d-a51c-10df42f44d2e','domyse','sacwan@sacwan.net','$2y$12$q13pEWufNypWIaAMwX0MheEEZDx1Y8V8UrXbbiDk10.DQIpkKBq6G','Dom','Myse',NULL,'LPC',NULL,'staff',1,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-01-23 13:43:11','2026-01-23 14:01:58',0,NULL,NULL,'2026-01-23 13:42:54','2026-01-23 14:01:58',NULL,NULL);
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

-- Dump completed on 2026-01-25 12:01:29
