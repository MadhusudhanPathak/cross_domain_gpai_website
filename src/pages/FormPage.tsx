import { getForm } from "../forms";
import { FormRenderer } from "../components/FormRenderer";
import { NotFound } from "./NotFound";

export function FormPage({ formId }: { formId: string }) {
  const form = getForm(formId);
  if (!form) return <NotFound />;
  return <FormRenderer form={form} />;
}
