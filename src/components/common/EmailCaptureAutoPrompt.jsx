"use client";
import React from "react";
import { usePathname } from "next/navigation";
import EmailCaptureModal from "@/components/common/EmailCaptureModal";
import {
  DISCLAIMER_ACK_EVENT,
  EMAIL_SESSION_SHOWN_KEY,
  isDisclaimerPending,
} from "@/lib/consent";

// Homepage auto-prompt: opens the email capture modal `delayMs` after mount,
// once per browser session. On a booking route — where the Ayurveda Disclaimer
// takes over the screen — it waits for that acknowledgement first so the two
// never stack.
export default function EmailCaptureAutoPrompt({ delayMs = 8000 }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (sessionStorage.getItem(EMAIL_SESSION_SHOWN_KEY) === "true") return;

    let timer;
    const startTimer = () => {
      timer = setTimeout(() => {
        sessionStorage.setItem(EMAIL_SESSION_SHOWN_KEY, "true");
        setOpen(true);
      }, delayMs);
    };

    if (!isDisclaimerPending(pathname)) {
      startTimer();
      return () => clearTimeout(timer);
    }

    const onAck = () => startTimer();
    window.addEventListener(DISCLAIMER_ACK_EVENT, onAck, { once: true });
    return () => {
      window.removeEventListener(DISCLAIMER_ACK_EVENT, onAck);
      clearTimeout(timer);
    };
  }, [delayMs, pathname]);

  return <EmailCaptureModal open={open} onClose={() => setOpen(false)} />;
}
