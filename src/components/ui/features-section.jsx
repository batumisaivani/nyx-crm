import { motion } from 'motion/react'

const features = [
  {
    image: '/features/card-1.png',
    title: 'Client browses.',
    accent: 'Every signal is captured.',
    accentColor: 'text-[#00EBFB]',
  },
  {
    image: '/features/card-2.png',
    title: 'Nyxie AI kicks in.',
    accent: 'Behavior becomes insight.',
    accentColor: 'text-purple-300',
  },
  {
    image: '/features/card-3.png',
    title: 'Facility acts.',
    accent: 'Right offer, right time.',
    accentColor: 'text-rose-300',
  },
]

export function FeaturesSection() {
  return (
    <section className="relative py-24 px-6">
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="text-[10px] tracking-[0.3em] uppercase text-purple-400 font-semibold mb-4 flex items-center justify-center gap-2.5 font-[Inter]">
            <span className="w-[30px] h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            How It Works
            <span className="w-[30px] h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          </div>
          <h2 className="font-[Playfair] text-[clamp(2rem,4.5vw,3.2rem)] font-normal leading-[1.15] mb-4 text-[#f0ecf9]">
            User books. AI <em className="italic text-purple-300">understands.</em><br />
            Facility <em className="italic text-purple-300">grows.</em>
          </h2>
          <p className="text-[0.95rem] text-[#b8b0ce] max-w-[520px] mx-auto leading-[1.7] font-light font-[Inter]">
            Three things happen every time a client interacts with your business.
          </p>
        </motion.div>

        {/* Three cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="flex flex-col"
            >
              <div className="rounded-2xl overflow-hidden border border-purple-500/10 hover:border-purple-500/25 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.35),0_0_60px_rgba(147,108,255,0.05)]">
                <img
                  src={feature.image}
                  alt={`${feature.title} ${feature.accent}`}
                  className="w-full h-auto block"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-14 pt-8 border-t border-purple-500/[0.05]"
        >
          <p className="text-sm text-[#7d7694] max-w-[520px] mx-auto leading-relaxed font-[Inter]">
            The user gets a perfectly timed recommendation. The salon gets a pre-qualified prospect. <strong className="text-purple-300 font-semibold">Nyxie makes it effortless for both.</strong>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
