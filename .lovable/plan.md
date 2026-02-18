
## Academy LMS — Implementation Plan

### Design System
- **Colors:** Deep indigo `#4F46E5` (primary), warm orange `#F59E0B` (accent), white/light gray backgrounds
- **Typography:** Inter font, generous whitespace
- **Components:** 12px rounded corners, soft shadows, no gradients — Notion/Linear feel matching the reference screenshot
- **Layout:** Persistent left sidebar (240px) + top header + scrollable main content area

---

### Phase 1 — Foundation & Auth
- **Supabase setup:** Connect Supabase, create all database tables (`profiles`, `lessons`, `wiki_articles`, `prompts`, `questions`, `answers`) with RLS policies
- **Storage:** Create `avatars` bucket with public read access
- **Auth pages:** Sign In + Sign Up pages with email/password, clean centered card design
- **Profile setup page:** First-login onboarding flow to set display name and avatar
- **Route protection:** Redirect unauthenticated users to login; redirect non-admins away from `/admin`

---

### Phase 2 — Main App Shell & Dashboard
- **App shell:** Persistent left sidebar with logo, navigation links (Dashboard, Lessons, Wiki, Prompt Library, Q&A, Profile), user avatar at bottom
- **Dashboard page:** Welcome card with user's name + emoji, quick stats row (total lessons, wiki articles, unanswered questions), recent lessons grid (3–4 cards with thumbnail, title, category pill, date)

---

### Phase 3 — User-Facing Content Pages

**Lessons Page**
- Grid of lesson cards: thumbnail image, title, short description, category tag pill, date
- Search bar + category filter chips at the top
- Lesson detail page: embedded VK video iframe, full description, related lessons section

**Wiki Page**
- Left sub-sidebar with collapsible category tree
- Main content area renders markdown article body
- Search bar at top; articles show title, body, category, date

**Prompt Library Page**
- Grid of prompt cards: title, category tag, preview text
- Click to expand full prompt text + copy-to-clipboard button
- Search bar + category filter tabs

**Q&A Page**
- List of question threads: author avatar, name, title, body preview, answer count badge, timestamp
- "Ask a Question" button opens a modal (title + body fields)
- Question detail view: full question + answers list, post answer form, author can mark best answer

**Profile Page**
- Circular avatar with Supabase Storage upload
- Editable display name + bio textarea; read-only email
- Save button with success toast

---

### Phase 4 — Admin Panel (`/admin`)

**Admin Shell:** Separate sidebar with sections: Dashboard, Lessons, Wiki, Prompts, Questions, Users

**Admin Dashboard:** Stat cards — total users, lessons, wiki articles, prompts, open questions

**CRUD Pages (Lessons, Wiki, Prompts):**
- Data table with search + pagination
- Create/Edit via slide-over modal with appropriate form fields
- Delete with confirmation dialog

**Questions Moderation:** Table of all questions with view, delete, and hide actions

**Users Page:** Table of all users (name, email, role, joined date) with ability to change role (user ↔ admin) via dropdown

---

### Database & Security
- RLS policies: all authenticated users can **read** lessons, wiki, prompts, questions, answers; only admins can **insert/update/delete** content; users manage only their own profile and Q&A posts
- `user_roles` separate table (as required) with `has_role()` security definer function for safe role checks
- Triggers: auto-create profile row on signup
