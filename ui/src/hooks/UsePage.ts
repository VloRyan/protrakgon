import { Page } from "ts-jsonapi-form/jsonapi/JsonApi";
import { extractPage } from "ts-jsonapi-form/jsonapi/Request";
import { useSearch } from "wouter";

export const usePage = () => {
  return extractPage(useSearch()) || ({ limit: 25, offset: 0 } satisfies Page);
};
