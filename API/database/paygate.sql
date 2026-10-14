-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: 35.154.105.31    Database: paymentgateway
-- ------------------------------------------------------
-- Server version	8.4.10-0ubuntu0.26.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `disputes`
--

DROP TABLE IF EXISTS `disputes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disputes` (
  `dispute_id` varchar(64) NOT NULL,
  `transaction_id` varchar(64) NOT NULL,
  `type` enum('chargeback','lien','complaint') NOT NULL DEFAULT 'chargeback',
  `reason` varchar(500) NOT NULL,
  `status` enum('open','under_review','resolved','rejected') NOT NULL DEFAULT 'open',
  `resolution_notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dispute_id`),
  KEY `idx_disputes_transaction_id` (`transaction_id`),
  KEY `idx_disputes_status` (`status`),
  CONSTRAINT `fk_disputes_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `payin_transactions` (`transaction_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disputes`
--

LOCK TABLES `disputes` WRITE;
/*!40000 ALTER TABLE `disputes` DISABLE KEYS */;
/*!40000 ALTER TABLE `disputes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gateway_upi_entries`
--

DROP TABLE IF EXISTS `gateway_upi_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gateway_upi_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `business_mobile` varchar(20) NOT NULL,
  `upi_platform_id` varchar(50) NOT NULL,
  `upi_id` varchar(255) DEFAULT NULL,
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gateway_upi_user_mobile_platform` (`user_id`,`business_mobile`,`upi_platform_id`),
  KEY `idx_gateway_upi_user_id` (`user_id`),
  CONSTRAINT `fk_gateway_upi_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gateway_upi_entries`
--

LOCK TABLES `gateway_upi_entries` WRITE;
/*!40000 ALTER TABLE `gateway_upi_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `gateway_upi_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `googlepay_transactions`
--

DROP TABLE IF EXISTS `googlepay_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `googlepay_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `utr` varchar(64) DEFAULT NULL,
  `payment_timestamp` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gpay_utr` (`utr`),
  KEY `idx_gpay_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `googlepay_transactions`
--

LOCK TABLES `googlepay_transactions` WRITE;
/*!40000 ALTER TABLE `googlepay_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `googlepay_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ip_whitelist`
--

DROP TABLE IF EXISTS `ip_whitelist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ip_whitelist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `allowed_ip_address` varchar(45) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `added_date` date NOT NULL DEFAULT (curdate()),
  `user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_whitelist_address_unique` (`allowed_ip_address`),
  KEY `idx_ip_whitelist_user_id` (`user_id`),
  CONSTRAINT `fk_ip_whitelist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ip_whitelist`
--

LOCK TABLES `ip_whitelist` WRITE;
/*!40000 ALTER TABLE `ip_whitelist` DISABLE KEYS */;
/*!40000 ALTER TABLE `ip_whitelist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ledger`
--

DROP TABLE IF EXISTS `ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ledger` (
  `entry_id` varchar(64) NOT NULL,
  `debit_credit` enum('debit','credit') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance` decimal(15,2) NOT NULL,
  `reference_id` varchar(64) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entry_id`),
  KEY `idx_ledger_reference_id` (`reference_id`),
  KEY `idx_ledger_user_id` (`user_id`),
  CONSTRAINT `fk_ledger_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ledger`
--

LOCK TABLES `ledger` WRITE;
/*!40000 ALTER TABLE `ledger` DISABLE KEYS */;
/*!40000 ALTER TABLE `ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchant_api_keys`
--

DROP TABLE IF EXISTS `merchant_api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchant_api_keys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `key_id` varchar(64) NOT NULL,
  `secret_hash` varchar(128) NOT NULL,
  `secret_encrypted` varchar(255) DEFAULT NULL,
  `secret_last4` varchar(8) DEFAULT NULL,
  `mode` enum('test','live') NOT NULL DEFAULT 'test',
  `status` enum('active','revoked') NOT NULL DEFAULT 'active',
  `last_used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_api_keys_key_id_unique` (`key_id`),
  KEY `idx_merchant_api_keys_user_id` (`user_id`),
  CONSTRAINT `fk_merchant_api_keys_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchant_api_keys`
--

