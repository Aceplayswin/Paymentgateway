-- Add Razorpay as a supported gateway provider (run once on existing databases).
ALTER TABLE `merchant_gateway_configs`
  MODIFY COLUMN `gateway_provider`
    ENUM('phonepe','paytm','googlepay','bharatpe','razorpay') NOT NULL DEFAULT 'phonepe';

ALTER TABLE `payin_transactions`
  MODIFY COLUMN `gateway_provider`
    ENUM('phonepe','paytm','googlepay','bharatpe','razorpay') NULL;
