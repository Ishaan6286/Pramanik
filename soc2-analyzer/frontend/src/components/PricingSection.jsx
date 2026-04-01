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
    iconBg: "bg-[hsl(var(--col-muted)/0.1)]",
    cta: "Get Started Free",
    ctaStyle: "bg-[hsl(var(--col-raise))] border border-[hsl(var(--col-border))] hover:bg-[hsl(var(--col-border))] text-[hsl(var(--col-text))]",
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
    iconBg: "bg-[hsl(var(--col-primary)/0.1)]",
    cta: "Start Starter",
    ctaStyle: "bg-[hsl(var(--col-primary)/0.1)] border border-[hsl(var(--col-primary)/0.2)] hover:bg-[hsl(var(--col-primary)/0.2)] text-[hsl(var(--col-primary))]",
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
    iconBg: "bg-[hsl(var(--col-primary)/0.15)]",
    cta: "Go Pro",
    ctaStyle: "bg-[hsl(var(--col-primary))] hover:opacity-90 text-white shadow-lg shadow-[hsl(var(--col-primary)/0.25)]",
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
    iconBg: "bg-[hsl(var(--col-accent)/0.1)]",
    cta: "Select Growth",
    ctaStyle: "bg-[hsl(var(--col-accent)/0.1)] border border-[hsl(var(--col-accent)/0.2)] hover:bg-[hsl(var(--col-accent)/0.2)] text-[hsl(var(--col-accent))]",
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
    iconBg: "bg-blue-500/10",
    cta: "Contact Sales",
    ctaStyle: "bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-500",
    badge: null,
    features: [
      "Custom Framework Support",
      "Private / On-Prem Deployment",
      "Dedicated Support",
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function PricingSection() {
  return (
    <section className="relative py-32 overflow-hidden bg-[hsl(var(--col-bg))] border-t border-[hsl(var(--col-border))]">
      
      {/* Ambient background grid */}
      <div className="absolute inset-0 bg-pattern-plus opacity-[0.07] pointer-events-none" />

      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-violet-500/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">

        {/* ── HEADER ── */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1 bg-[hsl(var(--col-primary)/0.1)] text-[hsl(var(--col-primary))] font-bold text-[11px] uppercase tracking-widest rounded-full mb-5 border border-[hsl(var(--col-primary)/0.2)]"
          >
            Pricing & Growth
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[44px] md:text-[56px] font-bold tracking-tight text-[hsl(var(--col-text))] mb-4 leading-[1.1]"
          >
            Flexible Revenue Models
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="text-[17px] text-[hsl(var(--col-muted))] max-w-xl mx-auto leading-relaxed"
          >
            Scale your compliance engine dynamically. Start free, upgrade as your audit and business needs grow.
          </motion.p>
        </div>

        {/* ── PRICING CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
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
                whileHover={{ y: -8, scale: plan.popular ? 1.03 : 1.02 }}
                className={`relative rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden
                  ${plan.popular
                    ? "border-[hsl(var(--col-primary)/0.5)] bg-[hsl(var(--col-primary)/0.04)] shadow-[0_8px_40px_hsl(var(--col-primary)/0.15)] scale-[1.02] z-10"
                    : "border-[hsl(var(--col-border))] bg-[hsl(var(--col-surface))] hover:border-[hsl(var(--col-primary)/0.3)] hover:shadow-[0_8px_30px_hsl(var(--col-primary)/0.08)]"
                  }`}
              >
                {/* Popular aura */}
                {plan.popular && (
                  <motion.div
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[hsl(var(--col-primary)/0.15)] to-transparent pointer-events-none"
                  />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-[hsl(var(--col-primary))] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-[hsl(var(--col-primary)/0.3)]">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">

                  {/* Icon + Label */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${plan.iconBg} shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${plan.iconColor}`} />
                    </div>
                    <span className="font-bold text-[15px] text-[hsl(var(--col-text))]">{plan.label}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <span className={`font-black tracking-tight leading-none ${plan.popular ? "text-[40px] text-[hsl(var(--col-primary))]" : "text-[36px] text-[hsl(var(--col-text))]"}`}>
                      {plan.priceDisplay}
                    </span>
                    {plan.price && (
                      <span className="text-[13px] text-[hsl(var(--col-muted))] font-medium ml-1">/mo</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[hsl(var(--col-muted))] font-medium mb-1">{plan.priceSub}</p>

                  {/* Description */}
                  <p className="text-[13px] text-[hsl(var(--col-sub))] leading-relaxed mb-6 mt-2">
                    {plan.description}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-[hsl(var(--col-border))] mb-5" />

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? "bg-[hsl(var(--col-primary)/0.2)]" : "bg-[hsl(var(--col-border))]"}`}>
                          <Check className={`w-2.5 h-2.5 ${plan.popular ? "text-[hsl(var(--col-primary))]" : "text-[hsl(var(--col-muted))]"}`} />
                        </span>
                        <span className="text-[13px] text-[hsl(var(--col-sub))] leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    className={`w-full py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
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
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center text-[13px] text-[hsl(var(--col-muted))] font-medium mt-12"
        >
          Trusted by compliance teams and consulting partners worldwide · All plans include SSL & SLA
        </motion.p>

      </div>
    </section>
  );
}
