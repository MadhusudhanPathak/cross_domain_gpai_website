import type { ComponentType } from "react";
import type { Field, FormData } from "../../formEngine/types";
import { isRecord } from "../../utils/guards";
import { MarkdownLite } from "../MarkdownLite";
import { ProcessOverview } from "../ProcessOverview";
import { AvailabilityField } from "./AvailabilityField";
import { CheckboxField } from "./CheckboxField";
import { CheckboxesField } from "./CheckboxesField";
import { ConsentsField } from "./ConsentsField";
import { MatrixField } from "./MatrixField";
import { RadioField } from "./RadioField";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";
import { TextareaField } from "./TextareaField";

type Props = {
  field: Field;
  data: FormData;
  setField: (id: string, value: unknown) => void;
  error?: string;
};

/** Components that an `info` field may embed via its `component` property. */
const INFO_COMPONENTS: Record<string, ComponentType> = {
  ProcessOverview,
};

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const asRecord = <T,>(v: unknown): Record<string, T> => (isRecord(v) ? (v as Record<string, T>) : {});

function asSlotMap(v: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [date, slots] of Object.entries(asRecord<unknown>(v))) out[date] = asStringArray(slots);
  return out;
}

/** Maps a field definition to its input component, coercing stored values to the shape each component expects. */
export function FieldRenderer({ field, data, setField, error }: Props) {
  const value = data[field.id];
  const onChange = (v: unknown) => setField(field.id, v);

  switch (field.type) {
    case "info": {
      const Embedded = field.component ? INFO_COMPONENTS[field.component] : undefined;
      return (
        <div className="field" id={field.id}>
          {Embedded ? <Embedded /> : field.text ? <MarkdownLite text={field.text} /> : null}
        </div>
      );
    }
    case "text":
    case "email":
    case "url":
      return <TextField field={field} value={asString(value)} onChange={onChange} error={error} />;
    case "textarea":
      return <TextareaField field={field} value={asString(value)} onChange={onChange} error={error} />;
    case "select":
      return <SelectField field={field} value={asString(value)} onChange={onChange} error={error} />;
    case "radio":
      return <RadioField field={field} value={asString(value)} onChange={onChange} error={error} />;
    case "checkboxes":
      return <CheckboxesField field={field} value={asStringArray(value)} onChange={onChange} error={error} />;
    case "checkbox":
      return <CheckboxField field={field} value={value === true} onChange={onChange} error={error} />;
    case "matrix":
      return <MatrixField field={field} value={asRecord<string>(value)} onChange={onChange} error={error} />;
    case "availability":
      return (
        <AvailabilityField
          field={field}
          value={asSlotMap(value)}
          onChange={onChange}
          error={error}
          city={asString(data.city) || undefined}
        />
      );
    case "consents":
      return <ConsentsField field={field} value={asRecord<boolean>(value)} onChange={onChange} error={error} />;
  }
}
