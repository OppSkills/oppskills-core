/**
 * Best-effort mobile from registration answers: PHONE_NO field type first, then label heuristic.
 */
export function extractMobileFromRegistrationFieldAnswers(
  answers: Array<{ fieldId: string; value: unknown }>,
  fields: Array<{ id: string; label: string; type: string }>,
): string {
  const fieldById = new Map(fields.map((f) => [f.id, f]));

  const stringifyValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map(String).join(',').trim();
    }
    return '';
  };

  for (const a of answers) {
    const field = fieldById.get(a.fieldId);
    if (field?.type === 'PHONE_NO') {
      const s = stringifyValue(a.value);
      if (s) return s;
    }
  }
  for (const a of answers) {
    const field = fieldById.get(a.fieldId);
    if (field && /phone|mobile|whatsapp/i.test(field.label)) {
      const s = stringifyValue(a.value);
      if (s) return s;
    }
  }
  return '';
}
