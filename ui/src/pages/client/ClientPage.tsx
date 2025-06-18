import { useLocation } from "wouter";
import { ItemPage } from "../../components/ItemPage.tsx";

import { SERVER_API_PATH } from "../../Config.ts";
import { joinPath } from "../../functions/url.ts";
import { useAlertSubmitResponseHandler } from "../../hooks/UseAlert.ts";
import { ClientEditor } from "../../components/client/ClientEditor.tsx";
import { useResource } from "../../hooks/UseResource.ts";
import { useResourceObjectForm } from "../../hooks/UseResourceObjectForm.ts";

export function ClientPage() {
  const [location] = useLocation();
  const submitResponseHandler = useAlertSubmitResponseHandler();
  const { doc, isLoading, error, queryKey } = useResource(
    joinPath(SERVER_API_PATH, "/v1/", location),
  );
  const form = useResourceObjectForm({
    id: "clientForm",
    object: doc && doc.data ? doc.data : null,
    queryKey: queryKey,
    submitUrlPrefix: SERVER_API_PATH,
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
