const User = require('../models/user.model');

exports.requireMerchant = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'merchant') {
    return res.status(403).json({
      success: false,
      message: 'Merchant access required'
    });
  }

  const merchant = await User.findMerchantById(req.user.id);

  if (!merchant) {
    return res.status(404).json({
      success: false,
      message: 'Merchant not found'
    });
  }

  req.merchant = merchant;
  return next();
};
