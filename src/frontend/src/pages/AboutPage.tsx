import { Globe, Lock, Music, Shield, Upload, Zap } from "lucide-react";
import { motion } from "motion/react";

export default function AboutPage() {
  const steps = [
    {
      icon: Upload,
      step: "01",
      title: "Upload",
      description:
        "Artists upload their tracks in MP3 or WAV format directly to the blockchain — fully decentralized, fully yours.",
    },
    {
      icon: Globe,
      step: "02",
      title: "Distribute",
      description:
        "Your music reaches listeners worldwide through our premium catalog, beautifully presented with gold-standard UX.",
    },
    {
      icon: Zap,
      step: "03",
      title: "Earn",
      description:
        "Fans purchase your tracks via secure Stripe checkout. Payments are verified on-chain before downloads are unlocked.",
    },
  ];

  const pillars = [
    {
      icon: Lock,
      title: "Blockchain-Powered",
      description:
        "Your content lives on the Internet Computer — censorship-resistant, always available, and owned by you.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description:
        "Real Stripe integration means every transaction is verified before download access is granted. No loopholes.",
    },
    {
      icon: Music,
      title: "Lossless Fidelity",
      description:
        "Tracks are stored and delivered in their original format — WAV or MP3 — exactly as you uploaded them.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,oklch(0.45_0.13_85/0.15),transparent_70%)]" />
        <div className="container mx-auto max-w-4xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="text-5xl mb-6 block crown-glow">👑</span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-gold mb-6 leading-tight">
              Built for Artists Who
              <br />
              <span className="text-foreground">Refuse to Settle</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Chosen One Distribution is the premium gateway between artists and
              their audience — powered by blockchain, secured by Stripe, and
              designed to make legends.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-2xl p-10 md:p-14 border border-gold/20 text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gold mb-6">
              Our Mission
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              The music industry has long favored gatekeepers over creators. We
              built Chosen One Distribution to flip that script. Every artist
              deserves a platform that respects their craft, protects their
              rights, and puts money directly in their hands — without
              middlemen, without compromises.
            </p>
            <div className="mt-8 h-px w-24 bg-gold/40 mx-auto" />
            <p className="mt-6 text-gold/80 font-display italic text-xl">
              Where Legends Are Distributed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It <span className="text-gold">Works</span>
            </h2>
            <p className="text-muted-foreground">
              Three steps from creation to compensation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="glass-card rounded-xl p-8 border border-gold/15 flex flex-col items-center text-center group hover:border-gold/40 transition-colors duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <item.icon className="w-6 h-6 text-gold" />
                </div>
                <span className="text-xs tracking-widest text-gold/50 font-mono mb-2">
                  STEP {item.step}
                </span>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Chosen One */}
      <section className="py-16 px-4 pb-24">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why <span className="text-gold">Chosen One</span>
            </h2>
            <p className="text-muted-foreground">
              We built the platform we always wished existed.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="glass-card rounded-xl p-8 border border-gold/15 hover:border-gold/40 transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
