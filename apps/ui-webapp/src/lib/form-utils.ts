/**
 * Determines whether a registration field should be rendered as a file upload field.
 * This checks the explicit field type as well as the field label for common upload keywords.
 *
 * @param type The type of the field
 * @param label The label of the field
 * @returns boolean True if the field is for file uploads
 */
export function isUploadField(type: string, label: string): boolean {
  if (type === "ATTACHMENTS") {
    return true;
  }

  if (!label) {
    return false;
  }

  const lowerLabel = label.toLowerCase();
  return (
    lowerLabel.includes("upload") ||
    lowerLabel.includes("doc") ||
    lowerLabel.includes("proof") ||
    lowerLabel.includes("attachment") ||
    lowerLabel.includes("resume") ||
    lowerLabel.includes("cv")
  );
}
