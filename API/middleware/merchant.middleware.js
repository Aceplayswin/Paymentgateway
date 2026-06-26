const User = require('../models/user.model');

exports.requireApprovedMerchant = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role !== 'merchant') {
    return res.status(403).json({
      success: false,
      message: 'Merchant access required'
    });
  }

  const merchant = await User.findMerchantById(req.user.id);

  if (!merchant) {
    return res.status(404).json({ success: false, message: 'Merchant not found' });
  }

  if (!merchant.otpVerifiedAt) {
    return res.status(403).json({
      success: false,
      message: 'Verify your email OTP before using payment gateway'
    });
  }

  if (merchant.approvalStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Merchant account must be approved by admin before using payment gateway'
    });
  }

  req.merchant = merchant;
  return next();
};
