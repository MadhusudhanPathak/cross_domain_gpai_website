import type { Field, FormData } from "../../lib/formTypes";
import { TextField } from "./TextField";
import { TextareaField } from "./TextareaField";
import { SelectField } from "./SelectField";
import { RadioField } from "./RadioField";
import { CheckboxesField } from "./CheckboxesField";
import { CheckboxField } from "./CheckboxField";
import { MatrixField } from "./MatrixField";
import { AvailabilityField } from "./AvailabilityField";
import { ConsentsField } from "./ConsentsField";
import { MarkdownLite } from "../../lib/markdownLite";
import { ProcessOverview } from "../ProcessOverview";

export function FieldRenderer({
  field,
  data,
  setField,
  error,
}: {
  field: Field;
  data: FormData;
  setField: (id: string, v: unknown) => void;
  error?: string;
}) {
  switch (field.type) {
    case "info":
      return (
        <div className="field" id={field.id}>
          {field.component === "ProcessOverview" ? <ProcessOverview /> : field.text ? <MarkdownLite text={field.text} /> : null}
        </div>
      );
    case "text":
    case "email":
    case "url":
      return <TextField field={field} value={(data[field.id] as string) ?? ""} onChange={(v) => setField(field.id, v)} error={error} />;
    case "textarea":
      return <TextareaField field={field} value={(data[field.id] as string) ?? ""} onChange={(v) => setField(field.id, v)} error={error} />;
    case "select":
      return <SelectField field={field} value={(data[field.id] as string) ?? ""} onChange={(v) => setField(field.id, v)} error={error} />;
    case "radio":
      return <RadioField field={field} value={(data[field.id] as string) ?? ""} onChange={(v) => setField(field.id, v)} error={error} />;
    case "checkboxes":
      return (
        <CheckboxesField field={field} value={(data[field.id] as string[]) ?? []} onChange={(v) => setField(field.id, v)} error={error} />
      );
    case "checkbox":
      return <CheckboxField field={field} value={(data[field.id] as boolean) ?? false} onChange={(v) => setField(field.id, v)} error={error} />;
    case "matrix":
      return (
        <MatrixField field={field} value={(data[field.id] as Record<string, string>) ?? {}} onChange={(v) => setField(field.id, v)} error={error} />
      );
    case "availability":
      return (
        <AvailabilityField
          field={field}
          value={(data[field.id] as Record<string, string[]>) ?? {}}
          onChange={(v) => setField(field.id, v)}
          error={error}
          timezone={data.timezone as string | undefined}
        />
      );
    case "consents":
      return (
        <ConsentsField
          field={field}
          value={(data[field.id] as Record<string, boolean>) ?? {}}
          onChange={(v) => setField(field.id, v)}
          error={error}
        />
      );
    default:
      return null;
  }
}
