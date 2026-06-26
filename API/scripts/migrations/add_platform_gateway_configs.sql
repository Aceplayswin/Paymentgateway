-- =============================================================================
-- Migration: platform_gateway_configs
-- A single, platform-wide acquiring account (Razorpay) configured by Admin and
-- used for EVERY merchant's payments (white-label / aggregator model).
--
--   key_id                   : Razorpay public key id (rzp_test_… / rzp_live_…).
--   key_secret_encrypted     : AES-256-GCM ciphertext of the key secret, recovered
--                              at payment time to call the Razorpay API.
--   key_secret_last4         : last 4 chars of the secret, for display.
--   webhook_secret_encrypted : AES-256-GCM ciphertext of the webhook secret used
--                              to verify Razorpay -> us webhook signatures.
--   environment              : sandbox | production (derived from key_id prefix).
--   status                   : pending | active | inactive.
--   singleton                : constant ('singleton') so the unique key enforces
--                              exactly one row per provider.
--
-- Idempotent: safe to re-run.
-- =============================================================================

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
