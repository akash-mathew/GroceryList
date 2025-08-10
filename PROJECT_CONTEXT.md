# GroceryList Mobile App - Project Context & Documentation

## ✅ Recent Updates
- Analytics (DashboardScreen): Removed the "Restart Tutorial" button from Breakdown; fixed a getTime() usage typo.
- History (HistoryScreen): Empty state centered within the list, color set to #1F2937, copy: "No Lists yet. Create your first grocery list!" to improve visibility. Added bottom padding so text isn’t occluded by the Add button.
- Onboarding (OnboardingModal): Replaced placeholder images with meaningful Ionicons per page (cart, calendar, notifications, stats). Backdrop remains dim and consistent.
- Tutorial: Single centralized overlay with consistent dim backdrop; ensured Next button stays visible (bottom clamping); Search overlay no longer blocks result table and search state is cleared on finish; added Analytics Insights step that auto-switches to the Insights section.
- Settings (SettingsScreen): Removed theme/font settings; kept the Settings tab. Notification-dependent toggles are disabled/greyed when permission isn’t granted and are forced OFF/persisted. Release builds hide tutorial actions and rename the section to Help; FAQ includes answers.
- Reminders (RemindersScreen): Safe-area aware Add button spacing; empty state color #1F2937; when Product Reminders is OFF the list/Add are hidden and an "Enable in Settings" CTA is shown. Add Reminder suggestions now match Add Item suggestions with dedupe; tap-to-select is reliable with delayed blur. Quantity-based interval scaling retained.
- Analytics layout: Floating in-screen sections kept — Breakdown has time filters; Insights shows two visuals only (last 6 months) with no filters.

### Files touched (recent)
- `src/screens/DashboardScreen.tsx`: Removed Restart Tutorial control; minor date utility fix; floating sections retained.
- `src/screens/HistoryScreen.tsx`: Centered and padded empty state; ensured color #1F2937 and updated copy.
- `src/screens/OnboardingModal.tsx`: Icon-based illustrations per page; consistent dim overlay.
- `src/components/TutorialOverlay.tsx`: Dim backdrop and tooltip clamping for visibility (single overlay across app).
- `src/context/TutorialContext.tsx`: Centralized step flow; Search cleanup on finish; Analytics Insights auto-step.
- `src/screens/RemindersScreen.tsx`: Safe-area spacing; empty state color; suggestions parity and reliable selection; permission gating UI.
- `src/screens/SettingsScreen.tsx`: Removed theme/font options; permission gating for notification toggles; Help/FAQ polish in release.

## 🔄 What changed (Onboarding + Tutorial Redesign)
- Added an onboarding modal shown on the first app launch with 4 concise pages (Welcome, Lists, Reminders, Analytics).
- On the Reminders page, the app proactively requests notification permission.
- After onboarding finishes, the in-app interactive tutorial auto-starts (no more missed start).
- Tutorial flow was hardened to always navigate to the starting screen, populate sample data, and present the overlay immediately.
- Centralized tutorial overlay: only one overlay is ever shown, driven by a single global step flow.

### Files touched
- `App.tsx`: Integrated `OnboardingModal`, first-launch detection, startup permission request (even in dev), and a bridge that starts tutorial immediately after onboarding.
- `src/context/TutorialContext.tsx`: Centralized, navigation-aware tutorial driver that renders a single overlay and orchestrates navigation across screens; clears sample data on skip/finish; cleans up Search UI after tutorial; ends tutorial after Reminders (Settings step removed).
- `src/screens/TutorialEnabledHistoryScreen.tsx`, `TutorialEnabledMainScreen.tsx`, `TutorialEnabledRemindersScreen.tsx`, `TutorialEnabledSearchAnalyticsScreen.tsx`, `TutorialEnabledSettingsScreen.tsx`: Removed local overlays to prevent double overlays; kept refs for element targeting.
- `src/navigation/AppTabNavigator.tsx`: Analytics tab points to the Analytics screen wrapper.
- `src/screens/DashboardScreen.tsx`: Uses floating in-screen sections (Breakdown/Insights). Breakdown has time filters; Insights shows only two visuals without filters, defaulting to last 6 months.
- `src/screens/TutorialEnabledDashboardScreen.tsx`: Forwards tutorial refs (onAddRef) so the tutorial can target time filter, toggle, and charts within Analytics.
- `src/components/TutorialOverlay.tsx`: Backdrop now consistently dims (light black) across all steps; when highlight is "none" we allow touches to pass through.
- `src/screens/SearchScreen.tsx`: Exposes a clear() API and guards against unmounted updates; tutorial-driven search state is cleared on finish/skip.
- `src/utils/reminderNotifications.ts`: Reminder interval scales by purchased quantity vs baseline (e.g., 1kg=>7d, 2kg=>~14d).
- `src/screens/RemindersScreen.tsx`: Updated copy to explain quantity-based scaling; added header/help tips.

## 📘 Onboarding Flow
- Trigger: First app launch when `grocery_app_tutorial_completed` is not set.
- Pages:
  1) Welcome to GroceryList
  2) Create Lists by Date
  3) Smart Reminders (requests notification permission here)
  4) Insights & History
- Actions:
  - Skip ends onboarding immediately.
  - Next advances pages; final page finishes onboarding and bridges into the tutorial.

## 🎓 Tutorial Flow (Now Centralized)
- Single, centralized overlay drives the full tour across screens; no duplicate overlays.
- Sequence:
  1) Welcome and landing (History): explain lists, add button, and opening a list
  2) Grocery List screen: items, Add Item, Edit/Delete, Share, Calendar
  3) Search tab: item search, shop search
  4) Analytics tab: filters, toggles, charts
  5) Reminders tab: explain quantity-based reminders and highlight Add button
  6) Finish: clears tutorial data and returns to landing
