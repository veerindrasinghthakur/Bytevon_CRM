import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge aware of Bytevon design tokens (see styles/tokens.css +
 * tailwind.config.js). Without this, default twMerge treats custom
 * `text-<token>` classes (e.g. text-on-primary, text-body-md) as one
 * conflicting group and silently drops the text COLOR whenever a text
 * SIZE is also present — e.g. every Button lost its variant text color.
 */
const CUSTOM_COLORS = [
  'background',
  'surface',
  'surface-bright',
  'surface-variant',
  'surface-tint',
  'surface-container',
  'surface-container-low',
  'surface-container-high',
  'surface-container-highest',
  'surface-container-lowest',
  'on-surface',
  'on-surface-variant',
  'on-background',
  'primary',
  'on-primary',
  'primary-container',
  'primary-fixed',
  'secondary',
  'on-secondary',
  'secondary-container',
  'on-secondary-container',
  'error',
  'on-error',
  'error-container',
  'outline',
  'outline-variant',
  'deep-navy',
  'electric-blue',
  'sidebar-accent',
  'sidebar-item-active',
  'surface-sidebar',
  'inverse-primary',
  'success-emerald',
  'on-success',
  'success-container',
  'warning-amber',
  'on-warning',
  'warning-container',
  'scrim',
  'shadow',
]

const CUSTOM_FONT_SIZES = [
  'body-sm',
  'body-md',
  'body-lg',
  'label-sm',
  'label-md',
  'title-lg',
  'headline-md',
  'headline-lg',
  'nav-item',
  'nav-group',
]

const twMergeTokens = extendTailwindMerge({
  extend: {
    classGroups: {
      // Custom token colors behave like default palette colors so they no
      // longer collide with text sizes (text-* doubles as size + color).
      'text-color': [{ text: CUSTOM_COLORS }],
      'bg-color': [{ bg: CUSTOM_COLORS }],
      'border-color': [{ border: CUSTOM_COLORS }],
      'ring-color': [{ ring: CUSTOM_COLORS }],
      'font-size': [{ text: CUSTOM_FONT_SIZES }],
    },
  },
})

/** Merge Tailwind classes safely (token-aware) */
export function cn(...inputs: ClassValue[]) {
  return twMergeTokens(clsx(inputs))
}
