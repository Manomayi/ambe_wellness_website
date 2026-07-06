"use client";
import React from "react";
import Image from "next/image";

// items: [{ title, body }]; image: src for the hands photo (kept on the right)
export default function BiomarkersAccordion({ items, image, imageAlt }) {
  const [openIndex, setOpenIndex] = React.useState(0); // first item open by default

  const toggle = (index) => {
    // one item open at a time; clicking the open item closes it
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="bg-white rounded-lg p-6 sm:p-8 md:p-10" style={{ border: "1px solid #E0E0E0" }}>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
        {/* Accordion */}
        <div className="w-full lg:flex-1">
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#FFD3AC" }}
          >
            Q&amp;A
          </div>

          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.title} style={{ borderTop: index === 0 ? "none" : "1px solid #F4F1EA" }}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left py-4 cursor-pointer"
                >
                  <span
                    className="font-heading text-base sm:text-lg font-medium"
                    style={{ color: "#353535" }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="text-2xl font-light flex-shrink-0 leading-none"
                    style={{ color: "#FFD3AC" }}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <p
                    className="text-sm sm:text-base leading-relaxed pb-5"
                    style={{ color: "#353535" }}
                  >
                    {item.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Hands photo — kept on the right */}
        <div className="w-full lg:flex-1">
          <div
            className="relative overflow-hidden h-[250px] sm:h-[300px] md:h-[350px] lg:h-full min-h-[300px] w-full mx-auto max-w-md lg:max-w-none"
            style={{ borderRadius: "0 150px 0 150px" }}
          >
            <Image
              src={image}
              alt={imageAlt}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
