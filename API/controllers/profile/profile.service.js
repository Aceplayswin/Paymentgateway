const User = require('../../models/user.model');
const UserProfile = require('../../models/userProfile.model');
const MerchantKyc = require('../../models/merchantKyc.model');
const { serializeUser } = require('../shared/user.serializer');
const { serializeMerchantOnboarding } = require('../kyc/kyc.serializer');

const buildProfile = (user, profile, kyc) => {
  const isAdmin = user.role === 'admin';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  const legalName = kyc?.formData?.business?.legalName;

  return {
    fullName,
    username: user.username,
    email: user.email,
    phone: user.phoneNumber || '',
    jobTitle: profile?.jobTitle || (isAdmin ? 'Administrator' : 'Business Owner'),
    department: profile?.department || (isAdmin ? 'Management' : 'Operations'),
    bio:
      profile?.bio ||
      (isAdmin
        ? 'Platform administrator responsible for content, security, and merchant operations.'
        : legalName
          ? `Account owner for ${legalName}.`
          : 'Merchant account owner managing payments and business operations.'),
    location: profile?.location || (isAdmin ? 'Mumbai, India' : 'Bengaluru, India'),
    dateOfBirth:
      profile?.dateOfBirth ||
      kyc?.formData?.personal?.dateOfBirth ||
      (user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : null),
    joinDate: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : null,
    avatarUrl: profile?.avatarUrl || null,
    role: user.role,
    user: serializeUser(user)
  };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return { statusCode: 404, success: false, message: 'User not found' };
  }

  const [profile, kyc] = await Promise.all([
    UserProfile.findByUserId(userId),
    user.role === 'merchant' ? MerchantKyc.findByUserId(userId) : Promise.resolve(null)
  ]);

  return {
    statusCode: 200,
    success: true,
    data: buildProfile(user, profile, kyc)
  };
};

const updateProfile = async (userId, payload = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    return { statusCode: 404, success: false, message: 'User not found' };
  }

  const userUpdates = {};
  if (payload.fullName) {
    const parts = String(payload.fullName).trim().split(/\s+/);
    userUpdates.firstName = parts[0] || user.firstName;
    userUpdates.lastName = parts.slice(1).join(' ') || user.lastName;
  }
  if (payload.phone !== undefined) {
    userUpdates.phoneNumber = payload.phone;
  }

  let updatedUser = user;
  if (Object.keys(userUpdates).length > 0) {
    updatedUser = await User.update(userId, userUpdates);
  }

  const profilePatch = {};
  if (payload.jobTitle !== undefined) profilePatch.jobTitle = payload.jobTitle;
  if (payload.department !== undefined) profilePatch.department = payload.department;
  if (payload.bio !== undefined) profilePatch.bio = payload.bio;
  if (payload.location !== undefined) profilePatch.location = payload.location;
  if (payload.avatarUrl !== undefined) profilePatch.avatarUrl = payload.avatarUrl;
  if (payload.dateOfBirth !== undefined) profilePatch.dateOfBirth = payload.dateOfBirth;

  const profile =
    Object.keys(profilePatch).length > 0
      ? await UserProfile.upsert(userId, profilePatch)
      : await UserProfile.findByUserId(userId);

  const kyc =
    updatedUser.role === 'merchant' ? await MerchantKyc.findByUserId(userId) : null;

  return {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully',
    data: buildProfile(updatedUser, profile, kyc)
  };
};

const getMerchantOnboarding = async (userId) => {
  const merchant = await User.findMerchantById(userId);
  if (!merchant) {
    return { statusCode: 404, success: false, message: 'Merchant not found' };
  }

  const kyc = await MerchantKyc.findByUserId(userId);

  return {
    statusCode: 200,
    success: true,
    data: {
      onboarding: serializeMerchantOnboarding(merchant, kyc)
    }
  };
};

module.exports = { getProfile, updateProfile, getMerchantOnboarding, buildProfile };
