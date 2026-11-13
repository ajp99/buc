import { MaterialsManager } from "@/components/materials-manager";

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string; batch?: string }> }) {
  const { edit, batch } = await searchParams;
  return <MaterialsManager basePath="/staff/materials" edit={edit} batch={batch} />;
}
