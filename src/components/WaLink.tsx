"use client";

import { markConfirmationSent } from "@/app/(app)/actions";

/**
 * Opens WhatsApp with a ready message. When `confirmId` is set, the booking is also marked as
 * "confirmation sent" (this only records that the button was used, not that the message was sent).
 */
export default function WaLink({
  href,
  label,
  hot,
  confirmId,
}: {
  href: string;
  label: string;
  hot?: boolean;
  confirmId?: string;
}) {
  return (
    <a
      className={"act" + (hot ? " hot" : "")}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={confirmId ? () => void markConfirmationSent(confirmId) : undefined}
    >
      {label}
    </a>
  );
}
