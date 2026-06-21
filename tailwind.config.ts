import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          subtle: 'hsl(var(--primary-subtle))',
          'subtle-foreground': 'hsl(var(--primary-subtle-foreground))',
          border: 'hsl(var(--primary-border))',
          hover: 'hsl(var(--primary-hover))',
          ring: 'hsl(var(--primary-ring))',
        },
        panel: {
          DEFAULT: 'hsl(var(--panel))',
          foreground: 'hsl(var(--card-foreground))',
        },
        surface: {
          DEFAULT: 'hsl(var(--card))',
          muted: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--card-foreground))',
          border: 'hsl(var(--border))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          deep: 'hsl(var(--sidebar-end))',
          foreground: 'hsl(var(--sidebar-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
          border: 'hsl(var(--sidebar-border))',
          hover: 'hsl(var(--sidebar-hover))',
          active: 'hsl(var(--sidebar-active))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          subtle: 'hsl(var(--success-subtle))',
          'subtle-foreground': 'hsl(var(--success-subtle-foreground))',
          muted: 'hsl(var(--success-muted))',
          'muted-foreground': 'hsl(var(--success-muted-foreground))',
          border: 'hsl(var(--success-border))',
          hover: 'hsl(var(--success-hover))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          subtle: 'hsl(var(--warning-subtle))',
          'subtle-foreground': 'hsl(var(--warning-subtle-foreground))',
          muted: 'hsl(var(--warning-muted))',
          'muted-foreground': 'hsl(var(--warning-muted-foreground))',
          border: 'hsl(var(--warning-border))',
          hover: 'hsl(var(--warning-hover))',
        },
        warningStrong: {
          DEFAULT: 'hsl(var(--warning-strong))',
          foreground: 'hsl(var(--warning-strong-foreground))',
          subtle: 'hsl(var(--warning-strong-subtle))',
          'subtle-foreground': 'hsl(var(--warning-strong-subtle-foreground))',
          border: 'hsl(var(--warning-strong-border))',
          hover: 'hsl(var(--warning-strong-hover))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
          subtle: 'hsl(var(--danger-subtle))',
          'subtle-foreground': 'hsl(var(--danger-subtle-foreground))',
          muted: 'hsl(var(--danger-muted))',
          'muted-foreground': 'hsl(var(--danger-muted-foreground))',
          border: 'hsl(var(--danger-border))',
          hover: 'hsl(var(--danger-hover))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          subtle: 'hsl(var(--info-subtle))',
          'subtle-foreground': 'hsl(var(--info-subtle-foreground))',
          muted: 'hsl(var(--info-muted))',
          'muted-foreground': 'hsl(var(--info-muted-foreground))',
          border: 'hsl(var(--info-border))',
          hover: 'hsl(var(--info-hover))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          subtle: 'hsl(var(--accent-subtle))',
          'subtle-foreground': 'hsl(var(--accent-subtle-foreground))',
          border: 'hsl(var(--accent-border))',
          hover: 'hsl(var(--accent-hover))',
        },
        'section-header': {
          DEFAULT: 'hsl(var(--section-header))',
          foreground: 'hsl(var(--section-header-foreground))',
          border: 'hsl(var(--section-header-border))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        japanese: ['var(--font-japanese)', 'sans-serif'],
      },
      transitionDuration: {
        instant: 'var(--motion-instant)',
        fast: 'var(--motion-fast)',
        normal: 'var(--motion-normal)',
        page: 'var(--motion-page)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        out: 'var(--ease-out)',
        in: 'var(--ease-in)',
      },
      translate: {
        'motion-y-small': 'var(--motion-y-small)',
        'motion-y-medium': 'var(--motion-y-medium)',
        'motion-y-page': 'var(--motion-y-page)',
        'motion-y-large': 'var(--motion-y-large)',
      },
    },
  },
  plugins: [],
};

export default config;
