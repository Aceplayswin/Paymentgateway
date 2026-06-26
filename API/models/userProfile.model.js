const pool = require('../config/db');

const mapRow = (row) => {
  if (!row) return null;
  return {
    userId: row.user_id,
    jobTitle: row.job_title,
    department: row.department,
    bio: row.bio,
    location: row.location,
    avatarUrl: row.avatar_url,
    dateOfBirth: row.date_of_birth,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const findByUserId = async (userId) => {
  const [rows] = await pool.execute('SELECT * FROM user_profiles WHERE user_id = ? LIMIT 1', [
    userId
  ]);
  return mapRow(rows[0]);
};

const upsert = async (userId, data) => {
  const existing = await findByUserId(userId);
  const now = new Date();

  if (!existing) {
    await pool.execute(
      `INSERT INTO user_profiles
         (user_id, job_title, department, bio, location, avatar_url, date_of_birth, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.jobTitle || null,
        data.department || null,
        data.bio || null,
        data.location || null,
        data.avatarUrl || null,
        data.dateOfBirth || null,
        now,
        now
      ]
    );
    return findByUserId(userId);
  }

  const fieldMap = {
    jobTitle: 'job_title',
    department: 'department',
    bio: 'bio',
    location: 'location',
    avatarUrl: 'avatar_url',
    dateOfBirth: 'date_of_birth'
  };

  const sets = [];
  const values = [];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      sets.push(`\`${col}\` = ?`);
      values.push(data[key]);
    }
  }

  if (sets.length === 0) return existing;

  sets.push('`updated_at` = ?');
  values.push(now, userId);

  await pool.query(`UPDATE user_profiles SET ${sets.join(', ')} WHERE user_id = ?`, values);
  return findByUserId(userId);
};

module.exports = { findByUserId, upsert };