- Navigation is executed automatically between steps; we wait briefly for the next screen to render before measuring targets.
- Skip/Finish: always clears tutorial data and returns to the landing screen.

## 🔔 Notifications + Settings
- App requests notification permission on startup (also logs in dev/Expo Go). Scheduling still requires dev client/standalone for delivery.
- Settings toggles prompt for permission when enabling without it, and only enable on grant.
- Daily unpurchased check is scheduled when permission exists and the toggle is ON; re-scheduled on time change.

## 📊 Analytics
- Analytics screen uses floating in-screen sections (not top tabs):
  - Breakdown: Grocery Item and Grocery Shop breakdowns with filters and unit toggle. Uses the selected time range (Last Week/Last Month/Custom).
  - Insights: Only two visuals — Purchase Analysis (pie) and Shopping Activity by Month (bar) — with a fixed default range of the last 6 months. No filters or test buttons are shown in this section.
- Shared time filters: Apply to the Breakdown section only.
- This keeps the screen clean and compact without a tall tab bar.

## 🪵 Tutorial Debugging
- Detailed logs around auto-start, navigation between steps, and measurement retries.
- Removed per-screen overlays to avoid two overlays showing at once.

---

## 📱 App Overview
A comprehensive React Native grocery list management app with advanced features including analytics, reminders, tutorial system, and historical tracking.

## 🎯 Core Functionalities

### 1. **Grocery List Management**
- **Add/Edit/Delete Items**: Full CRUD operations for grocery items
- **Date-based Lists**: Create and manage grocery lists for specific dates
- **Item Properties**: Name, quantity, unit (kg/liter/piece), shop
- **Purchase Tracking**: Mark items as purchased with timestamps
- **Auto-suggestions**: Smart suggestions from user history and common grocery items

### 2. **Search & Analytics**
- **Item Search**: Search through purchase history by item name
- **Shop Search**: Find all items purchased from specific shops
- **Purchase Analytics**: Visual charts showing buying patterns
- **Unpurchased Items Analysis**: Track items that weren't bought
- **Monthly Trends**: Bar charts showing purchase frequency over time
- **Shop Analytics**: See which shops you visit most

### 3. **Smart Reminders**
- **Product Reminders**: Set automated reminders for regular grocery items
- **Customizable Intervals**: Configure reminder frequency (days)
- **Quantity Tracking**: Set specific quantities and units for reminders
- **Auto-suggestions**: Smart suggestions from purchase history and common items
- **Edit/Delete**: Full management of existing reminders
- **Quantity-based Scaling**: Baseline intervals scale with the quantity you purchase (e.g., 1 kg => 7 days, 2 kg => ~14 days).

### 4. **Tutorial System**
- **Interactive Overlays**: Step-by-step guided tutorials
- **Auto-start Detection**: Automatically starts for new users
- **Element Targeting**: Highlights specific UI elements
- **Navigation Integration**: Guides users through different screens
- **Tutorial Data Isolation**: Separate tutorial data from real user data

### 5. **Historical Tracking**
- **Calendar Interface**: Browse grocery lists by date
- **Purchase History**: Complete history of all purchases
- **Shop History**: Track where items were purchased
- **Export Functionality**: Share grocery lists
- **Date Navigation**: Easy navigation between different dates

## 🏗️ Architecture & Navigation Structure

### Navigation Hierarchy
```
AppTabNavigator (Bottom Tabs)
├── Grocery List Tab
│   └── GroceryStack (Stack Navigator)
│       ├── History Screen (Calendar view)
│       └── GroceryListScreen (Daily list)
├── Search Tab
│   └── SearchAnalyticsScreen (Search UI)
├── Analytics Tab
│   └── DashboardScreen (Analytics with floating sections)
├── Reminders Tab
│   └── RemindersScreen (Smart reminders)
└── Settings Tab
    └── SettingsScreen (App configuration)
```

### Key Screens & Components

#### **Main Screens**
- **`MainScreen.tsx`**: Core grocery list interface with add/edit/delete functionality
- **`SearchScreen.tsx`**: Search interface for items and shops
- **`RemindersScreen.tsx`**: Reminder management interface
- **`DashboardScreen.tsx`**: Analytics with floating Breakdown/Insights sections
- **`HistoryScreen.tsx`**: Calendar-based navigation for grocery lists
- **`SettingsScreen.tsx`**: App settings and configuration

#### **Tutorial-Enabled Wrappers**
- **`TutorialEnabledMainScreen.tsx`**: Main screen with tutorial integration
- **`TutorialEnabledSearchAnalyticsScreen.tsx`**: Search with tutorials
- **`TutorialEnabledRemindersScreen.tsx`**: Reminders with tutorial steps
- **`TutorialEnabledDashboardScreen.tsx`**: Wraps the analytics screen and forwards refs for tutorial targeting
- **`TutorialEnabledSettingsScreen.tsx`**: Settings with tutorial integration

## 📊 Analytics Placement
- Bottom tab "Analytics" uses in-screen floating sections: Breakdown and Insights.
- Breakdown covers items and shops with filters; Insights shows only the two visuals (Purchase Analysis and Monthly Activity) using the last 6 months by default.

## 🛠 Notes on Temporary Files
- The files `src/screens/AnalyticsTabsScreen.tsx`, `src/screens/AnalyticsBreakdownScreen.tsx`, and `src/screens/AnalyticsInsightsScreen.tsx` were created during an exploration of top-tab analytics but are not used now. They can be safely removed later to keep the codebase lean.

## 🛠 Reminders Screen Fix
- Ensured no raw string rendering; header wrapped in `<Text>`; avoids RN warning when first opening the tab.
- Clarified that reminders scale with purchased quantity; tutorial emphasizes only the Add action on the Reminders screen.
