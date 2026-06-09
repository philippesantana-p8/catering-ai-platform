import {
  BUILD_LABEL,
  BUILD_SHA,
  BUILD_TIME_ISO,
} from '@/Lib/buildInfo.generated'

export type BuildInfo = {
  label: string
  timeIso: string
  shortSha: string
  displayTime: string
}

function formatDisplayTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'local'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getBuildInfo(): BuildInfo {
  const label =
    process.env.NEXT_PUBLIC_BUILD_VERSION?.trim() || BUILD_LABEL || 'local'
  const timeIso =
    process.env.NEXT_PUBLIC_BUILD_TIME?.trim() || BUILD_TIME_ISO || ''
  const sha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    BUILD_SHA ||
    'local'

  return {
    label,
    timeIso,
    shortSha: sha === 'local' ? 'local' : sha.slice(0, 7),
    displayTime: formatDisplayTime(timeIso),
  }
}
