import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function SubjectSelect({ options, defaultValue }: {
  options: { id: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <NativeSelect id="subject_id" name="subject_id" defaultValue={defaultValue ?? ""} className="w-full">
      <NativeSelectOption value="" disabled>
        --
      </NativeSelectOption>
      {options.map((o) => (
        <NativeSelectOption key={o.id} value={o.id}>
          {o.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
