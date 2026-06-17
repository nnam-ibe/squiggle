import { HomeScreen } from "@/components/HomeScreen";
import { getCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic"; // reflects dataset presence at request time

export default async function Home() {
  const catalog = await getCatalog();
  return <HomeScreen catalog={catalog} />;
}
