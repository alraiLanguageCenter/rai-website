import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

const schema = z.object({
  fullName:        z.string().trim().min(2).max(120),
  email:           z.string().trim().email().max(160),
  phone:           z.string().trim().min(5).max(40),
  gender:          z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  dateOfBirth:     z.string().optional().or(z.literal('')),
  ageGroup:        z.enum(['child', 'teen', 'adult', 'professional']).optional(),
  location:        z.string().trim().max(160).optional().or(z.literal('')),
  nativeLanguage:  z.string().trim().max(80).optional().or(z.literal('')),
  targetLanguage:  z.string().trim().max(80).optional().or(z.literal('')),
  targetLevel:     z.string().trim().max(10).optional().or(z.literal('')),
  goals:           z.string().trim().max(1200).optional().or(z.literal('')),
  source:          z.string().trim().max(120).optional().or(z.literal('')),
  locale:          z.enum(['ar', 'en']).default('en'),
  /** Anti-spam honeypot: real users leave this empty. */
  website:         z.string().max(0).optional().or(z.literal('')),
});

/**
 * Public endpoint that accepts a student-registration application.
 *
 * Insert is performed through the service-role client (no Auth required from
 * the visitor). The DB has an RLS policy that also allows anon insert, but
 * going through the admin client guarantees the write succeeds even if RLS
 * misbehaves and lets us return the freshly-minted row id cleanly.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Honeypot — if a bot filled the hidden `website` field, drop silently.
  if (d.website) {
    return NextResponse.json({ ok: true, applicationId: null });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Registration is temporarily unavailable. Please try again later.' },
      { status: 503 },
    );
  }

  try {
    const sb = getSupabaseAdmin();
    const userAgent = req.headers.get('user-agent') ?? null;

    const { data, error } = await sb
      .from('student_applications')
      .insert({
        full_name:       d.fullName,
        email:           d.email.toLowerCase(),
        phone:           d.phone,
        gender:          d.gender ?? null,
        date_of_birth:   d.dateOfBirth || null,
        age_group:       d.ageGroup ?? null,
        location:        d.location || null,
        native_language: d.nativeLanguage || null,
        target_language: d.targetLanguage || null,
        target_level:    d.targetLevel || null,
        goals:           d.goals || null,
        source:          d.source || null,
        locale:          d.locale,
        user_agent:      userAgent,
      })
      .select('id, applied_at')
      .single();

    if (error) {
      console.error('[student-application] insert failed', error);
      return NextResponse.json(
        { ok: false, error: 'Could not save your application. Please try again or contact us directly.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, applicationId: data.id, appliedAt: data.applied_at });
  } catch (e) {
    console.error('[student-application] unexpected error', e);
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 });
  }
}
