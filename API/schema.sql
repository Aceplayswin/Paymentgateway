-- =============================================================================
-- Payment Gateway System - Database Schema (MySQL)
-- Generated from payment_gateway_ui_flow.pdf
--
-- Dialect      : MySQL (matches config/db.js -> dialect: 'mysql')
-- Engine       : InnoDB (FK support)
-- Charset      : utf8mb4
--
-- Single source of truth for fresh database setup — import this file directly
-- (no incremental migrations). Tables map to screen fields in the PDF and to
-- Sequelize models under models/.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. users  (already managed by models/user.model.js)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `username`     VARCHAR(255) NOT NULL,
  `first_name`   VARCHAR(255) NOT NULL,
  `last_name`    VARCHAR(255) NOT NULL,
  `email`        VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(255) NULL,
  `password`     VARCHAR(255) NOT NULL,
  `role`         ENUM('admin','merchant') NOT NULL DEFAULT 'merchant',
  `approval_status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `kyc_status`   ENUM('verified','unverified','submitted','rejected') NOT NULL DEFAULT 'unverified',
  `approved_at`  DATETIME NULL,
  `approved_by`  INT NULL,
  `approval_requested_at` DATETIME NULL,
  `rejected_at`  DATETIME NULL,
  `rejected_by`  INT NULL,
  `rejection_reason` VARCHAR(500) NULL,
  `otp_code`     VARCHAR(6) NULL,
  `otp_expires_at` DATETIME NULL,
  `otp_verified_at` DATETIME NULL,
  `last_login`   DATETIME NULL,
  `created_at`    DATETIME NOT NULL,
  `updated_at`    DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_number_unique` (`phone_number`),
  KEY `idx_users_kyc_status` (`kyc_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2. user_sessions  (already managed by models/userSession.model.js)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `user_id`       INT NOT NULL,
  `refresh_token` TEXT NOT NULL,
  `expires_at`    DATETIME NOT NULL,
  `is_revoked`    TINYINT(1) NOT NULL DEFAULT 0,
  `ip_address`    VARCHAR(255) NULL,
  `user_agent`    VARCHAR(255) NULL,
  `last_used_at`  DATETIME NOT NULL,
  `created_at`     DATETIME NOT NULL,
  `updated_at`     DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_sessions_refresh_token_unique` (`refresh_token`(255)),
  KEY `idx_user_sessions_user_id` (`user_id`),
  CONSTRAINT `fk_user_sessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2b. merchant_kyc  (merchant verification / KYC form from FE onboarding)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `merchant_kyc` (
  `id`                  INT NOT NULL AUTO_INCREMENT,
  `user_id`             INT NOT NULL,
  `status`              ENUM('not_started','submitted','approved') NOT NULL DEFAULT 'not_started',
  `form_data`           JSON NULL,
  `draft_data`          JSON NULL,
  `draft_current_step`  TINYINT UNSIGNED NULL,
  `draft_saved_at`      DATETIME NULL,
  `submitted_at`        DATETIME NULL,
  `approved_at`         DATETIME NULL,
  `approved_by`         INT NULL,
  `rejected_at`         DATETIME NULL,
  `rejected_by`         INT NULL,
  `rejection_reason`    VARCHAR(500) NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_kyc_user_unique` (`user_id`),
  KEY `idx_merchant_kyc_status` (`status`),
  KEY `idx_merchant_kyc_submitted_at` (`submitted_at`),
  CONSTRAINT `fk_merchant_kyc_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_merchant_kyc_approved_by`
    FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_merchant_kyc_rejected_by`
    FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2c. user_profiles  (extended profile fields for FE Profile page)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `user_id`             INT NOT NULL,
  `job_title`           VARCHAR(255) NULL,
  `department`          VARCHAR(255) NULL,
  `bio`                 TEXT NULL,
  `location`            VARCHAR(255) NULL,
  `avatar_url`          MEDIUMTEXT NULL,
  `date_of_birth`       DATE NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_profiles_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2d. gateway_upi_entries  (PhonePe Business UPI linkage from FE Gateway page)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `gateway_upi_entries` (
  `id`                    INT NOT NULL AUTO_INCREMENT,
  `user_id`               INT NOT NULL,
  `business_mobile`       VARCHAR(20) NOT NULL,
  `upi_platform_id`       VARCHAR(50) NOT NULL,
  `upi_id`                VARCHAR(255) NULL,
  `status`                ENUM('active','disabled') NOT NULL DEFAULT 'active',
  `added_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gateway_upi_user_mobile_platform` (`user_id`, `business_mobile`, `upi_platform_id`),
  KEY `idx_gateway_upi_user_id` (`user_id`),
  CONSTRAINT `fk_gateway_upi_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- PAYIN MODULE
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3a. merchant_gateway_configs  (PhonePe Business merchant account linkage)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `merchant_gateway_configs` (
  `id`                  INT NOT NULL AUTO_INCREMENT,
  `user_id`             INT NOT NULL,
  `gateway_provider`    ENUM('phonepe','paytm','googlepay','bharatpe','razorpay') NOT NULL DEFAULT 'phonepe',
  `merchant_name`       VARCHAR(255) NOT NULL,
  `merchant_phone`      VARCHAR(20) NOT NULL,
  `phonepe_merchant_id` VARCHAR(64) NULL,
  `client_id`           VARCHAR(255) NOT NULL,
  `client_secret`       VARCHAR(512) NOT NULL,
  `client_version`      INT NOT NULL DEFAULT 1,
  `environment`         ENUM('sandbox','production') NOT NULL DEFAULT 'sandbox',
  `redirect_url`        VARCHAR(500) NOT NULL,
  `webhook_username`    VARCHAR(64) NULL,
  `webhook_password`    VARCHAR(128) NULL,
  `provider_config`     JSON NULL,
  `status`              ENUM('pending','active','inactive') NOT NULL DEFAULT 'pending',
  `activated_at`        DATETIME NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_gateway_user_provider_unique` (`user_id`, `gateway_provider`),
  KEY `idx_merchant_gateway_status` (`status`),
  CONSTRAINT `fk_merchant_gateway_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3b. platform_gateway_configs  (which acquiring gateway the Admin has active)
--     Records WHICH gateway powers payments (white-label / aggregator model).
--     Acquiring credentials now live in the server ENVIRONMENT (.env via
--     config/gatewayCredentials.js), NOT here — the admin only activates a
--     gateway. One row per provider via the constant `singleton` key. The
--     credential columns below are legacy and are no longer read or written.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `platform_gateway_configs` (
  `id`                    INT NOT NULL AUTO_INCREMENT,
  `gateway_provider`      ENUM('razorpay') NOT NULL DEFAULT 'razorpay',
  `singleton`             CHAR(9) NOT NULL DEFAULT 'singleton',
  `display_name`          VARCHAR(255) NULL,
  `key_id`                VARCHAR(255) NULL,
  `key_secret_encrypted`  VARCHAR(512) NULL,
  `key_secret_last4`      VARCHAR(8) NULL,
  `webhook_secret_encrypted` VARCHAR(512) NULL,
  `environment`           ENUM('sandbox','production') NOT NULL DEFAULT 'sandbox',
  `status`                ENUM('pending','active','inactive') NOT NULL DEFAULT 'pending',
  `activated_at`          DATETIME NULL,
  `updated_by`            INT NULL,
  `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `platform_gateway_singleton_unique` (`gateway_provider`, `singleton`),
  CONSTRAINT `fk_platform_gateway_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payin_transactions` (
  `transaction_id` VARCHAR(64) NOT NULL,
  `order_id`       VARCHAR(64) NOT NULL,
  `customer_name`  VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(20) NULL,
  `gateway_provider` ENUM('phonepe','paytm','googlepay','bharatpe','razorpay') NULL,
  `gateway_order_id` VARCHAR(64) NULL,
  `byte_transaction_id` VARCHAR(64) NULL,
  `utr`            VARCHAR(64) NULL,
  `redirect_url`   TEXT NULL,
  `remark1`        VARCHAR(255) NULL,
  `remark2`        VARCHAR(255) NULL,
  `gateway_state`  VARCHAR(32) NULL,
  `amount`         DECIMAL(15,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `status`         ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `date_time`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`        INT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `idx_payin_order_id` (`order_id`),
  KEY `idx_payin_status` (`status`),
  KEY `idx_payin_user_id` (`user_id`),
  KEY `idx_payin_byte_txn` (`byte_transaction_id`),
  CONSTRAINT `fk_payin_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3c. payment_links  (hosted-payment-page tokens, 5-min TTL)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_links` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `link_token` VARCHAR(128) NOT NULL,
  `order_id`   VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_link_token` (`link_token`),
  KEY `idx_payment_link_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3d. googlepay_transactions  (SMS-ingested incoming UPI credits)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `googlepay_transactions` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `user_id`           INT NULL,
  `amount`            DECIMAL(15,2) NULL,
  `customer_name`     VARCHAR(255) NULL,
  `company_name`      VARCHAR(255) NULL,
  `date`              DATE NULL,
  `utr`               VARCHAR(64) NULL,
  `payment_timestamp` BIGINT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gpay_utr` (`utr`),
  KEY `idx_gpay_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 4. settlements
--    PDF fields: Settlement ID, Total Amount, Fees, Net Amount,
--                Settlement Status, Settlement Date
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settlements` (
  `settlement_id`     VARCHAR(64) NOT NULL,
  `total_amount`      DECIMAL(15,2) NOT NULL,
  `fees`              DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `net_amount`        DECIMAL(15,2) NOT NULL,
  `settlement_status` ENUM('pending','processing','settled','failed') NOT NULL DEFAULT 'pending',
  `settlement_date`   DATE NULL,
  `user_id`           INT NULL,
  `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`settlement_id`),
  KEY `idx_settlements_status` (`settlement_status`),
  KEY `idx_settlements_user_id` (`user_id`),
  CONSTRAINT `fk_settlements_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 5. disputes
--    Covers Payin "Chargeback & Liens" and "Complaints".
--    PDF fields: Dispute ID, Transaction ID, Reason, Status, Resolution Notes
--    `type` distinguishes chargeback / lien / complaint.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `disputes` (
  `dispute_id`       VARCHAR(64) NOT NULL,
  `transaction_id`   VARCHAR(64) NOT NULL,
  `type`             ENUM('chargeback','lien','complaint') NOT NULL DEFAULT 'chargeback',
  `reason`           VARCHAR(500) NOT NULL,
  `status`           ENUM('open','under_review','resolved','rejected') NOT NULL DEFAULT 'open',
  `resolution_notes` TEXT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dispute_id`),
  KEY `idx_disputes_transaction_id` (`transaction_id`),
  KEY `idx_disputes_status` (`status`),
  CONSTRAINT `fk_disputes_transaction`
    FOREIGN KEY (`transaction_id`) REFERENCES `payin_transactions` (`transaction_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- PAYOUT MODULE
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 6. payout_transactions
--    PDF fields: Payout ID, Beneficiary Name, Bank Details, Amount,
--                Status, Timestamp
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payout_transactions` (
  `payout_id`        VARCHAR(64) NOT NULL,
  `beneficiary_name` VARCHAR(255) NOT NULL,
  `bank_details`     VARCHAR(500) NOT NULL,
  `amount`           DECIMAL(15,2) NOT NULL,
  `status`           ENUM('pending','processing','success','failed') NOT NULL DEFAULT 'pending',
  `timestamp`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`          INT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payout_id`),
  KEY `idx_payout_status` (`status`),
  KEY `idx_payout_user_id` (`user_id`),
  CONSTRAINT `fk_payout_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 7. ip_whitelist
--    PDF fields: Allowed IP Address, Status (Active/Inactive), Added Date
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ip_whitelist` (
  `id`                 INT NOT NULL AUTO_INCREMENT,
  `allowed_ip_address` VARCHAR(45) NOT NULL,
  `status`             ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `added_date`         DATE NOT NULL DEFAULT (CURRENT_DATE),
  `user_id`            INT NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_whitelist_address_unique` (`allowed_ip_address`),
  KEY `idx_ip_whitelist_user_id` (`user_id`),
  CONSTRAINT `fk_ip_whitelist_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 8. ledger
--    PDF fields: Entry ID, Debit/Credit, Balance, Reference ID, Timestamp
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ledger` (
  `entry_id`     VARCHAR(64) NOT NULL,
  `debit_credit` ENUM('debit','credit') NOT NULL,
  `amount`       DECIMAL(15,2) NOT NULL,
  `balance`      DECIMAL(15,2) NOT NULL,
  `reference_id` VARCHAR(64) NULL,
  `timestamp`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`      INT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entry_id`),
  KEY `idx_ledger_reference_id` (`reference_id`),
  KEY `idx_ledger_user_id` (`user_id`),
  CONSTRAINT `fk_ledger_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 9. payout_balance
--    PDF fields: Available Balance, Pending Amount, Total Balance
--    One balance row per user/merchant.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payout_balance` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `user_id`           INT NOT NULL,
  `available_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `pending_amount`    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_balance`     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payout_balance_user_unique` (`user_id`),
  CONSTRAINT `fk_payout_balance_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 10. merchant_api_keys
--     Public/secret API key pairs merchants use to authenticate calls to the
--     public payment API (/api/v1/*) with HMAC request signing. Only the SHA-256
--     hash of the secret is stored; the plaintext secret is shown once on create.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `merchant_api_keys` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `user_id`          INT NOT NULL,
  `key_id`           VARCHAR(64) NOT NULL,
  `secret_hash`      VARCHAR(128) NOT NULL,
  `secret_encrypted` VARCHAR(255) NULL,
  `secret_last4`     VARCHAR(8) NULL,
  `mode`         ENUM('test','live') NOT NULL DEFAULT 'test',
  `status`       ENUM('active','revoked') NOT NULL DEFAULT 'active',
  `last_used_at` DATETIME NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_api_keys_key_id_unique` (`key_id`),
  KEY `idx_merchant_api_keys_user_id` (`user_id`),
  CONSTRAINT `fk_merchant_api_keys_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
