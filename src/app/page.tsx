import CertificationSearch from "@/components/certification-search";
import { getClientData } from "@/lib/data";

export default function Home() {
  const data = getClientData();
  return <CertificationSearch data={data} />;
}
