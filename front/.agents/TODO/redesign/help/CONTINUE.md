# Help Documentation System - Implementation Guide

##  System Architecture

### Components to Create
1. **HelpModal** - Reusable modal component for displaying help
2. **HelpButton** - Icon button that triggers HelpModal
3. **HelpContent** - Structured help content with sections
4. **DocPage** - Main documentation hub layout
5. **DocSection** - Documentation section component

### Design System
- **Modal**: Use existing elevated modal with animated blueprint stroke
- **Width**: Max 640px for readability
- **Header**: "راهنما" + topic title + close button
- **Body**: Scrollable content with sections
- **Footer**: "نیاز به کمک بیشتر؟" with link to full docs

---

## 📝 Help Content Template

Use this structure for EVERY help topic:

```typescript
interface HelpTopic {
  id: string
  title: string
  sections: {
    title: string
    content: string
    screenshot?: {
      placeholder: string // Hint for screenshot
      alt: string
      path: string // Where to save: /public/help/[path].png
    }
  }[]
  relatedTopics?: string[] // Links to other help IDs
}
```

### Example Help Content (PERSIAN):

```typescript
const purchasingRequestHelp: HelpTopic = {
  id: "pr-new-form",
  title: "ثبت درخواست خرید جدید",
  sections: [
    {
      title: "معرفی فرم",
      content: `
        این فرم برای ثبت درخواست‌های خرید جدید استفاده می‌شود. 
        شما می‌توانید کالاها، خدمات یا تجهیزات مورد نیاز واحد خود را 
        از طریق این فرم درخواست دهید.
        
        فرآیند بررسی درخواست شما به صورت خودکار آغاز شده و 
        پس از تأیید مدیر واحد، وارد گردش کار تعریف‌شده می‌شود.
      `,
      screenshot: {
        placeholder: "نمای کلی فرم - تمام بخش‌ها visible باشند",
        alt: "فرم ثبت درخواست خرید",
        path: "requests/new-form-overview"
      }
    },
    {
      title: "مراحل ثبت درخواست",
      content: `
        **۱. انتخاب فرآیند:**
        - سیستم به صورت خودکار فرآیند مناسب را بر اساس 
          واحد سازمانی شما انتخاب می‌کند
        - در صورت وجود چند فرآیند فعال، می‌توانید انتخاب کنید
        
        **۲. وارد کردن اطلاعات کالا:**
        - عنوان درخواست: توضیح مختصر و واضح
        - مدل کالا: از لیست کالاها انتخاب کنید
        - تعداد: مقدار مورد نیاز
        - برآورد هزینه: مبلغ تقریبی به ریال
        
        **۳. انتخاب انبار:**
        - انبار مقصد را انتخاب کنید
        - موجودی انبار قابل مشاهده است
        
        **۴. توضیحات تکمیلی:**
        - هرگونه توضیح اضافی که به بررسی کمک می‌کند
        - پیوست مدارک (اختیاری)
        
        **۵. ثبت نهایی:**
        - دکمه «ثبت درخواست» را کلیک کنید
        - شماره درخواست به شما نمایش داده می‌شود
      `,
      screenshot: {
        placeholder: "فرم پر شده با داده‌های نمونه",
        alt: "فرم تکمیل شده",
        path: "requests/new-form-filled"
      }
    },
    {
      title: "نکات مهم",
      content: `
        ✓ قبل از ثبت، موجودی انبار را بررسی کنید
        ✓ برآورد هزینه باید واقع‌بینانه باشد
        ✓ برای مبالغ بالا (>۵۰ میلیون ریال) فرآیند مناقصه 
          فعال می‌شود
        ✓ پس از ثبت، امکان ویرایش فقط در حالت پیش‌نویس وجود دارد
        ✓ می‌توانید وضعیت درخواست را در صفحه «درخواست‌های من» 
          پیگیری کنید
      `
    },
    {
      title: "سوالات متداول",
      content: `
        **آیا می‌توانم درخواست را پس از ثبت ویرایش کنم؟**
        فقط در حالت پیش‌نویس (Draft) امکان‌پذیر است.
        
        **چقدر طول می‌کشد درخواست من تأیید شود؟**
        بسته به فرآیند تعریف‌شده، معمولاً ۲-۵ روز کاری.
        
        **آیا می‌توانم درخواست را لغو کنم؟**
        بله، تا قبل از مرحله مناقصه می‌توانید لغو کنید.
      `
    }
  ],
  relatedTopics: ["pr-status-meanings", "inventory-check", "process-workflow"]
}
```

