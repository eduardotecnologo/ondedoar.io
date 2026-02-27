"use client";

import React from "react";
import { useFormStatus } from "react-dom";

type HiddenInput = { name: string; value: string };

function SubmitButton(props: {
  text: string;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={props.className}>
      {pending ? props.pendingText ?? props.text : props.text}
    </button>
  );
}

export default function ConfirmServerActionForm(props: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenInputs: HiddenInput[];
  confirmMessage: string;
  buttonText: string;
  pendingText?: string;
  buttonClassName?: string;
  className?: string;
}) {
  return (
    <form
      action={props.action}
      className={props.className}
      onSubmit={(e) => {
        if (!confirm(props.confirmMessage)) e.preventDefault();
      }}
    >
      {props.hiddenInputs.map((h) => (
        <input key={h.name} type="hidden" name={h.name} value={h.value} />
      ))}
      <SubmitButton
        text={props.buttonText}
        pendingText={props.pendingText}
        className={props.buttonClassName}
      />
    </form>
  );
}

