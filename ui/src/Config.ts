// @ts-expect-error will be added by server
export const CONTEXT_ROOT = window.SERVER_DATA.contextRoot;

export const SERVER_API_PATH = import.meta.env.PROD
  ? // @ts-expect-error will be added by server
    window.SERVER_DATA.apiUrl
  : `/api`;
export const APP_NAME = "ProTrakGon";
