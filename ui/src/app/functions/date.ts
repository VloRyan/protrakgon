export abstract class DateUtils {
  public static asIsoDataString(d: Date) {
    return d.toISOString().substring(0, 10);
  }

  public static asIsoTimeString(d: Date) {
    return d.toISOString().substring(11, 16);
  }
}
export function asIsoDateString(d: Date) {
  return d.toISOString().substring(0, 10);
}
export function asIsoTimeString(d: Date) {
  return d.toISOString().substring(11, 16);
}
