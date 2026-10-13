"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Quote } from "lucide-react";
import { TestimonialItem } from "@/lib/constants";

interface TestimonialCardProps {
  testimonial: TestimonialItem;
  index: number;
}

export function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="relative flex flex-col justify-between h-full rounded-2xl border border-white/[0.08] bg-[#0D131D] p-7 sm:p-8 shadow-xl hover:border-white/[0.18] transition-all duration-300 group"
    >
      <div>
        {/* Quote Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-emerald-400">
          <Quote className="w-5 h-5 opacity-80" />
        </div>

        {/* Quotation text */}
        <p className="text-base sm:text-lg text-[#F5F7FA] leading-relaxed italic font-sans group-hover:text-white transition-colors">
          "{testimonial.quote}"
        </p>
      </div>

      {/* User Info */}
      <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-full bg-gradient-to-tr ${testimonial.avatarBg} flex items-center justify-center font-bold text-[#05070B] text-sm shadow-md border border-white/10 shrink-0`}
        >
          {testimonial.initials}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#F5F7FA] tracking-tight">
            {testimonial.name}
          </h3>
          <p className="text-xs text-slate-300">
            {testimonial.role} &middot;{" "}
            <span className="text-emerald-300 font-medium">{testimonial.company}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
