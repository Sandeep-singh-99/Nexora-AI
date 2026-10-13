"use client";

import * as React from "react";
import { motion } from "motion/react";
import { TESTIMONIALS } from "@/lib/constants";
import { TestimonialCard } from "@/components/landing/testimonial-card";

export function Testimonials() {
  return (
    <section aria-label="Testimonials" className="relative py-24 sm:py-32 bg-[#0A0F18] border-t border-white/[0.06] overflow-hidden">
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-15 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs sm:text-sm font-semibold tracking-widest text-teal-400 uppercase mb-3 font-mono"
          >
            TRUSTED BY MODERN TEAMS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-[#F5F7FA] tracking-tight"
          >
            Built for people who work with knowledge.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed"
          >
            From research and product strategy to engineering and decision-making, Nexora helps teams turn information into action.
          </motion.p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((testimonial, idx) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
