'use client';
import { LayoutDashboard, FileQuestion, ClipboardList, Library, BookOpen, Sparkles, CalendarPlus, MessageCircle } from 'lucide-react';
import { PortalShell } from './PortalShell';

const NAV = [
  { href: '/student',             label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/student/exams',       label: 'Exams',     Icon: FileQuestion },
  { href: '/student/marks',       label: 'Marks',     Icon: ClipboardList },
  { href: '/student/materials',   label: 'Materials', Icon: Library },
  { href: '/student/library',     label: 'Library',   Icon: BookOpen },
  { href: '/student/tutor',       label: 'AI Tutor',  Icon: Sparkles },
  { href: '/student/sessions',    label: 'Sessions',  Icon: CalendarPlus },
  { href: '/student/complaints',  label: 'Complaints',Icon: MessageCircle },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  return <PortalShell role="student" loginPath="/student/login" nav={NAV}>{children}</PortalShell>;
}
