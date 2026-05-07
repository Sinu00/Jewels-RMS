# Jewelry Rental Management System — Full Project Context

## What Is This App?

This is a web application built for a jewelry rental business in India. The business rents out gold and silver ornaments to customers for events like weddings, festivals, and functions. Staff at the shop use this app every day to manage which ornaments are available, who has rented what, when items need to come back, and how much money has been collected.

The app must work smoothly on mobile phones because staff often use it while standing at the counter, not sitting at a desktop. It should feel fast, clean, and easy — not complicated. Think of it like a smart digital register that replaces paper notebooks and spreadsheets.

---

## Who Uses This App?
There are only two types of users — both are shop staff, not customers. Customers never log in to this app.

**Admin**
The shop owner or manager. Has full control — can add ornaments, manage staff accounts, see all financial records, change settings, and access everything in the app.

**Staff**
Regular counter staff. Can create rentals, process returns, add customers, and record payments. Cannot delete records, access settings, or manage other staff accounts.

Each user belongs to one specific outlet (branch). A staff member at Branch A cannot see or touch any data from Branch B.

---

## The Business Has Two Outlets (Branches)

The business currently runs two physical shop locations. Each branch works independently:
- Separate ornament inventory (an ornament at Branch A is not available at Branch B)
- Separate customer records
- Separate rental transactions
- Separate financial records
- Separate staff accounts

The app supports both branches from a single deployment. When a user logs in, they only ever see their own branch's data. There is no combined cross-branch view in this version.

---

## Core Features — Explained Simply

### 1. Inventory Management

The inventory is the list of all ornaments the shop owns and can rent out.

**What information is stored for each ornament:**
- Name (e.g. "Kundan Bridal Necklace Set")
- Category (e.g. Necklace, Ring, Bangles, Earrings, Maang Tikka, Haar, Armlet, etc.)
- A unique item code that is automatically created when the ornament is added — format is the first 3 letters of the category followed by a 4-digit number, e.g. `NEC0042` for necklace number 42, `RNG0003` for ring number 3
- Up to 5 photos of the ornament
- Weight in grams (optional)
- Base rental rate in rupees per day (this is the default price for renting this item)
- Valuation price — the estimated market value of the ornament (used to decide how much deposit to collect from the customer)
- Whether the ornament is currently available or out on rent

**How item codes work:**
Item codes are created automatically by the system. Staff never type them manually. When a new necklace is added, the system counts how many necklaces exist in that branch and assigns the next number. So if there are already 41 necklaces, the new one gets `NEC0042`. These codes never change once assigned. They make it easy to find a specific ornament quickly.

**Search and availability check:**
Staff can search ornaments by name, item code, or category. The search instantly shows whether each item is available or currently rented out. This is used at the counter when a customer asks "do you have a kundan necklace available for next week?"

---

### 2. Customer Management

Every customer who rents from the shop is saved in the system.

**What is stored for each customer:**
- Full name
- Phone number (this is used for WhatsApp bill sharing)
- Address (optional)
- ID proof details like Aadhar or PAN (optional, for record keeping)

Customers belong to the branch where they registered. Staff can search customers by name or phone number. Clicking a customer shows their full rental history — all past and current rentals.

---

### 3. Rental Management

This is the most important part of the app. When a customer comes in to rent ornaments, staff create a rental transaction.

**Creating a rental — step by step:**

1. Staff selects or creates the customer
2. Staff searches for and selects which ornaments to rent (only available ones can be selected)
3. For each ornament, the base rental rate is shown — staff can change this rate if needed for this specific rental (for example, giving a discount or charging a special rate)
4. Staff sets the start date and the due/return date
5. The system automatically calculates the total rental amount (rate × number of days × number of items)
6. Staff enters the safety deposit amount to collect from the customer (this is a refundable amount held during the rental)
7. Staff adds any notes if needed
8. The rental is confirmed — ornaments are marked as unavailable

**What happens to ornaments during a rental:**
Once a rental is created, all ornaments in that rental are marked as "rented" and will not appear as available in searches. They become available again only when the rental is returned.

**Rental statuses:**
- **Active** — currently rented, within the due date
- **Overdue** — currently rented, but past the due date (the customer has not returned yet)
- **Extended** — the due date was pushed forward at the customer's request
- **Returned** — all items have been returned, rental is complete

