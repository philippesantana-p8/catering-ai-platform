'use client'

import Link from 'next/link'
import {
  BackofficeAccentBadge,
  BackofficeBtnDanger,
  BackofficeBtnOutline,
  BackofficeBtnSecondary,
  BackofficeMetaRow,
  BackofficeStatusBadge,
} from '@/components/backoffice/BackofficeCardPrimitives'
import { BackofficeInventoryButton } from '@/components/backoffice/BackofficeSectionPrimitives'
import CatalogImageFrame from '@/components/CatalogImageFrame'
import {
  ExpandableDescription,
  PremiumCard,
  PriceBreakdownCard,
} from '@/components/premium/PremiumPrimitives'
import type { PackageListItem } from '@/Lib/fetchPackages'
import {
  getPackageCurrencyCode,
  getPackageDisplayOrder,
  getPackageHasGarnish,
  getPackageImageUrl,
  getPackageKey,
  getPackageLabel,
  getPackagePrice,
} from '@/Lib/packageFieldAccess'
import {
  formatPackageItemsText,
  formatPackageSideItemsText,
  type PackageItem,
  type PackageSideItem,
} from '@/Lib/packageConfiguration'
import {
  getPackageGarnishDisplayText,
  getPackageItemsDisplayText,
  parsePackageHighlightsText,
} from '@/Lib/packageDisplay'

function formatPrice(value: number, currency = 'USD') {
  return `${currency === 'USD' ? '$' : ''}${value.toFixed(2)}`
}

export default function PackageDetailCard({
  pkg,
  allPackages = [],
  packageItems = [],
  packageSideItems = [],
  onEdit,
  onPhoto,
  onDeactivate,
  uploading = false,
}: {
  pkg: PackageListItem
  allPackages?: PackageListItem[]
  packageItems?: PackageItem[]
  packageSideItems?: PackageSideItem[]
  onEdit: () => void
  onPhoto: () => void
  onDeactivate: () => void
  uploading?: boolean
}) {
  const packageKey = getPackageKey(pkg) || '—'
  const displayName = getPackageLabel(pkg)
  const withSides = getPackageHasGarnish(pkg)
  const imageUrl = getPackageImageUrl(pkg)
  const currency = getPackageCurrencyCode(pkg)
  const price = getPackagePrice(pkg)
  const itemsText =
    packageItems.length > 0
      ? formatPackageItemsText(packageItems)
      : getPackageItemsDisplayText(pkg)
  const garnishText =
    packageSideItems.length > 0
      ? formatPackageSideItemsText(packageSideItems)
      : getPackageGarnishDisplayText(pkg)
  const highlightItems = parsePackageHighlightsText(pkg.package_highlights_pt)

  let basePrice = price
  let garnishAddon = 0
  if (withSides && packageKey.endsWith('+')) {
    const baseKey = packageKey.replace(/\+$/, '')
    const basePkg = allPackages.find((row) => getPackageKey(row) === baseKey)
    if (basePkg) {
      basePrice = getPackagePrice(basePkg)
      garnishAddon = Math.max(0, price - basePrice)
    }
  }

  return (
    <PremiumCard className="overflow-hidden">
      <div className="aspect-[4/3] w-full bg-neutral-50 sm:aspect-[16/10]">
        <CatalogImageFrame
          src={imageUrl}
          alt={displayName}
          variant="package"
          fallbackLabel="Sem imagem cadastrada"
          rounded="none"
          className="!h-full !min-h-0 !max-h-none !w-full !rounded-none"
        />
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {packageKey}
          </span>
          {withSides ? (
            <BackofficeAccentBadge>Com guarnições</BackofficeAccentBadge>
          ) : (
            <BackofficeAccentBadge>Sem guarnições</BackofficeAccentBadge>
          )}
          <BackofficeStatusBadge active={pkg.active !== false} />
        </div>

        <div>
          <h3 className="text-2xl font-black text-neutral-900">{displayName}</h3>
          <p className="mt-2 text-3xl font-black text-red-600">
            {formatPrice(price, currency)}
            <span className="ml-1 text-sm font-semibold text-neutral-500">/ pessoa</span>
          </p>
        </div>

        {highlightItems.length > 0 ? (
          <div className="package-highlights-box !mt-0">
            <p className="package-highlights-title">Diferenciais do pacote</p>
            <div className="package-highlights-list">
              {highlightItems.map((item) => (
                <span key={item}>• {item}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              Diferenciais do pacote
            </p>
            <p className="mt-1 text-sm text-neutral-400">Diferenciais não cadastrados</p>
          </div>
        )}

        <PriceBreakdownCard
          rows={[
            {
              label: 'Pacote base',
              value: `${formatPrice(basePrice, currency)} / pessoa`,
            },
            {
              label: 'Guarnições',
              value:
                garnishAddon > 0
                  ? `+ ${formatPrice(garnishAddon, currency)} / pessoa`
                  : withSides
                    ? 'Inclusas no preço'
                    : 'Não',
            },
            {
              label: 'Total por pessoa',
              value: `${formatPrice(price, currency)} / pessoa`,
              emphasis: true,
            },
            {
              label: 'Moeda',
              value: currency,
            },
          ]}
        />

        <ExpandableDescription label="Itens do pacote" text={itemsText || '—'} />
        <ExpandableDescription label="Guarnições" text={garnishText} />

        <div className="rounded-xl border border-neutral-100 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">
            Operação
          </p>
          <div className="mt-3 space-y-1">
            <BackofficeMetaRow label="Ordem" value={getPackageDisplayOrder(pkg)} />
            <BackofficeMetaRow label="Status" value={pkg.active === false ? 'Inativo' : 'Ativo'} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
          <BackofficeBtnSecondary onClick={onEdit}>Editar</BackofficeBtnSecondary>
          <BackofficeBtnOutline accent onClick={onPhoto} disabled={uploading}>
            {uploading ? 'Enviando…' : 'Foto'}
          </BackofficeBtnOutline>
          <Link
            href="/commercial-rules"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50"
          >
            Regras
          </Link>
          <BackofficeInventoryButton source="package" id={pkg.id} />
          {pkg.active !== false ? (
            <BackofficeBtnDanger onClick={onDeactivate}>Inativar</BackofficeBtnDanger>
          ) : null}
        </div>
      </div>
    </PremiumCard>
  )
}
