"use client";

import { useEffect, useRef, useState } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or pages without clipboard permission.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export default function CopyButton({
  text,
  label = "Copy",
  className = "act",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <button
      type="button"
      className={className}
      disabled={!text}
      onClick={async () => {
        setState((await copyText(text)) ? "done" : "fail");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 1800);
      }}
    >
      <span aria-live="polite">{state === "done" ? "Copied ✓" : state === "fail" ? "Copy failed" : label}</span>
    </button>
  );
}
