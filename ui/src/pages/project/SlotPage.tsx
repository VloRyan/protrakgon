import { useLocation } from "wouter";
import { ItemPage } from "../../components/ItemPage.tsx";

import { SlotEditor } from "../../components/project/SlotEditor.tsx";
import { SERVER_API_PATH } from "../../Config.ts";
import { useAlertSubmitResponseHandler } from "../../hooks/UseAlert.ts";
import { joinPath } from "../../functions/url.ts";
import { useResource } from "../../hooks/UseResource.ts";
import { useResourceObjectForm } from "../../hooks/UseResourceObjectForm.ts";

export function SlotPage() {
  const [location] = useLocation();
  const submitResponseHandler = useAlertSubmitResponseHandler();
  const { doc, isLoading, error, queryKey } = useResource(
    joinPath(SERVER_API_PATH, "v1/", location),
  );
  const form = useResourceObjectForm({
    id: "slotForm",
    object: doc && doc.data ? doc.data : null,
    queryKey: queryKey,
    submitResponseHandler: submitResponseHandler,
    submitUrlPrefix: SERVER_API_PATH,
  });
  return (
    <ItemPage error={error} isLoading={isLoading} formId={form.id}>
      <form {...form.setup()}>
        <SlotEditor form={form} />
      </form>
    </ItemPage>
  );
}
