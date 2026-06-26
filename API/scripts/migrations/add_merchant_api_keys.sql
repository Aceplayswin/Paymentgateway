-- =============================================================================
-- Migration: merchant_api_keys
-- Adds public/secret API key pairs that merchants use to authenticate calls to
-- the public payment API (/api/v1/*) with HMAC request signing.
--
--   key_id          : public identifier, safe to expose (pk_test_… / pk_live_…)
--   secret_hash     : SHA-256 hash of the secret (fast lookup / integrity check).
--   secret_encrypted: AES-256-GCM ciphertext of the secret, recoverable to verify
--                     merchant HMAC request signatures. Plaintext is shown to the
--                     merchant only once at creation.
--   secret_last4    : last 4 chars of the secret, for display ("sk_test_…a1b2").
--   mode        : test | live
--   status      : active | revoked
--
-- Idempotent: safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `merchant_api_keys` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `user_id`      INT NOT NULL,
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
