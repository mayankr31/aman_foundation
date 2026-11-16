import { redirect } from "next/navigation";

// Legacy URLs: /beneficiaries and all nested beneficiary pages moved to
// /participants. Keep this permanent redirect so old bookmarks and links keep
// working while API routes stay at /api/beneficiaries.
export default async function LegacyBeneficiariesRedirect({ params, searchParams }) {
  const { rest = [] } = (await params) || {};
  const query = new URLSearchParams((await searchParams) || {}).toString();
  const suffix = rest.length ? `/${rest.map((part) => encodeURIComponent(part)).join("/")}` : "";
  redirect(`/participants${suffix}${query ? `?${query}` : ""}`);
}
