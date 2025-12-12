# Sauce Ambassador Platform - Code Review Export
**Generated:** 2025-12-12

## Project Overview
A gamified, multi-stage ambassador recruitment web app for a campus marketing agency. Users complete an intake flow, create accounts, and access an ambassador portal.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State Management:** TanStack React Query
- **Routing:** React Router DOM v6
- **Backend:** Supabase (Lovable Cloud)
- **Animation:** Framer Motion

---

## Current Issue
**RLS Policy Violation on INSERT to `applicants` table**

The intake flow fails with: `"new row violates row-level security policy for table 'applicants'"`

### Flow Context
1. User completes intake flow (landing → qualifier → profile → result card)
2. Applicant data is inserted into `applicants` table (anonymous user)
3. User creates password → Supabase Auth account created
4. Edge function links `user_id` to applicant record

---

## Database Schema

### Table: `applicants`
```sql
CREATE TABLE public.applicants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email text, -- NULLABLE
  school text NOT NULL,
  is_19_plus boolean NOT NULL DEFAULT false,
  instagram_handle text NOT NULL,
  personality_traits text[] NOT NULL DEFAULT '{}'::text[],
  interests text[] NOT NULL DEFAULT '{}'::text[],
  household_size integer NOT NULL DEFAULT 1,
  scene_types text[] NOT NULL DEFAULT '{}'::text[],
  scene_custom text,
  content_uploaded boolean NOT NULL DEFAULT false,
  ambassador_type text NOT NULL,
  waitlist_position integer NOT NULL,
  referral_code text NOT NULL,
  points integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'new'::text,
  content_urls jsonb DEFAULT '[]'::jsonb,
  pitch_url text,
  pitch_type text,
  instagram_profile_pic text,
  instagram_followers integer,
  instagram_verified boolean DEFAULT false,
  first_name text,
  last_name text,
  user_id uuid, -- NULLABLE - linked after account creation
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone
);

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
```

### RLS Policies on `applicants`
```sql
-- 1. INSERT Policy (for intake flow)
CREATE POLICY "Anyone can submit application" 
ON public.applicants 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 2. SELECT - Block public read
CREATE POLICY "No public read access" 
ON public.applicants 
FOR SELECT 
USING (false);

-- 3. SELECT - Users can view their own (by user_id or email)
CREATE POLICY "Users can view their own applicant record" 
ON public.applicants 
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  ((user_id IS NULL) AND (email = get_current_user_email()))
);

-- 4. SELECT - Admins can view all
CREATE POLICY "Admins can view all applicants" 
ON public.applicants 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. UPDATE - Users can update their own
CREATE POLICY "Users can update their own applicant record" 
ON public.applicants 
FOR UPDATE 
USING (
  (user_id = auth.uid()) OR 
  ((user_id IS NULL) AND (email = get_current_user_email()))
)
WITH CHECK (
  (user_id = auth.uid()) OR 
  ((user_id IS NULL) AND (email = get_current_user_email()))
);

-- 6. UPDATE - Admins can update
CREATE POLICY "Admins can update applicants" 
ON public.applicants 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. DELETE - Admins can delete
CREATE POLICY "Admins can delete applicants" 
ON public.applicants 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Database Functions
```sql
-- Check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;
```

### Table: `user_roles`
```sql
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL, -- enum: 'admin', 'moderator', 'user'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
```

---

## Critical Code: Intake Flow Insert

### `src/components/intake/IntakeFlow.tsx`
```tsx
// Sign out any existing session when starting the intake flow
useEffect(() => {
  const clearSession = async () => {
    await supabase.auth.signOut();
    setIsReady(true);
  };
  clearSession();
}, []);

// In handleProfileComplete:
const generatedId = crypto.randomUUID();

const completeData = {
  id: generatedId, // Client-generated ID
  school: applicantData.school!,
  is_19_plus: applicantData.is19Plus!,
  first_name: applicantData.firstName || null,
  last_name: applicantData.lastName || null,
  email: applicantData.email || null,
  instagram_handle: applicantData.instagramHandle!,
  instagram_profile_pic: applicantData.instagramProfilePic || null,
  instagram_followers: applicantData.instagramFollowers || null,
  instagram_verified: applicantData.instagramVerified || false,
  personality_traits: data.personalityTraits,
  interests: data.interests,
  household_size: data.householdSize,
  scene_types: data.sceneTypes,
  scene_custom: data.sceneCustom || null,
  content_uploaded: data.contentUploaded,
  content_urls: data.contentUrls,
  pitch_url: data.pitchUrl,
  pitch_type: data.pitchType,
  ambassador_type: ambassadorType.name,
  waitlist_position: waitlistPosition,
  referral_code: referralCode,
  points: score,
};

