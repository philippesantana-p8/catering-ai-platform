import { Montserrat, Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-proposal-serif',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-proposal-sans',
  display: 'swap',
})

export default function QuoteDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${playfair.variable} ${montserrat.variable}`}>
      {children}
    </div>
  )
}
