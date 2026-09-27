import pdfParse from 'pdf-parse';
import WordExtractor from 'word-extractor';

const MAX_RESUME_BYTES =
  10 * 1024 * 1024;

const MAX_RESUME_TEXT_LENGTH =
  60000;

function normalizeResumeText(value) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(
      0,
      MAX_RESUME_TEXT_LENGTH
    );
}

function getResumeType({
  path,
  contentType,
}) {
  const normalizedPath =
    String(path || '')
      .toLowerCase()
      .split('?')[0];

  const normalizedType =
    String(contentType || '')
      .toLowerCase();

  if (
    normalizedPath.endsWith(
      '.pdf'
    ) ||
    normalizedType.includes(
      'application/pdf'
    )
  ) {
    return 'pdf';
  }

  if (
    normalizedPath.endsWith(
      '.docx'
    ) ||
    normalizedType.includes(
      'officedocument.wordprocessingml.document'
    )
  ) {
    return 'word';
  }

  if (
    normalizedPath.endsWith(
      '.doc'
    ) ||
    normalizedType.includes(
      'application/msword'
    )
  ) {
    return 'word';
  }

  return '';
}

async function downloadResume(
  url
) {
  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      'The Client resume could not be downloaded for tailoring.'
    );
  }

  const contentLength =
    Number(
      response.headers.get(
        'content-length'
      ) || 0
    );

  if (
    contentLength >
    MAX_RESUME_BYTES
  ) {
    throw new Error(
      'The Client resume is too large to process.'
    );
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    );

  if (
    !buffer.length ||
    buffer.length >
      MAX_RESUME_BYTES
  ) {
    throw new Error(
      'The Client resume could not be processed.'
    );
  }

  return {
    buffer,
    contentType:
      response.headers.get(
        'content-type'
      ) || '',
  };
}

async function extractPdfText(
  buffer
) {
  const result =
    await pdfParse(buffer);

  return result?.text || '';
}

async function extractWordText(
  buffer
) {
  const extractor =
    new WordExtractor();

  const document =
    await extractor.extract(
      buffer
    );

  return document?.getBody?.() || '';
}

export async function extractResumeTextFromUrl({
  url,
  path,
}) {
  const {
    buffer,
    contentType,
  } =
    await downloadResume(url);

  const resumeType =
    getResumeType({
      path,
      contentType,
    });

  let extractedText = '';

  if (
    resumeType === 'pdf'
  ) {
    extractedText =
      await extractPdfText(
        buffer
      );
  } else if (
    resumeType === 'word'
  ) {
    extractedText =
      await extractWordText(
        buffer
      );
  } else {
    throw new Error(
      'This resume file type cannot be used for AI tailoring.'
    );
  }

  const normalizedText =
    normalizeResumeText(
      extractedText
    );

  if (
    normalizedText.length < 40
  ) {
    throw new Error(
      'ApplyLoop could not read enough text from this resume. Please use a text-based PDF, DOC or DOCX resume.'
    );
  }

  return normalizedText;
}
