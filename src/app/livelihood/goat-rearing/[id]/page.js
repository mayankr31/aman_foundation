"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GoatRearingProgramDetail() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace("/livelihood/non-farm");
  }, [router]);

  return (
    <div className="p-12 flex items-center justify-center">
      <p className="text-on-surface-variant">Redirecting to Non-Farm Programs...</p>
    </div>
  );
}