// Insert WITHOUT .select() to avoid SELECT RLS issues
const { error } = await supabase
  .from('applicants')
  .insert(completeData);
```

---

## Edge Functions

### `supabase/functions/link-applicant/index.ts`
Links applicant record to auth user after account creation.

```typescript
serve(async (req) => {
  // Uses user's JWT to get user ID
  // Uses service role to update applicant record
  // Verifies email matches for security
  
  const { applicantId } = await req.json();
  
  // Get user from JWT
  const { data: { user } } = await userClient.auth.getUser();
  
  // Use service role to update
  const { error: updateError } = await adminClient
    .from('applicants')
    .update({ user_id: user.id })
    .eq('id', applicantId);
});
```

### `supabase/functions/instagram-lookup/index.ts`
Fetches Instagram profile data and stores profile picture in Supabase Storage.

---

## Auth Flow

### Account Creation (Post-Intake)
```tsx
// In AccountCreationStage, onComplete callback:
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: applicantData.email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/portal`,
  },
});

// Call edge function to link applicant
const { data: linkData, error: linkError } = await supabase.functions.invoke('link-applicant', {
  body: { applicantId },
});

// Navigate to portal
navigate('/portal', { replace: true });
```

### Portal Auth
```tsx
// usePortalAuth.tsx fetches applicant by user_id
const { data } = await supabase
  .from('applicants')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();
```

---

## Storage Buckets
| Bucket Name | Public |
|-------------|--------|
| applicant-content | Yes |
| applicant-recordings | Yes |
| instagram-profiles | Yes |

---

## Other Tables

### `challenges`
Boost challenges for waitlist position improvement.

### `challenge_completions`
Tracks which applicants completed which challenges.

### `opportunities`
Brand partnership opportunities for approved ambassadors.

### `opportunity_applications`
Tracks applicant applications to opportunities.

### `schools`
List of Ontario universities for intake dropdown.

### `personality_traits`, `interests`, `venue_types`
Form field options for profile builder.

### `ambassador_types`
Ambassador type assignments with weights.

### `settings`
App configuration settings.

### `admin_notes`
Admin notes on applicants.

---

## Known Issues / Questions

1. **RLS INSERT Failure**: Despite having `WITH CHECK (true)` and `TO anon, authenticated`, INSERT still fails with RLS policy violation.

2. **Session State**: IntakeFlow calls `signOut()` on mount to ensure clean state, but error persists.

3. **Client-Generated UUID**: Changed to generate UUID client-side to avoid needing SELECT after INSERT.

4. **Policy Roles**: Query showed INSERT policy now has `roles: {anon, authenticated}`, but issue persists.

---

## File Structure
```
src/
├── App.tsx                    # Routes configuration
├── components/
│   ├── admin/                 # Admin dashboard components
│   ├── intake/                # Intake flow components
│   │   ├── IntakeFlow.tsx     # Main intake orchestrator
│   │   └── stages/            # Individual stage components
│   │       ├── AccountCreationStage.tsx
│   │       ├── LandingStage.tsx
│   │       ├── ProfileBuilderStage.tsx
│   │       ├── QualifierStage.tsx
│   │       └── ResultCardStage.tsx
│   ├── portal/                # Portal layout/components
│   └── ui/                    # shadcn/ui components
├── hooks/
│   ├── useAuth.tsx            # Admin auth hook
│   └── usePortalAuth.tsx      # Portal auth hook
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client
│       └── types.ts           # Generated types
├── lib/
│   └── applicant-utils.ts     # Scoring utilities
├── pages/
│   ├── admin/                 # Admin pages
│   ├── portal/                # Portal pages
│   ├── Index.tsx              # Home (IntakeFlow)
│   └── NotFound.tsx
└── types/
    └── applicant.ts           # Applicant types

supabase/
├── config.toml
└── functions/
    ├── instagram-lookup/
    │   └── index.ts
    └── link-applicant/
        └── index.ts
```

---

## Environment Variables
```
VITE_SUPABASE_URL=https://xyyjpudqpmeuxgvvlmtz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=xyyjpudqpmeuxgvvlmtz
```

---

## Debugging Notes
- Console shows: `"new row violates row-level security policy for table 'applicants'"`
- The INSERT operation is performed by an anonymous user (after signOut)
- The RLS policy `Anyone can submit application` should allow this
- No user is authenticated at time of INSERT (verified with signOut on mount)
