"use client";

import { useState } from "react";

interface ClientTimezoneOffsetFieldProps {
  name?: string;
}

export default function ClientTimezoneOffsetField({
  name = "client_timezone_offset_minutes",
}: ClientTimezoneOffsetFieldProps) {
  const [offset] = useState(() => String(new Date().getTimezoneOffset()));

  return <input type="hidden" name={name} value={offset} />;
}
