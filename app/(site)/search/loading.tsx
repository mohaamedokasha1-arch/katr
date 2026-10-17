export default function SearchLoading() {
  return (
    <div className="page-shell py-8" aria-busy="true">
      <div className="skeleton h-4 w-32" />
      <div className="mt-4 skeleton h-9 w-2/3 max-w-lg" />
      <div className="mt-6 panel p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_168px_auto]">
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
          <div className="skeleton h-12 w-24" />
        </div>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_288px]">
        <div className="space-y-3">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-14 w-full" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel p-5">
              <div className="flex justify-between">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-5 w-24" />
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div className="skeleton h-10 w-24" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-10 w-24" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden space-y-3 lg:block">
          <div className="skeleton h-48 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
