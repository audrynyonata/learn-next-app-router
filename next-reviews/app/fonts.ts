import { Orbitron, Exo_2 } from 'next/font/google';

export const orbitron = Orbitron({
  subsets: ['latin'], // greek, cyrillic
  variable: '--font-orbitron', // assign a variable to refer this font and later add it into classes of html element
});

export const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
});
