'use client';

import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items: FAQItem[];
}

export default function BlogFAQ({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Generate FAQ Schema JSON-LD
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  const toggleItem = (index: number) => {
    setOpenIndex(prev => prev === index ? null : index);
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="my-8 space-y-4">
        <h2 className="text-2xl font-bold font-header text-gray-900 mb-6">Frequently Asked Questions</h2>
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                className="flex items-center justify-between w-full p-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-100 transition-colors text-left"
                onClick={() => toggleItem(index)}
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="p-4 pt-0 text-gray-700 border-t border-gray-200">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
