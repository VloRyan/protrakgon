import { useLocation } from "wouter";

import { ItemPage } from "@vloryan/boot-api-ts/pages/";

import { apiPath } from "../../functions/url.ts";
import {
  useAlertSubmitResponseHandler,
  useDocumentForm,
  useResource,
} from "@vloryan/boot-api-ts/hooks/";
import { ActivityEditor } from "../../components/project/ActivityEditor.tsx";

export function ActivityPage() {
  const [location] = useLocation();
  const submitResponseHandler = useAlertSubmitResponseHandler();
  const { doc, isLoading, error, queryKey } = useResource(apiPath(location));
  const form = useDocumentForm({
    id: "activityForm",
    document: doc,
    queryKey: queryKey,
    submitResponseHandler: submitResponseHandler,
    apiUrl: apiPath(location.replace(/\/new/, "")),
  });
  return (
    <ItemPage error={error} isLoading={isLoading} formId={form.id}>
      <form {...form.setup()}>
        <ActivityEditor form={form} />
      </form>
    </ItemPage>
  );
}
