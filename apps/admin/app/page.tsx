import { AuthGate } from "../components/auth-gate";
import { CrmWorkspace } from "../components/crm-workspace";

export default function AdminHome() {
  return (
    <AuthGate>
      <CrmWorkspace />
    </AuthGate>
  );
}