LOCK TABLES `merchant_api_keys` WRITE;
/*!40000 ALTER TABLE `merchant_api_keys` DISABLE KEYS */;
INSERT INTO `merchant_api_keys` VALUES (1,3,'pk_test_b20f3686de3ca4edcfa39b6b','6ce419de70cab783e413f5518c8ccfedc4ad31b8a519cf3b7116e68a75ef5908','f28fe660592ebc636136a5d1:029fc685d18adc54958696aa30244a61:4f376ada82f4baf43e0a4f2df124381f732bb36adbf63e18819fa46a7cfe78d40eb10ef1bc3baa4af9522f14b6449ac9dbfcf709e47cda11','984c','test','active','2026-10-14 11:26:28','2026-06-27 07:14:08','2026-10-14 11:26:28');
/*!40000 ALTER TABLE `merchant_api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchant_gateway_configs`
--

DROP TABLE IF EXISTS `merchant_gateway_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchant_gateway_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `gateway_provider` enum('phonepe','paytm','googlepay','bharatpe','razorpay') NOT NULL DEFAULT 'phonepe',
  `merchant_name` varchar(255) NOT NULL,
  `merchant_phone` varchar(20) NOT NULL,
  `phonepe_merchant_id` varchar(64) DEFAULT NULL,
  `client_id` varchar(255) NOT NULL,
  `client_secret` varchar(512) NOT NULL,
  `client_version` int NOT NULL DEFAULT '1',
  `environment` enum('sandbox','production') NOT NULL DEFAULT 'sandbox',
  `redirect_url` varchar(500) NOT NULL,
  `webhook_username` varchar(64) DEFAULT NULL,
  `webhook_password` varchar(128) DEFAULT NULL,
  `provider_config` json DEFAULT NULL,
  `status` enum('pending','active','inactive') NOT NULL DEFAULT 'pending',
  `activated_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_gateway_user_provider_unique` (`user_id`,`gateway_provider`),
  KEY `idx_merchant_gateway_status` (`status`),
  CONSTRAINT `fk_merchant_gateway_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchant_gateway_configs`
--

LOCK TABLES `merchant_gateway_configs` WRITE;
/*!40000 ALTER TABLE `merchant_gateway_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `merchant_gateway_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchant_kyc`
--

DROP TABLE IF EXISTS `merchant_kyc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchant_kyc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `status` enum('not_started','submitted','approved') NOT NULL DEFAULT 'not_started',
  `form_data` json DEFAULT NULL,
  `draft_data` json DEFAULT NULL,
  `draft_current_step` tinyint unsigned DEFAULT NULL,
  `draft_saved_at` datetime DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_kyc_user_unique` (`user_id`),
  KEY `idx_merchant_kyc_status` (`status`),
  KEY `idx_merchant_kyc_submitted_at` (`submitted_at`),
  KEY `fk_merchant_kyc_approved_by` (`approved_by`),
  KEY `fk_merchant_kyc_rejected_by` (`rejected_by`),
  CONSTRAINT `fk_merchant_kyc_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_merchant_kyc_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_merchant_kyc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchant_kyc`
--

LOCK TABLES `merchant_kyc` WRITE;
/*!40000 ALTER TABLE `merchant_kyc` DISABLE KEYS */;
/*!40000 ALTER TABLE `merchant_kyc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payin_transactions`
--

DROP TABLE IF EXISTS `payin_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payin_transactions` (
  `transaction_id` varchar(64) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `gateway_provider` enum('phonepe','paytm','googlepay','bharatpe','razorpay') DEFAULT NULL,
  `gateway_order_id` varchar(64) DEFAULT NULL,
  `byte_transaction_id` varchar(64) DEFAULT NULL,
  `utr` varchar(64) DEFAULT NULL,
  `redirect_url` text,
  `remark1` varchar(255) DEFAULT NULL,
  `remark2` varchar(255) DEFAULT NULL,
  `gateway_state` varchar(32) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `status` enum('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `date_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `idx_payin_order_id` (`order_id`),
  KEY `idx_payin_status` (`status`),
  KEY `idx_payin_user_id` (`user_id`),
  KEY `idx_payin_byte_txn` (`byte_transaction_id`),
  CONSTRAINT `fk_payin_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payin_transactions`
--

LOCK TABLES `payin_transactions` WRITE;
/*!40000 ALTER TABLE `payin_transactions` DISABLE KEYS */;
INSERT INTO `payin_transactions` VALUES ('TXN1782544574842456','DM-1782544574828-3781','Alice Kumar','9876543210','razorpay','order_T6ZO5DJwZqiH8J','BYTE11121782544574842',NULL,'https://casypay.com/demo-store/demo-store/result?orderId=DM-1782544574828-3781','DummyMart order',NULL,'captured',1499.00,'razorpay','success','2026-06-27 07:16:15',3,'2026-06-27 07:16:15','2026-06-27 07:17:00'),('TXN1782566682746703','DM-1782566682675-4083','Alice Kumar','9876543210','razorpay','order_T6ffIw7oXx2CLf','BYTE58341782566682746',NULL,'https://casypay.com/demo-store/demo-store/result?orderId=DM-1782566682675-4083','DummyMart order',NULL,'created',3289.00,'razorpay','pending','2026-06-27 13:24:43',3,'2026-06-27 13:24:43','2026-06-27 13:24:43'),('TXN1782566729355944','DM-1782566729339-1282','Alice Kumar','9876543210','razorpay','order_T6fg7nKpWit2dE','BYTE49031782566729355',NULL,'https://casypay.com/demo-store/demo-store/result?orderId=DM-1782566729339-1282','DummyMart order',NULL,'captured',3289.00,'razorpay','success','2026-06-27 13:25:29',3,'2026-06-27 13:25:29','2026-06-27 13:26:38'),('TXN1783315502959464','DM-1783315502597-6283','Alice Kumar','9876543210','razorpay','order_TA6Ihl5jZ5RT2P','BYTE72451783315502959',NULL,'https://casypay.com/demo-store/demo-store/result?orderId=DM-1783315502597-6283','DummyMart order',NULL,'captured',1999.00,'razorpay','success','2026-07-06 05:25:03',3,'2026-07-06 05:25:03','2026-07-06 05:25:54'),('TXN1791977189010972','DM-1791977188774-5969','Alice Kumar','9876543210','razorpay','order_TnlsY65QkwlhoV','BYTE12481791977189010',NULL,'https://casypay.com/demo-store/demo-store/result?orderId=DM-1791977188774-5969','DummyMart order',NULL,'created',1499.00,'razorpay','pending','2026-10-14 11:26:29',3,'2026-10-14 11:26:29','2026-10-14 11:26:29');
/*!40000 ALTER TABLE `payin_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_links`
--

DROP TABLE IF EXISTS `payment_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `link_token` varchar(128) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_link_token` (`link_token`),
  KEY `idx_payment_link_order` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_links`
--

LOCK TABLES `payment_links` WRITE;
/*!40000 ALTER TABLE `payment_links` DISABLE KEYS */;
INSERT INTO `payment_links` VALUES (1,'37a5ff71af322a62921e0b057726647435644d36b7c758c41668a934bf5cb36c','DM-1782544574828-3781','2026-06-27 07:16:15'),(2,'f10bb2e735af1e766c2c2ef158cc0f9ddafeb7c00b1ab4fe0937e108ae69003e','DM-1782566682675-4083','2026-06-27 13:24:43'),(3,'38f5739e11b9f293e923de834fa9707f22d2b473374028d74d76c12e78a682b0','DM-1782566729339-1282','2026-06-27 13:25:29'),(4,'e60609ab84d60f41c74ffdd6e79fa825ff3ba0d9ff38746307712cf082a58eaf','DM-1783315502597-6283','2026-07-06 05:25:03'),(5,'981c6e421ba69fdff12433c46adf3ddd149b23c5f8e9aa25dfc461528bfab372','DM-1791977188774-5969','2026-10-14 11:26:29');
/*!40000 ALTER TABLE `payment_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payout_balance`
--

DROP TABLE IF EXISTS `payout_balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payout_balance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `available_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `pending_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payout_balance_user_unique` (`user_id`),
  CONSTRAINT `fk_payout_balance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payout_balance`
--

LOCK TABLES `payout_balance` WRITE;
/*!40000 ALTER TABLE `payout_balance` DISABLE KEYS */;
/*!40000 ALTER TABLE `payout_balance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payout_transactions`
--

DROP TABLE IF EXISTS `payout_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payout_transactions` (
  `payout_id` varchar(64) NOT NULL,
  `beneficiary_name` varchar(255) NOT NULL,
  `bank_details` varchar(500) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('pending','processing','success','failed') NOT NULL DEFAULT 'pending',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payout_id`),
  KEY `idx_payout_status` (`status`),
  KEY `idx_payout_user_id` (`user_id`),
  CONSTRAINT `fk_payout_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payout_transactions`
--

LOCK TABLES `payout_transactions` WRITE;
/*!40000 ALTER TABLE `payout_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `payout_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platform_gateway_configs`
--

DROP TABLE IF EXISTS `platform_gateway_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platform_gateway_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gateway_provider` enum('razorpay') NOT NULL DEFAULT 'razorpay',
  `singleton` char(9) NOT NULL DEFAULT 'singleton',
  `display_name` varchar(255) DEFAULT NULL,
  `key_id` varchar(255) DEFAULT NULL,
  `key_secret_encrypted` varchar(512) DEFAULT NULL,
  `key_secret_last4` varchar(8) DEFAULT NULL,
  `webhook_secret_encrypted` varchar(512) DEFAULT NULL,
  `environment` enum('sandbox','production') NOT NULL DEFAULT 'sandbox',
  `status` enum('pending','active','inactive') NOT NULL DEFAULT 'pending',
  `activated_at` datetime DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `platform_gateway_singleton_unique` (`gateway_provider`,`singleton`),
  KEY `fk_platform_gateway_updated_by` (`updated_by`),
  CONSTRAINT `fk_platform_gateway_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platform_gateway_configs`
--

LOCK TABLES `platform_gateway_configs` WRITE;
/*!40000 ALTER TABLE `platform_gateway_configs` DISABLE KEYS */;
INSERT INTO `platform_gateway_configs` VALUES (1,'razorpay','singleton',NULL,NULL,NULL,NULL,NULL,'sandbox','active','2026-06-27 07:16:12',1,'2026-06-27 07:16:12','2026-06-27 07:16:12');
/*!40000 ALTER TABLE `platform_gateway_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settlements`
--

DROP TABLE IF EXISTS `settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlements` (
  `settlement_id` varchar(64) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `fees` decimal(15,2) NOT NULL DEFAULT '0.00',
  `net_amount` decimal(15,2) NOT NULL,
  `settlement_status` enum('pending','processing','settled','failed') NOT NULL DEFAULT 'pending',
  `settlement_date` date DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`settlement_id`),
  KEY `idx_settlements_status` (`settlement_status`),
  KEY `idx_settlements_user_id` (`user_id`),
  CONSTRAINT `fk_settlements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settlements`
--

LOCK TABLES `settlements` WRITE;
/*!40000 ALTER TABLE `settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `user_id` int NOT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `bio` text,
  `location` varchar(255) DEFAULT NULL,
  `avatar_url` mediumtext,
  `date_of_birth` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `refresh_token` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT '0',
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `last_used_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_sessions_refresh_token_unique` (`refresh_token`(255)),
  KEY `idx_user_sessions_user_id` (`user_id`),
  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` VALUES (1,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgyNTM4ODQ0LCJleHAiOjE3ODMxNDM2NDR9.RlYvT93XbkMWb7b4wTITkOaBJBBhcU4eydIVEQA0xQA','2026-07-04 05:40:44',0,'::ffff:127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 05:40:44','2026-06-27 05:40:44','2026-06-27 05:40:44'),(2,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzgyNTQxOTU3LCJleHAiOjE3ODMxNDY3NTd9.qLnQFeaUa4PspgvUMn2EzK7wIdU9SISuzNRzOEqqGxU','2026-07-04 06:32:37',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 06:32:38','2026-06-27 06:32:38','2026-06-27 06:32:38'),(3,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgyNTQ0MzQ5LCJleHAiOjE3ODMxNDkxNDl9.FAQZG3GqAjiMu6SLULGy31hu4hhmelRdLKc0Oc_JirI','2026-07-04 07:12:29',0,'::ffff:127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 07:12:30','2026-06-27 07:12:30','2026-06-27 07:12:30'),(4,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzgyNTQ0NDQ0LCJleHAiOjE3ODMxNDkyNDR9.nLDPzojg5lp2s8EXhGFmS0Oy9CR2K34sAOMtqmDzyFk','2026-07-04 07:14:04',0,'::ffff:127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 07:14:04','2026-06-27 07:14:04','2026-06-27 07:14:04'),(5,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgyNTQ0NTY4LCJleHAiOjE3ODMxNDkzNjh9.aeBPolK6jktsO9qpfV2osOYOkPPvMeTcqb3fWWHfQ0c','2026-07-04 07:16:08',0,'::ffff:127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 07:16:09','2026-06-27 07:16:09','2026-06-27 07:16:09'),(6,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzgyNTQ0NjI4LCJleHAiOjE3ODMxNDk0Mjh9.1djRDB4hAMngtKlnhF1h5oY1d7HUmgBeFJrPTlZbMFU','2026-07-04 07:17:08',0,'::ffff:127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 07:17:08','2026-06-27 07:17:08','2026-06-27 07:17:08'),(7,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgyNTQ0ODAyLCJleHAiOjE3ODMxNDk2MDJ9.jJLMnhAF_UhCjGv685-_6SrEcWWae7zwvwZrSFUrga8','2026-07-04 07:20:02',0,'::ffff:127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 07:20:02','2026-06-27 07:20:02','2026-06-27 07:20:02'),(8,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgyNTY2NTkzLCJleHAiOjE3ODMxNzEzOTN9.b2Sio2vWVlk9bdd1kB44odeI6hhjzMHUPIBy32V-Uss','2026-07-04 13:23:13',0,'::ffff:127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 13:23:14','2026-06-27 13:23:14','2026-06-27 13:23:14'),(9,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzgyNTY2NjQ5LCJleHAiOjE3ODMxNzE0NDl9.k2PLmVYxqQwSuYHzrU-3dfQgPYecl-MAakMVuxpVEBs','2026-07-04 13:24:09',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-27 13:24:09','2026-06-27 13:24:09','2026-06-27 13:24:09'),(10,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgyNTY2OTA5LCJleHAiOjE3ODMxNzE3MDl9.ugF5rOVxUsYYUzfRxmVUgCu-ZLX85ewTE9y4fx4x3Gw','2026-07-04 13:28:29',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-06-28 07:22:08','2026-06-27 13:28:30','2026-06-28 07:22:08'),(11,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgzMzE1Mjk2LCJleHAiOjE3ODM5MjAwOTZ9.RUAQfunndElXdhyLe44LIdt8Z53veJpg2m-X95nVhX8','2026-07-13 05:21:36',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 05:21:37','2026-07-06 05:21:37','2026-07-06 05:21:37'),(12,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzgzMzE1NDExLCJleHAiOjE3ODM5MjAyMTF9.jtksn-Ub4TOt_DlFFZ5MtLL_8LcYXy7HMcjr5eoUaKA','2026-07-13 05:23:31',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 05:23:32','2026-07-06 05:23:32','2026-07-06 05:23:32'),(13,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgzMzE2NDI2LCJleHAiOjE3ODM5MjEyMjZ9.Li6je-o-1ICJ5kCn-v9ubZcegKNhMONyYfFIl_Hj7F4','2026-07-13 05:40:26',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-06 05:40:27','2026-07-06 05:40:27','2026-07-06 05:40:27'),(14,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgzMzE2NDMzLCJleHAiOjE3ODM5MjEyMzN9.1s1xezlsGQnQ91kIrVzTNyHHP0uDzzWAGza_LwwbS18','2026-07-13 05:40:33',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-06 05:40:34','2026-07-06 05:40:34','2026-07-06 05:40:34'),(15,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgzMzE2NDQ2LCJleHAiOjE3ODM5MjEyNDZ9.Nfn2Hr7fcCuJUUFkdEaxntoCcoOha-GBDygrkkmTTmk','2026-07-13 05:40:46',0,'::ffff:127.0.0.1','Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','2026-07-06 05:40:47','2026-07-06 05:40:47','2026-07-06 05:40:47'),(16,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgzMzE2NzQ2LCJleHAiOjE3ODM5MjE1NDZ9.X-6v4LLeCCbBQk1ZWZxXOOOLsIVdnBZTZS06WPNLX8M','2026-07-13 05:45:46',0,'::ffff:127.0.0.1','Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','2026-07-06 05:45:47','2026-07-06 05:45:47','2026-07-06 05:45:47'),(17,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg0NDcwNTUzLCJleHAiOjE3ODUwNzUzNTN9.ve_qsqvAnXN6Vrn4BYXEtcMidKHc_H7XJWyLzB93IvM','2026-07-26 14:15:53',0,'::ffff:127.0.0.1','Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','2026-07-19 14:15:54','2026-07-19 14:15:54','2026-07-19 14:15:54'),(18,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg0NDg2MDI1LCJleHAiOjE3ODUwOTA4MjV9.BCJYMsQka_YpElKpaiQZsiCo1_P_GVHNUEPZd1_Uat4','2026-07-26 18:33:45',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-19 18:33:45','2026-07-19 18:33:45','2026-07-19 18:33:45'),(19,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzg0NDg2MTI2LCJleHAiOjE3ODUwOTA5MjZ9.laDT_w0rw_s2Zeje9Rl4N0k-8p-RHGvZxd8qXoczfBg','2026-07-26 18:35:26',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-19 18:35:26','2026-07-19 18:35:26','2026-07-19 18:35:26'),(20,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkxODczMzc4LCJleHAiOjE3OTI0NzgxNzh9.Uz4BIDV5ikCC23uC0tT9j6KghJEPFE_8ZS-7BiG1PJE','2026-10-20 06:36:18',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-14 11:28:20','2026-10-13 06:36:18','2026-10-14 11:28:20'),(21,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzkxODczMzkxLCJleHAiOjE3OTI0NzgxOTF9.qfCOaY2GBRVv8zBzt564s3AnzgGT-jSw06fOLLNc_v0','2026-10-20 06:36:31',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-13 09:17:23','2026-10-13 06:36:31','2026-10-13 09:17:23'),(22,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkxOTc2NDQ2LCJleHAiOjE3OTI1ODEyNDZ9.bEtMzkDyGZMPyp41WJ-kB_fkJ_aAJjp0oHDBauj_K34','2026-10-21 11:14:06',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-14 11:14:07','2026-10-14 11:14:07','2026-10-14 11:14:07'),(23,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzkxOTc2NTU3LCJleHAiOjE3OTI1ODEzNTd9.ILLKq8BhJcay1LQj5hyGXZ6Z58RuGYydWmodIoW9Hgg','2026-10-21 11:15:57',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-14 11:15:57','2026-10-14 11:15:57','2026-10-14 11:15:57'),(24,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkxOTc2OTA5LCJleHAiOjE3OTI1ODE3MDl9.ke-beRwyDgJ_sqZ9f_TeFoQxVRwSmfkJ5g6NYgTP4Zo','2026-10-21 11:21:49',0,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-10-14 11:21:49','2026-10-14 11:21:49','2026-10-14 11:21:49');
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','merchant') NOT NULL DEFAULT 'merchant',
  `approval_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `kyc_status` enum('verified','unverified','submitted','rejected') NOT NULL DEFAULT 'unverified',
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approval_requested_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `otp_verified_at` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_number_unique` (`phone_number`),
  KEY `idx_users_kyc_status` (`kyc_status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'pgpg6074','Paygate','Gateway','admin@paygate.com','0000000000','$2b$10$ajn4qY9q9r8ePSpuYRTFKODVjvC9nj3eSovtm73MWjqr0CpG9eOrC','admin','approved','verified',NULL,NULL,'2026-06-27 05:19:59',NULL,NULL,NULL,NULL,NULL,'2026-06-27 05:19:59','2026-10-14 11:21:50','2026-06-27 05:19:59','2026-10-14 11:21:50'),(3,'mepa8189','Merchant','Paygate','merchant@paygate.com','0000000001','$2b$10$091lRHO/h9PIWSpiymjI0OtiWn61K6T.RaQupRVtfHLnSUULcnJSG','merchant','approved','verified','2026-06-27 07:12:45',1,'2026-06-27 05:22:35',NULL,NULL,NULL,NULL,NULL,'2026-06-27 05:22:35','2026-10-14 11:15:57','2026-06-27 05:22:35','2026-10-14 11:15:57');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'paymentgateway'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-14 17:05:42
