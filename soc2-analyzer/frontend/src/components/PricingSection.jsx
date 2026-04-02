import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles, Zap, Shield, Building2, Star } from "lucide-react";

const PLANS = [
  {
    key: "free",
    label: "Free",
    price: null,
    priceDisplay: "Free",
    priceSub: "No credit card required",
    description: "Explore AI-powered compliance with essential tools",
    icon: Star,
    iconColor: "text-[hsl(var(--col-muted))]",
    iconBg: "bg-[hsl(var(--col-muted)/0.08)]",
    cta: "Get Started Free",
    ctaStyle: "bg-[hsl(var(--col-raise))] border border-[hsl(var(--col-border))] hover:border-[hsl(var(--col-primary)/0.3)] text-[hsl(var(--col-text))]",
    badge: null,
    features: [
      "Limited compliance checks",
      "Basic AI assistance",
      "Preview-only reports",
      "Limited usage per month",
    ],
  },
  {
    key: "starter",
    label: "Starter",
    price: 499,
    priceDisplay: "Rs. 499",
    priceSub: "per month",
    description: "Essential compliance foundation for early-stage teams",
    icon: Zap,
    iconColor: "text-[hsl(var(--col-primary))]",
    iconBg: "bg-[hsl(var(--col-primary)/0.08)]",
    cta: "Start Starter",
    ctaStyle: "bg-[hsl(var(--col-primary)/0.08)] border border-[hsl(var(--col-primary)/0.22)] hover:bg-[hsl(var(--col-primary)/0.14)] hover:border-[hsl(var(--col-primary)/0.38)] text-[hsl(var(--col-primary))]",
    badge: null,
    features: [
      "1 Compliance Framework",
      "Limited Integrations",
      "Automated Evidence Collection",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    price: 999,
    priceDisplay: "Rs. 999",
    priceSub: "per month",
    description: "Multi-framework compliance for growing companies",
    icon: Sparkles,
    iconColor: "text-[hsl(var(--col-primary))]",
    iconBg: "bg-[hsl(var(--col-primary)/0.12)]",
    cta: "Go Pro",
    ctaStyle: "bg-[hsl(var(--col-primary))] hover:bg-[hsl(168_46%_30%)] text-white",
    badge: "Most Popular",
    popular: true,
    features: [
      "Multiple Framework Support",
      "Unlimited Integrations",
      "Security Questionnaires",
    ],
  },
  {
    key: "growth",
    label: "Growth",
    price: 2499,
    priceDisplay: "Rs. 2,499",
    priceSub: "per month",
    description: "Advanced workflows and AI-powered governance",
    icon: Shield,
    iconColor: "text-[hsl(var(--col-accent))]",
    iconBg: "bg-[hsl(var(--col-accent)/0.08)]",
    cta: "Select Growth",
    ctaStyle: "bg-[hsl(var(--col-accent)/0.08)] border border-[hsl(var(--col-accent)/0.22)] hover:bg-[hsl(var(--col-accent)/0.14)] hover:border-[hsl(var(--col-accent)/0.38)] text-[hsl(var(--col-accent))]",
    badge: null,
    features: [
      "AI-driven Compliance Insights",
      "Vendor Risk Management",
      "Continuous Monitoring",
    ],
  },
  {
    key: "enterprise",
    label: "Enterprise",
    price: null,
    priceDisplay: "Custom",
    priceSub: "Talk to our team",
    description: "Tailored compliance infrastructure for large organizations",
    icon: Building2,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/8",
    cta: "Contact Sales",
    ctaStyle: "bg-blue-500/8 border border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/35 text-blue-500",
    badge: null,
    features: [
      "Custom Framework Support",
      "Private / On-Prem Deployment",
      "Dedicated Support",
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function PricingSection() {
  return (
    <section className="relative py-28 overflow-hidden bg-[hsl(var(--col-bg))] border-t border-[hsl(var(--col-border))]">

      {/* Very subtle ambient background */}
      <div className="absolute inset-0 bg-pattern-dots opacity-[0.06] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[hsl(var(--col-primary)/0.04)] blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">

        {/* ── HEADER ── */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="badge mb-5"
          >
            Pricing &amp; Growth
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-[38px] md:text-[50px] font-bold tracking-[-0.03em] text-[hsl(var(--col-text))] mt-4 mb-3 leading-[1.1]"
          >
            Flexible Revenue Models
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="text-[16px] text-[hsl(var(--col-muted))] max-w-lg mx-auto leading-relaxed"
          >
            Scale your compliance engine dynamically. Start free, upgrade as your audit and business needs grow.
          </motion.p>
        </div>

        {/* ── PRICING CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.key}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden
                  ${plan.popular
                    ? "border-[hsl(var(--col-primary)/0.45)] bg-[hsl(var(--col-surface))] ring-2 ring-[hsl(var(--col-primary)/0.18)] z-10"
                    : "border-[hsl(var(--col-border))] bg-[hsl(var(--col-surface))] hover:border-[hsl(var(--col-primary)/0.28)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)]"
                  }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-3.5 right-3.5 z-10">
                    <span className="bg-[hsl(var(--col-primary))] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">

                  {/* Icon + Label */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.iconBg} shrink-0`}>
                      <Icon className={`w-4 h-4 ${plan.iconColor}`} />
                    </div>
                    <span className="font-bold text-[14px] text-[hsl(var(--col-text))]">{plan.label}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <span className={`font-black tracking-tight leading-none ${plan.popular ? "text-[36px] text-[hsl(var(--col-primary))]" : "text-[32px] text-[hsl(var(--col-text))]"}`}>
                      {plan.priceDisplay}
                    </span>
                    {plan.price && (
                      <span className="text-[12px] text-[hsl(var(--col-muted))] font-medium ml-1">/mo</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[hsl(var(--col-muted))] font-medium mb-1">{plan.priceSub}</p>

                  {/* Description */}
                  <p className="text-[12px] text-[hsl(var(--col-sub))] leading-relaxed mb-5 mt-2">
                    {plan.description}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-[hsl(var(--col-border))] mb-4" />

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${plan.popular ? "bg-[hsl(var(--col-primary)/0.15)]" : "bg-[hsl(var(--col-border))]"}`}>
                          <Check className={`w-2.5 h-2.5 ${plan.popular ? "text-[hsl(var(--col-primary))]" : "text-[hsl(var(--col-muted))]"}`} />
                        </span>
                        <span className="text-[12px] text-[hsl(var(--col-sub))] leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    className={`w-full py-2.5 rounded-[10px] font-semibold text-[13px] flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-px ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── TRUST LINE ── */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-center text-[12px] text-[hsl(var(--col-muted))] font-medium mt-10"
        >
          Trusted by compliance teams worldwide &nbsp;·&nbsp; All plans include SSL &amp; SLA
        </motion.p>

      </div>
    </section>
  );
}
