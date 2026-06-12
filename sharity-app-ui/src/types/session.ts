export type SessionCheckResult = {
  status: 'authenticated' | 'anonymous';
};

export type BrowserSessionSummary = {
  applications?: string[];
  authenticated?: boolean;
  csrfToken?: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  publicId?: string | null;
  roles?: string[];
};
