export const ROLES = ['ADMIN', 'MANAGER', 'USER'] as const;

export type Role = typeof ROLES[number];
