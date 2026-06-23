"use client";
import React from "react";
import EmailCaptureModal from "@/components/common/EmailCaptureModal";
import {
  DISCLAIMER_ACK_EVENT,
  EMAIL_SESSION_SHOWN_KEY,
  isDisclaimerSatisfied,
} from "@/lib/consent";

// Homepage auto-prompt: opens the email capture modal `delayMs` after the
// Ayurveda Disclaimer is acknowledged, once per browser session. If the
// disclaimer was acknowledged on a previous visit the timer starts on mount;
// otherwise it waits for the acknowledgement event so the two never stack.
export default function EmailCaptureAutoPrompt({ delayMs = 8000 }) {
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

    if (isDisclaimerSatisfied()) {
      startTimer();
      return () => clearTimeout(timer);
    }

    const onAck = () => startTimer();
    window.addEventListener(DISCLAIMER_ACK_EVENT, onAck, { once: true });
    return () => {
      window.removeEventListener(DISCLAIMER_ACK_EVENT, onAck);
      clearTimeout(timer);
    };
  }, [delayMs]);

  return <EmailCaptureModal open={open} onClose={() => setOpen(false)} />;
}
