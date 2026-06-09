import { getPackageHasGarnish } from '@/Lib/packageFieldAccess'

export function packageKeyHasGarnish(packageKey: string | null | undefined): boolean {
  return (packageKey ?? '').trim().endsWith('+')
}

export function splitPackagesByGarnish<
  T extends { package_key?: string | null },
>(packages: T[]) {
  const withoutGarnish: T[] = []
  const withGarnish: T[] = []

  for (const pkg of packages) {
    if (getPackageHasGarnish(pkg)) {
      withGarnish.push(pkg)
    } else {
      withoutGarnish.push(pkg)
    }
  }

  return { withoutGarnish, withGarnish }
}