**Processing a return:**
When the customer brings the ornaments back, staff open the rental and process the return. The app shows the deposit amount clearly so staff know how much cash to give back to the customer. Staff confirm the return, the deposit refund is recorded, and all ornaments become available again.

**Extending a rental:**
If a customer needs more time, staff can extend the due date. The extension is recorded with the old due date, new due date, and a reason. The rental status changes to "Extended."

**Overdue tracking:**
The dashboard shows all overdue rentals with how many days they are overdue. The system automatically marks rentals as overdue when their due date passes.

---

### 4. Safety Deposit Tracking

When an ornament is rented, the customer pays a refundable security deposit. This is a separate amount from the rental fee. It is held by the shop during the rental period.

**How it works:**
- During rental creation, staff enters the deposit amount manually
- The deposit is recorded as a payment of type "Deposit"
- When the rental is returned, the app shows the deposit amount in a prominent, unmissable highlighted box — so staff immediately know how much to hand back
- Staff confirm the refund — this is recorded as a "Deposit Refund" payment
- The system tracks whether the deposit has been refunded or not

---

### 5. WhatsApp Bill and Reminder Sharing

The app generates WhatsApp messages and opens them directly in WhatsApp. No WhatsApp API or business account is needed — it uses a simple wa.me link.

**Rental bill sharing:**
After a rental is created, there is a "Share via WhatsApp" button. Tapping it opens WhatsApp with the customer's number pre-filled and a formatted bill message that includes the shop name, rental number, list of ornaments rented, rental fee, deposit collected, due date, and a thank-you note.

**Return reminder:**
Staff can send a reminder message to customers whose rentals are coming due or are overdue. The message says something like: "Dear [Name], your rental [RNT-20240501-001] of [item names] is due on [date]. Please return the items or contact us to extend."

Both message types are formatted clearly and ready to send — staff just tap the send button in WhatsApp.

---

### 6. Accounting / Payments Module

This is a basic record of money coming in and going out. There is no payment gateway — all payments are cash, UPI, or bank transfer, recorded manually by staff.

**Types of payments recorded:**
- Rental payment — money collected for the rental fee
- Deposit — security deposit collected from customer
- Deposit refund — money returned to customer when they return ornaments
- Other — any miscellaneous payment

**What is stored for each payment:**
- Which rental it belongs to (optional for "Other" type)
- Amount in rupees
- Payment type (Rental / Deposit / Deposit Refund / Other)
- Payment method (Cash / UPI / Bank Transfer)
- Date and time
- Optional note
- Which staff member recorded it

**Accounts page:**
Shows a list of all payments with filters for date range, type, and payment method. Also shows summary totals — today's income, this week's income, this month's income — for the branch.

There is no GST. No tax is calculated or shown anywhere in this app.

---

### 7. Dashboard

The first screen after login. Shows a quick overview of what is happening in the branch right now.

**Dashboard cards:**
- Total active rentals (how many rentals are currently out)
- Overdue rentals (how many are past due, shown in red with urgency)
- Items due today (rentals due for return today)
- Today's income (total payments received today)
- Total ornaments / available ornaments count

**Overdue list:**
A short list of the most overdue rentals showing customer name, items rented, and how many days overdue. Each row has a WhatsApp reminder button.

---

### 8. PWA — Works Like a Mobile App

PWA stands for Progressive Web App. It means the website can be installed on a phone like a regular app — it appears on the home screen, opens without browser bars, and works fast.

**What this means practically:**
- Staff can add the app to their phone's home screen
- It opens fullscreen like a native app
- Works on any phone, tablet, or computer without downloading from an app store
- The app shell loads quickly even on slow connections
- The theme colour (gold) is applied to the phone's status bar

---

## Pages / Screens in the App

### Login
- Email and password fields
- Shows which outlet the user belongs to after login
- Redirects to dashboard on success

### Dashboard
- Stats cards
- Overdue rentals list
- Quick action buttons: New Rental, Search Ornament

### Inventory
- Grid of ornament cards with photo, name, item code, availability status, and rental rate
- Search bar at the top
- Filter by category and availability
- "Add Ornament" button (Admin only for delete, Staff can add)
- Each card opens the ornament detail page

### Ornament Detail
- All ornament info
- Photo gallery (swipe through up to 5 images)
- Current rental info if it is rented out (who has it, since when, due when)
- Edit button (Admin only)

