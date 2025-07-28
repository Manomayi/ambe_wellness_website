// Design tokens extracted from the Ambe design guide

export const colors = {
  // Primary colors
  primary: {
    peach: '#FFD3AC', // CTA/Static Links color
    darkCharcoal: '#353535', // Font color/Headings
  },
  
  // Neutral colors
  neutral: {
    background: '#E5E5E5', // Background
    white: '#FFFFFF', // Font color
    bodyText: '#535353', // Body text
    gridBox: '#F4F4F4', // Grid box
  },
};

export const typography = {
  fonts: {
    heading: 'Richmond Text', // H1 - 35px - For Hero Image/Text Overlay
    body: 'Basis Grotesque Arabic Pro', // H2 & Paragraph - 19px/16px
  },
  
  sizes: {
    h1: '35px', // Richmond Text
    h2: '19px', // Basis Grotesque Arabic Pro
    paragraph: '16px', // Basis Grotesque Arabic Pro
  },
};

export const buttons = {
  borderRadius: '9999px', // Fully rounded buttons as shown in design
  padding: {
    x: '32px',
    y: '12px',
  },
  variants: {
    primary: {
      background: colors.primary.peach,
      color: colors.primary.darkCharcoal,
      hover: {
        background: colors.primary.darkCharcoal,
        color: colors.neutral.white,
      },
    },
  },
};