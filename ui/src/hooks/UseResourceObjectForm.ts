import { ResourceObjectForm } from "ts-jsonapi-form/form/ResourceObjectForm.ts";
import { ResourceObject } from "ts-jsonapi-form/jsonapi/model/Objects.ts";
import type { QueryKey } from "@tanstack/query-core";
import { useQueryClient } from "@tanstack/react-query";

export interface SubmitResponseHandler {
  onSubmitSuccess: (object: ResourceObject) => void;
  onSubmitError: (error: Error) => void;
}
export interface useResourceObjectFormProps {
  object: ResourceObject | null;
  id?: string;
  onSubmit?: (object: ResourceObject) => void;
  queryKey?: QueryKey;
  submitResponseHandler?: SubmitResponseHandler;
  submitUrlPrefix?: string;
}

export const useResourceObjectForm = (props: useResourceObjectFormProps) => {
  const queryClient = useQueryClient();

  return new ResourceObjectForm({
    ...props,
    onSubmitSuccess: (obj: ResourceObject) => {
      if (props.queryKey) {
        queryClient!
          .invalidateQueries({
            queryKey: props.queryKey,
          })
          .then();
      }
      if (props.submitResponseHandler) {
        props.submitResponseHandler.onSubmitSuccess(obj);
      }
    },
    onSubmitError: (err: Error) => {
      if (props.submitResponseHandler) {
        props.submitResponseHandler.onSubmitError(err);
      }
    },
  });
};
