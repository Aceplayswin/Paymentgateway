const User = require('../../models/user.model');

const buildUsernameBase = (firstName, lastName) => {
  const firstPart = (firstName || '').trim().slice(0, 2).toLowerCase();
  const lastPart = (lastName || '').trim().slice(0, 2).toLowerCase();
  const fallbackFirst = firstPart.padEnd(2, 'x');
  const fallbackLast = lastPart.padEnd(2, 'x');
  return fallbackFirst.concat(fallbackLast);
};

const generateUniqueUsername = async (firstName, lastName) => {
  const base = buildUsernameBase(firstName, lastName);

  for (let attempt = 0; attempt < 10; attempt++) {
    const randomValue = Math.floor(1000 + Math.random() * 9000);
    const candidate = base.concat(String(randomValue));
    const existing = await User.findByUsername(candidate);

    if (!existing) {
      return candidate;
    }
  }

  return base.concat(String(Date.now()));
};

module.exports = { buildUsernameBase, generateUniqueUsername };
