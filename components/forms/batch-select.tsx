import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function BatchSelect({ batches, defaultValue, name = "batch_id" }: {
  batches: { id: string; name: string }[];
  defaultValue?: string | null;
  name?: string;
}) {
  return (
    <NativeSelect id={name} name={name} defaultValue={defaultValue ?? ""} className="w-full">
      <NativeSelectOption value="" disabled>
        --
      </NativeSelectOption>
      {batches.map((b) => (
        <NativeSelectOption key={b.id} value={b.id}>
          {b.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
