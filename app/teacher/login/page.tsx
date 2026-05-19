'use client';
import { PortalLogin } from '@/components/portal/PortalShell';
export default function TeacherLoginPage() {
  return <PortalLogin role="teacher" successHref="/teacher" />;
}
