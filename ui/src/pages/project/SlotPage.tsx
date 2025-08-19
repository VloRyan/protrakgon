import { useLocation } from "wouter";

import { ItemPage } from "@vloryan/boot-api-ts/pages/";

import { apiPath } from "../../functions/url.ts";
import {
  useAlertSubmitResponseHandler,
  useResource,
  useResourceObjectForm,
} from "@vloryan/boot-api-ts/hooks/";
import { SlotEditor } from "../../components/project/SlotEditor.tsx";

export function SlotPage() {
  const [location] = useLocation();
  const submitResponseHandler = useAlertSubmitResponseHandler();
  const { doc, isLoading, error, queryKey } = useResource(apiPath(location));
  const form = useResourceObjectForm({
    id: "slotForm",
    document: doc,
    queryKey: queryKey,
    submitResponseHandler: submitResponseHandler,
    apiUrl: apiPath(location.replace(/\/new/, "")),
  });
  return (
    <ItemPage error={error} isLoading={isLoading} formId={form.id}>
      <form {...form.setup()}>
        <SlotEditor form={form} />
      </form>
    </ItemPage>
  );
}
