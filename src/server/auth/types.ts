export type FormState = { error?: string };

export type EnrollResult = { factorId: string; qr: string; secret: string } | { error: string };