### Add / Edit Ornament
- Form: name, category, weight, base rental rate, valuation price, description
- Image upload — drag and drop or tap to pick — up to 5 images
- Item code shown (auto-generated, read-only)

### Rentals List
- Tabs: Active / Overdue / Extended / Returned
- Each rental shows: rental number, customer name, items count, due date, status badge
- Search by customer name or rental number
- "New Rental" floating button on mobile

### New Rental
- Step 1: Select or create customer
- Step 2: Search and add ornaments (only available ones shown)
- Step 3: Review items, adjust rates per item if needed, set dates
- Step 4: Set deposit amount, add notes, confirm
- Shows running total as items are added

### Rental Detail
- Full rental info
- List of all ornament items with their rates and amounts
- Status badge and due date
- Process Return button (when active/overdue)
- Extend Rental button
- Share Bill on WhatsApp button
- Send Reminder on WhatsApp button
- Payment history for this rental

### Return Processing
- Shows all items in the rental
- Shows deposit amount in a large highlighted box: "Refund ₹X to customer"
- Confirm return button
- Records deposit refund payment automatically

### Customers List
- Search by name or phone
- Each row shows name, phone, active rentals count
- "Add Customer" button

### Customer Detail
- Customer info
- Full rental history (all past and current rentals)

### Accounts
- Payments list with date, type, method, amount, linked rental
- Summary: Today / This Week / This Month totals
- Filter by payment type and method

### Settings (Admin only)
- Outlet info (name, address, phone)
- Staff management: add staff, deactivate staff

---

## Design Style

**Feel:** Luxury minimal. Clean, fast, premium. Looks like a high-end jewellery brand's internal tool — not a generic invoice app.

**Colors:**
- Gold accent: `#B8860B` for buttons, badges, highlights
- Background: warm off-white `#FAFAF8`
- Cards: `#FFFDF7` with a thin warm border
- Text: near-black `#1A1A16` and muted `#6B6860`
- Available: green dot
- Rented/Overdue: amber/red dot

**Fonts:** DM Sans for body text, DM Serif Display for rupee amounts and headings — gives a premium feel

**Mobile layout:**
- Bottom navigation bar with 4 icons: Inventory, Rentals, Customers, Accounts
- Floating gold button for "New Rental"
- All tap targets large enough for fingers
- No tiny text anywhere

**Desktop layout:**
- Left sidebar navigation
- Wider content area with grid layouts

---

## What the App Does NOT Do

- No customer-facing portal — customers never log in
- No online payments — everything is cash/UPI/bank, recorded manually
- No GST or tax calculations — prices are shown as-is
- No SMS — only WhatsApp via wa.me links
- No email — no email sending feature
- No barcode scanner — item codes are typed or searched
- No cross-branch transfers — each branch is completely independent
- No automated backups — handled at server level separately
- No subscription billing for the shop owner — this is a self-hosted tool

---

## Tech Stack Summary (for developers)

| Part | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 with App Router | Fast, modern React framework with routing built in |
| UI Components | shadcn/ui + Tailwind CSS | Clean, customisable components |
| State management | TanStack Query + Zustand | Server data and client state separately |
| Backend | Express.js | Simple, flexible Node.js API server |
| Database | PostgreSQL | Reliable, handles relations well |
| ORM | Prisma | Type-safe database queries, easy migrations |
| Auth | JWT tokens | Simple, stateless authentication |
| Image storage | Local VPS disk via multer | No extra cost, images served directly |
| Monorepo | pnpm workspaces | Frontend and backend share types and utilities |
| Deployment | VPS with Nginx + PM2 | Full control, low cost |
| PWA | next-pwa | Makes the website installable on phones |

---

## Key Business Rules (Never Break These)

1. An ornament can only be in one rental at a time — if it is rented, it cannot be added to another rental
2. All data is always filtered by outlet — staff at Branch A never see Branch B data
3. Item codes never change after creation
4. The deposit amount shown on return must always match exactly what was collected — no automatic recalculation
5. Rental rates can be overridden per rental — the override is stored, not the base rate
6. There is no GST — no tax is added to any amount anywhere
7. All rupee amounts use Indian formatting — ₹1,20,000 not ₹120,000
8. Phone numbers are always stored and used with country code 91 for WhatsApp links
9. Deleting ornaments or customers is a soft delete — records are hidden but not actually removed from the database so rental history stays intact
10. A rental can only be marked as returned by processing it through the return flow — not by directly editing the status