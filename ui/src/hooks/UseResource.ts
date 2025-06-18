import { FetchOpts, fetchResource } from "ts-jsonapi-form/jsonapi/JsonApi.ts";
import {
  CollectionResourceDoc,
  SingleResourceDoc,
} from "ts-jsonapi-form/jsonapi/model/Document.ts";
import { useQuery } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/query-core";

export interface QueryOpts {
  staleTime?: number;
  retry?: boolean | number;
}

export const useResource = (
  url: string,
  fetchOpts?: FetchOpts,
  queryOpts?: QueryOpts,
) => {
  const queryKey: QueryKey = [url, fetchOpts];

  const { data, isLoading, error } = useQuery({
    ...queryOpts,
    queryKey: queryKey,
    queryFn: async () => fetchResource(url, fetchOpts),
  });
  if (!data) {
    return { doc: null, isLoading, error, queryKey };
  }
  const doc = data as SingleResourceDoc;
  return { doc, isLoading, error, queryKey };
};

export function useResources(
  url: string,
  fetchOpts?: FetchOpts,
  queryOpts?: QueryOpts,
) {
  const queryKey = [url, fetchOpts];

  const { data, isLoading, error } = useQuery({
    ...queryOpts,
    queryKey: queryKey,
    queryFn: async () => fetchResource(url, fetchOpts),
  });
  if (!data) {
    return { doc: null, isLoading, error, queryKey };
  }
  const doc = data as CollectionResourceDoc;
  return { doc, isLoading, error, queryKey };
}
