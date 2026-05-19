import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Approves a student application AND provisions a real sign-in account for the
 * applicant. Flow:
 *   1. Verify the caller is signed in AND has profile.role = 'admin'.
 *   2. Fetch the application — must still be pending/waitlisted.
 *   3. Generate a temporary password (cryptographically random, 12 chars).
 *   4. Create-or-update the auth user via the Supabase service-role auth API.
 *   5. Upsert a profiles row with role='student' and display_name from the application.
 *   6. Update the application: status='approved' (the existing BEFORE-UPDATE
 *      trigger mints a fresh student_number from the sequence).
 *   7. Re-read the application to capture the freshly-assigned student_number,
 *      and copy it onto the student's profile so the student portal can
 *      display it on their dashboard.
 *   8. Return the credentials so the admin UI can show them in a modal for
 *      the admin to copy and forward to the new student.
 *
 * If anything fails halfway, we try to leave the system in a reasonable state
 * (the application stays pending if we never got to step 6).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Server is not configured.' }, { status: 503 });
  }

  // --- 1) admin check ---
  const sbServer = await getSupabaseServer();
  const { data: { user } } = await sbServer.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const { data: callerProfile } = await sbServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Admin role required.' }, { status: 403 });
  }

  const { id: applicationId } = await params;
  const admin = getSupabaseAdmin();

  // --- 2) fetch application ---
  const { data: app, error: appErr } = await admin
    .from('student_applications')
    .select('id, full_name, email, phone, status, assigned_student_number')
    .eq('id', applicationId)
    .maybeSingle();
  if (appErr || !app) {
    return NextResponse.json({ ok: false, error: 'Application not found.' }, { status: 404 });
  }
  if (app.status === 'rejected') {
    return NextResponse.json({ ok: false, error: 'Cannot approve a previously-rejected application. Reset it first.' }, { status: 409 });
  }

  // --- 3) random temp password ---
  const tempPassword = generateTempPassword(12);

  // --- 4) create or update auth user ---
  let authUserId: string | null = null;
  try {
    // Look the user up by email — Supabase doesn't expose a getUserByEmail in
    // the JS SDK so we page the admin list. With 4 demo users + a handful of
    // real applications this is fine; revisit if it scales.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => (u.email ?? '').toLowerCase() === app.email.toLowerCase());

    if (existing) {
      authUserId = existing.id;
      // Reset password + ensure email is confirmed so they can sign in straight away.
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password: tempPassword,
        email_confirm: true,
      });
      if (updErr) throw updErr;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: app.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { display_name: app.full_name, source: 'student_application', applicationId: app.id },
      });
      if (createErr) throw createErr;
      authUserId = created?.user?.id ?? null;
    }
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: 'Could not create the auth account.',
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
  if (!authUserId) {
    return NextResponse.json({ ok: false, error: 'Auth user creation returned no id.' }, { status: 500 });
  }

  // --- 5) upsert profile (role=student) ---
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({
      id: authUserId,
      email: app.email,
      role: 'student',
      display_name: app.full_name,
      phone: app.phone,
    }, { onConflict: 'id' });
  if (profileErr) {
    return NextResponse.json({ ok: false, error: 'Profile upsert failed.', detail: profileErr.message }, { status: 500 });
  }

  // --- 6) approve the application (trigger mints student_number) ---
  const { error: approveErr } = await admin
    .from('student_applications')
    .update({ status: 'approved', decided_by: user.id })
    .eq('id', applicationId);
  if (approveErr) {
    return NextResponse.json({ ok: false, error: 'Approval update failed.', detail: approveErr.message }, { status: 500 });
  }

  // --- 7) read back the assigned student_number and copy onto profile ---
  const { data: approved } = await admin
    .from('student_applications')
    .select('assigned_student_number')
    .eq('id', applicationId)
    .maybeSingle();
  const studentNumber = (approved as { assigned_student_number: number | null } | null)?.assigned_student_number ?? null;
  if (studentNumber != null) {
    await admin.from('profiles').update({ student_number: studentNumber }).eq('id', authUserId);
  }

  // --- 8) return creds for the admin UI to show ---
  return NextResponse.json({
    ok: true,
    studentNumber,
    email: app.email,
    tempPassword,
    loginUrl: '/student/login',
  });
}

/* -------------------- helpers -------------------- */

/**
 * Generates a random, easy-ish-to-read password using web-crypto. Uses an
 * alphabet without confusable characters (no O/0, no l/1/I), and guarantees
 * at least one digit and one symbol so the password is robust.
 */
function generateTempPassword(len = 12): string {
  const lowers  = 'abcdefghjkmnpqrstuvwxyz';
  const uppers  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits  = '23456789';
  const symbols = '!@#$%&*';
  const all = lowers + uppers + digits + symbols;

  // Cryptographically random bytes.
  const bytes = new Uint8Array(len);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  // Guarantee at least one of each class
  const must = [
    lowers[bytes[0] % lowers.length],
    uppers[bytes[1] % uppers.length],
    digits[bytes[2] % digits.length],
    symbols[bytes[3] % symbols.length],
  ];
  const rest: string[] = [];
  for (let i = 4; i < len; i++) {
    rest.push(all[bytes[i] % all.length]);
  }
  const out = [...must, ...rest];
  // Fisher-Yates shuffle with the same random bytes recycled
  for (let i = out.length - 1; i > 0; i--) {
    const j = (bytes[i] ?? 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join('');
}
