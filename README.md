# 🏫 Class App

A React Native (Expo) + Supabase routine/class management app for school sections.

---

## ✅ Feature Summary

| Feature | Who |
|---|---|
| Pick batch + section | Students (no login) |
| View class timeline with teacher info | Students |
| View exam schedule (Class Test / Mid / Final) | Students |
| View bus schedule | Students (all sections) |
| View notices + emergency alerts | Students (section-wise) |
| Change section anytime | Students |
| Login with email + password | Admin |
| Login with ID + password (set by admin) | Section Reps |
| Add/remove batches and sections | Admin only |
| Add/kick/reinstate section reps | Admin only |
| View password list for reps | Admin only |
| Manage bus schedule | Admin only |
| Add/edit/delete class timeline | Rep (their section only) |
| Add/edit/delete exam schedule | Rep (their section only) |
| Post/edit/delete/toggle notices | Rep (their section only) |

---

## 🚀 Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor** and paste the contents of `supabase_schema.sql`
3. Run it — this creates all tables, RLS policies, and sample batch data
4. Go to **Authentication → Users** → Add your admin email + password manually
5. Copy your **Project URL** and **anon key** from Settings → API

### 2. Configure Supabase in the App

Open `lib/supabase.ts` and replace:
```ts
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the App

```bash
npx expo start
```

Scan QR with Expo Go on your phone, or run on simulator.

---

## 📱 App Flow

```
App Launch
├── Has student session? → Student Tabs (Timeline / Exams / Bus / Notices / Settings)
├── Has rep session?     → Rep Tabs (Timeline / Exams / Notices / Profile)
├── Has admin session?   → Admin Tabs (Dashboard / Batches / Reps / Bus / Profile)
└── No session          → Section Picker (pick batch → pick section → Student Tabs)
                              └── "Admin / Rep Login" button → Login Screen
                                      ├── Admin tab → email + password → Admin Tabs
                                      └── Rep tab   → login ID + password → Rep Tabs
```

---

## 🗃️ Database Tables

| Table | Purpose |
|---|---|
| `batches` | e.g. "28th Batch", "29th Batch" |
| `sections` | e.g. "Sec-1" within a batch |
| `section_reps` | Rep login IDs + passwords (admin managed) |
| `timeline_items` | Class schedule per section, per day |
| `exam_schedule` | Exams with type, date, time, place per section |
| `bus_schedule` | Shared bus routes and stop times |
| `notices` | Notices/emergency alerts per section |
| `admins` | Admin email tracking |

---

## 🔐 Login Details

### Admin
- Login via: **email + password** (Supabase Auth)
- Create account in: Supabase Dashboard → Authentication → Users

### Section Rep
- Login via: **Login ID + password** (set by admin in app)
- Admin creates them in: Admin Tabs → Reps → + Rep
- Password is visible in the Reps screen (tap 👁️ icon)

### Students
- No login needed — just pick batch and section once
- Section choice saved on device, can be changed in Settings

---

## 📁 Project Structure

```
ClassApp/
├── App.tsx                        # Root navigator + session check
├── app.json                       # Expo config
├── package.json
├── tsconfig.json
├── supabase_schema.sql            # Run this in Supabase SQL editor
│
├── lib/
│   ├── supabase.ts                # Supabase client (put your keys here)
│   └── auth.ts                    # Login/session/format helpers
│
├── types/
│   └── index.ts                   # All TypeScript types
│
├── constants/
│   └── theme.ts                   # Colors, fonts, radius, shadows
│
└── app/
    ├── auth/
    │   └── LoginScreen.tsx        # Admin + Rep login
    ├── student/
    │   ├── SectionPickerScreen.tsx
    │   ├── StudentTabsScreen.tsx
    │   ├── TimelineTab.tsx
    │   ├── ExamTab.tsx
    │   ├── BusTab.tsx
    │   ├── NoticesTab.tsx
    │   └── SettingsTab.tsx
    ├── admin/
    │   ├── AdminTabsScreen.tsx
    │   ├── AdminDashboard.tsx
    │   ├── AdminBatchesScreen.tsx
    │   ├── AdminRepsScreen.tsx
    │   ├── AdminBusScreen.tsx
    │   └── AdminProfileScreen.tsx
    └── rep/
        ├── RepTabsScreen.tsx
        ├── RepTimelineScreen.tsx
        ├── RepExamScreen.tsx
        ├── RepNoticesScreen.tsx
        └── RepProfileScreen.tsx
```

---

## 🛠️ Customization Tips

- **Add more icon types**: Edit `ICON_MAP` in `constants/theme.ts`
- **Add more pill colors**: Edit `PILL_COLORS` in `RepTimelineScreen.tsx`
- **Realtime updates**: Already enabled for Notices tab — can extend to timeline
- **Push notifications**: Add `expo-notifications` and call it after posting a notice
- **Admin broadcasts**: Set `section_id = null` when posting a notice to reach all sections

---

## 📦 Key Packages

- `expo` ~54.0.0
- `@supabase/supabase-js` ^2.45.0
- `@react-navigation/native` + `native-stack` + `bottom-tabs`
- `@react-native-async-storage/async-storage`
- `react-native-url-polyfill`
# Routinely
Routinely is a centralized university class management app built with React Native (Expo), TypeScript, and Supabase. Tailored for students, section reps, and administrators, it delivers real-time updates for daily class timelines, exam schedules, bus routes, and urgent notices via secure, role-based access control.
