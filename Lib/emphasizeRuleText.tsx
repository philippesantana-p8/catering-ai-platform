import type { ReactNode } from 'react'

const RULE_EMPHASIS_PATTERN =
  /(\$[\d.,]+|\d+\s*%|pedido mínimo de \$[\d.,]+|acréscimo de \d+\s*%|Sem reembolso[^.]*\.|Multa[^.]*\.)/gi

export function emphasizeRuleText(text: string): ReactNode {
  const nodes: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(RULE_EMPHASIS_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }
    nodes.push(
      <strong key={`${index}-${match[0]}`} className="font-semibold text-cdl-fg">
        {match[0]}
      </strong>,
    )
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : text
}
