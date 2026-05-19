'use client';
import { PortalLogin } from '@/components/portal/PortalShell';
export default function StudentLoginPage() {
  return <PortalLogin role="student" successHref="/student" />;
}
