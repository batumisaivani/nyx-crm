import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RocketIcon, ArrowRightIcon, PhoneCallIcon } from "lucide-react";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { TextShimmer } from "@/components/ui/text-shimmer";
import Floating, { FloatingElement } from "@/components/ui/floating";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
    const navigate = useNavigate();

    return (
        <section className="relative mx-auto w-full max-w-5xl">
            {/* Floating parallax elements — pushed to corners */}
            <Floating sensitivity={1.5} easingFactor={0.04} className="pointer-events-none z-0">
                <FloatingElement depth={0.5} className="-top-[5%] -left-[15%]">
                    <div className="w-72 h-72 rounded-full bg-purple-600/50 blur-[120px]" />
                </FloatingElement>
                <FloatingElement depth={1.2} className="-top-[5%] -right-[15%]">
                    <div className="w-80 h-80 rounded-full bg-violet-500/40 blur-[140px]" />
                </FloatingElement>
                <FloatingElement depth={2} className="bottom-[5%] -left-[20%]">
                    <div className="w-56 h-56 rounded-full bg-purple-500/50 blur-[100px]" />
                </FloatingElement>
                <FloatingElement depth={1.8} className="bottom-[5%] -right-[20%]">
                    <div className="w-48 h-48 rounded-full bg-fuchsia-500/35 blur-[100px]" />
                </FloatingElement>
                <FloatingElement depth={0.8} className="-bottom-[10%] -right-[10%]">
                    <div className="w-64 h-64 rounded-full bg-indigo-500/40 blur-[120px]" />
                </FloatingElement>
                <FloatingElement depth={1.5} className="-top-[10%] -left-[5%]">
                    <div className="w-44 h-44 rounded-full bg-violet-400/45 blur-[90px]" />
                </FloatingElement>
            </Floating>

            {/* Gradient backdrop — pushed to edges */}
            <div aria-hidden="true" className="absolute inset-0 -z-10">
                {/* Top-left corner */}
                <div className="absolute -top-[30%] -left-[20%] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.15)_0%,transparent_65%)]" />
                {/* Top-right corner */}
                <div className="absolute -top-[25%] -right-[20%] w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.12)_0%,transparent_60%)]" />
                {/* Bottom-left corner */}
                <div className="absolute -bottom-[20%] -left-[15%] w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1)_0%,transparent_60%)]" />
                {/* Bottom-right corner */}
                <div className="absolute -bottom-[25%] -right-[15%] w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.1)_0%,transparent_60%)]" />
            </div>

            {/* X Bold Faded Borders – purple */}
            <div
                aria-hidden="true"
                className="absolute inset-0 mx-auto hidden min-h-screen w-full max-w-5xl lg:block"
            >
                <div className="mask-y-from-80% mask-y-to-100% absolute inset-y-0 left-0 z-10 h-full w-px bg-purple-500/25" />
                <div className="mask-y-from-80% mask-y-to-100% absolute inset-y-0 right-0 z-10 h-full w-px bg-purple-500/25" />
            </div>

            {/* main content */}
            <div className="relative flex flex-col items-center justify-center gap-5 pt-32 pb-30">
                {/* X Content Faded Borders – purple */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-1 size-full overflow-hidden"
                >
                    <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-purple-500/25 to-purple-500/25 md:left-8" />
                    <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-purple-500/25 to-purple-500/25 md:right-8" />
                    <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-purple-500/12 to-purple-500/12 md:left-12" />
                    <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-purple-500/12 to-purple-500/12 md:right-12" />
                </div>

                {/* Pill badge */}
                <a
                    className={cn(
                        "group mx-auto flex w-fit items-center gap-3 rounded-full border border-purple-500/25 bg-white/5 px-3 py-1 shadow",
                        "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out",
                        "hover:bg-white/10 hover:border-purple-500/40"
                    )}
                    href="#"
                >
                    <RocketIcon className="size-3 text-purple-400" />
                    <span className="text-xs text-white/70 font-[Inter]">waitlist is open</span>
                    <span className="block h-5 border-l border-purple-500/25" />
                    <ArrowRightIcon className="size-3 text-purple-400 duration-150 ease-out group-hover:translate-x-1" />
                </a>

                {/* Heading */}
                <h1
                    className={cn(
                        "fade-in slide-in-from-bottom-10 animate-in text-balance fill-mode-backwards text-center text-4xl tracking-tight delay-100 duration-500 ease-out md:text-6xl lg:text-7xl",
                        "font-[Playfair] font-light text-white",
                        "drop-shadow-[0_0px_50px_rgba(168,85,247,0.3)]"
                    )}
                >
                    The <TextShimmer as="span" duration={2} spread={2} className="italic font-light">intelligence</TextShimmer> layer <br /> for client relationships
                </h1>

                {/* Subtitle */}
                <p className="fade-in slide-in-from-bottom-10 mx-auto max-w-md animate-in fill-mode-backwards text-center text-sm text-white/60 tracking-wider delay-200 duration-500 ease-out sm:text-base md:text-lg font-[Inter] font-light">
                    Nurture every client relationship with predictive AI and gamified loyalty.
                </p>

                {/* CTA Buttons */}
                <div className="fade-in slide-in-from-bottom-10 flex animate-in flex-row flex-wrap items-center justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
                    <Button
                        className="rounded-full bg-white/5 text-white border border-purple-500/25 hover:bg-white/10 hover:border-purple-500/40 transition-all font-[Inter] text-sm cursor-pointer"
                        size="lg"
                        variant="secondary"
                    >
                        <PhoneCallIcon data-icon="inline-start" className="size-4 mr-2" />{" "}
                        Book a Call
                    </Button>
                    <Button
                        className="rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500 shadow-[0_0_24px_rgba(147,51,234,0.4)] hover:shadow-[0_0_32px_rgba(147,51,234,0.6)] transition-all font-[Inter] text-sm cursor-pointer"
                        size="lg"
                        onClick={() => navigate('/login')}
                    >
                        Get started{" "}
                        <ArrowRightIcon
                            className="size-4 ms-2"
                            data-icon="inline-end"
                        />
                    </Button>
                </div>
            </div>
        </section>
    );
}

export function LogosSection() {
    return (
        <section className="relative space-y-4 border-t border-purple-500/10 pt-6 pb-10">
            <h2 className="text-center font-light text-lg text-white/50 tracking-tight md:text-xl font-[Inter]">
                Trusted by <span className="text-white">experts</span>
            </h2>
            <div className="relative z-10 mx-auto max-w-4xl">
                <LogoCloud logos={logos} />
            </div>
        </section>
    );
}

const logos = [
    {
        src: "https://storage.efferd.com/logo/nvidia-wordmark.svg",
        alt: "Nvidia Logo",
    },
    {
        src: "https://storage.efferd.com/logo/supabase-wordmark.svg",
        alt: "Supabase Logo",
    },
    {
        src: "https://storage.efferd.com/logo/openai-wordmark.svg",
        alt: "OpenAI Logo",
    },
    {
        src: "https://storage.efferd.com/logo/turso-wordmark.svg",
        alt: "Turso Logo",
    },
    {
        src: "https://storage.efferd.com/logo/vercel-wordmark.svg",
        alt: "Vercel Logo",
    },
    {
        src: "https://storage.efferd.com/logo/github-wordmark.svg",
        alt: "GitHub Logo",
    },
    {
        src: "https://storage.efferd.com/logo/claude-wordmark.svg",
        alt: "Claude AI Logo",
    },
    {
        src: "https://storage.efferd.com/logo/clerk-wordmark.svg",
        alt: "Clerk Logo",
    },
];
