import { UploadWizard } from "@/components/UploadWizard";
import { getCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic"; // needs current dataset presence for the replace warning

export default async function UploadPage() {
  const catalog = await getCatalog();
  return <UploadWizard catalog={catalog} />;
}
