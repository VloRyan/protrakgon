import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const typeToIconMap = new Map<string, IconDefinition>();

export function initIcons(m: Map<string, IconDefinition>) {
  typeToIconMap.clear();
  m.forEach((value: IconDefinition, key: string) => {
    typeToIconMap.set(key, value);
  });
}

export function resolveIcon(type: string) {
  if (!type) {
    return undefined;
  }
  let icon = typeToIconMap.get(type);
  if (icon === undefined) {
    const parts = type.split(".");
    if (parts.length == 3) {
      const parentType = parts[0] + "." + parts[1];
      icon = typeToIconMap.get(parentType);
    }
    if (icon === undefined) {
      if (parts.length > 1) {
        const parentType = parts[0];
        icon = typeToIconMap.get(parentType);
      }
    }
  }
  return icon;
}
