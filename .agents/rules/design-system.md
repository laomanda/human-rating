# Rule: HuMob Design System Compliance

When generating or editing UI components, styling, or page layouts in HuMob, you MUST strictly follow `docs/DESIGN_SYSTEM.md`.

## Mandatory Rules:
1. **Typography**:
   - Headings: `Plus Jakarta Sans` (`font-heading tracking-tight`)
   - Body: `Inter` (`font-sans text-muted-foreground`)
   - Metrics/Scores/Timers: `JetBrains Mono` (`font-mono tabular-nums`)
2. **Themes**: Support Light & Dark Mode natively using HSL tokens (`var(--background)`, `var(--foreground)`, `var(--card)`).
3. **Cards & Glassmorphism**: Use `.glass-card` with 1px top-edge inner specular highlight (`border-t border-white/15` dark mode / `border-t border-black/10` light mode).
4. **Pseudo-Classes**:
   - `:hover`: `hover:-translate-y-0.5 transition-all duration-200 hover:border-emerald-500/30`
   - `:active`: `active:scale-[0.985] transition-transform duration-100`
   - `:focus-visible`: `focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2`
5. **Anti-Slop Enforcement**: NEVER use generic purple/blue neon gradients, 2px thick bright borders, or heavy dark muddy drop shadows.
