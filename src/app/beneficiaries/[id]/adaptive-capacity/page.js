"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

const questions = [
  {
    id: 1,
    text: "What is your ownership status of the land that you farm on?",
    options: [
      { value: 1, label: "Landless laborer", score: 0.2, img: "/images/capacity-tools/adaptive_q1_1.jpg" },
      { value: 2, label: "Tenant (rights to cultivate)", score: 0.4, img: "/images/capacity-tools/adaptive_q1_2.jpg" },
      { value: 3, label: "Owning up to 2 acres of land", score: 0.6, img: "/images/capacity-tools/adaptive_q1_3.jpg" },
      { value: 4, label: "Owning up to 5 acres of land", score: 0.8, img: "/images/capacity-tools/adaptive_q1_4.webp" },
      { value: 5, label: "Owning more than 5 acres", score: 1, img: "/images/capacity-tools/adaptive_q1_5.jpg" },
    ]
  },
  {
    id: 2,
    text: "Do you have sufficient equipment required to farm on your land?",
    options: [
      { value: 1, label: "No equipment", score: 0.2, img: "/images/capacity-tools/adaptive_q2_1.jpg" },
      { value: 2, label: "Few equipment", score: 0.4, img: "/images/capacity-tools/adaptive_q2_2.png" },
      { value: 3, label: "Most equipment", score: 0.6, img: "/images/capacity-tools/adaptive_q2_3.jpg" },
      { value: 4, label: "All equipment", score: 0.8, img: "/images/capacity-tools/adaptive_q2_4.png" },
      { value: 5, label: "Have all & renting to others", score: 1, img: "/images/capacity-tools/adaptive_q2_5.png" },
    ]
  },
  {
    id: 3,
    text: "What is the source of water for the household?",
    options: [
      { value: 1, label: "Rainfed", score: 0.2, img: "/images/capacity-tools/adaptive_q3_1.png" },
      { value: 2, label: "River", score: 0.4, img: "/images/capacity-tools/adaptive_q3_2.png" },
      { value: 3, label: "Ponds/lakes/dam", score: 0.6, img: "/images/capacity-tools/adaptive_q3_3.avif" },
      { value: 4, label: "Irrigation canals", score: 0.8, img: "/images/capacity-tools/adaptive_q3_4.jfif" },
      { value: 5, label: "Well/Borewells", score: 1, img: "/images/capacity-tools/adaptive_q3_5.jpg" },
    ]
  },
  {
    id: 4,
    text: "What type of cropping practice does the household follow on their farm (at present)?",
    options: [
      { value: 1, label: "Single crop", score: 0.2, img: "/images/capacity-tools/adaptive_q4_1.jfif" },
      { value: 2, label: "Crop rotation-limited diversity", score: 0.4, img: "/images/capacity-tools/adaptive_q4_2.png" },
      { value: 3, label: "Seasonal rotation", score: 0.6, img: "/images/capacity-tools/adaptive_q4_3.png" },
      { value: 4, label: "Mixed cropping", score: 0.8, img: "/images/capacity-tools/adaptive_q4_4.png" },
      { value: 5, label: "Inter-cropping", score: 1, img: "/images/capacity-tools/adaptive_q4_5.jpg" },
    ]
  },
  {
    id: 5,
    text: "Do you have livestock or any alternative source of income to support your livelihood?",
    options: [
      { value: 1, label: "No alt source", score: 0.2, img: "/images/capacity-tools/adaptive_q5_1.jpg" },
      { value: 2, label: "Support for 3 months", score: 0.4, img: "/images/capacity-tools/adaptive_q5_2.png" },
      { value: 3, label: "Support for 6 months", score: 0.6, img: "/images/capacity-tools/adaptive_q5_3.png" },
      { value: 4, label: "Support for 6-8 months", score: 0.8, img: "/images/capacity-tools/adaptive_q5_4.png" },
      { value: 5, label: "Throughout year", score: 1, img: "/images/capacity-tools/adaptive_q5_5.png" },
    ]
  },
  {
    id: 6,
    text: "How do you upgrade your knowledge and skill set on your livelihoods?",
    options: [
      { value: 1, label: "Family & Friends", score: 0.2, img: "/images/capacity-tools/adaptive_q6_1.png" },
      { value: 2, label: "Private agents", score: 0.4, img: "/images/capacity-tools/adaptive_q6_2.webp" },
      { value: 3, label: "Govt sources", score: 0.6, img: "/images/capacity-tools/adaptive_q6_3.png" },
      { value: 4, label: "NGOs/CBOs", score: 0.8, img: "/images/capacity-tools/adaptive_q6_4.webp" },
      { value: 5, label: "Media", score: 1, img: "/images/capacity-tools/adaptive_q6_5.png" },
    ]
  },
  {
    id: 7,
    text: "How does your family access financial services/loans during the shock?",
    options: [
      { value: 1, label: "Money lender", score: 0.2, img: "/images/capacity-tools/adaptive_q7_1.png" },
      { value: 2, label: "Cooperative/MFI", score: 0.4, img: "/images/capacity-tools/adaptive_q7_2.png" },
      { value: 3, label: "Bank", score: 0.6, img: "/images/capacity-tools/adaptive_q7_3.png" },
      { value: 4, label: "Neighbors/relative", score: 0.8, img: "/images/capacity-tools/adaptive_q7_4.png" },
      { value: 5, label: "Savings", score: 1, img: "/images/capacity-tools/adaptive_q7_5.png" },
    ]
  },
  {
    id: 8,
    text: "How often do members of the household talk to people outside your usual social circles at present?",
    options: [
      { value: 1, label: "Never", score: 0.2, img: "/images/capacity-tools/adaptive_q8_1.jpg" },
      { value: 2, label: "Rarely", score: 0.4, img: "/images/capacity-tools/adaptive_q8_2.jpg" },
      { value: 3, label: "Occasionally", score: 0.6, img: "/images/capacity-tools/adaptive_q8_3.png" },
      { value: 4, label: "Frequently", score: 0.8, img: "/images/capacity-tools/adaptive_q8_4.png" },
      { value: 5, label: "All the time", score: 1, img: "/images/capacity-tools/adaptive_q8_5.avif" },
    ]
  },
  {
    id: 9,
    text: "How confident does the household feel in its ability to recover if it were to face this shock in the next 2 years?",
    options: [
      { value: 1, label: "Not confident at all", score: 0.2, img: "/images/capacity-tools/adaptive_q9_1.jpg" },
      { value: 2, label: "Somewhat - need support", score: 0.4, img: "/images/capacity-tools/adaptive_q9_2.jpg" },
      { value: 3, label: "Somewhat - no support", score: 0.6, img: "/images/capacity-tools/adaptive_q9_3.png" },
      { value: 4, label: "Very - need support", score: 0.8, img: "/images/capacity-tools/adaptive_q9_4.png" },
      { value: 5, label: "Very - no support", score: 1, img: "/images/capacity-tools/adaptive_q9_5.jpg" },
    ]
  }
];

export default function AdaptiveCapacitySurveyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const toast = useToast();
  
  const [responses, setResponses] = useState({});
  const [vulnerabilityNote, setVulnerabilityNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (questionId, optionValue) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: optionValue
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length < questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const totalScore = questions.reduce((sum, q) => {
        const selectedValue = responses[q.id];
        const option = q.options.find(o => o.value === selectedValue);
        return sum + (option ? option.score : 0);
      }, 0);

      const maxScore = questions.length * 1; 
      const percentageScore = (totalScore / maxScore) * 10;

      const payload = {
        responses: {
          ...responses,
          vulnerabilityNote,
          facilitator: user?.name || user?.email || "Unknown",
        },
        overallScore: parseFloat(percentageScore.toFixed(2))
      };
      
      const res = await fetch(`/api/beneficiaries/${id}/adaptive-surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Adaptive Capacity Assessment submitted successfully!");
        router.push(`/beneficiaries/${id}`);
      } else {
        toast.error("Error submitting survey: " + data.error);
      }
    } catch (error) {
      console.error("Submission failed", error);
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      <Link href={`/beneficiaries/${id}`} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity mb-6 w-fit font-sans font-bold text-sm">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Beneficiary Profile
      </Link>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden mb-8">
        <div className="bg-surface-container-low p-6 border-b border-outline-variant/10">
          <h1 className="text-3xl font-bold font-headline text-on-surface">Adaptive Capacity Assessment</h1>
          <p className="text-on-surface-variant mt-2 max-w-2xl text-sm">
            Please answer all questions by selecting the most appropriate option. Your answers help us understand the adaptive capacity.
          </p>
        </div>

        {/* Survey Details Header */}
        <div className="bg-surface-container-lowest p-6 border-b border-surface-container-highest grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-on-surface-variant font-bold">Member ID (Beneficiary ID)</p>
            <p className="text-on-surface font-medium">{id}</p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant font-bold">Date</p>
            <p className="text-on-surface font-medium">{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant font-bold">Facilitator</p>
            <p className="text-on-surface font-medium">{user?.name || user?.email || "Not Logged In"}</p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant font-bold mb-1">Vulnerability</p>
            <input 
              type="text" 
              placeholder="Enter vulnerability details..."
              value={vulnerabilityNote}
              onChange={(e) => setVulnerabilityNote(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-12">
          <div className="space-y-8">
            {questions.map((q) => (
              <div key={q.id} className="font-sans border border-surface-container-highest rounded-xl overflow-hidden">
                <div className="bg-surface-container-low p-4 border-b border-surface-container-highest">
                  <h3 className="font-semibold text-sm md:text-base">{q.id}. {q.text}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full mt-2 inline-block">Single Choice</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-surface-container-highest">
                  {q.options.map((opt) => (
                    <div 
                      key={opt.value} 
                      onClick={() => handleSelect(q.id, opt.value)}
                      className={`p-4 flex flex-col items-center text-center cursor-pointer transition-colors duration-200 ${
                        responses[q.id] === opt.value 
                          ? 'bg-primary/10 border-b-4 border-b-primary' 
                          : 'hover:bg-surface-container-lowest border-b-4 border-b-transparent'
                      }`}
                    >
                      <div className="w-24 h-24 bg-surface-container mb-3 rounded-md flex items-center justify-center overflow-hidden relative border border-outline-variant/20">
                        <Image 
                          src={opt.img} 
                          alt={opt.label} 
                          fill 
                          sizes="(max-width: 768px) 100vw, 20vw"
                          className="object-contain p-2"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="text-xs text-on-surface-variant z-[-1] absolute">Image</span>
                      </div>
                      <span className={`text-xs font-medium ${responses[q.id] === opt.value ? 'text-primary font-bold' : 'text-on-surface'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-on-surface-variant mt-auto pt-2 block w-full border-t border-outline-variant/10">
                        Level {opt.value} ({opt.score})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low p-6 border-t border-outline-variant/10 flex items-center justify-between font-sans">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-on-surface-variant">Progress</span>
            <span className="text-xs">{Object.keys(responses).length} of {questions.length} answered</span>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gradient-primary bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Survey"}
          </button>
        </div>
      </div>
    </div>
  );
}
