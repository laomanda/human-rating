"use client";
import React, { useState, useRef } from "react";

import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface iNavItem {
	heading: string;
	href: string;
	subheading?: string;
}

interface iNavLinkProps extends iNavItem {
	setIsActive: (isActive: boolean) => void;
	index: number;
}

interface iCurvedNavbarProps {
	setIsActive: (isActive: boolean) => void;
	navItems: iNavItem[];
}

interface iHeaderProps {
	navItems?: iNavItem[];
	footer?: React.ReactNode;
}

const MENU_SLIDE_ANIMATION = {
	initial: { x: "calc(100% + 100px)" },
	enter: { x: "0", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] } },
	exit: {
		x: "calc(100% + 100px)",
		transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
	},
};

const defaultNavItems: iNavItem[] = [
	{
		heading: "Beranda Utama",
		href: "/",
		subheading: "Ukur performa harian tanpa self-bias",
	},
	{
		heading: "Fitur Unggulan",
		href: "#features",
		subheading: "Bento grid & perbandingan objektif",
	},
	{
		heading: "Rating Engine",
		href: "#scoring-engine",
		subheading: "Algoritma deterministik 3 dimensi",
	},
	{
		heading: "Simulator Skor",
		href: "#simulator",
		subheading: "Uji simulasi kalkulasi real-time",
	},
	{
		heading: "Eksplorasi Komunitas",
		href: "/dashboard/explore",
		subheading: "Jelajahi top 1% global performers",
	},
];

const CustomFooter: React.FC = () => {
	return (
		<div className="flex flex-col gap-3.5 w-full px-6 md:px-10 py-5 border-t border-border bg-background/95 backdrop-blur-md">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2.5">
					<span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Tema</span>
					<ThemeToggle />
				</div>

				<Link
					href="/dashboard"
					className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
				>
					<span>Masuk Dashboard</span>
					<ArrowRight className="w-3.5 h-3.5" />
				</Link>
			</div>

			<div className="flex items-center justify-between pt-2 border-t border-border/50">
				<span className="text-[10px] text-muted-foreground font-mono">HuMob 2.0 • Deterministic Math</span>
			</div>
		</div>
	);
};

const NavLink: React.FC<iNavLinkProps> = ({
	heading,
	href,
	subheading,
	setIsActive,
	index,
}) => {
	const ref = useRef<HTMLAnchorElement | null>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const handleMouseMove = (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
	) => {
		const rect = ref.current!.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		x.set(mouseX / rect.width - 0.5);
		y.set(mouseY / rect.height - 0.5);
	};

	const handleClick = () => {
		return setIsActive(false);
	};

	return (
		<motion.div
			onClick={handleClick}
			initial="initial"
			whileHover="whileHover"
			className="group relative flex flex-col border-b border-border/60 py-3.5 transition-colors duration-300"
		>
			<Link ref={ref} onMouseMove={handleMouseMove} href={href} className="w-full block">
				<div className="flex items-baseline gap-3.5">
					<span className="text-muted-foreground font-mono text-base font-medium">
						0{index}.
					</span>
					<div className="flex flex-col">
						<motion.span
							variants={{
								initial: { x: 0 },
								whileHover: { x: 4 },
							}}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
							className="text-lg md:text-xl font-heading font-medium text-foreground group-hover:text-emerald-500 transition-colors tracking-tight"
						>
							{heading}
						</motion.span>
						{subheading && (
							<span className="text-xs text-muted-foreground font-sans font-normal mt-0.5 group-hover:text-foreground/80 transition-colors">
								{subheading}
							</span>
						)}
					</div>
				</div>
			</Link>
		</motion.div>
	);
};

const Curve: React.FC = () => {
	const windowHeight = typeof window !== "undefined" ? window.innerHeight : 1000;
	const initialPath = `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q-100 ${windowHeight / 2} 100 0`;
	const targetPath = `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q100 ${windowHeight / 2} 100 0`;

	const curve = {
		initial: { d: initialPath },
		enter: {
			d: targetPath,
			transition: { duration: 1, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
		},
		exit: {
			d: initialPath,
			transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
		},
	};

	return (
		<svg
			className="absolute top-0 -left-[99px] w-[100px] stroke-none h-full text-background dark:text-zinc-950 fill-current"
		>
			<motion.path
				variants={curve}
				initial="initial"
				animate="enter"
				exit="exit"
			/>
		</svg>
	);
};

const CurvedNavbar: React.FC<
	iCurvedNavbarProps & { footer?: React.ReactNode }
> = ({ setIsActive, navItems, footer }) => {
	return (
		<motion.div
			variants={MENU_SLIDE_ANIMATION}
			initial="initial"
			animate="enter"
			exit="exit"
			className="h-[100dvh] w-screen max-w-md fixed right-0 top-0 z-50 bg-background text-foreground border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden"
		>
			<div className="h-full flex flex-col justify-between">
				{/* Top Content */}
				<div className="flex flex-col gap-6 px-6 md:px-10 pt-6">
					{/* Header inside Drawer with Logo & Close Button */}
					<div className="flex items-center justify-between border-b border-border pb-4">
						<div className="flex items-center gap-2.5">
							<Image
								src="/logo.webp"
								alt="HuMob Logo"
								width={32}
								height={32}
								className="object-contain"
							/>
							<span className="font-heading font-bold text-lg text-foreground tracking-tight">
								HuMob<span className="text-emerald-500">.</span>
							</span>
						</div>

						{/* Close Button */}
						<button
							onClick={() => setIsActive(false)}
							aria-label="Close Menu"
							className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					{/* Navigation List */}
					<section className="bg-transparent mt-1">
						<div className="mx-auto">
							{navItems.map((item, index) => {
								return (
									<NavLink
										key={item.href}
										{...item}
										setIsActive={setIsActive}
										index={index + 1}
									/>
								);
							})}
						</div>
					</section>
				</div>

				{/* Footer */}
				{footer}
			</div>

			<Curve />
		</motion.div>
	);
};

const Header: React.FC<iHeaderProps> = ({
	navItems = defaultNavItems,
	footer = <CustomFooter />,
}) => {
	const [isActive, setIsActive] = useState(false);

	const handleClick = () => {
		setIsActive(!isActive);
	};

	return (
		<>
			<button
				onClick={handleClick}
				aria-label="Toggle Menu"
				className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors focus:outline-none"
			>
				<div className="relative w-4 h-3.5 flex flex-col justify-between items-center">
					<span
						className={`block h-0.5 w-4 bg-foreground transition-transform duration-300 ${isActive ? "rotate-45 translate-y-1.5" : ""}`}
					></span>
					<span
						className={`block h-0.5 w-4 bg-foreground transition-opacity duration-300 ${isActive ? "opacity-0" : ""}`}
					></span>
					<span
						className={`block h-0.5 w-4 bg-foreground transition-transform duration-300 ${isActive ? "-rotate-45 -translate-y-1.5" : ""}`}
					></span>
				</div>
			</button>

			<AnimatePresence mode="wait">
				{isActive && (
					<CurvedNavbar
						setIsActive={setIsActive}
						navItems={navItems}
						footer={footer}
					/>
				)}
			</AnimatePresence>
		</>
	);
};

export default Header;
