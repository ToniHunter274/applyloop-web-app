import formidable from 'formidable';

export const MAX_RESUME_SIZE = 10 * 1024 * 1024;

export const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function parseClientForm(req) {
  const form = formidable({
    allowEmptyFiles: false,
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: MAX_RESUME_SIZE,
    maxTotalFileSize: MAX_RESUME_SIZE,
    minFileSize: 1,
    filter: ({ name, mimetype }) => {
      return (
        name === 'resume' &&
        ALLOWED_RESUME_TYPES.has(mimetype)
      );
    },
  });

  return form.parse(req);
}

export function getField(fields, name) {
  const value = fields[name];

  if (Array.isArray(value)) {
    return value[0]?.trim() || '';
  }

  return typeof value === 'string' ? value.trim() : '';
}

export function getFile(files, name) {
  const value = files[name];

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}
