import DOMPurify from 'dompurify';

/**
 * HTML 문자열에서 악성 스크립트를 제거합니다.
 * 정상적인 텍스트 서식(굵기, 색상, 이미지 등)은 유지합니다.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'a', 'img', 'video', 'source',
      'div', 'span', 'font', 'sub', 'sup', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
      'style', 'class', 'color', 'face', 'size',
      'controls', 'autoplay', 'muted', 'loop', 'type',
      'colspan', 'rowspan', 'align', 'valign',
    ],
    ALLOW_DATA_ATTR: false,
  });
}
