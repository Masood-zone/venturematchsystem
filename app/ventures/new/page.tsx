import { Suspense } from "react";
import DashboardLoading from "@/components/ventures/dashboard-loading";
import { EditorPage } from "../editor-page";

export default function NewVenture() {
  return <Suspense fallback={<DashboardLoading />}><EditorPage /></Suspense>;
}
