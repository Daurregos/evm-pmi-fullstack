import { DashboardView } from "@/ui/dashboard-view";

/**
 * La lectura ocurre en el cliente porque `NEXT_PUBLIC_EVM_API_BASE_URL` admite
 * una ruta relativa, que solo el navegador puede resolver contra su origen.
 */
export default function HomePage() {
  return <DashboardView />;
}
