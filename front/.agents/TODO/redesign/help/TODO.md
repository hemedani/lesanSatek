# Help Documentation System - TODO

## 📋 Overview
This TODO tracks the creation of a comprehensive help system for LesanSatek, including:
- `/doc` documentation hub page
- Help modal components
- Contextual help icons on all pages
- Fluent Persian help content for every feature
- please look at `backdocs/*.md` files to know more about the backend structure in every page help step

##  Workflow
1. **READ** `redesign/help/CONTINUE.md` for templates and guidelines
2. **CREATE** help content for each unchecked item below
3. **ADD** help icons to UI components where needed
4. **TEST** modals open correctly with proper content
5. **CHECK** the box when complete
6. **REPEAT** for next item

## 📚 Documentation Hub
- [x] `/doc` - Main documentation landing page with navigation to all sections

## 🎨 Admin Panel Help
### Organizations
- [x] `/admin/organizations` - List page help
- [x] `/admin/organizations/add` - Create organization help
- [x] `/admin/organizations/[id]` - Edit organization help
- [x] Organization cards/containers help

### Units
- [x] `/admin/units` - List page help
- [x] `/admin/units/add` - Create unit help
- [x] `/admin/units/[id]` - Edit unit help
- [x] Unit hierarchy visualization help

### Users & Roles
- [x] `/admin/users` - User management help
- [x] `/admin/users/add` - Add user help
- [x] `/admin/roles` - Role management help
- [x] Permission assignment help

### Processes
- [x] `/admin/processes` - Process list help
- [x] `/admin/processes/add` - Create process help
- [x] `/admin/processes/[id]` - Edit process help
- [x] `/admin/processes/[id]/graph` - Workflow graph editor help (DETAILED)
- [x] `/admin/processes/[id]/steps` - Steps management help
- [x] `/admin/processes/[id]/relations` - Relations/conditions help

### Ware Management
- [x] `/admin/ware-types` - Ware types help
- [x] `/admin/ware-classes` - Ware classes help
- [x] `/admin/ware-groups` - Ware groups help (hierarchical)
- [x] `/admin/ware-models` - Ware models help
- [x] `/admin/manufacturers` - Manufacturers help
- [x] `/admin/wares` - Ware catalog help
- [x] `/admin/wares/add` - Add ware help (with all fields)

### Stores & Inventory
- [x] `/admin/stores` - Store management help
- [x] `/admin/inventory` - Inventory list help
- [x] `/admin/stock-movements` - Stock movements help
- [x] `/admin/consumption` - Consumption records help

### Finance
- [x] `/admin/budget-lines` - Budget lines help
- [x] `/admin/fiscal-years` - Fiscal years help
- [x] `/admin/budget-reports` - Budget reports help

### Geographic
- [x] `/admin/states` - States/provinces help
- [x] `/admin/cities` - Cities help

##  OrgHead Panel Help
### Dashboard
- [x] `/orghead` - Dashboard overview help
- [x] KPI cards help (what each metric means)
- [x] Quick navigation cards help

### Organization
- [x] `/orghead/org-chart` - Org chart visualization help
- [x] `/orghead/settings` - Organization settings help

### Units & Users
- [x] `/orghead/units` - Unit management help
- [x] `/orghead/users` - User management in org context help

### Processes
- [x] `/orghead/processes` - Process list help
- [x] `/orghead/processes/add` - Create process help
- [x] `/orghead/processes/[id]` - Edit process help
- [x] `/orghead/processes/[id]/graph` - Workflow graph help (DETAILED)
- [x] `/orghead/processes/[id]/steps` - Steps help
- [x] `/orghead/processes/[id]/relations` - Relations help

### Requests
- [x] `/orghead/requests` - Requests list help
- [x] `/orghead/requests/[id]` - Request detail help
- [x] Request status badges help (what each status means)

### Inventory
- [x] `/orghead/inventory` - Unit inventory help
- [x] `/orghead/consumption` - Consumption tracking help
- [x] `/orghead/stock-movements` - Stock movements help

##  UnitHead Panel Help
### Dashboard
- [x] `/unit-head` - Dashboard help
- [x] Pending approvals help

### Requests
- [x] `/unit-head/requests` - Requests to approve help
- [x] `/unit-head/requests/[id]` - Request review help
- [x] Approval workflow help
- [x] Rejection reasons help

### Finance
- [x] `/unit-head/finance` - Finance approval help
- [x] Budget line assignment help

### Goods Receipt
- [x] `/unit-head/goods-receipt` - Goods receipt help
- [x] Delivery confirmation help

##  StoreHead Panel Help
### Dashboard
- [x] `/storehead` - Store dashboard help
- [x] Pending deliveries alert help

### Purchasing Requests
- [x] `/storehead/purchasing-requests` - PR list help
- [x] `/storehead/purchasing-requests/[id]` - PR detail with payment orders help

### Tenders
- [x] `/storehead/tenders` - Tender management help
- [x] `/storehead/tenders/[id]` - Tender detail help
- [x] `/storehead/my-offers` - My offers help

### Stuff
- [x] `/storehead/stuff` - Stuff/items management help

## 🛒 Requests Panel (Employee) Help
### Main
- [x] `/requests` - Requests center help
- [x] `/requests/my-requests` - My requests help
- [x] `/requests/new` - **NEW PR FORM - COMPREHENSIVE WORKFLOW HELP** (CRITICAL)

### Inventory Access
- [x] `/requests/inventory` - Inventory view help
- [x] `/requests/consumption` - Consumption registration help
- [x] `/requests/stock-movements` - Stock movements help

## 🔐 Authentication Help
- [x] `/login` - Login help
- [x] `/register` - Registration help
- [x] Password recovery help

## 📖 Documentation Sections
- [x] `/doc/getting-started` - Getting started guide
- [x] `/doc/user-roles` - User roles and permissions guide
- [x] `/doc/processes` - Process management guide
- [x] `/doc/purchasing-workflow` - Complete purchasing workflow guide
- [x] `/doc/inventory` - Inventory management guide
- [x] `/doc/finance` - Finance and budget guide
- [x] `/doc/faq` - Frequently asked questions
- [x] `/doc/video-tutorials` - Video tutorials section

---

**⚠️ CRITICAL REMINDERS:**
- All help content MUST be in fluent, natural Persian (fa)
- Use modal component for help content (not external pages)
- Include screenshot placeholders with hints
- Keep help concise but comprehensive
- Link related help topics together
