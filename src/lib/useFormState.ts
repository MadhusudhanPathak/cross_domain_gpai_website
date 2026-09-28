import { useCallback, useState } from "react";
import type { FormData } from "./formTypes";

export function useFormState(initial: FormData | (() => FormData) = {}) {
  const [data, setData] = useState<FormData>(initial);

  const setField = useCallback((id: string, value: unknown) => {
    setData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const replaceAll = useCallback((next: FormData) => {
    setData(next);
  }, []);

  return { data, setField, replaceAll };
}
