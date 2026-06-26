const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();

  if (!raw) {
    return [];
  }

  return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
};

const getCorsOptions = () => {
  const allowedOrigins = parseAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
};

module.exports = {
  parseAllowedOrigins,
  getCorsOptions,
};
