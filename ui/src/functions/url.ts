import { SERVER_API_PATH } from "../Config.ts";
import { joinPath } from "@vloryan/boot-api-ts/functions";

export function apiPath(...elements: string[]) {
  return joinPath(SERVER_API_PATH, ...elements);
}
