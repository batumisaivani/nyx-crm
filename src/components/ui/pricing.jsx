import React from 'react'
import { PlusIcon, ShieldCheckIcon, Building2, UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import { Badge } from './badge'
import { Button } from './button'
import { cn } from '../../lib/utils'

export function Pricing() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 px-6">
      <div id="pricing" className="mx-auto w-full max-w-6xl space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl space-y-5"
        >
          <div className="text-[10px] tracking-[0.3em] uppercase text-purple-400 font-semibold flex items-center justify-center gap-2.5 font-[Inter]">
            <span className="w-[30px] h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            Pricing
            <span className="w-[30px] h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          </div>
          <h2 className="font-[Playfair] text-[clamp(2rem,4.5vw,3.2rem)] font-normal leading-[1.15] text-center text-[#f0ecf9]">
            Simple pricing that <em className="italic text-purple-300">scales</em> with you.
          </h2>
          <p className="text-[0.95rem] text-[#b8b0ce] max-w-[520px] mx-auto leading-[1.7] font-light font-[Inter] text-center">
            A flat monthly fee for your facility, plus a small cost per specialist. No hidden fees, no surprises.
          </p>
        </motion.div>

        <div className="relative pt-8">
          <div
            className={cn(
              'pointer-events-none absolute inset-0 size-full',
              'bg-[linear-gradient(to_right,rgba(147,108,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(147,108,255,0.08)_1px,transparent_1px)]',
              'bg-[size:32px_32px]',
              '[mask-image:radial-gradient(ellipse_at_center,black_10%,transparent)]',
            )}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mx-auto w-full max-w-2xl space-y-3"
          >
            <div className="grid md:grid-cols-2 relative border border-purple-500/10 p-4 bg-black/50 backdrop-blur-sm">
              <PlusIcon className="absolute -top-3 -left-3 size-5.5 text-purple-500/40" />
              <PlusIcon className="absolute -top-3 -right-3 size-5.5 text-purple-500/40" />
              <PlusIcon className="absolute -bottom-3 -left-3 size-5.5 text-purple-500/40" />
              <PlusIcon className="absolute -right-3 -bottom-3 size-5.5 text-purple-500/40" />

              {/* Facility Registration */}
              <div className="w-full px-4 pt-5 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-purple-400" />
                      <h3 className="leading-none font-semibold text-[#f0ecf9] font-[Inter]">Facility</h3>
                    </div>
                    <Badge variant="secondary">Base plan</Badge>
                  </div>
                  <p className="text-[#b8b0ce] text-sm font-[Inter]">Register your facility and get full CRM access.</p>
                </div>
                <div className="mt-10 space-y-4">
                  <div className="text-white/40 flex items-end gap-0.5 text-xl font-[Inter]">
                    <span>$</span>
                    <span className="text-[#f0ecf9] -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
                      7.99
                    </span>
                    <span>/month</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500 shadow-[0_0_24px_rgba(147,51,234,0.3)] hover:shadow-[0_0_32px_rgba(147,51,234,0.5)] transition-all cursor-pointer font-[Inter]"
                    asChild
                  >
                    <a href="#">Register Facility</a>
                  </Button>
                </div>
              </div>

              {/* Per Specialist */}
              <div className="relative w-full rounded-lg border border-purple-500/10 px-4 pt-5 pb-4 bg-purple-500/5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="size-4 text-purple-400" />
                      <h3 className="leading-none font-semibold text-[#f0ecf9] font-[Inter]">Specialist</h3>
                    </div>
                    <Badge>Per person</Badge>
                  </div>
                  <p className="text-[#b8b0ce] text-sm font-[Inter]">Add specialists as your team grows.</p>
                </div>
                <div className="mt-10 space-y-4">
                  <div className="text-white/40 flex items-end gap-0.5 text-xl font-[Inter]">
                    <span>$</span>
                    <span className="text-[#f0ecf9] -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
                      4.99
                    </span>
                    <span>/each</span>
                  </div>
                  <Button
                    className="w-full bg-transparent border border-purple-500/25 text-white hover:bg-white/5 hover:border-purple-500/40 transition-all cursor-pointer font-[Inter]"
                    variant="outline"
                    asChild
                  >
                    <a href="#">Add Specialists</a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-[#b8b0ce] flex items-center justify-center gap-x-2 text-sm font-[Inter]">
              <ShieldCheckIcon className="size-4 text-purple-400" />
              <span>All features included — only pay for your team size</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
