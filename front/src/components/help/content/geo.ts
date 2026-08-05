import type { HelpTopic } from "@/components/help/help-topic"

export const geoTopics: HelpTopic[] = [
  {
    id: "admin-states",
    title: "استان‌ها",
    description: "مدیریت استان‌های کشور و شمار شهرهای هر استان",
    sections: [
      {
        title: "معرفی صفحه",
        content: `
          در این صفحه فهرست استان‌های کشور مدیریت می‌شود. هر استان می‌تواند چند شهر داشته باشد و شهرها از نظر جغرافیایی به استان متصل هستند.

          از این صفحه می‌توانید استان جدیدی ایجاد کنید یا استان‌های موجود را جستجو و ویرایش کنید.
        `,
        screenshot: {
          placeholder: "نمای کلی فهرست استان‌ها",
          alt: "فهرست استان‌ها",
          path: "admin/states",
        },
      },
    ],
    relatedTopics: ["admin-cities"],
  },
  {
    id: "admin-cities",
    title: "شهرها",
    description: "مدیریت شهرهای کشور و ارتباط آن‌ها با استان‌ها",
    sections: [
      {
        title: "معرفی صفحه",
        content: `
          در این صفحه فهرست شهرها مدیریت می‌شود. هر شهر به یک استان متصل است و از این ارتباط برای مشخص‌کردن موقعیت جغرافیایی واحدها و فروشگاه‌ها استفاده می‌شود.

          می‌توانید شهر جدیدی ایجاد کنید یا شهرهای موجود را جستجو، ویرایش و حذف کنید.
        `,
        screenshot: {
          placeholder: "نمای کلی فهرست شهرها",
          alt: "فهرست شهرها",
          path: "admin/cities",
        },
      },
    ],
    relatedTopics: ["admin-states"],
  },
]