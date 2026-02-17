import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export function Header() {
    const [open, setOpen] = React.useState(false);
    const scrolled = useScroll(10);
    const navigate = useNavigate();

    const links = [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'About', href: '#about' },
    ];

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <header
            className={cn('sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300', {
                'bg-black/95 supports-[backdrop-filter]:bg-black/50 border-purple-500/10 backdrop-blur-lg':
                    scrolled,
            })}
        >
            <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
                <a href="/" className="hover:opacity-80 transition-opacity rounded-md p-2">
                    <img
                        src="/logo.png"
                        alt="Nyxie"
                        className="h-8 w-auto brightness-0 invert"
                    />
                </a>
                <div className="hidden items-center gap-2 md:flex">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            className={cn(
                                buttonVariants({ variant: 'ghost' }),
                                'text-white/80 hover:text-white hover:bg-white/10 font-[Inter]'
                            )}
                            href={link.href}
                        >
                            {link.label}
                        </a>
                    ))}
                    <Button
                        variant="outline"
                        className="rounded-full bg-white/5 text-white border border-purple-500/25 hover:bg-white/10 hover:border-purple-500/40 transition-all cursor-pointer font-[Inter]"
                        onClick={() => navigate('/login')}
                    >
                        Sign In
                    </Button>
                    <Button
                        className="rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500 shadow-[0_0_24px_rgba(147,51,234,0.4)] hover:shadow-[0_0_32px_rgba(147,51,234,0.6)] transition-all cursor-pointer font-[Inter]"
                        onClick={() => navigate('/login')}
                    >
                        Get Started
                    </Button>
                </div>
                <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setOpen(!open)}
                    className="md:hidden border-purple-500/40 text-white hover:bg-purple-500/10"
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    aria-label="Toggle menu"
                >
                    <MenuToggleIcon open={open} className="size-5" duration={300} />
                </Button>
            </nav>
            <MobileMenu open={open}>
                <div className="grid gap-y-2">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            className={cn(
                                buttonVariants({ variant: 'ghost' }),
                                'justify-start text-white/80 hover:text-white hover:bg-white/10 font-[Inter]'
                            )}
                            href={link.href}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        className="w-full bg-transparent border-purple-500/40 text-white hover:bg-purple-500/10 font-[Inter]"
                        onClick={() => navigate('/login')}
                    >
                        Sign In
                    </Button>
                    <Button
                        className="w-full bg-purple-600 text-white hover:bg-purple-700 font-[Inter]"
                        onClick={() => navigate('/login')}
                    >
                        Get Started
                    </Button>
                </div>
            </MobileMenu>
        </header>
    );
}

function MobileMenu({ open, children }) {
    if (!open || typeof window === 'undefined') return null;

    return createPortal(
        <div
            id="mobile-menu"
            className={cn(
                'bg-black/95 supports-[backdrop-filter]:bg-black/50 backdrop-blur-lg',
                'fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y border-purple-500/10 md:hidden',
            )}
        >
            <div
                data-slot={open ? 'open' : 'closed'}
                className="data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out size-full p-4 flex flex-col justify-between gap-2"
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
