// Design tokens — Ambé Wellness brand (5 colors, 2 fonts)

export const colors = {
  dark: '#1a1a1a',
  charcoal: '#353535',
  gold: '#C8996A',
  peach: '#FFD3AC',
  cream: '#F4F1EA',
};

export const typography = {
  fonts: {
    heading: 'Cormorant Garamond',
    body: 'Jost',
  },
  sizes: {
    h1: '35px',
    h2: '19px',
    paragraph: '16px',
  },
};

export const buttons = {
  borderRadius: '9999px',
  padding: {
    x: '32px',
    y: '12px',
  },
  variants: {
    primary: {
      background: colors.peach,
      color: colors.charcoal,
      hover: {
        background: colors.charcoal,
        color: colors.cream,
      },
    },
  },
};
