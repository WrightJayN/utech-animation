# UTech Animation Portfolio Gallery

A full-stack portfolio platform built for animation students at the **University of Technology, Jamaica**. Students can upload and showcase their work, and anyone can browse portfolios without needing an account — similar to Behance.

**Live site:** https://utech-animation.vercel.app

---

## Screenshots

### Discovery Feed
The home page features an animated hero, tag filters, year filters, and a staggered portfolio grid. Visitors can browse without an account.

### Student Dashboard
Students manage all their portfolios in one place with visibility controls (Public, Unlisted, Private), edit access, and status indicators for warnings, takedowns and appeals.

### Profile Settings
Students can upload a profile avatar, set their year of study, and write a bio — all reflected instantly across the platform.

### New Portfolio
The upload flow lets students add a title, description, cover image, media items (images and video), and tags in one form.

### Portfolio View
Each portfolio has a full-page view with a cover image, tags, like and comment counts, a clickable owner card, a zoomable/pannable media lightbox, likes, comments, and a report button.

### Public Profile
Every student gets a public profile at `/profile/[username]` showing their avatar, bio, year of study, total portfolios, total likes received, and a grid of all their public work.

---

## What It Does

### For Visitors
- Browse all public student portfolios on an animated discovery feed
- Filter by tag (Character Design, Illustration, 3D Modelling, Video Editing, Graphic Design)
- Filter by upload year
- Search portfolios by title
- Search students by name
- View individual portfolios with a zoomable, pannable media lightbox
- See like and comment counts without an account

### For Students
- Create an account with email and password
- Upload portfolios with a cover image, description, tags, and media (images and video)
- Set portfolio visibility: **Public**, **Unlisted** (link-only), or **Private**
- Edit portfolios — add or remove media items
- Like and comment on any public portfolio
- View a public profile page showing all your work
- Upload a profile avatar and edit bio and year of study
- Receive admin warnings with the ability to submit a counter statement
- Submit one appeal if a portfolio is taken down
- See the status of takedowns, appeals, and scheduled deletion dates

### For Admins
- Full moderation panel at `/admin`
- Search portfolios by title or student name, filter by year
- Issue timed warnings (3 days, 1 week, 2 weeks) without affecting portfolio visibility
- Review counter statements submitted by students after a warning
- Green light a portfolio (clear the warning) or escalate to takedown
- Take down portfolios with a required reason
- Students receive one appeal — admin can approve or deny
- Denied appeals lock the portfolio and schedule permanent deletion 1 year from denial date
- Admin override to reset a denied appeal if a mistake was made
- Manage reports (Inappropriate Content, Copyright) with card-spread view per portfolio
- Update report status: Pending → Reviewed → Actioned / Dismissed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Animations | Framer Motion |
| Styling | CSS Custom Properties (no framework) |
| Fonts | Syne (display) + Inter (body) via Google Fonts |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Discovery feed (home)
│   ├── login/page.tsx              # Auth page
│   ├── dashboard/page.tsx          # Student portfolio management
│   ├── upload/page.tsx             # Create portfolio
│   ├── edit/[id]/page.tsx          # Edit portfolio
│   ├── portfolio/[slug]/page.tsx   # Public portfolio view
│   ├── profile/[username]/page.tsx # Public profile page
│   ├── settings/page.tsx           # Profile settings + avatar upload
│   ├── admin/page.tsx              # Admin moderation panel
│   └── terms/page.tsx              # Terms and conditions
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── PageTransition.tsx
│   └── ui/
│       ├── AnimatedCard.tsx        # Portfolio card with hover animations
│       ├── AnimatedSection.tsx     # FadeUp, StaggerGrid, ScrollReveal
│       ├── AdminClient.tsx         # Admin panel client component
│       ├── Avatar.tsx              # Avatar display + upload
│       ├── DashboardClient.tsx     # Student dashboard interactions
│       ├── EditClient.tsx          # Portfolio edit form
│       ├── Lightbox.tsx            # Zoom + pan media viewer
│       ├── LikesAndComments.tsx    # Like button + comment thread
│       ├── ReportButton.tsx        # Report submission form
│       ├── SearchAndFilter.tsx     # Search, tag, year filters
│       └── SettingsClient.tsx      # Profile settings form
└── lib/
    ├── supabase.ts                 # Browser client
    └── supabase-server.ts          # Server client (SSR)
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Extended user data (name, username, bio, avatar, year) |
| `portfolios` | Portfolio records with visibility + status fields |
| `portfolio_items` | Individual media items within a portfolio |
| `portfolio_tags` | Many-to-many join between portfolios and tags |
| `tags` | Tag definitions (Character Design, Illustration, etc.) |
| `likes` | One like per user per portfolio |
| `comments` | Comments on portfolios |
| `reports` | User-submitted reports (inappropriate content / copyright) |
| `takedowns` | Admin takedown records with appeal tracking |
| `warnings` | Timed admin warnings with counter statement support |
| `admin_roles` | Admin user registry |

### Portfolio Status Flow

```
active → (warning issued) → still active, yellow review card for admin
active → taken_down → pending_appeal → active (approved)
                                     → denied_appeal → [deleted after 1 year]
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project

### Installation

```bash
# Clone the repo
git clone https://github.com/WrightJayN/utech-animation-portfolio.git
cd utech-animation-portfolio

# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Making Someone an Admin

In Supabase SQL Editor:

```sql
-- Get the user's ID first
select id, email from auth.users;

-- Then insert into admin_roles
insert into admin_roles (user_id) values ('paste-user-id-here');
```

---

## Terms and Conditions

The platform includes a full terms and conditions page at `/terms` covering:
- Content standards and eligibility
- Portfolio visibility options
- Reporting process and report statuses
- Warning system and durations
- Takedown process and student rights
- One-appeal policy and finality of denied appeals
- Data deletion schedule (1 year after appeal denial)
- Admin override provisions
- Intellectual property and licensing

---

## Features Roadmap

- Email notifications for warnings, takedowns and appeal outcomes
- Batch admin actions
- Portfolio analytics (view counts)
- Featured / staff picks section
- Export portfolio as PDF
- SSO with UTech student email

---

## Built By

Developed as a full-stack hackathon style build for the UTech Animation program.

**University of Technology, Jamaica — Animation Program**  
https://utech-animation.vercel.app