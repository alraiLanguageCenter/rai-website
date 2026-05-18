import { redirect } from 'next/navigation';

export default function AdminRoot() {
  // Default landing: announcements dashboard
  redirect('/admin/announcements');
}
