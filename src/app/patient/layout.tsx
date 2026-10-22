import { PatientShell } from "@/components/layout/shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
