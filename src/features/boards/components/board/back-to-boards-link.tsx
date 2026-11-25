"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { linkButton } from "@/components/button-styles";

export function BackToBoardsLink() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <Link href={`/w/${slug}`} className={linkButton("default", "h-10 px-4")}>
      Voltar aos quadros
    </Link>
  );
}
