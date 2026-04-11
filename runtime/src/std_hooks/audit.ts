export interface AuditRecord {
  category: string;
  action: string;
  at: string;
  details?: Record<string, unknown>;
}

const records: AuditRecord[] = [];

export function audit(category: string, action: string, details?: Record<string, unknown>): AuditRecord {
  const record: AuditRecord = {
    category,
    action,
    at: new Date().toISOString(),
    details
  };
  records.push(record);
  return record;
}

export function getAuditTrail(): AuditRecord[] {
  return [...records];
}
