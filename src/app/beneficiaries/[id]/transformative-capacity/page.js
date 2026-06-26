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
    text: "How easy will it be for your household to access inputs for your livelihoods (Quality, Quantity, Time and Price)",
    options: [
      { value: 1, label: "Very difficult", score: 0.2, img: "/images/capacity-tools/transform_q1_1" },
      { value: 2, label: "Difficult", score: 0.4, img: "/images/capacity-tools/transform_q1_2" },
      { value: 3, label: "Somewhat easy", score: 0.6, img: "/images/capacity-tools/transform_q1_3" },
      { value: 4, label: "Easy", score: 0.8, img: "/images/capacity-tools/transform_q1_4" },
      { value: 5, label: "Very easy", score: 1, img: "/images/capacity-tools/transform_q1_5" },
    ]
  },
  {
    id: 2,
    text: "How easy is it for your household to access markets for selling your produce (Single Chanel, Multiple Chanel, Reasonable Price)",
    options: [
      { value: 1, label: "Very difficult", score: 0.2, img: "/images/capacity-tools/transform_q2_1" },
      { value: 2, label: "Difficult", score: 0.4, img: "/images/capacity-tools/transform_q2_2" },
      { value: 3, label: "Somewhat easy", score: 0.6, img: "/images/capacity-tools/transform_q2_3" },
      { value: 4, label: "Easy", score: 0.8, img: "/images/capacity-tools/transform_q2_4" },
      { value: 5, label: "Very easy", score: 1, img: "/images/capacity-tools/transform_q2_5" },
    ]
  },
  {
    id: 3,
    text: "How easy is it for your household to access services for public welfare (Affordability, Timely delivery, Quality service)",
    options: [
      { value: 1, label: "Very difficult", score: 0.2, img: "/images/capacity-tools/transform_q3_1" },
      { value: 2, label: "Difficult", score: 0.4, img: "/images/capacity-tools/transform_q3_2" },
      { value: 3, label: "Somewhat easy", score: 0.6, img: "/images/capacity-tools/transform_q3_3" },
      { value: 4, label: "Easy", score: 0.8, img: "/images/capacity-tools/transform_q3_4" },
      { value: 5, label: "Very easy", score: 1, img: "/images/capacity-tools/transform_q3_5" },
    ]
  },
  {
    id: 4,
    text: "How easy is your household to access common public resources? (Library, Common grazing lands, Sources of water, Places of worship, Health clinics)",
    options: [
      { value: 1, label: "Very difficult", score: 0.2, img: "/images/capacity-tools/transform_q4_1" },
      { value: 2, label: "Difficult", score: 0.4, img: "/images/capacity-tools/transform_q4_2" },
      { value: 3, label: "Somewhat easy", score: 0.6, img: "/images/capacity-tools/transform_q4_3" },
      { value: 4, label: "Easy", score: 0.8, img: "/images/capacity-tools/transform_q4_4" },
      { value: 5, label: "Very easy", score: 1, img: "/images/capacity-tools/transform_q4_5" },
    ]
  },
  {
    id: 5,
    text: "Do you or your family members engage in any skill development programs or activities (at present)?",
    options: [
      { value: 1, label: "No access", score: 0.2, img: "/images/capacity-tools/transform_q5_1" },
      { value: 2, label: "Low access", score: 0.4, img: "/images/capacity-tools/transform_q5_2" },
      { value: 3, label: "Moderate access", score: 0.6, img: "/images/capacity-tools/transform_q5_3" },
      { value: 4, label: "High access", score: 0.8, img: "/images/capacity-tools/transform_q5_4" },
      { value: 5, label: "Very high access", score: 1, img: "/images/capacity-tools/transform_q5_5" },
    ]
  },
  {
    id: 6,
    text: "Would it be possible for members of your household to claim and receive benefits from social security services (Pensions (all),Maternity benefit, MGNREGA, MSP)",
    options: [
      { value: 1, label: "Don't know policy", score: 0.2, img: "/images/capacity-tools/transform_q6_1" },
      { value: 2, label: "Not applied to policy", score: 0.4, img: "/images/capacity-tools/transform_q6_2" },
      { value: 3, label: "Not received benefits", score: 0.6, img: "/images/capacity-tools/transform_q6_3" },
      { value: 4, label: "Many delays faced", score: 0.8, img: "/images/capacity-tools/transform_q6_4" },
      { value: 5, label: "Benefitted at right time", score: 1, img: "/images/capacity-tools/transform_q6_5" },
    ]
  },
  {
    id: 7,
    text: "In times of crisis, how connected do you feel to organizations or institutions working in your area?",
    options: [
      { value: 1, label: "Only few connections", score: 0.2, img: "/images/capacity-tools/transform_q7_1" },
      { value: 2, label: "Some (not many) connections", score: 0.4, img: "/images/capacity-tools/transform_q7_2" },
      { value: 3, label: "Actively making connections", score: 0.6, img: "/images/capacity-tools/transform_q7_3" },
      { value: 4, label: "Established connections", score: 0.8, img: "/images/capacity-tools/transform_q7_4" },
      { value: 5, label: "Well-connected", score: 1, img: "/images/capacity-tools/transform_q7_5" },
    ]
  },
  {
    id: 8,
    text: "Do female household members access employment opportunities at present?",
    options: [
      { value: 1, label: "Not aware", score: 0.2, img: "/images/capacity-tools/transform_q8_1" },
      { value: 2, label: "No opportunities available", score: 0.4, img: "/images/capacity-tools/transform_q8_2" },
      { value: 3, label: "Not allowed to access", score: 0.6, img: "/images/capacity-tools/transform_q8_3" },
      { value: 4, label: "Paid very little wages", score: 0.8, img: "/images/capacity-tools/transform_q8_4" },
      { value: 5, label: "Paid fair wages", score: 1, img: "/images/capacity-tools/transform_q8_5" },
    ]
  },
  {
    id: 9,
    text: "For which of the aspects, female members of the family participate in decision making ?",
    options: [
      { value: 1, label: "No participation", score: 0.2, img: "/images/capacity-tools/transform_q9_1" },
      { value: 2, label: "Day-to-day activities", score: 0.4, img: "/images/capacity-tools/transform_q9_2" },
      { value: 3, label: "Social activities (SHGs, NGOs)", score: 0.6, img: "/images/capacity-tools/transform_q9_3" },
      { value: 4, label: "Children education, Marriage", score: 0.8, img: "/images/capacity-tools/transform_q9_4" },
      { value: 5, label: "Buying & Selling of assets etc.", score: 1, img: "/images/capacity-tools/transform_q9_5" },
    ]
  }
];

