import { SupplierHomeDashboard } from "../../components/supplier/SupplierHomeDashboard";
import { ffPage } from "../../lib/fixflowUi";

export default function SupplierDashboard() {
  return (
    <div className={`supplier-theme ${ffPage}`}>
      <SupplierHomeDashboard />
    </div>
  );
}
