import sanitizeHtml from "sanitize-html";

/**
 * Escapes characters with special meaning in Regular Expressions
 * Prevents ReDoS (Regular Expression Denial of Service) and Mongo regex injection attacks.
 */
export function escapeRegex(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips dangerous tags, JavaScript execution vectors, event handlers (onload, onerror),
 * and unauthorized external hrefs from SVG strings to prevent Stored XSS.
 */
export function sanitizeSvg(svgContent: string): string {
  if (!svgContent || typeof svgContent !== "string") return "";

  return sanitizeHtml(svgContent, {
    allowedTags: [
      "svg",
      "g",
      "path",
      "line",
      "rect",
      "circle",
      "ellipse",
      "polygon",
      "polyline",
      "text",
      "tspan",
      "defs",
      "use",
      "linearGradient",
      "radialGradient",
      "stop",
      "pattern",
      "mask",
      "clipPath",
      "filter",
      "feDropShadow",
      "feGaussianBlur",
      "feOffset",
      "feBlend",
      "feColorMatrix",
      "feMerge",
      "feMergeNode"
    ],
    allowedAttributes: {
      "*": [
        "id",
        "class",
        "style",
        "fill",
        "stroke",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
        "stroke-dasharray",
        "stroke-dashoffset",
        "opacity",
        "fill-opacity",
        "stroke-opacity",
        "transform",
        "d",
        "x",
        "y",
        "x1",
        "y1",
        "x2",
        "y2",
        "cx",
        "cy",
        "r",
        "rx",
        "ry",
        "width",
        "height",
        "viewBox",
        "xmlns",
        "xmlns:xlink",
        "version",
        "font-family",
        "font-size",
        "font-weight",
        "text-anchor",
        "dominant-baseline",
        "gradientUnits",
        "offset",
        "stop-color",
        "stop-opacity"
      ]
    },
    disallowedTagsMode: "discard",
    transformTags: {
      svg: (tagName: string, attribs: Record<string, string>) => {
        // Strip out any event handler or javascript URI
        const cleanAttribs: Record<string, string> = {};
        for (const [key, val] of Object.entries(attribs)) {
          const stringVal = String(val ?? "");
          if (!key.toLowerCase().startsWith("on") && !stringVal.toLowerCase().startsWith("javascript:")) {
            cleanAttribs[key] = stringVal;
          }
        }
        return { tagName, attribs: cleanAttribs };
      }
    }
  });
}

/**
 * Verifies that a JWT secret is sufficiently strong and not a known placeholder.
 */
export function isPlaceholderSecret(secret: string): boolean {
  if (!secret) return true;
  const s = secret.toLowerCase().trim();
  const placeholders = [
    "replace-with-a-long-random-secret",
    "replace-with-a-different-long-random-secret",
    "dev-access-secret-change-me",
    "dev-refresh-secret-change-me",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    "secret",
    "jwtsecret",
    "supersecret"
  ];
  const isSequentialHex = /^(0123456789abcdef)+$/i.test(s) || /^(fedcba9876543210)+$/i.test(s);
  return placeholders.includes(s) || isSequentialHex || s.length < 16;
}

/**
 * Strips HTML tags and script elements from normal text fields.
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

/**
 * Recursively sanitizes user input objects to prevent XSS across all fields
 * while preserving valid SVG diagrams and KaTeX mathematics formatting.
 */
export function deepSanitize<T>(input: T): T {
  if (!input || typeof input !== "object") {
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (trimmed.startsWith("<svg") || trimmed.startsWith("<?xml")) {
        return sanitizeSvg(trimmed) as unknown as T;
      }
      // If it contains potential HTML/script tags, sanitize it
      if (/<[a-z][\s\S]*>/i.test(input)) {
        return sanitizePlainText(input) as unknown as T;
      }
      return input;
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => deepSanitize(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(input)) {
    result[key] = deepSanitize(val);
  }
  return result as T;
}
