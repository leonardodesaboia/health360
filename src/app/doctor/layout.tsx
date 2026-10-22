import { DoctorShell } from "@/components/layout/shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DoctorShell>{children}</DoctorShell>;
}
