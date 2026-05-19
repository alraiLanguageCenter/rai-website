'use client';
import { GraduationCap, Library, FileQuestion, ClipboardList } from 'lucide-react';
import { PortalShell } from './PortalShell';

const NAV = [
  { href: '/teacher/classes',  label: 'My Classes',  Icon: GraduationCap },
  { href: '/teacher/materials',label: 'Materials',   Icon: Library },
  { href: '/teacher/exams',    label: 'Exams',       Icon: FileQuestion },
  { href: '/teacher/grades',   label: 'Grades',      Icon: ClipboardList },
];

export function TeacherShell({ children }: { children: React.ReactNode }) {
  return <PortalShell role="teacher" loginPath="/teacher/login" nav={NAV}>{children}</PortalShell>;
}
