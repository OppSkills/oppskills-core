# Frontend Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [App Router Structure](#app-router-structure)
3. [Components Organization](#components-organization)
4. [API Integration](#api-integration)
5. [State Management](#state-management)
6. [Styling](#styling)
7. [Forms and Validation](#forms-and-validation)
8. [File Uploads](#file-uploads)

---

## Architecture Overview

The OppSkills frontend is a **Next.js 16** application built with the App Router pattern, TypeScript, and modern React patterns. It provides a platform for managing and participating in hackathons, festivals, and team-based competitions.

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Framework**: React 19
- **Styling**: Tailwind CSS 4
- **Component Library**: Radix UI
- **State Management**: TanStack Query (React Query)
- **Authentication**: Clerk
- **Form Handling**: React Hook Form (via custom components)
- **Rich Text Editing**: Tiptap
- **Animations**: Framer Motion
- **Icons**: Lucide React, Tabler Icons
- **HTTP Client**: Axios

### Key Dependencies

```json
{
  "@clerk/nextjs": "^6.32.0",
  "@tanstack/react-query": "^5.90.9",
  "@tiptap/react": "^3.13.0",
  "framer-motion": "^12.23.25",
  "next": "^16.0.7",
  "react": "^19.2.1",
  "recharts": "^3.5.1",
  "sonner": "^2.0.7"
}
```

### Project Structure

```
apps/ui-webapp/src/
├── app/                      # Next.js App Router pages
│   ├── competitions/         # Public competition pages
│   ├── dashboard/            # Dashboard for organizers
│   ├── organize/             # Event/opportunity creation
│   ├── team-register/        # Team registration flow
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── ui/                   # Radix UI primitives
│   ├── layout/               # Layout components
│   └── [feature]/            # Feature-specific components
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities and API clients
│   ├── api/                  # API client functions
│   └── uploads/              # File upload helpers
└── _actions/                 # Server actions
```

---

## App Router Structure

### Public Routes

#### `/` - Landing Page
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/page.tsx`
- **Purpose**: Main landing page with hero, features, and CTAs
- **Components**: Hero sections, event listings, testimonials

#### `/competitions/[slug]` - Competition Details
- **Files**:
  - `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/competitions/[slug]/page.tsx`
  - Components in `_components/` folder
- **Purpose**: Public view of competition/hackathon details
- **Features**:
  - About section
  - Rounds timeline
  - Prize information
  - Organizer details
  - Registration sidebar

#### `/festivals` - Festival Listing
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/festivals/page.tsx`
- **Purpose**: Browse all festivals

#### `/participants` - Participants View
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/participants/page.tsx`
- **Purpose**: Participant portal

#### `/team-register` - Team Registration
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/team-register/page.tsx`
- **Purpose**: Register team for hackathon
- **Features**: Team creation, member invites

### Organizer Routes (Dashboard)

#### `/dashboard` - Dashboard Home
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/page.tsx`
- **Purpose**: Overview of managed events
- **Features**:
  - Analytics cards (registrations, impressions, etc.)
  - Recent listings
  - Gender diversity chart
  - Domains chart
  - Round stats
  - Alerts

#### `/dashboard/hackathon` - Opportunities List
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/hackathon/page.tsx`
- **Purpose**: List all hackathons/opportunities managed by user

#### `/dashboard/hackathon/[slug]` - Opportunity Dashboard
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/hackathon/[slug]/page.tsx`
- **Purpose**: Individual opportunity management hub

#### `/dashboard/hackathon/[slug]/edit-opportunity` - Edit Hackathon
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/hackathon/[slug]/edit-opportunity/page.tsx`
- **Purpose**: Comprehensive hackathon editor with tabs
- **Features**:
  - **Preview Tab**: Live preview of competition page
  - **Basic Details Tab**: Name, description, thumbnail, dates, location
  - **Registration Settings Tab**: Eligibility, deadlines, team size, max teams
  - **Rounds & Stages Tab**: Define multiple rounds with dates/times
  - **Prizes Tab**: Prize breakdown, certificates, prize description
  - **Additional Info Tab**: Contact information, attachments
- **Key Features**:
  - Auto-save functionality (debounced, 900ms)
  - Real-time save status indicator
  - Query params for tab navigation (`?tab=basic-details`)
  - Form validation and error handling

#### `/dashboard/hackathon/[slug]/manage-roles` - Manage Roles
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/hackathon/[slug]/manage-roles/page.tsx`
- **Purpose**: Assign managers and evaluators to hackathon
- **Features**:
  - Owner display (non-editable)
  - Manager tab (add/remove managers)
  - Evaluator tab (add/remove evaluators)
  - Email-based role assignment
  - User search integration
  - Role cards with avatar, name, email

#### `/dashboard/hackathon/[slug]/manage-registration` - Manage Registrations
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/hackathon/[slug]/manage-registration/page.tsx`
- **Purpose**: View and manage team registrations
- **Features**:
  - Participant list with filters
  - Stage/round management
  - Team approval workflow

#### `/dashboard/hackathon/[slug]/manage-registration/[teamID]` - Team Details
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/hackathon/[slug]/manage-registration/[teamID]/page.tsx`
- **Purpose**: View individual team details
- **Features**:
  - Team member information
  - Offline round submissions
  - Synopsis submission
  - Presentation submission

#### `/dashboard/hackathon/[slug]/payments` - Payments
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/hackathon/[slug]/payments/page.tsx`
- **Purpose**: Manage payments and tickets for events

#### `/dashboard/hackathon/[slug]/send-notifications` - Send Notifications
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/hackathon/[slug]/send-notifications/page.tsx`
- **Purpose**: Send notifications to participants

#### `/dashboard/events` - Events (Festivals)
- **Purpose**: Manage festival events
- **Similar structure** to opportunities with edit, roles, registration, notifications

#### `/dashboard/talent-pipeline` - Talent Pipeline
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/talent-pipeline/page.tsx`
- **Purpose**: Manage talent pipeline

#### `/dashboard/session` - Session Management
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/dashboard/session/page.tsx`
- **Purpose**: Session-related features

### Organize Routes

#### `/organize` - Organize Home
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/organize/page.tsx`
- **Purpose**: Landing page for organizers

#### `/organize/hackathon` - Create Opportunity
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/organize/hackathon/page.tsx`
- **Purpose**: Create new hackathon/opportunity

#### `/organize/event` - Create Event
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/organize/event/page.tsx`
- **Purpose**: Create new festival/event

### Auth Routes

#### `/sso-callback` - SSO Callback
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/sso-callback/page.tsx`
- **Purpose**: Handle Clerk SSO callbacks

#### `/complete-profile` - Complete Profile
- **File**: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-webapp/src/app/complete-profile/page.tsx`
- **Purpose**: Post-signup profile completion

---

## Components Organization

### UI Components (`/components/ui/`)

#### Radix UI Primitives
Pre-built, accessible components based on Radix UI:
- `avatar.tsx` - User avatars
- `badge.tsx` - Status badges
- `button.tsx` - Buttons with variants
- `calendar.tsx` - Date picker
- `card.tsx` - Card container
- `checkbox.tsx` - Checkboxes
- `command.tsx` - Command palette
- `dialog.tsx` - Modal dialogs
- `dropdown-menu.tsx` - Dropdown menus
- `input.tsx` - Input fields
- `label.tsx` - Form labels
- `popover.tsx` - Popovers
- `select.tsx` - Select dropdowns
- `separator.tsx` - Dividers
- `sheet.tsx` - Slide-out panels
- `sidebar.tsx` - Sidebar component (25KB+)
- `switch.tsx` - Toggle switches
- `table.tsx` - Data tables
- `textarea.tsx` - Text areas
- `tooltip.tsx` - Tooltips
- `sonner.tsx` - Toast notifications

#### Derived Components (`/components/ui/derived/`)
Custom components built on top of primitives:
- `FloatingInput.tsx` - Floating label inputs
- `MotionWrapper.tsx` - Framer Motion wrappers
- `EventCard.tsx` - Event display cards
- `DescriptionEditorModal.tsx` - Rich text editor modal

#### Editor Components (`/components/ui/editor/`)
Rich text editing with Tiptap:
- `RichtextEditor.tsx` - Main editor component
- `Toolbar.tsx` - Editor toolbar with formatting controls

**Features**:
- Bold, italic, underline, strikethrough
- Headings (H1-H6)
- Lists (ordered/unordered)
- Links with custom styling
- Text alignment (left/center/right)
- Subscript/superscript
- Placeholder support
- Custom prose styling

#### Hackathon Components (`/components/ui/hackathon/`)
- `Input.tsx` - Hackathon-specific inputs
- `RegistrationQuestionsModal.tsx` - Dynamic form builder for registration questions
  - Drag-and-drop reordering (Framer Motion Reorder)
  - Fixed questions (Name, Email, Phone, Gender, College)
  - Custom question types: Text, Number, Phone, Email, Attachments, Options
  - Required/optional toggle
  - Options field management (add/remove options)

#### Payment Components (`/components/ui/payment-side/`)
- `PaymentFormModal.tsx` - Payment form
- `create-ticket-modal.tsx` - Ticket creation

### Layout Components (`/components/layout/`)

- `app-sidebar.tsx` - Main application sidebar
- `opportunity-sidebar.tsx` - Opportunity-specific sidebar
- `events-sidebar.tsx` - Events-specific sidebar
- `site-header.tsx` - Site header/navbar
- `nav-main.tsx` - Main navigation
- `mobile-sidebar-switcher.tsx` - Mobile sidebar toggle
- `mobile-navigation-context.tsx` - Mobile nav context

### Feature Components

#### Team Components
- `CreateTeamForm.tsx` - Team creation form
- `JoinTeamList.tsx` - List of teams to join

#### Auth Components (`/components/auth/`)
- Clerk-based authentication flows

#### Landing Page Components (`/components/landingpage/`)
- Hero sections
- Feature highlights
- Testimonials

### Root Components
- `navbar.tsx` - Navigation bar
- `footer.tsx` - Site footer
- `layout-provider.tsx` - Layout context provider
- `theme-provider.tsx` - Dark/light theme support
- `mode-toggle.tsx` - Theme switcher

---

## API Integration

### API Client Architecture

The frontend uses a centralized API client pattern with Axios and TanStack Query.

#### API Client (`/lib/api/apiClient.ts`)

**Environment Configuration**:
```typescript
// Defaults to http://localhost:3001 in development
const API_URL = process.env.NEXT_PUBLIC_API_URL
```

**Key Functions**:
- `getApiRootUrl()` - Normalizes API base URL
- `createApiClient(resourcePath)` - Creates Axios instance for resource
- `buildAuthHeaders(token)` - Builds Bearer token headers

**Example**:
```typescript
const API = createApiClient("/hackathons");
const headers = buildAuthHeaders(token);
const response = await API.get("/", { headers });
```

#### Resource APIs

##### Hackathon API (`/lib/api/hackathonApi.ts`)

**Endpoints**:
- `getHackathons(token)` - Get all hackathons
- `getMyHackathons(token)` - Get user's hackathons (owned + manager role)
- `getHackathonById(token, id)` - Get by ID
- `getHackathonBySlug(token, slug)` - Get by slug
- `createHackathon(token, data)` - Create new hackathon
- `updateHackathon(token, id, data)` - Update hackathon
- `updateHackathonRounds(token, id, data)` - Update rounds
- `updateHackathonAdditionalInfo(token, id, data)` - Update contact/attachments
- `updateHackathonRegistrationForm(token, id, data)` - Update registration form
- `updateHackathonPrizeBreakdown(token, id, data)` - Update prizes
- `updateHackathonMaxTeams(token, id, data)` - Update team limit
- `deleteHackathon(token, id)` - Delete hackathon
- `registerForHackathon(token, id)` - Register user

**Role Management**:
- `getHackathonRoles(token, id)` - Get all roles
- `addHackathonRole(token, id, data)` - Add manager/evaluator
- `removeHackathonRole(token, id, data)` - Remove role

##### Festival API (`/lib/api/festivalApi.ts`)
Similar structure for festival management.

##### Team API (`/lib/api/teamApi.ts`)
Team creation, joining, and management.

##### Media API (`/lib/api/mediaApi.ts`)

**Presigned Uploads**:
```typescript
presignImageUpload(token, {
  purpose: "HACKATHON_BANNER",
  mimeType: "image/png"
})

presignDocumentUpload(token, {
  purpose: "OPPORTUNITY_ATTACHMENT",
  mimeType: "application/pdf",
  fileName: "attachment.pdf"
})
```

**Upload Purposes**:
- `HACKATHON_BANNER` - Hackathon banner images
- `EVENT_ATTACHMENT` - Event attachments
- `OPPORTUNITY_ATTACHMENT` - Opportunity attachments

##### Users API (`/lib/api/usersApi.ts`)
User search and management.

### Custom Hooks

The frontend uses custom hooks to encapsulate TanStack Query logic and provide clean APIs.

#### `useHackathons` (`/hooks/useHackathons.ts`)

```typescript
const { data, isLoading, error, create, update, remove, register } = useHackathons();

// Create
await create.mutateAsync({ name: "My Hackathon", ... });

// Update
await update.mutateAsync({ id: "123", data: { name: "Updated" } });

// Delete
await remove.mutateAsync("123");

// Register
await register.mutateAsync("123");
```

**Features**:
- Automatic query invalidation on mutations
- Auth token management
- Error handling
- Loading states

#### `useHackathonBySlug` (`/hooks/useHackathonBySlug.ts`)

```typescript
const { data, isLoading, error } = useHackathonBySlug(slug);
```

**Features**:
- Only runs when slug is provided
- Cached queries with `queryKey: ["hackathon", slug]`

#### `useHackathonById` (`/hooks/useHackathonById.ts`)

Similar to `useHackathonBySlug` but uses ID.

#### `useHackathonRoles` (`/hooks/useHackathonRoles.ts`)

```typescript
const rolesQuery = useHackathonRoles(hackathonId);
const addMutation = useAddHackathonRoleMutation(hackathonId);
const removeMutation = useRemoveHackathonRoleMutation(hackathonId);

// Add role
await addMutation.mutateAsync({
  email: "user@example.com",
  role: "MANAGER"
});

// Remove role
await removeMutation.mutateAsync({
  email: "user@example.com",
  role: "EVALUATOR"
});
```

**Features**:
- Separate queries for fetch vs mutations
- Automatic cache invalidation
- Role types: `MANAGER`, `EVALUATOR`

#### `useUserSearch` (`/hooks/useUserSearch.ts`)

```typescript
const { data, isLoading } = useUserSearch(email);
```

Search users by email for role assignment.

#### `useTeams` (`/hooks/useTeams.ts`)

Team management hooks.

#### `use-mobile` (`/hooks/use-mobile.ts`)

```typescript
const isMobile = useMobile();
```

Detects mobile viewport for responsive UI.

---

## State Management

### TanStack Query (React Query)

The frontend uses **TanStack Query** as its primary state management solution for server state.

#### Setup (`/src/client-providers.tsx`)

```typescript
const queryClient = new QueryClient();

export default function ClientProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

#### Query Keys Convention

```typescript
// Single resource by ID
["hackathon", id]

// Single resource by slug
["hackathon", "by-slug", slug]

// Collection
["hackathons"]

// Nested resource
["hackathon-roles", hackathonId]

// User-specific
["my-hackathons"]
```

#### Cache Invalidation

Mutations automatically invalidate related queries:

```typescript
const update = useMutation({
  mutationFn: async (payload) => {
    const token = requireToken(await getToken());
    return updateHackathon(token, payload.id, payload.data);
  },
  onSuccess: () => {
    // Invalidate all hackathon queries
    queryClient.invalidateQueries({ queryKey: ["hackathons"] });
  },
});
```

### URL State (nuqs)

The frontend uses **nuqs** for URL state management:

```typescript
import { useQueryState } from "nuqs";

const [activeTab, setActiveTab] = useQueryState("tab", {
  defaultValue: "basic-details",
});
```

**Use Cases**:
- Tab navigation (`?tab=basic-details`)
- Filters
- Pagination
- Search params

### Local Component State

Standard React `useState` and `useReducer` for UI-only state:
- Form inputs
- Modal open/close
- Accordion expand/collapse
- Loading indicators

### Context API

#### Layout Context (`layout-provider.tsx`)
Manages layout state (sidebar, mobile nav).

#### Mobile Navigation Context (`mobile-navigation-context.tsx`)
Mobile-specific navigation state.

#### Theme Context (`theme-provider.tsx`)
Dark/light theme management via `next-themes`.

### Authentication State (Clerk)

Clerk provides auth state via React hooks:

```typescript
import { useAuth, useUser } from "@clerk/nextjs";

const { getToken, userId } = useAuth();
const { user } = useUser();

// Get JWT token for API calls
const token = await getToken();
```

---

## Styling

### Tailwind CSS 4

The frontend uses **Tailwind CSS 4** with custom theming.

#### Configuration

**Global Styles** (`/src/app/globals.css`):
```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  /* ... */
}
```

**Custom Colors**:
```css
:root {
  --primary: #9500d5;           /* Purple */
  --primary-foreground: #ffffff;
  --secondary: #eaccf7;          /* Light purple */
  --surface: #ededed;            /* Light gray */
  --muted: #f5e6fb;
  --accent: #ffef99;             /* Yellow */
  --destructive: #ffd0d0;        /* Light red */
  --border: #c3bfc4;
}
```

**Custom Color Palette**:
- Primary shades: 100-900
- Neutral shades: 100-900
- UI colors: success, error, warning, info
- Accent colors: yellow, green, blue, pink (100, 300, 500)

#### Typography

**Fonts**:
- **Inter** - Body text (via Google Fonts)
- **Poppins** - Headings (via Google Fonts)
- **Kaushan Script** - Decorative (via Google Fonts)
- **Dancing Script** - Decorative (via Google Fonts)

**Font Variables**:
```tsx
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

**Usage**:
```css
body {
  font-family: var(--font-inter);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-poppins);
  font-weight: 600;
}
```

#### Utility Classes

**Custom Utilities**:
```css
.line-clamp-1 { /* Single line truncation */ }
.line-clamp-2 { /* Two line truncation */ }
.line-clamp-4 { /* Four line truncation */ }
```

**Animation Classes** (via `tw-animate-css`):
- Fade in/out
- Slide in/out
- Bounce
- Pulse
- Spin

#### Component Styling Pattern

**Using `cn()` utility**:
```typescript
import { cn } from "@/lib/utils";

<button
  className={cn(
    "px-4 py-2 rounded-lg",
    isActive && "bg-primary text-white",
    !isActive && "bg-muted text-muted-foreground"
  )}
>
  Click me
</button>
```

**`cn()` function** (`/lib/utils.ts`):
```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Combines `clsx` for conditional classes and `twMerge` for conflict resolution.

### Radix UI Theming

Radix components use CSS variables for theming:

```css
:root {
  --radius: 0.625rem;  /* 10px */
}

/* Sidebar colors */
--sidebar: #ffffff;
--sidebar-foreground: #0f0015;
--sidebar-primary: #9500d5;
```

### Dark Mode

Powered by `next-themes`:

```tsx
import { ThemeProvider } from "@/components/theme-provider";

<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

**Usage**:
```css
.dark {
  --background: #000000;
  --foreground: #ffffff;
  /* ... */
}
```

### Rich Text Editor Styling

**Tiptap ProseMirror styles** (in `globals.css`):
```css
.ProseMirror {
  outline: none;
}

.ProseMirror h1 {
  font-size: 1.4rem;
  margin-top: 3.5rem;
}

.ProseMirror ul li {
  list-style-type: disc;
}

.ProseMirror pre {
  background: #0d0d0d;
  color: #fff;
  border-radius: 0.5rem;
}
```

### Responsive Design

**Breakpoints** (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Example**:
```tsx
<div className="w-full p-2 sm:p-4 md:p-6 lg:p-10">
  <h1 className="text-xl md:text-2xl lg:text-3xl">
    Responsive Heading
  </h1>
</div>
```

### Animations

**Framer Motion**:
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

**CSS Animations**:
```css
.animate-scroll {
  animation: scroll 30s linear infinite;
}

@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-50% - 0.75rem)); }
}
```

---

## Forms and Validation

### Form Patterns

The frontend uses **controlled components** with React state for form management.

#### Basic Form Pattern

```typescript
const [formData, setFormData] = useState<FormData>({
  eventName: "",
  eventDate: undefined,
  // ...
});

<Input
  value={formData.eventName}
  onChange={(e) => setFormData(prev => ({
    ...prev,
    eventName: e.target.value
  }))}
/>
```

#### Auto-save Pattern (Edit Opportunity)

**Debounced Auto-save** (900ms delay):

```typescript
const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");

useEffect(() => {
  if (!hasHydratedFromBackend) return;

  const snapshot = serializeFormData(formData);
  if (snapshot === lastSavedSnapshotRef.current) {
    setAutoSaveStatus("saved");
    return;
  }

  setAutoSaveStatus("dirty");

  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
  }

  debounceTimerRef.current = setTimeout(() => {
    runSaveMutation();
  }, 900);
}, [formData]);
```

**Save Queue** (handles concurrent edits):
```typescript
const runSaveMutation = () => {
  if (saveMutation.isPending) {
    saveQueuedRef.current = true;  // Queue save
    return;
  }

  saveMutation.mutate(undefined, {
    onSuccess: () => {
      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        setTimeout(() => runSaveMutation(), 0);  // Flush queue
      }
    }
  });
};
```

**Status Indicator**:
```tsx
<div className="text-xs font-medium">
  {autoSaveStatus === "saving" && <span className="text-primary">Saving…</span>}
  {autoSaveStatus === "dirty" && <span className="text-amber-600">Unsaved changes</span>}
  {autoSaveStatus === "error" && <span className="text-destructive-foreground">Autosave error</span>}
  {autoSaveStatus === "saved" && <span className="text-emerald-600">Saved</span>}
</div>
```

### Form Components

#### FloatingLabelInput

```tsx
import { FloatingLabelInput } from "@/components/ui/derived/FloatingInput";

<FloatingLabelInput
  id="eventName"
  label="Event Name"
  value={formData.eventName}
  onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
/>
```

Features animated floating labels on focus.

#### Select Dropdown

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Date Picker

```tsx
import { Calendar } from "@/components/ui/calendar";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      {date ? format(date, "PPP") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
    />
  </PopoverContent>
</Popover>
```

#### Rich Text Editor

```tsx
import RichTextEditor from "@/components/ui/editor/RichtextEditor";

<RichTextEditor
  value={formData.eventDescription}
  onChange={(html) => setFormData(prev => ({ ...prev, eventDescription: html }))}
  placeholder="Enter event description..."
/>
```

**Supported Formatting**:
- Headings (H1-H6)
- Bold, italic, underline, strikethrough
- Lists (ordered/unordered)
- Links
- Text alignment
- Subscript/superscript

### Validation

#### Client-side Validation

**Type Guards**:
```typescript
function isValidUrl(value: string): boolean {
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}
```

**Required Field Checks**:
```typescript
if (!formData.eventName.trim()) {
  toast.error("Event name is required");
  return;
}
```

**Date Validation**:
```typescript
if (formData.eventDate && formData.eventEndDate) {
  if (formData.eventEndDate < formData.eventDate) {
    toast.error("End date must be after start date");
    return;
  }
}
```

#### Server-side Validation

Backend validates using `class-validator` DTOs from `@oppskills/types`.

**Example DTO** (shared package):
```typescript
import { IsString, IsOptional, IsEnum } from "class-validator";

export class UpdateHackathonDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(HackathonModeValue)
  @IsOptional()
  mode?: HackathonModeValue;
}
```

### Dynamic Forms

#### Registration Questions Modal

**Drag-and-drop reorderable questions**:
```tsx
import { Reorder } from "framer-motion";

<Reorder.Group
  axis="y"
  values={customQuestions}
  onReorder={handleReorder}
>
  {customQuestions.map((question) => (
    <Reorder.Item key={question.id} value={question}>
      {/* Question editor */}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

**Question Types**:
- Text
- Number
- Phone No.
- Email
- Attachments
- Options (with sub-options)

**Features**:
- Add/remove questions
- Reorder via drag-and-drop
- Required toggle
- Options management (for "Options" type)

### Toast Notifications

Using **Sonner** for user feedback:

```typescript
import { toast } from "sonner";

// Success
toast.success("Hackathon created successfully!");

// Error
toast.error("Failed to save changes");

// Info
toast.info("This user is already a manager");

// Loading
const toastId = toast.loading("Uploading...");
toast.dismiss(toastId);
```

---

## File Uploads

### Upload Flow

The frontend uses **presigned S3 uploads** for secure, direct-to-S3 file uploads without exposing AWS credentials.

#### Image Upload

**1. Request Presigned URL**:
```typescript
import { presignImageUpload } from "@/lib/api/mediaApi";
import { useAuth } from "@clerk/nextjs";

const { getToken } = useAuth();
const token = await getToken();

const presignData = await presignImageUpload(token, {
  purpose: "HACKATHON_BANNER",
  mimeType: file.type,
});
```

**Response**:
```typescript
{
  uploadUrl: "https://s3.amazonaws.com/bucket-name",
  fields: {
    key: "uploads/hackathon-banners/uuid-filename.png",
    Policy: "...",
    Signature: "...",
    // ...
  },
  key: "uploads/hackathon-banners/uuid-filename.png",
  publicUrl: "https://cdn.example.com/uploads/hackathon-banners/uuid-filename.png",
  maxBytes: 5242880  // 5MB
}
```

**2. Upload to S3**:
```typescript
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

await uploadImageToS3PresignedPost({
  presign: presignData,
  file: file,
});
```

**3. Use Public URL**:
```typescript
setFormData(prev => ({
  ...prev,
  eventThumbnail: presignData.publicUrl
}));
```

#### Document Upload

**Similar flow** for documents (PDFs, DOCs, etc.):

```typescript
import { presignDocumentUpload } from "@/lib/api/mediaApi";

const presignData = await presignDocumentUpload(token, {
  purpose: "OPPORTUNITY_ATTACHMENT",
  mimeType: file.type,
  fileName: file.name,
});

await uploadDocumentToS3PresignedPost({
  presign: presignData,
  file: file,
});
```

### Upload Implementation

#### `uploadImageToS3.ts`

```typescript
export async function uploadImageToS3PresignedPost(input: {
  presign: PresignImageUploadResponse;
  file: File;
}): Promise<void> {
  const form = new FormData();

  // Add presigned fields BEFORE the file
  for (const [k, v] of Object.entries(input.presign.fields)) {
    form.append(k, v);
  }

  // Add file (field must be named "file")
  form.append("file", input.file);

  const res = await fetch(input.presign.uploadUrl, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`S3 upload failed (${res.status})`);
  }
}
```

#### `uploadDocumentToS3.ts`

Similar implementation for documents.

### File Input Component

**Example usage**:
```tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file size
  if (file.size > 5 * 1024 * 1024) {
    toast.error("File size must be less than 5MB");
    return;
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    toast.error("Only image files are allowed");
    return;
  }

  try {
    toast.loading("Uploading...", { id: "upload" });

    const token = await getToken();
    const presignData = await presignImageUpload(token, {
      purpose: "HACKATHON_BANNER",
      mimeType: file.type,
    });

    await uploadImageToS3PresignedPost({
      presign: presignData,
      file,
    });

    setFormData(prev => ({
      ...prev,
      eventThumbnail: presignData.publicUrl
    }));

    toast.success("Upload complete!", { id: "upload" });
  } catch (err) {
    toast.error("Upload failed", { id: "upload" });
    console.error(err);
  }
};

<input
  type="file"
  accept="image/*"
  onChange={handleFileChange}
  className="hidden"
  id="banner-upload"
/>
<label htmlFor="banner-upload" className="cursor-pointer">
  <Button asChild>
    <span>Upload Image</span>
  </Button>
</label>
```

### Upload Purposes

Defined in `mediaApi.ts`:

**Images**:
- `HACKATHON_BANNER` - Hackathon banner images (5MB limit)

**Documents**:
- `EVENT_ATTACHMENT` - Event attachments
- `OPPORTUNITY_ATTACHMENT` - Opportunity attachments

### File Size Limits

Configured on backend, returned in `presignData.maxBytes`:
- Images: 5MB
- Documents: 10MB (typical)

### Accepted File Types

**Images**:
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- WebP (`image/webp`)
- GIF (`image/gif`)

**Documents**:
- PDF (`application/pdf`)
- Word (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- Excel (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

### Error Handling

```typescript
try {
  await uploadImageToS3PresignedPost({ presign, file });
} catch (err) {
  if (err instanceof Error) {
    if (err.message.includes("403")) {
      toast.error("Upload permission denied");
    } else if (err.message.includes("413")) {
      toast.error("File too large");
    } else {
      toast.error("Upload failed. Please try again.");
    }
  }
}
```

### Preview Before Upload

```tsx
const [preview, setPreview] = useState<string | null>(null);

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Create preview URL
  const url = URL.createObjectURL(file);
  setPreview(url);

  // Cleanup on unmount
  return () => URL.revokeObjectURL(url);
};

{preview && (
  <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
)}
```

---

## Best Practices

### Performance

1. **Code Splitting**: Use dynamic imports for large components
   ```tsx
   const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
     loading: () => <Skeleton />,
   });
   ```

2. **Image Optimization**: Use Next.js `<Image>` component
   ```tsx
   import Image from "next/image";

   <Image
     src={imageUrl}
     alt="Description"
     width={800}
     height={600}
     priority={isAboveFold}
   />
   ```

3. **Query Caching**: Leverage TanStack Query's built-in caching
   ```typescript
   useQuery({
     queryKey: ["hackathons"],
     queryFn: getHackathons,
     staleTime: 5 * 60 * 1000,  // 5 minutes
   });
   ```

### Accessibility

1. **Semantic HTML**: Use proper HTML elements
2. **ARIA Labels**: Add labels for screen readers
3. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
4. **Focus Management**: Manage focus for modals/dialogs

### Error Handling

1. **User-Friendly Messages**: Show clear error messages
2. **Retry Mechanisms**: Provide retry buttons on errors
3. **Loading States**: Always show loading indicators
4. **Error Boundaries**: Use React error boundaries for unexpected errors

### Security

1. **Token Management**: Never store auth tokens in localStorage
2. **Input Sanitization**: Sanitize user inputs (handled by backend DTOs)
3. **HTTPS Only**: Enforce HTTPS in production
4. **CSP Headers**: Configure Content Security Policy

---

## Development Workflow

### Running Locally

```bash
# Install dependencies
pnpm install

# Start dev server (with Turbopack)
pnpm dev

# Start frontend only
pnpm dev:ui-webapp
```

Frontend runs on **http://localhost:3000**

### Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Optional (for analytics):
```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_... # Get from PostHog project settings
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com # Optional, defaults to US instance
```

### Building

```bash
# Build all packages
pnpm build

# Build frontend only
pnpm build:ui-webapp
```

### Linting & Formatting

```bash
# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm check-types
```

---

## Troubleshooting

### Common Issues

**Issue**: "NEXT_PUBLIC_API_URL is not set"
- **Solution**: Add `NEXT_PUBLIC_API_URL` to `.env.local`

**Issue**: "Not authenticated" errors
- **Solution**: Check Clerk configuration and ensure user is signed in

**Issue**: Upload fails with 403
- **Solution**: Verify backend is returning correct presigned URL

**Issue**: Auto-save not working
- **Solution**: Check browser console for errors, verify backend is running

**Issue**: Styles not applying
- **Solution**: Restart dev server (Tailwind CSS 4 requires rebuild)

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Tiptap Documentation](https://tiptap.dev/)
