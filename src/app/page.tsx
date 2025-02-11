import Link from "next/link";
import { Mic, Calendar } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Voice-Powered Productivity
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Transform your voice into organized journals and time-blocked tasks
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-16">
        <Link
          href="/journal"
          className="relative group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold flex items-center gap-2">
            <Mic className="h-6 w-6" />
            Voice Journal
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Record your thoughts and let AI create detailed journal entries with summaries.
          </p>
        </Link>

        <Link
          href="/tasks"
          className="relative group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Time Blocking
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Speak your schedule and automatically create time-blocked tasks.
          </p>
        </Link>
      </div>
    </div>
  );
}
