import crypto from 'crypto';

const CLIENT_TOKEN_SECRET = process.env.CLIENT_TOKEN_SECRET || 'quiroagenda_client_portal_secure_token_secret_cordoba_2026';

export function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return digits;
}

export function hashPin(pin: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(pin.trim()).digest('hex');
}

/**
 * Genera un token criptográfico HMAC seguro con validez de 30 días.
 */
export function createClientSessionToken(clientId: string, phone: string): string {
  const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días
  const payload = `${clientId}:${normalizePhone(phone)}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', CLIENT_TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

/**
 * Valida la firma HMAC, fecha de caducidad y correspondencia con el cliente y teléfono.
 */
export function verifyClientSessionToken(token: string | undefined | null, expectedClientId?: string, expectedPhone?: string): { valid: boolean; clientId?: string; phone?: string } {
  if (!token) return { valid: false };
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return { valid: false };
    
    const [tClientId, tPhone, tExpiresAt, tHmac] = parts;
    if (!tClientId || !tPhone || !tExpiresAt || !tHmac) return { valid: false };

    // Comprobar expiración
    if (Date.now() > Number(tExpiresAt)) return { valid: false };

    // Si se especifica cliente o teléfono esperado, contrastar
    if (expectedClientId && tClientId !== expectedClientId) return { valid: false };
    if (expectedPhone && tPhone !== normalizePhone(expectedPhone)) return { valid: false };

    // Verificar firma criptográfica
    const expectedPayload = `${tClientId}:${tPhone}:${tExpiresAt}`;
    const expectedHmac = crypto.createHmac('sha256', CLIENT_TOKEN_SECRET).update(expectedPayload).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(tHmac), Buffer.from(expectedHmac))) {
      return { valid: true, clientId: tClientId, phone: tPhone };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}
