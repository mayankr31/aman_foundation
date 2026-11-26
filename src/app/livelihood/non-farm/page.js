"use client";

import ProgramsIndex from "@/components/livelihood/ProgramsIndex";

export default function NonFarmPrograms() {
  return (
    <ProgramsIndex
      category="NON_FARM"
      title="Non-Farm Programs"
      description="Livestock and allied activities: goat rearing, fish farming, poultry, and more. A program can now bundle several activities."
      addLabel="Add Program"
      typeCategory="NON_FARM"
    />
  );
}
