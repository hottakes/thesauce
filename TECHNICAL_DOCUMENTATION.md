# Sauce Ambassador Platform - Technical Documentation

**Version:** 1.0  
**Last Updated:** January 7, 2026  
**Platform:** Lovable Cloud (Supabase-powered backend)

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Application Flows](#application-flows)
7. [Edge Functions](#edge-functions)
8. [Row-Level Security (RLS)](#row-level-security-rls)
9. [Component Structure](#component-structure)
10. [Design System](#design-system)
11. [Key Features](#key-features)
12. [API Integrations](#api-integrations)
13. [File Storage](#file-storage)
14. [Known Constraints](#known-constraints)
15. [Environment Variables](#environment-variables)

---

## Overview

Sauce Ambassador Platform is a gamified, multi-stage ambassador recruitment web application for a campus marketing agency. The design philosophy is "Spotify Wrapped meets premium app onboarding" — featuring a dark mode aesthetic with bold gradients, full-screen stages, smooth transitions, and a social-native feel.

### Key Metrics
- **Target Completion Time:** ~3 minutes for intake flow
- **Primary Device:** Mobile (80%+ of users)
- **Viewport Baseline:** 375px (mobile-first design)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^18.3.1 | UI Framework |
| Vite | Latest | Build Tool |
| TypeScript | Latest | Type Safety |
| Tailwind CSS | Latest | Styling |
| Framer Motion | ^12.23.26 | Animations |
| React Router DOM | ^6.30.1 | Routing |
| TanStack React Query | ^5.83.0 | Data Fetching/Caching |
| React Hook Form | ^7.61.1 | Form Management |
| Zod | ^3.25.76 | Schema Validation |

### UI Components
| Library | Purpose |
|---------|---------|
| shadcn/ui | Component Library (Radix-based) |
| Lucide React | Icons |
| Sonner | Toast Notifications |
| Recharts | Data Visualization |
| canvas-confetti | Celebration Animations |

### Backend (Lovable Cloud)
| Service | Purpose |
|---------|---------|
| Supabase Auth | Authentication |
| Supabase Database | PostgreSQL Database |
| Supabase Storage | File Storage |
| Supabase Edge Functions | Serverless Functions (Deno) |

---

## Architecture

### Application Structure

```
src/
├── assets/                  # Static assets (images, brand logos)
├── components/
│   ├── admin/              # Admin dashboard components
│   ├── intake/             # Intake flow components
│   ├── portal/             # Ambassador portal components
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── integrations/
│   └── supabase/          # Supabase client & types (auto-generated)
├── lib/                    # Utility functions
├── pages/
│   ├── admin/             # Admin pages
│   └── portal/            # Portal pages
└── types/                 # TypeScript type definitions

supabase/
├── config.toml            # Supabase configuration (auto-generated)
└── functions/             # Edge Functions
    ├── instagram-lookup/  # Instagram profile fetching
    └── link-applicant/    # Account linking
```

### Route Structure

| Route Pattern | Component | Access |
|---------------|-----------|--------|
| `/` | `Index.tsx` → `IntakeFlow` | Public |
| `/admin/login` | `AdminLogin` | Public |
| `/admin/*` | `AdminLayout` (protected) | Admin Only |
| `/portal/login` | `PortalLogin` | Public |
| `/portal/*` | `PortalLayout` | Authenticated Applicants |

---

## Database Schema

### Core Tables

#### `applicants`
Primary table storing all applicant data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `email` | text | Yes | - | User email |
| `school` | text | No | - | Selected university |
| `is_19_plus` | boolean | No | `false` | Age verification |
| `instagram_handle` | text | No | - | Instagram username |
| `instagram_profile_pic` | text | Yes | - | Stored profile pic URL |
| `instagram_followers` | integer | Yes | - | Follower count |
| `instagram_verified` | boolean | Yes | `false` | Verification status |
| `first_name` | text | Yes | - | First name |
| `last_name` | text | Yes | - | Last name |
| `personality_traits` | text[] | No | `'{}'` | Selected traits |
| `interests` | text[] | No | `'{}'` | Selected interests |
| `household_size` | integer | No | `1` | Household size (1-8+) |
| `scene_types` | text[] | No | `'{}'` | Venue preferences |
| `scene_custom` | text | Yes | - | Custom venue text |
| `content_uploaded` | boolean | No | `false` | Has uploaded content |
| `content_urls` | jsonb | Yes | `'[]'` | Array of content URLs |
| `pitch_url` | text | Yes | - | Pitch recording URL |
| `pitch_type` | text | Yes | - | `'video'` or `'audio'` |
| `ambassador_type` | text | No | - | Assigned type |
| `waitlist_position` | integer | No | - | Calculated position |
| `referral_code` | text | No | - | Unique referral code |
| `points` | integer | No | `50` | Total points |
| `status` | text | No | `'new'` | Application status |
| `user_id` | uuid | Yes | - | Linked auth user |
| `approved_at` | timestamptz | Yes | - | Approval timestamp |
| `rejected_at` | timestamptz | Yes | - | Rejection timestamp |

#### `schools`
Dynamic list of Ontario universities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | School name |
| `spots_total` | integer | Total ambassador spots |
| `spots_remaining` | integer | Available spots |
| `is_active` | boolean | Show in dropdown |
| `sort_order` | integer | Display order |

#### `ambassador_types`
Configurable ambassador type assignments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Type name (e.g., "The Connector") |
| `description` | text | Type description |
| `assignment_weight` | integer | Random assignment weight |
| `is_active` | boolean | Include in assignment pool |

#### `opportunities`
Brand partnership opportunities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Opportunity title |
| `brand_name` | text | Brand name |
| `brand_logo_url` | text | Brand logo URL |
| `description` | text | Full description |
| `short_description` | text | Card description |
| `opportunity_type` | text | Type: sampling/event/content/tabling/promotion |
| `compensation` | text | Payment/perks description |
| `location` | text | Location details |
| `schools` | text[] | Eligible schools (empty = all) |
| `requirements` | text[] | Requirements list |
| `start_date` | date | Start date |
| `end_date` | date | End date |
| `spots_total` | integer | Total spots |
| `spots_filled` | integer | Filled spots |
| `is_featured` | boolean | Featured badge |
| `status` | text | draft/active/completed/cancelled |

#### `opportunity_applications`
Tracks applications to opportunities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `opportunity_id` | uuid | FK to opportunities |
| `applicant_id` | uuid | FK to applicants |
| `status` | text | pending/approved/rejected |
| `applied_at` | timestamptz | Application timestamp |
| `approved_at` | timestamptz | Approval timestamp |
| `notes` | text | Admin notes |

#### `challenges`
Waitlist boost challenges.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Challenge title |
| `description` | text | Instructions |
| `points` | integer | Points awarded |
| `verification_type` | text | honor/proof/auto |
| `icon` | text | Icon identifier |
| `external_url` | text | Link for challenge |
| `is_active` | boolean | Show to users |
| `sort_order` | integer | Display order |

#### `challenge_completions`
Tracks completed challenges.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `applicant_id` | uuid | FK to applicants |
| `challenge_id` | uuid | FK to challenges |
| `completed_at` | timestamptz | Completion time |
| `verified` | boolean | Verified by admin |
| `proof_url` | text | Proof file URL |

#### `user_roles`
Role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `role` | app_role | admin/moderator/user |

### Form Configuration Tables

All managed via Admin Panel:

- `personality_traits` - Selectable personality traits with emoji
- `interests` - Selectable interests with emoji
- `venue_types` - Scene/venue options with emoji
- `settings` - Key-value configuration store
- `admin_notes` - Notes on applicants

---

## Authentication System

### Dual Authentication Context

The application uses **two separate auth contexts**:

#### 1. Admin Authentication (`useAuth`)
**File:** `src/hooks/useAuth.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}
```

- Used for `/admin/*` routes
- Checks `user_roles` table for admin role
- Protected by `ProtectedRoute` component

#### 2. Portal Authentication (`usePortalAuth`)
**File:** `src/hooks/usePortalAuth.tsx`

```typescript
interface PortalAuthContextType {
  session: Session | null;
  user: User | null;
  applicant: ApplicantData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}
```

- Used for `/portal/*` routes
- Fetches linked applicant record after auth
- Requires applicant record with matching `user_id`

### Admin Role Assignment

First admin must be manually granted via database:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

### Role Checking Function

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

---

## Application Flows

### Intake Flow (5 Stages)

```
┌─────────────────┐
│  Stage 1:       │
│  Landing/Hook   │──► Hero, scarcity, social proof
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stage 2:       │
│  Quick Qualifier│──► School → Age → Instagram (30 seconds)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stage 3:       │
│  Profile Builder│──► Vibe → Crew → Scene → Flex (4 sections)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stage 4:       │
│  Result Card    │──► Ambassador type, score, confetti
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stage 5:       │
│  Account Create │──► Email/password → Link to applicant
└─────────────────┘
```

### Account Linking Flow

```
1. User completes intake (applicant record created with client-generated UUID)
2. User enters email/password on AccountCreationStage
3. Supabase Auth account created
4. Edge function `link-applicant` called with applicant ID
5. Edge function verifies email match
6. Updates applicant.user_id with auth user ID
7. User redirected to /portal
```

### Scoring Algorithm

```typescript
const calculateApplicantScore = (data) => {
  let score = 50; // Base score
  
  // +10 per interest selected
  score += data.interests.length * 10;
  
  // +15 if household size > 2
  if (data.householdSize > 2) score += 15;
  
  // +20 if content uploaded
  if (data.contentUploaded) score += 20;
  
  return score; // Max: 175
};
```

Waitlist position is inversely calculated from score (higher score = lower/better position).

---

## Edge Functions

### `instagram-lookup`
**Path:** `supabase/functions/instagram-lookup/index.ts`

Fetches Instagram profile data without OAuth.

**Request:**
```json
{ "username": "instagram_handle" }
```

**Response:**
```json
{
  "username": "handle",
  "profilePicUrl": "https://storage.url/...",
  "followerCount": 1500,
  "isVerified": false
}
```

**Process:**
1. Cleans username (removes @)
2. Fetches from Instagram web API
3. Downloads profile picture
4. Stores in Supabase Storage (`instagram-profiles` bucket)
5. Returns permanent storage URL

### `link-applicant`
**Path:** `supabase/functions/link-applicant/index.ts`

Links applicant record to authenticated user.

**Request:**
```json
{ "applicantId": "uuid" }
```

**Authorization:** Requires valid JWT in Authorization header

**Process:**
1. Validates JWT and extracts user
2. Fetches applicant by ID
3. Verifies email match
4. Updates `applicant.user_id`

---

## Row-Level Security (RLS)

### Critical: Applicants Table

```sql
-- Allow anonymous inserts (intake flow)
CREATE POLICY "allow_public_insert" ON public.applicants
FOR INSERT WITH CHECK (true);

-- Users can view own record
CREATE POLICY "Users can view their own applicant record" ON public.applicants
FOR SELECT USING (
  (user_id = auth.uid()) OR 
  ((user_id IS NULL) AND (email = get_current_user_email()))
);

-- Users can update own record
CREATE POLICY "Users can update their own applicant record" ON public.applicants
FOR UPDATE USING (
  (user_id = auth.uid()) OR 
  ((user_id IS NULL) AND (email = get_current_user_email()))
);

-- Admins have full access
CREATE POLICY "Admins can view all applicants" ON public.applicants
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applicants" ON public.applicants
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applicants" ON public.applicants
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
```

### Table Permissions Required

```sql
-- Applicants table requires explicit grants
GRANT INSERT, SELECT, UPDATE ON public.applicants TO anon, authenticated;
```

### Standard Pattern for Other Tables

```sql
-- Public read for active items
CREATE POLICY "Anyone can view active [table]" ON public.[table]
FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage [table]" ON public.[table]
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
```

---

## Component Structure

### Intake Components

| Component | Purpose |
|-----------|---------|
| `IntakeFlow.tsx` | Main flow controller, state management |
| `StageWrapper.tsx` | Animation wrapper for stages |
| `AnimatedBackground.tsx` | Gradient background animation |
| `LandingStage.tsx` | Hero, CTA, social proof |
| `QualifierStage.tsx` | School, age, Instagram collection |
| `ProfileBuilderStage.tsx` | 4-section profile builder |
| `ResultCardStage.tsx` | Ambassador type reveal with confetti |
| `AccountCreationStage.tsx` | Auth account creation |
| `TileSelector.tsx` | Multi-select tile grid |
| `ContentUploader.tsx` | File upload component |
| `PitchRecorder.tsx` | Video/audio recording |
| `BrandLogos.tsx` | Partner brand display |
| `SocialProofTicker.tsx` | Scrolling social proof |
| `ProgressBar.tsx` | Profile builder progress |

### Admin Components

| Component | Purpose |
|-----------|---------|
| `AdminLayout.tsx` | Sidebar navigation, outlet |
| `ProtectedRoute.tsx` | Auth guard for admin routes |
| `OpportunityApplicationsDrawer.tsx` | Application review drawer |

### Portal Components

| Component | Purpose |
|-----------|---------|
| `PortalLayout.tsx` | Sidebar/bottom nav, outlet |
| `PortalSkeleton.tsx` | Loading state |
| `PortalError.tsx` | Error state |
| `PortalEmpty.tsx` | Empty state |

---

## Design System

### Color Tokens (HSL)

Defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --muted: 0 0% 96.1%;
  --accent: 0 0% 96.1%;
  --destructive: 0 84.2% 60.2%;
  
  /* Brand Colors */
  --sauce-orange: 18 100% 60%;
  --sauce-pink: 344 100% 60%;
  --sauce-purple: 270 100% 65%;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark mode overrides */
}
```

### Typography

- **Display Font:** Custom (via `font-display` class)
- **Body Font:** System sans-serif stack

### Animation Patterns

```typescript
// Container animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Item animation
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

### Glass Card Styling

```css
.glass-card {
  @apply bg-card/80 backdrop-blur-sm border border-border rounded-2xl;
}
```

---

## Key Features

### Dynamic Form Management

All form options are database-driven:
- Schools (with spot tracking)
- Personality traits (with emoji)
- Interests (with emoji)
- Venue types (with emoji)
- Challenges (with points)
- Ambassador types (with weights)

Changes in admin panel immediately reflect in intake flow.

### FOMO-Driven Opportunity Display

Portal opportunities designed with psychology:
- Show all details to locked users (don't hide)
- Subtle overlay with pulsing lock icon
- "Hot" badges on featured opportunities
- "Only X spots left" urgency
- "Filling Fast" when >50% filled
- Real-time activity ticker

### Challenge Completion System

1. User clicks challenge → completion recorded
2. Points added to `applicant.points`
3. Waitlist position recalculated
4. Confetti animation shown
5. UI refreshes with new position

---

## API Integrations

### Instagram (No OAuth)

- Fetches public profile data via web API
- Downloads and stores profile pictures
- Extracts: handle, followers, verified status
- Edge function handles all processing

### Future Integration Points

- Stripe (compensation payouts)
- Email service (notifications)
- SMS verification

---

## File Storage

### Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `instagram-profiles` | Profile pictures | Public read |
| `applicant-content` | Uploaded content files | Authenticated |
| `applicant-recordings` | Pitch recordings | Authenticated |

### Upload Limits

- Max file size: 50MB
- Max files per applicant: 5
- Recording duration: 30-60 seconds

---

## Known Constraints

### Infrastructure
- **Locked to Lovable Cloud** - Cannot migrate to external Supabase
- **No direct SQL access** - Use migrations tool only
- **Edge functions only** - No Node.js/Python backend

### Technical
- Query limit: 1000 rows per Supabase query
- Anonymous users must be able to INSERT applicants (pre-auth)
- RLS policies must be PERMISSIVE, not RESTRICTIVE

### Design
- Mobile-first (375px baseline)
- Dark mode primary
- ~3 minute completion target

---

## Environment Variables

Auto-configured (DO NOT EDIT `.env`):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

---

## Development Notes

### First-Time Admin Setup

```sql
-- After creating first user account at /admin/login
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-admin@email.com';
```

### Debugging Tips

1. **RLS Issues:** Check GRANT statements on tables
2. **Missing Data:** Check 1000 row query limit
3. **Auth Issues:** Verify `user_roles` entry exists
4. **Portal Access:** Ensure `applicant.user_id` is linked

### File Ownership

**Auto-generated (DO NOT EDIT):**
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `supabase/config.toml`
- `.env`

---

## Appendix: Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   schools   │     │    applicants    │     │ user_roles  │
├─────────────┤     ├──────────────────┤     ├─────────────┤
│ id          │     │ id               │     │ id          │
│ name        │     │ school ──────────┼────►│ user_id ────┼──► auth.users
│ spots_total │     │ user_id ─────────┼─────┤ role        │
│ spots_remain│     │ email            │     └─────────────┘
└─────────────┘     │ ambassador_type ─┼──┐
                    │ ...              │  │  ┌─────────────────┐
                    └────────┬─────────┘  │  │ ambassador_types│
                             │            │  ├─────────────────┤
                             │            └─►│ id              │
                             │               │ name            │
         ┌───────────────────┼───────────┐   │ description     │
         │                   │           │   │ assignment_weight│
         ▼                   ▼           │   └─────────────────┘
┌─────────────────┐  ┌──────────────┐    │
│opportunity_apps │  │challenge_comp│    │
├─────────────────┤  ├──────────────┤    │
│ id              │  │ id           │    │
│ opportunity_id ─┼┐ │ applicant_id─┼────┘
│ applicant_id ───┼┘ │ challenge_id─┼──┐
│ status          │  │ completed_at │  │
│ approved_at     │  │ verified     │  │
└────────┬────────┘  └──────────────┘  │
         │                             │
         ▼                             ▼
┌─────────────────┐           ┌─────────────┐
│  opportunities  │           │  challenges │
├─────────────────┤           ├─────────────┤
│ id              │           │ id          │
│ title           │           │ title       │
│ brand_name      │           │ points      │
│ status          │           │ is_active   │
│ spots_total     │           └─────────────┘
│ spots_filled    │
└─────────────────┘
```

---

**Document maintained by:** Lovable AI  
**Questions:** Reference codebase or project memories
