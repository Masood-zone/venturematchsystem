import { Suspense } from "react";
import DashboardLoading from "@/components/ventures/dashboard-loading";
import { EditorPage } from "../../editor-page";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  return <EditorPage id={(await params).id} />;
}

export default function EditVenture({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<DashboardLoading />}><Edit params={params} /></Suspense>;
}
