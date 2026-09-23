"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: [string, string][] = [
  ["/today", "Today"],
  ["/analytics", "Analytics"],
  ["/marketing", "Marketing AI"],
  ["/inbox", "Inbox"],
  ["/enquiries", "Enquiries"],
  ["/bookings", "Bookings"],
  ["/quotations", "Quotations"],
  ["/invoices", "Invoices"],
  ["/payments", "Payments"],
  ["/followups", "Follow-ups"],
  ["/students", "Students"],
  ["/team", "Team"],
  ["/settings", "Settings"],
];

export default function Nav({ newLeads }: { newLeads: number }) {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className="tab"
          aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}
        >
          {label}
          {href === "/inbox" && newLeads > 0 ? <small>{newLeads}</small> : null}
        </Link>
      ))}
    </nav>
  );
}
