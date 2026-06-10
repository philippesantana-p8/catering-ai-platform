'use client'

import { getBuildInfo } from '@/Lib/buildInfo'

export default function BuildVersionBadge({
  className = '',
}: {
  className?: string
}) {
  const build = getBuildInfo()

  return (
    <p
      className={`text-[11px] leading-snug text-cdl-muted ${className}`}
      title={`Build ${build.label} · ${build.timeIso} · ${build.shortSha}`}
    >
      Atualizado em: {build.displayTime} — {build.note} · versão {build.label}
      {build.shortSha !== 'local' ? ` · ${build.shortSha}` : ''}
    </p>
  )
}
