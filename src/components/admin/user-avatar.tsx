"use client";

import Image from "next/image";
import { useState } from "react";

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function imageUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  return origin ? `${origin}/${path.replace(/^\/+/, "")}` : null;
}

export function UserAvatar({ name, profileImage, size = "md" }: { name?: string | null; profileImage?: string | null; size?: "sm" | "md" }) {
  const [failed, setFailed] = useState(false);
  const source = imageUrl(profileImage);
  const dimensions = size === "sm" ? "size-8 text-[10px]" : "size-10 text-xs";

  return (
    <span className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8edff] font-semibold text-[#5267c5] ring-1 ring-[#dce3f7] ${dimensions}`}>
      {source && !failed ? (
        <Image src={source} alt={name ? `${name} profile` : "User profile"} fill sizes="40px" unoptimized onError={() => setFailed(true)} className="object-cover" />
      ) : initials(name)}
    </span>
  );
}