---

## 🎨 Help Modal Component

Create this reusable component:

```tsx
import { HelpCircle, X, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  topic: HelpTopic
}

function HelpModal({ isOpen, onClose, topic }: HelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-electric-iris" />
            <DialogTitle className="text-xl text-moonlight">
              {topic.title}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {topic.sections.map((section, idx) => (
            <section key={idx} className="space-y-3">
              <h3 className="text-base font-semibold text-moonlight">
                {section.title}
              </h3>
              
              {section.screenshot && (
                <div className="rounded-lg border border-steel-border/30 overflow-hidden bg-black/20">
                  {/* PLACEHOLDER FOR SCREENSHOT */}
                  <div className="p-4 text-center text-fog/60 text-sm">
                    📸 [Screenshot: {section.screenshot.placeholder}]
                    <br />
                    <span className="text-xs">
                      مسیر ذخیره‌سازی: /public/help/{section.screenshot.path}.png
                    </span>
                  </div>
                  {/* Replace with actual image when ready:
                  <img 
                    src={`/help/${section.screenshot.path}.png`}
                    alt={section.screenshot.alt}
                    className="w-full"
                  />
                  */}
                </div>
              )}
              
              <div 
                className="prose prose-invert prose-sm max-w-none text-ice"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </section>
          ))}
          
          {topic.relatedTopics && (
            <div className="pt-4 border-t border-steel-border/20">
              <p className="text-sm text-fog mb-2">مطالب مرتبط:</p>
              <div className="flex flex-wrap gap-2">
                {topic.relatedTopics.map(id => (
                  <button
                    key={id}
                    onClick={() => loadTopic(id)}
                    className="text-xs text-electric-iris hover:underline"
                  >
                    {/* Show topic title by ID */}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-steel-border/20">
          <p className="text-sm text-fog text-center">
            نیاز به کمک بیشتر دارید؟ به{' '}
            <Link href="/doc" className="text-electric-iris hover:underline">
              مستندات کامل
            </Link>{' '}
            مراجعه کنید.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 📋 Help Button Component

```tsx
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HelpButtonProps {
  topicId: string
  tooltip?: string
  onClick: (topicId: string) => void
}

function HelpButton({ topicId, tooltip, onClick }: HelpButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-fog/60 hover:text-electric-iris hover:bg-electric-iris/10"
          onClick={() => onClick(topicId)}
        >
          <HelpCircle className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip || "راهنما"}</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

---

## 🎯 Implementation Checklist for Each Page

For EVERY page/section in TODO.md:

1. **Identify Help Topics**
   - [ ] What does this page do?
   - [ ] What are the key features?
   - [ ] What might confuse users?
   - [ ] What are common mistakes?

2. **Write Help Content**
   - [ ] Create fluent Persian content
   - [ ] Break into logical sections
   - [ ] Add step-by-step instructions
   - [ ] Include tips and warnings
   - [ ] Add FAQ section
   - [ ] Link related topics

3. **Add Screenshots**
   - [ ] Identify where screenshots needed
   - [ ] Add placeholder with hint
   - [ ] Note: "📸 [SCREENSHOT: description]"
   - [ ] Specify save path: `/public/help/[category]/[name].png`

4. **Add Help Button to UI**
   - [ ] Place button in page header (next to title)
   - [ ] Add buttons to complex containers/cards
   - [ ] Add buttons to form sections
   - [ ] Ensure tooltip text is helpful

