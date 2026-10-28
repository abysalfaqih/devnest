export type SaveAppState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  savedAt?: number;
};

export type ActionResult = { error?: string };
