"use client";

import Image from "next/image";
import { adaptiveQuestions, absorptiveQuestions, transformativeQuestions } from "@/lib/capacityDictionaries";
import { useState } from "react";

// Helper component to try loading an image with different extensions
function ImageWithFallback({ srcPrefix, alt, sizes, className }) {
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
    return <div className={`flex items-center justify-center bg-surface-container ${className}`}><span className="text-xs text-on-surface-variant px-2 text-center">Image not available</span></div>;
  }

  return (
    <div className={`relative ${className}`}>
      <Image 
        src={`${srcPrefix}${ext}`} 
        alt={alt} 
        fill 
        sizes={sizes}
        className="object-cover rounded"
        onError={handleError}
      />
    </div>
  );
}

export default function CapacityReadOnlyView({ type, responses }) {
  let questions = [];
  if (type === 'adaptive') questions = adaptiveQuestions;
  if (type === 'absorptive') questions = absorptiveQuestions;
  if (type === 'transformative') questions = transformativeQuestions;

  return (
    <div className="space-y-8 font-sans">
      {/* Metadata Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-highest">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Facilitator</p>
          <p className="font-semibold text-sm">{responses.facilitator || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Vulnerability Note</p>
          <p className="font-semibold text-sm text-error">{responses.vulnerabilityNote || "None"}</p>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold font-headline border-b border-surface-container-highest pb-2">Survey Responses</h3>
        {questions.map((q) => {
          const selectedValue = responses[q.id];
          const option = q.options.find(o => o.value === parseInt(selectedValue));

          return (
            <div key={q.id} className="p-5 bg-surface-container-lowest rounded-xl border border-surface-container-highest">
              <p className="font-bold text-on-surface mb-4">{q.id}. {q.text}</p>
              
              {option ? (
                <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-lg border border-primary/30">
                  {option.img && (
                    <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden relative shadow-sm">
                       {/* The img path in capacityDictionaries might have an extension or not. Let's just use ImageWithFallback and strip extension if any */}
                       <ImageWithFallback 
                         srcPrefix={option.img.replace(/\.[^/.]+$/, "")} 
                         alt={option.label}
                         sizes="(max-width: 640px) 96px, 128px"
                         className="w-full h-full"
                       />
                    </div>
                  )}
                  <div className="flex-grow">
                    <span className="inline-block px-2 py-1 bg-primary text-on-primary text-[10px] font-bold uppercase rounded mb-2">Selected Answer</span>
                    <p className="text-base sm:text-lg font-bold text-on-surface">{option.label}</p>
                    <p className="text-sm text-on-surface-variant mt-1">Score value: {option.score}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-surface-container rounded-lg text-on-surface-variant italic text-sm">
                  No answer provided or invalid answer.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
