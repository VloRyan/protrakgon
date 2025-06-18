export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function trimSuffix(text: string, suffix: string): string {
  if (!text || !suffix) {
    return text;
  }
  const index = text.lastIndexOf(suffix);
  if (index === -1 || index + suffix.length !== text.length) {
    return text;
  }
  return text.substring(0, index);
}

export function trimPrefix(text: string, prefix: string): string {
  if (!text || !prefix) {
    return text;
  }
  const index = text.indexOf(prefix);
  if (index !== 0) {
    return text;
  }
  return text.substring(prefix.length);
}

export function padLeft(
  num: number,
  size: number,
  insert: string = " ",
): string {
  let s = num + "";
  while (s.length < size) {
    s = insert + s;
  }
  return s;
}
