# Web-to-Lead Forms

Capture leads straight from your website. You create a **Web Form** in Mini CRM, share its link (or embed it on your site), and every visitor who submits it becomes a **Lead** in the CRM automatically. It is assigned to a sales rep, and the rep gets a notification.

No more copying enquiries from email into the CRM by hand.

**Who can manage forms:** Admin and Manager (sidebar → **Web Forms**)
**Who can submit:** Anyone with the link. No login is needed.

---

## How it works (the flow)

```
 ┌──────────────────────┐        ┌──────────────────────────┐
 │ 1. Admin/Manager      │        │ 2. Share                 │
 │    creates a form     │ ─────► │    • Direct link /f/xxxx │
 │    (source, assignee) │        │    • <iframe> embed code │
 └──────────────────────┘        └────────────┬─────────────┘
                                              │
                                              ▼
                               ┌──────────────────────────────┐
                               │ 3. Visitor fills the form     │
                               │    name, email, phone,        │
                               │    company, message           │
                               └──────────────┬───────────────┘
                                              │  POST /f/{token}
                                              ▼
                       ┌─────────────────────────────────────────────┐
                       │ 4. Spam checks                               │
                       │    • max 10 submissions / minute per IP      │
                       │    • hidden honeypot field (bots get a fake  │
                       │      "thank you" and nothing is saved)       │
                       └──────────────────────┬──────────────────────┘
                                              ▼
                       ┌─────────────────────────────────────────────┐
                       │ 5. Does an open lead with this email exist?  │
                       └───────────┬───────────────────────┬─────────┘
                               YES │                       │ NO
                                   ▼                       ▼
            ┌────────────────────────────────┐  ┌───────────────────────────────┐
            │ Append message to that lead's   │  │ Create new lead               │
            │ notes + log "Web Form           │  │  status = new                 │
            │ Submission" activity            │  │  source = form's source       │
            │ (no duplicate is created)       │  │  assigned by the form's rule  │
            └────────────────────────────────┘  │ Log "Created" activity        │
                                                 │ Notify assignee (bell + email)│
                                                 └───────────────────────────────┘
                                              │
                                              ▼
                       ┌─────────────────────────────────────────────┐
                       │ 6. Visitor sees the thank-you message        │
                       │    (or is redirected to your own URL)        │
                       └─────────────────────────────────────────────┘
```

---

## Step-by-step

### 1. Create a form

1. Sidebar → **Web Forms** → **+ New Form**
2. Fill in:

| Field | What it does |
|---|---|
| **Internal name** | Only your team sees it, e.g. "Homepage contact form" |
| **Form heading / Description** | Shown to visitors at the top of the form |
| **Lead source** | Saved on every lead from this form (Website, Advertisement, Event…). Shows up in the **Leads by Source** report |
| **Assignment** | Who gets the new lead (see below) |
| **Thank-you message** | Shown after submitting |
| **Redirect URL** | Optional. Send visitors to your own thank-you page instead |
| **Active** | Untick to pause the form. Paused forms show "Not Found" |

### 2. Choose an assignment rule

| Mode | Behaviour |
|---|---|
| **Leave unassigned** | Leads land in the Leads list with no owner |
| **Always assign to one user** | Every lead goes to the selected user |
| **Round-robin across sales users** | Leads rotate between all *active* users with the `sales_user` role (A → B → C → A …). If there are no sales users, the selected fallback user is used |

The assigned user gets an in-app notification (bell icon) and an email, using the same mechanism as manual lead assignment.

### 3. Share it

Click **Share** on the form row:

- **Direct link**, e.g. `https://your-crm.com/f/k3j9x…`. Put it in emails, social posts, QR codes, or link buttons.
- **Embed code**: paste it into any website's HTML:
  ```html
  <iframe src="https://your-crm.com/f/k3j9x…" width="100%" height="640" style="border:0"></iframe>
  ```

### 4. Watch leads come in

- The **Submissions** column shows how many times the form was submitted, plus how many leads it created. Click the number to open the Leads list filtered to that form (`/leads?form={id}`).
- Each lead's **notes** contain the company and message the visitor typed, stamped with the form name and time.
- The lead's activity timeline shows **"Captured via web form …"**.

---

## Duplicate handling

If someone submits again with an email that already belongs to an **open** lead (any status except `converted` or `lost`), Mini CRM does **not** create a second lead. It:

1. appends the new message to the existing lead's notes, and
2. logs a **Web Form Submission** activity on that lead.

If the earlier lead was `converted` or `lost`, a fresh lead is created, because this is a new opportunity.

## Spam protection

- **Rate limit:** 10 submissions per minute per IP address (HTTP 429 after that).
- **Honeypot:** a hidden "website" field that humans never see. If it is filled in, the submission is silently discarded, but the bot still sees the thank-you page.
- The public `/f/*` routes are exempt from CSRF. This is needed so the form works inside an `<iframe>` on another domain, where browsers block session cookies.

---

## Technical reference

| Item | Location |
|---|---|
| Migration | `Modules/Lead/database/migrations/2026_11_13_000001_create_lead_forms_table.php` creates `lead_forms`, adds `leads.lead_form_id`, and makes `leads.created_by` nullable |
| Model | `Modules/Lead/app/Models/LeadForm.php` |
| Core logic | `Modules/Lead/app/Services/LeadCaptureService.php` |
| Admin controller | `Modules/Lead/app/Http/Controllers/LeadFormController.php` |
| Public controller | `Modules/Lead/app/Http/Controllers/PublicLeadFormController.php` |
| Pages | `Modules/Lead/resources/js/Pages/LeadForms.jsx`, `PublicLeadForm.jsx` |
| Tests | `tests/Feature/LeadFormTest.php` |

### Routes

| Method | URL | Access | Purpose |
|---|---|---|---|
| GET | `/lead-forms` | admin, manager | Manage forms |
| POST | `/lead-forms` | admin, manager | Create form |
| PATCH | `/lead-forms/{id}` | admin, manager | Update / pause form |
| DELETE | `/lead-forms/{id}` | admin, manager | Delete form (captured leads are kept) |
| GET | `/f/{token}` | public | Show form |
| POST | `/f/{token}` | public, `throttle:10,1` | Submit form → lead |
| GET | `/f/{token}/thanks` | public | Thank-you page |

### `lead_forms` table

| Column | Type | Notes |
|---|---|---|
| `name` | string | Internal name |
| `token` | string(40), unique | Random, used in the public URL |
| `title`, `description` | string, text | Shown to visitors |
| `source` | string | One of `Lead::$sources` |
| `assignment_mode` | string | `none` \| `user` \| `round_robin` |
| `assigned_user_id` | FK users, nullable | Fixed assignee / round-robin fallback |
| `last_assigned_user_id` | FK users, nullable | Round-robin cursor |
| `success_message`, `redirect_url` | string, nullable | After-submit behaviour |
| `is_active` | boolean | Paused forms return 404 |
| `submissions_count` | unsigned int | Includes merged duplicates |
| `created_by` | FK users, nullable | |
