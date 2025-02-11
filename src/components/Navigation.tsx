"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full transition-all duration-300 ${
        isActive
          ? "bg-white/20 text-white backdrop-blur-apple"
          : "text-white/70 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function Navigation() {
  return (
    <nav className="fixed top-0 inset-x-0 h-16 flex items-center justify-center backdrop-blur-apple bg-black/10">
      <div className="flex space-x-2">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/journal">Journal</NavLink>
        <NavLink href="/tasks">Tasks</NavLink>
      </div>
    </nav>
  );
} 