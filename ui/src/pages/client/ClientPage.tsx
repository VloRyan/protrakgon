import { useLocation } from "wouter";
import { ItemPage } from "@vloryan/boot-api-ts/pages/";
import { apiPath } from "../../functions/url.ts";
import {
  useAlertSubmitResponseHandler,
  useResource,
  useResourceObjectForm,
} from "@vloryan/boot-api-ts/hooks";
import { ClientEditor } from "../../components/client/ClientEditor.tsx";

export function ClientPage() {
  const [location] = useLocation();
  const submitResponseHandler = useAlertSubmitResponseHandler();
  const { doc, isLoading, error, queryKey } = useResource(apiPath(location));
  const form = useResourceObjectForm({
    id: "clientForm",
    document: doc,
    queryKey: queryKey,
    apiUrl: apiPath(location.replace(/\/new/, "")),
    submitResponseHandler: submitResponseHandler,
  });
  return (
    <ItemPage error={error} isLoading={isLoading} formId={form.id}>
      <form {...form.setup()}>
        <ClientEditor form={form} />
      </form>
    </ItemPage>
  );
}