// Helper component to try loading an image with different extensions
function ImageWithFallback({ srcPrefix, alt, sizes }) {
  const [ext, setExt] = useState(".png");
  const [error, setError] = useState(false);

  const handleError = () => {
    if (ext === ".png") setExt(".jpg");
    else if (ext === ".jpg") setExt(".webp");
    else if (ext === ".webp") setExt(".avif");
    else if (ext === ".avif") setExt(".jfif");
    else setError(true);
  };

  if (error) {
    return <span className="text-xs text-on-surface-variant z-[-1] absolute">Image</span>;
  }

  return (
    <Image 
      src={`${srcPrefix}${ext}`} 
      alt={alt} 
      fill 
      sizes={sizes}
      className="object-contain p-2"
      onError={handleError}
    />
  );
}

export default function TransformativeCapacitySurveyPage() {
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
      
      const res = await fetch(`/api/beneficiaries/${id}/transformative-surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Transformative Capacity Assessment submitted successfully!");
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
          <h1 className="text-3xl font-bold font-headline text-on-surface">Transformative Capacity Assessment</h1>
          <p className="text-on-surface-variant mt-2 max-w-2xl text-sm">
            Please answer all questions by selecting the most appropriate option. Your answers help us understand the transformative capacity.
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
                        <ImageWithFallback srcPrefix={opt.img} alt={opt.label} sizes="(max-width: 768px) 100vw, 20vw" />
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
