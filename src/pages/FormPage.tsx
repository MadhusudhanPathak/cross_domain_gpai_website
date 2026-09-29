import { FormRenderer } from "../components/form/FormRenderer";
import { getForm } from "../forms";
import { NotFound } from "./NotFound";

export function FormPage({ formId }: { formId: string }) {
  const form = getForm(formId);
  if (!form) return <NotFound />;
  return <FormRenderer key={form.id} form={form} />;
}
