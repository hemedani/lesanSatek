export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 text-center max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight text-glacier">
          ساتک
        </h1>
        <p className="text-lg text-pebble">
          سامانه مدیریت فرآیندهای سازمانی
        </p>
        <div className="flex gap-4 mt-4">
          <a
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-sm bg-electric-iris px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-electric-iris/80"
          >
            ورود به سامانه
          </a>
          <a
            href="/admin"
            className="inline-flex h-9 items-center justify-center rounded-sm border border-steel-border bg-transparent px-4 py-2 text-sm font-medium text-moonlight transition-colors hover:bg-graphite-plate"
          >
            پنل مدیریت
          </a>
        </div>
      </div>
    </div>
  )
}
