export const config = {
  thresholds: {
    QUIZ_PASS_SCORE: parseInt(process.env.QUIZ_PASS_SCORE || '7'),
    FOCUS_MIN_MINUTES: parseInt(process.env.FOCUS_MIN_MINUTES || '60'),
  },
  failSafe: {
    MENTOR_RESPONSE_DEADLINE_HOURS: parseInt(process.env.MENTOR_RESPONSE_DEADLINE_HOURS || '12'),
    AUTO_UNLOCK_HOURS: parseInt(process.env.AUTO_UNLOCK_HOURS || '24'),
  },
  n8n: {
    WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || '',
  },
  jwt: {
    SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    TOKEN_TTL: '1h', // 1 hour TTL for mentor action tokens
  },
};