5. **Test**
   - [ ] Modal opens correctly
   - [ ] Content displays properly
   - [ ] Links to related topics work
   - [ ] Persian text reads naturally
   - [ ] Mobile responsive

---

## 📸 Screenshot Guidelines

### When to Take Screenshots:
- Complex forms (filled with sample data)
- Workflow diagrams
- Multi-step processes
- Before/after states
- Error states and validation

### Screenshot Specifications:
- **Resolution**: 1920x1080 or 1440x900
- **Format**: PNG with transparency if possible
- **Quality**: High quality, but optimized (<500KB)
- **Content**: 
  - Show full context
  - Use realistic sample data
  - Highlight important elements (optional red box/arrow)
  - Clean UI state (no errors unless demonstrating error handling)

### Naming Convention:
```
/public/help/[panel]/[page]-[section].png

Examples:
/public/help/admin/processes-graph-editor.png
/public/help/requests/new-form-overview.png
/public/help/orghead/dashboard-kpi-cards.png
```

---

## 🌟 Priority Levels

### P0 - CRITICAL (Do First)
- `/requests/new` - NEW PR FORM (complete workflow)
- `/admin/processes/[id]/graph` - Workflow editor
- `/admin/organizations/add` - First-time user experience
- `/login` and `/register` - Entry points

### P1 - HIGH (Do Second)
- All list pages with filters
- All add/edit forms
- Dashboard pages
- Approval workflows

### P2 - MEDIUM (Do Third)
- Detail/view pages
- Settings pages
- Reports and analytics

### P3 - LOW (Do Last)
- Simple list pages
- Reference data pages (states, cities)
- Static content pages

---

## 🔄 Quality Assurance

Before marking any TODO item as complete:

- [ ] Content is in fluent, natural Persian
- [ ] look at `backdocs/*.md` files to know more about the backend structure
- [ ] No English words or technical jargon
- [ ] Screenshots have clear placeholders with hints
- [ ] All sections follow the template structure
- [ ] Related topics are linked
- [ ] Help button is placed appropriately
- [ ] Modal opens and closes smoothly
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation, screen reader)

---

## 📚 Documentation Page Structure

Create `/doc` page with these sections:

```tsx
function DocPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section>
        <h1>مستندات ساتک</h1>
        <p>راهنمای کامل استفاده از سامانه مدیریت فرآیندهای خرید</p>
      </section>
      
      {/* Quick Links */}
      <section>
        <h2>شروع سریع</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DocCard title="راهنمای شروع" href="/doc/getting-started" />
          <DocCard title="آموزش ویدیویی" href="/doc/video-tutorials" />
          <DocCard title="سوالات متداول" href="/doc/faq" />
        </div>
      </section>
      
      {/* By Role */}
      <section>
        <h2>راهنما بر اساس نقش کاربری</h2>
        <DocSection title="کاربر عادی" topics={ordinaryUserTopics} />
        <DocSection title="مدیر واحد" topics={unitHeadTopics} />
        <DocSection title="مسئول انبار" topics={storeHeadTopics} />
        <DocSection title="مدیر سازمان" topics={orgHeadTopics} />
        <DocSection title="مدیر سیستم" topics={adminTopics} />
      </section>
      
      {/* By Feature */}
      <section>
        <h2>راهنما بر اساس ویژگی</h2>
        <DocSection title="فرآیندها" topics={processTopics} />
        <DocSection title="درخواست‌های خرید" topics={prTopics} />
        <DocSection title="انبارداری" topics={inventoryTopics} />
        <DocSection title="مالی و بودجه" topics={financeTopics} />
      </section>
    </div>
  )
}
```

---

##  Next Steps

1. **Start with P0 items** from TODO.md
2. **Create the HelpModal and HelpButton components** first
3. **Implement help for `/requests/new`** as the gold standard example
4. **Take screenshots** for that page
5. **Test thoroughly**
6. **Use as template** for remaining pages

---

**Remember**: Good help documentation reduces support tickets, improves user satisfaction, and accelerates onboarding. Every minute spent writing clear help content saves hours of user confusion.
