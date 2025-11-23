import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface MentorActionTokenPayload {
  student_id: string;
  intervention_id?: string;
  task?: string;
  mentor?: string;
}

/**
 * Generate a signed token for mentor action links (approve/reject)
 */
export function generateMentorActionToken(payload: MentorActionTokenPayload): string {
  // Make sure TypeScript sees this as a valid JWT secret
  const secret: Secret = config.jwt.SECRET as unknown as Secret;

  const options: SignOptions = {
    // TOKEN_TTL should be something like "1h", "7d" or a number (seconds)
    expiresIn: config.jwt.TOKEN_TTL as any,
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verify and decode mentor action token
 */
export function verifyMentorActionToken(token: string): MentorActionTokenPayload {
  const secret: Secret = config.jwt.SECRET as unknown as Secret;

  try {
    const decoded = jwt.verify(token, secret) as MentorActionTokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
