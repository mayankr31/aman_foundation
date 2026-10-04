"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import ResilienceSurveyForm from "@/components/ResilienceSurveyForm";

export default function KYRSurveyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, isInitializing } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [prefill, setPrefill] = useState({});
  const [lockQuestionIds, setLockQuestionIds] = useState([]);

  useEffect(() => {
    if (isInitializing || !id || id === "undefined" || id === "null") return;

    async function loadBeneficiary() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/beneficiaries/${id}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const b = json.data;
          const pairs = [
            ["B.3", b.state],
            ["B.4", b.district],
            ["B.5", b.block],
            ["B.6", b.ward],
            ["B.7", b.village],
            ["B.8", b.name],
            ["B.9", b.gender],
            ["B.10", b.householdSize != null ? String(b.householdSize) : ""],
            ["B.14", b.primaryIncomeType],
            ["B.16_Min", b.monthlyIncome != null ? String(b.monthlyIncome) : ""],
            ["B.16_Max", b.monthlyIncome != null ? String(b.monthlyIncome) : ""],
            ["B.18", b.caste],
          ];
          const nextPrefill = {};
          const locks = [];
          pairs.forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value).trim() !== "") {
              nextPrefill[key] = value;
            }
          });
          pairs.forEach(([key, value]) => {
            if (key === "B.16_Min" || key === "B.16_Max") return;
            if (value !== undefined && value !== null && String(value).trim() !== "") {
              locks.push(key);
            }
          });
          if (nextPrefill["B.16_Min"]) {
            locks.push("B.16");
          }
          setPrefill(nextPrefill);
          setLockQuestionIds(locks);
        }
      } catch (error) {
        console.error("Failed to load beneficiary for survey prefill:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBeneficiary();
  }, [id, token, isInitializing]);

  const handleSubmit = async ({ responses, scores }) => {
    try {
      const res = await fetch(`/api/beneficiaries/${id}/resilience-surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ responses, scores }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Survey submitted successfully!");
        router.push(`/beneficiaries/${id}`);
      } else {
        toast.error("Error submitting survey: " + data.error);
      }
    } catch (error) {
      console.error("Submission failed", error);
      toast.error("Submission failed. Please try again.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <Link href={`/beneficiaries/${id}`} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity mb-6 w-fit font-sans font-bold text-sm">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Beneficiary Profile
      </Link>

      {loading ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 p-10 text-center text-sm text-on-surface-variant font-sans">
          Loading KYOR form...
        </div>
      ) : (
        <ResilienceSurveyForm
          mode="page"
          prefill={prefill}
          lockQuestionIds={lockQuestionIds}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
