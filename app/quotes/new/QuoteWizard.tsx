'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import AppMainNav from '../../../components/AppMainNav'
import { useTenant } from '../../../components/tenant/TenantProvider'
import CatalogImageFrame from '../../../components/CatalogImageFrame'
import BuildVersionBadge from '../../../components/BuildVersionBadge'
import QuoteHeaderCompact from '../../../components/quotes/QuoteHeaderCompact'
import QuoteHeroBanner from '../../../components/quotes/QuoteHeroBanner'
import QuotePackageStepExplorer from '../../../components/quotes/QuotePackageStepExplorer'
import {
  getPackageDetailTitle,
  sortPackagesByCommercialTier,
} from '../../../Lib/packageDisplay'
import QuoteWizardSummaryStep from '../../../components/quote-review/QuoteWizardSummaryStep'
import { RESERVATION_PAYMENT_TEXT } from '../../../Lib/cdlCommercialRules'
import { resolvePackageCatalogImageUrl } from '../../../Lib/packageCatalogVisual'
import { calcAdditionalLineTotal } from '../../../Lib/calculateQuoteTotals'
import type { CommercialRulesSnapshot } from '../../../Lib/supabaseCommercialRules'
import { calculateQuoteDraftFromSupabasePricing } from '../../../Lib/calculateQuoteDraftFromSupabasePricing'
import type { QuoteSaveInput } from '../../../Lib/buildQuoteSavePayload'
import { createQuote } from '../../../Lib/createQuote'
import { updateQuote } from '../../../Lib/updateQuote'
import {
  buildSaveQuoteError,
  logSaveQuoteError,
  normalizeSaveQuoteError,
  type SaveQuoteErrorInfo,
} from '../../../Lib/supabaseSaveError'
import {
  CUSTOMER_DISPLAY_NAME_EMPTY,
  getCustomerDisplayName,
} from '../../../Lib/getCustomerDisplayName'
import { getAdditionalItemPrice } from '../../../Lib/getAdditionalItemPrice'
import { isUsablePhone, normalizePhone } from '../../../Lib/normalizePhone'
import {
  dedupeCustomersList,
  filterCustomersBySearch,
  mergeCustomerIntoList,
  sortCustomersByRecency,
} from '../../../Lib/searchCustomers'
import {
  grillPhotoStatusToRequired,
  type GrillPhotoStatus,
} from '../../../Lib/grillPhotoStatus'
import type { QuoteSnapshotRecord } from '../../../Lib/readQuoteSnapshot'
import type {
  PackageItem,
  PackageSideItem,
} from '../../../Lib/packageConfiguration'
import {
  getBlockedAdditionalItemIds,
  getPendingPackageSelectionGroupIds,
  getPackageOptionGroupsForPackage,
  isCustomPackage,
  prunePackageSelectionsForPackage,
  validatePackageSelections,
  type PackageOptionGroup,
} from '../../../Lib/packageOptionGroups'
import {
  buildPricingFingerprint,
  createInitialWizardState,
  type QuoteLanguage,
  type WizardState,
} from '../../../Lib/quoteWizardTypes'
import AddressAutocompleteFields from './AddressAutocompleteFields'
import {
  getMandatoryPendingSteps,
  getStepVisualStatus,
  isQuoteReadyToSave,
  type StepStatusContext,
  type StepVisualStatus,
} from './wizardStepStatus'

export type Customer = {
  id: string
  ab_name?: string | null
  ab_number?: string | null
  full_name?: string | null
  contact_name?: string | null
  company_name?: string | null
  email?: string | null
  phone?: string | null
  phone_normalized?: string | null
  address_line?: string | null
  address?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  postal_code?: string | null
  venue_name?: string | null
  updated_at?: string | null
  created_at?: string | null
}

export type Package = {
  id: string
  package_key?: string | null
  package_name?: string | null
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  name_pt?: string | null
  name_en?: string | null
  name_es?: string | null
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
  description?: string | null
  price_per_person?: number | null
  price?: number | null
  base_price?: number | null
  currency_code?: string | null
  display_order?: number | null
  active?: boolean | null
  image_url?: string | null
}

export type AdditionalItem = {
  id: string
  item_key?: string | null
  item_name?: string | null
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  category_pt?: string | null
  price?: number | null
  pricing_type?: string | null
  charge_type?: string | null
  quantity?: number | null
  unit?: string | null
  quantity_2?: number | null
  uom_2?: string | null
  unit_label?: string | null
  display_order?: number | null
  image_url?: string | null
  active?: boolean | null
}

const STEPS = [
  'Cliente',
  'Evento',
  'Pacote',
  'Adicionais',
  'Churrasqueira',
  'Milhagem',
  'Reserva',
  'Resumo',
] as const

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function roundPercentage(value: number) {
  return Math.round(value * 1000) / 1000
}

function formatPercentage(value: number) {
  const rounded = roundPercentage(Math.min(100, Math.max(0, value)))
  const formatted = rounded.toFixed(3).replace(/\.?0+$/, '')
  return `${formatted}%`
}

function formatReservationSummary(
  percentage: number,
  amount: number,
  amountCustomized: boolean,
) {
  const pct = formatPercentage(percentage)
  const abs = formatCurrency(amount)
  return amountCustomized ? `${abs} (${pct})` : `${pct} (${abs})`
}

function formatDate(value: string) {
  if (!value) return '—'
  return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(value: string) {
  if (!value) return '—'
  const [hours, minutes] = value.split(':')
  if (!hours || minutes === undefined) return value
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function formatTimeRange(start: string, end: string) {
  if (!start && !end) return '—'
  if (start && end) return `${formatTime(start)} – ${formatTime(end)}`
  return formatTime(start || end)
}

function parseDateValue(value: string) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const CALENDAR_WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type FieldCompletion = 'filled' | 'empty'

function getFieldCompletion(value: string | number): FieldCompletion {
  if (typeof value === 'number') return value > 0 ? 'filled' : 'empty'
  return value.trim().length > 0 ? 'filled' : 'empty'
}

function fieldCompletionClass(completion?: FieldCompletion) {
  if (completion === 'filled') return 'cdl-field-filled'
  if (completion === 'empty') return 'cdl-field-empty'
  return 'border-cdl-border bg-cdl-inset'
}

function FieldCheck({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-cdl-success"
      aria-hidden
    >
      ✓
    </span>
  )
}

function stepSegmentClass(status: StepVisualStatus) {
  switch (status) {
    case 'complete':
      return 'bg-cdl-success'
    case 'pending':
      return 'bg-cdl-warning'
    case 'error':
      return 'bg-cdl-action'
    default:
      return 'bg-cdl-step-empty'
  }
}

function stepButtonClass(status: StepVisualStatus, isCurrent: boolean) {
  const currentRing = isCurrent
    ? 'ring-2 ring-cdl-brand ring-offset-2 ring-offset-cdl-surface'
    : ''

  switch (status) {
    case 'complete':
      return `border border-cdl-success-border bg-cdl-success-soft text-cdl-success ${currentRing}`
    case 'pending':
      return `border border-cdl-warning-border bg-cdl-warning-soft text-cdl-warning ${currentRing}`
    case 'error':
      return `border border-cdl-action bg-cdl-red-soft text-cdl-action ${currentRing}`
    default:
      return `border border-cdl-border bg-cdl-inset text-cdl-muted ${currentRing}`
  }
}

function stepBadgeClass(status: StepVisualStatus) {
  switch (status) {
    case 'complete':
      return 'bg-cdl-success text-[#070707]'
    case 'pending':
      return 'bg-cdl-warning text-[#070707]'
    case 'error':
      return 'bg-cdl-action text-white'
    default:
      return 'bg-cdl-image text-cdl-muted'
  }
}
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTE_OPTIONS = [0, 15, 30, 45]

function parseTimeParts(value: string) {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return { hours, minutes }
}

function toTimeValue(hours: number, minutes: number) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function addHoursToTime(time: string, hoursToAdd: number) {
  const parsed = parseTimeParts(time)
  if (!parsed) return ''

  const totalMinutes =
    parsed.hours * 60 + parsed.minutes + hoursToAdd * 60
  const normalized =
    ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)

  return toTimeValue(
    Math.floor(normalized / 60),
    normalized % 60,
  )
}

function CalendarIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-cdl-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function DatePickerField({
  label,
  value,
  onChange,
  className = '',
  completion,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  completion?: FieldCompletion
}) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => parseDateValue(value) ?? new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = parseDateValue(value)

  useEffect(() => {
    const parsed = parseDateValue(value)
    if (parsed) setViewDate(parsed)
  }, [value])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<number | null> = []

    for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)

    return { year, month, cells }
  }, [viewDate])

  function selectDay(day: number) {
    onChange(toDateValue(new Date(calendarDays.year, calendarDays.month, day)))
    setOpen(false)
  }

  function shiftMonth(offset: number) {
    setViewDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    )
  }

  const monthLabel = viewDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-2 ${className}`}>
      <span className="cdl-eyebrow">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 pr-10 text-left text-base outline-none transition-colors hover:border-cdl-accent-border focus:border-cdl-accent-border ${fieldCompletionClass(completion)}`}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span className={selectedDate ? 'text-cdl-fg' : 'text-cdl-faint'}>
            {selectedDate ? formatDate(value) : 'Selecione a data'}
          </span>
          <CalendarIcon />
        </button>
        <FieldCheck show={completion === 'filled'} />
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={`Calendário de ${label}`}
          className="absolute left-0 top-full z-30 mt-2 w-full min-w-[300px] rounded-2xl border border-cdl-border bg-cdl-surface p-4 shadow-cdl-popup sm:w-[320px]"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-cdl-border bg-cdl-inset text-cdl-fg transition-colors hover:border-cdl-accent-border"
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <p className="text-sm font-bold capitalize text-cdl-accent">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-cdl-border bg-cdl-inset text-cdl-fg transition-colors hover:border-cdl-accent-border"
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {CALENDAR_WEEKDAYS.map((weekday) => (
              <span
                key={weekday}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-cdl-muted"
              >
                {weekday}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.cells.map((day, index) => {
              if (day === null) {
                return <span key={`empty-${index}`} className="h-10" />
              }

              const isSelected =
                selectedDate?.getFullYear() === calendarDays.year &&
                selectedDate?.getMonth() === calendarDays.month &&
                selectedDate?.getDate() === day

              const isToday =
                new Date().getFullYear() === calendarDays.year &&
                new Date().getMonth() === calendarDays.month &&
                new Date().getDate() === day

              return (
                <button
                  key={`${calendarDays.year}-${calendarDays.month}-${day}`}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-cdl-accent text-cdl-on-accent'
                      : isToday
                        ? 'border border-cdl-accent-border bg-cdl-accent-soft text-cdl-accent'
                        : 'text-cdl-fg hover:bg-cdl-muted-bg hover:text-cdl-accent'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ClockIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-cdl-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function TimePickerField({
  label,
  value,
  onChange,
  className = '',
  completion,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  completion?: FieldCompletion
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = parseTimeParts(value)
  const [draftHour, setDraftHour] = useState(selected?.hours ?? 18)
  const [draftMinute, setDraftMinute] = useState(selected?.minutes ?? 0)

  useEffect(() => {
    const parsed = parseTimeParts(value)
    if (parsed) {
      setDraftHour(parsed.hours)
      setDraftMinute(parsed.minutes)
    }
  }, [value])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function selectHour(hour: number) {
    setDraftHour(hour)
    onChange(toTimeValue(hour, draftMinute))
  }

  function selectMinute(minute: number) {
    setDraftMinute(minute)
    onChange(toTimeValue(draftHour, minute))
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-2 ${className}`}>
      <span className="cdl-eyebrow">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 pr-10 text-left text-base outline-none transition-colors hover:border-cdl-accent-border focus:border-cdl-accent-border ${fieldCompletionClass(completion)}`}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span className={selected ? 'text-cdl-fg' : 'text-cdl-faint'}>
            {selected ? formatTime(value) : 'Selecione o horário'}
          </span>
          <ClockIcon />
        </button>
        <FieldCheck show={completion === 'filled'} />
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={`Seletor de ${label}`}
          className="absolute left-0 top-full z-30 mt-2 w-full min-w-[300px] rounded-2xl border border-cdl-border bg-cdl-surface p-4 shadow-cdl-popup sm:w-[320px]"
        >
          <p className="mb-3 text-center text-sm font-bold text-cdl-accent">
            {toTimeValue(draftHour, draftMinute)}
          </p>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-cdl-muted">
            Hora
          </p>
          <div className="mb-4 grid max-h-40 grid-cols-6 gap-1 overflow-y-auto pr-1">
            {HOUR_OPTIONS.map((hour) => {
              const isSelected = draftHour === hour
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => selectHour(hour)}
                  className={`flex h-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-cdl-accent text-cdl-on-accent'
                      : 'text-cdl-fg hover:bg-cdl-muted-bg hover:text-cdl-accent'
                  }`}
                >
                  {String(hour).padStart(2, '0')}
                </button>
              )
            })}
          </div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-cdl-muted">
            Minutos
          </p>
          <div className="grid grid-cols-4 gap-1">
            {MINUTE_OPTIONS.map((minute) => {
              const isSelected = draftMinute === minute
              return (
                <button
                  key={minute}
                  type="button"
                  onClick={() => selectMinute(minute)}
                  className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-cdl-accent text-cdl-on-accent'
                      : 'text-cdl-fg hover:bg-cdl-muted-bg hover:text-cdl-accent'
                  }`}
                >
                  {String(minute).padStart(2, '0')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function getCustomerName(customer: Customer) {
  return getCustomerDisplayName(customer, { emptyLabel: '—' })
}

function getEventDefaultsFromCustomer(customer: Customer) {
  const customerName = getCustomerName(customer)

  return {
    eventName: customerName === '—' ? '' : customerName,
    address:
      customer.address_line ?? customer.address ?? customer.street ?? '',
    city: customer.city ?? '',
    state: customer.state ?? '',
    zipCode: customer.zip_code ?? customer.postal_code ?? '',
  }
}

function getPackageName(pkg: Package) {
  return (
    pkg.label_pt ??
    pkg.name_pt ??
    pkg.package_name ??
    pkg.label_en ??
    pkg.name_en ??
    pkg.label_es ??
    pkg.name_es ??
    '—'
  )
}

function getPackageDescription(pkg: Package) {
  return (
    pkg.description_pt ??
    pkg.description_en ??
    pkg.description_es ??
    pkg.description ??
    ''
  )
}

function getPackagePrice(pkg: Package) {
  return Number(
    pkg.price_per_person ?? pkg.price ?? pkg.base_price ?? 0,
  )
}

function getAdditionalLabel(item: AdditionalItem) {
  return (
    item.item_name ??
    item.label_pt ??
    item.label_en ??
    item.label_es ??
    item.item_key ??
    '—'
  )
}

function isPerPersonAdditional(item: AdditionalItem) {
  return (
    item.pricing_type === 'PER_PERSON' || item.charge_type === 'PERSON'
  )
}

function getAdditionalUnitPrice(item: AdditionalItem) {
  return getAdditionalItemPrice(item)
}

function normalizeAdditionalQuantity(item: AdditionalItem, quantity: number) {
  if (isPerPersonAdditional(item)) {
    return quantity > 0 ? 1 : 0
  }
  return Math.max(0, quantity)
}

function calcAdditionalLineTotalForItem(
  item: AdditionalItem,
  quantity: number,
  billableGuestCount: number,
) {
  const normalizedQty = normalizeAdditionalQuantity(item, quantity)
  if (normalizedQty <= 0) return 0

  return calcAdditionalLineTotal(
    {
      quantity: normalizedQty,
      unitPrice: getAdditionalUnitPrice(item),
      perPerson: isPerPersonAdditional(item),
    },
    billableGuestCount,
  )
}

function mapSelectedAdditionalRow(
  item: AdditionalItem,
  quantity: number,
  billableGuestCount: number,
) {
  const normalizedQty = normalizeAdditionalQuantity(item, quantity)
  return {
    item,
    quantity: normalizedQty,
    unitPrice: getAdditionalUnitPrice(item),
    perPerson: isPerPersonAdditional(item),
    totalPrice: calcAdditionalLineTotalForItem(item, normalizedQty, billableGuestCount),
  }
}

function formatWeightUom(uom: string) {
  if (uom === 'LB') return 'lb'
  return uom.toLowerCase()
}

function getAdditionalPackLabel(item: AdditionalItem) {
  const packQty = item.quantity ?? 1
  const packUnit = item.unit_label ?? item.unit ?? 'UN'
  const weight = item.quantity_2
  const weightUom = item.uom_2

  if (weight != null && weightUom) {
    return `${packQty} ${packUnit} · ${weight} ${formatWeightUom(weightUom)}`
  }
  return `${packQty} ${packUnit}`
}

function getAdditionalTotalWeight(
  item: AdditionalItem,
  quantity: number,
) {
  const normalizedQty = normalizeAdditionalQuantity(item, quantity)
  if (normalizedQty <= 0 || item.quantity_2 == null || !item.uom_2) {
    return null
  }
  return {
    amount: item.quantity_2 * normalizedQty,
    uom: item.uom_2,
  }
}

function getAdditionalImage(item: AdditionalItem) {
  return item.image_url ?? null
}

const ADDITIONAL_CATEGORY_ORDER = [
  'Bovino Tradicional',
  'Bovino Nobre',
  'Frango',
  'Porco',
  'Linguiças',
  'Frutos do Mar',
  'Legumes e Saladas',
] as const

function normalizeCategory(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const ADDITIONAL_CATEGORY_ALIASES: Record<string, string> = {
  'beef traditional': 'bovino tradicional',
  'premium beef': 'bovino nobre',
  chicken: 'frango',
  pork: 'porco',
  sausages: 'linguiças',
  seafood: 'frutos do mar',
  vegetables: 'legumes e saladas',
  bovino: 'bovino tradicional',
  legumes: 'legumes e saladas',
}

function getAdditionalCategorySortIndex(category: string) {
  const normalized =
    ADDITIONAL_CATEGORY_ALIASES[normalizeCategory(category)] ??
    normalizeCategory(category)
  const index = ADDITIONAL_CATEGORY_ORDER.findIndex(
    (name) => normalizeCategory(name) === normalized,
  )
  if (index !== -1) return index
  return ADDITIONAL_CATEGORY_ORDER.length
}

function compareAdditionalCategories(a: string, b: string) {
  const indexDiff =
    getAdditionalCategorySortIndex(a) - getAdditionalCategorySortIndex(b)
  if (indexDiff !== 0) return indexDiff
  return a.localeCompare(b, 'pt-BR')
}

function WizardStepButton({
  label,
  onClick,
  className = '',
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cdl-btn-primary ${className}`}
    >
      {label}
    </button>
  )
}

function AdditionalItemCard({
  item,
  quantity,
  billableGuestCount,
  onChangeQty,
}: {
  item: AdditionalItem
  quantity: number
  billableGuestCount: number
  onChangeQty: (qty: number) => void
}) {
  const image = getAdditionalImage(item)
  const unitPrice = getAdditionalUnitPrice(item)
  const perPerson = isPerPersonAdditional(item)
  const normalizedQty = normalizeAdditionalQuantity(item, quantity)
  const lineTotal = calcAdditionalLineTotalForItem(item, quantity, billableGuestCount)
  const isSelected = normalizedQty > 0
  const totalWeight = getAdditionalTotalWeight(item, quantity)
  const packLabel = !perPerson ? getAdditionalPackLabel(item) : null

  const cardClassName = `overflow-hidden rounded-2xl border text-left transition-colors ${
    isSelected
      ? 'border-cdl-accent bg-cdl-accent-soft'
      : 'border-cdl-border bg-cdl-inset'
  }`

  const media = (
    <CatalogImageFrame
      src={image}
      alt={getAdditionalLabel(item)}
      variant="additionalItem"
      className="shrink-0"
    />
  )

  const header = (
    <>
      <h3 className="font-bold text-cdl-fg">{getAdditionalLabel(item)}</h3>
      <p className="mt-1 text-sm font-bold text-cdl-price">
        {formatCurrency(unitPrice)}
        {perPerson ? (
          <span className="ml-1 text-xs font-semibold text-cdl-text-secondary">/ pessoa</span>
        ) : (
          packLabel && (
            <span className="ml-1 text-xs font-semibold text-cdl-text-secondary">
              / {packLabel}
            </span>
          )
        )}
      </p>
      {item.pricing_type && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cdl-muted">
          {perPerson ? 'Por pessoa' : 'Por unidade'}
        </p>
      )}
    </>
  )

  if (perPerson) {
    return (
      <button
        type="button"
        onClick={() => onChangeQty(isSelected ? 0 : 1)}
        className={`${cardClassName} w-full`}
      >
        {media}
        <div className="p-5">
          {header}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  isSelected
                    ? 'border-cdl-accent bg-cdl-accent text-cdl-on-accent'
                    : 'border-cdl-faint bg-cdl-surface'
                }`}
                aria-hidden
              >
                {isSelected ? '✓' : ''}
              </span>
              <span className="text-sm font-semibold text-cdl-fg">
                {isSelected ? 'Selecionado' : 'Selecionar'}
              </span>
            </span>
            {isSelected && (
              <div className="text-right">
                <span className="text-sm font-bold text-cdl-price">
                  {formatCurrency(lineTotal)}
                </span>
                {billableGuestCount > 0 && (
                  <p className="mt-0.5 text-xs text-cdl-subtle">
                    {formatCurrency(unitPrice)} × {billableGuestCount}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <article className={cardClassName}>
      {media}
      <div className="p-5">
        {header}
        {packLabel && (
          <p className="mt-2 text-xs text-cdl-muted">
            Cada unidade: {packLabel}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeQty(normalizedQty - 1)}
              disabled={normalizedQty === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-cdl-border bg-cdl-surface text-lg font-bold text-cdl-fg transition-colors hover:border-cdl-accent-border disabled:opacity-30"
              aria-label="Remover unidade"
            >
              −
            </button>
            <div className="min-w-[3rem] text-center">
              <span className="text-lg font-semibold text-cdl-fg">
                {normalizedQty}
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cdl-muted">
                {item.unit_label ?? item.unit ?? 'UN'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeQty(normalizedQty + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-cdl-border bg-cdl-surface text-lg font-bold text-cdl-fg transition-colors hover:border-cdl-accent-border"
              aria-label="Adicionar unidade"
            >
              +
            </button>
          </div>
          {isSelected && (
            <div className="text-right">
              <span className="text-sm font-bold text-cdl-price">
                {formatCurrency(lineTotal)}
              </span>
              {totalWeight && (
                <p className="mt-0.5 text-xs font-semibold text-cdl-text-secondary">
                  {totalWeight.amount} {formatWeightUom(totalWeight.uom)} total
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function AdditionalCategorySection({
  category,
  items,
  expanded,
  selectedCount,
  quantities,
  billableGuestCount,
  onToggle,
  onChangeQty,
}: {
  category: string
  items: AdditionalItem[]
  expanded: boolean
  selectedCount: number
  quantities: Record<string, number>
  billableGuestCount: number
  onToggle: () => void
  onChangeQty: (itemId: string, qty: number) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-cdl-hover sm:p-6"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-lg font-extrabold text-cdl-title sm:text-xl">
            {category}
          </span>
          <span className="text-sm text-cdl-muted">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
          {selectedCount > 0 && (
            <span className="rounded-full bg-cdl-accent px-2.5 py-0.5 text-xs font-bold text-cdl-on-accent">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 text-sm text-cdl-accent transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="border-t border-cdl-border-subtle p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <AdditionalItemCard
                key={item.id}
                item={item}
                quantity={quantities[item.id] ?? 0}
                billableGuestCount={billableGuestCount}
                onChangeQty={(qty) => onChangeQty(item.id, qty)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// mileage + quote totals: see Lib/calculateQuoteTotals.ts

function SectionCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-cdl-border bg-cdl-surface p-7 shadow-cdl sm:p-9 ${className}`}
    >
      <h2 className="cdl-section-title">{title}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-cdl-muted">
        {label}
      </span>
      <span className="text-sm text-cdl-fg">{value ?? '—'}</span>
    </div>
  )
}

function MileageSummaryPanel({
  distance,
  freeLimit,
  rate,
  mileageFee,
}: {
  distance: number
  freeLimit: number
  rate: number
  mileageFee: number
}) {
  const chargedMiles = Math.max(0, distance - freeLimit)

  return (
    <div className="sm:col-span-2 rounded-xl border border-cdl-border bg-cdl-inset px-6 py-5 shadow-cdl">
      <p className="cdl-eyebrow">Resumo de milhagem</p>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <p className="cdl-eyebrow">Milhas totais</p>
          <p className="mt-2 text-xl font-bold text-cdl-fg">{distance} mi</p>
        </div>
        <div>
          <p className="cdl-eyebrow">Milhas inclusas</p>
          <p className="mt-2 text-xl font-bold text-cdl-fg">{freeLimit} mi</p>
        </div>
        <div>
          <p className="cdl-eyebrow">Milhas cobradas</p>
          <p className="mt-2 text-xl font-bold text-cdl-price">{chargedMiles} mi</p>
        </div>
        <div>
          <p className="cdl-eyebrow">Taxa calculada</p>
          <p className="mt-2 text-xl font-bold text-cdl-price">
            {formatCurrency(mileageFee)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs text-cdl-text-secondary">
        {chargedMiles} mi × {formatCurrency(rate)}/mi
      </p>
    </div>
  )
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  step,
  min,
  max,
  completion,
  inputRef,
  onFocus,
}: {
  label: string
  type?: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  step?: string | number
  min?: string | number
  max?: string | number
  completion?: FieldCompletion
  inputRef?: React.RefObject<HTMLInputElement | null>
  onFocus?: () => void
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="cdl-eyebrow">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border px-4 py-3.5 pr-10 text-base text-cdl-fg shadow-cdl outline-none transition-colors placeholder:text-cdl-faint focus:border-cdl-accent-border ${fieldCompletionClass(completion)}`}
        />
        <FieldCheck show={completion === 'filled'} />
      </div>
    </label>
  )
}

function QuantityField({
  label,
  value,
  onChange,
  className = '',
  placeholder = '0',
  min = 0,
  disabled = false,
  completion,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  min?: number
  disabled?: boolean
  completion?: FieldCompletion
}) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(String(value))
  }, [value, focused])

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="cdl-eyebrow">{label}</span>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            const next =
              draft === ''
                ? min
                : Math.max(min, Number.parseInt(draft, 10) || min)
            onChange(next)
            setDraft(String(next))
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '')
            setDraft(raw)
            if (raw !== '') {
              onChange(Math.max(min, Number.parseInt(raw, 10) || min))
            }
          }}
          className={`w-full rounded-xl border px-4 py-3.5 pr-10 text-base text-cdl-fg shadow-cdl outline-none transition-colors placeholder:text-cdl-faint focus:border-cdl-accent-border disabled:cursor-not-allowed disabled:opacity-40 ${fieldCompletionClass(completion)}`}
        />
        <FieldCheck show={completion === 'filled'} />
      </div>
    </label>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-cdl-border bg-cdl-inset px-5 py-4 shadow-cdl transition-colors hover:border-cdl-accent-border">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-cdl-brand"
      />
      <span className="text-xs font-bold uppercase tracking-wider text-cdl-fg">
        {label}
      </span>
    </label>
  )
}

function GrillPhotoStatusField({
  value,
  disabled,
  onChange,
}: {
  value: GrillPhotoStatus
  disabled?: boolean
  onChange: (value: GrillPhotoStatus) => void
}) {
  const options: { value: GrillPhotoStatus; label: string }[] = [
    { value: 'received', label: 'Sim' },
    { value: 'pending', label: 'Não' },
    { value: 'not_applicable', label: 'Não se aplica' },
  ]

  return (
    <fieldset className="sm:col-span-2">
      <legend className="cdl-eyebrow">Foto da churrasqueira recebida?</legend>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {options.map((option) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                selected
                  ? 'border-cdl-accent-border bg-cdl-accent/10 text-cdl-brand'
                  : 'border-cdl-border bg-cdl-inset text-cdl-text-secondary hover:border-cdl-accent-border'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="grill-photo-status"
                value={option.value}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="accent-[var(--cdl-action)]"
              />
              {option.label}
            </label>
          )
        })}
      </div>
      {value === 'received' ? (
        <p className="mt-2 text-xs text-cdl-success">
          Foto confirmada como recebida.
        </p>
      ) : null}
      {value === 'pending' ? (
        <p className="mt-2 text-xs text-cdl-warning">
          Foto ainda pendente para validação.
        </p>
      ) : null}
    </fieldset>
  )
}

export { getStepVisualStatus } from './wizardStepStatus'

export default function QuoteWizard({
  customers,
  packages,
  additionalItems,
  packageOptionGroups = [],
  packageItems = [],
  packageSideItems = [],
  commercialRules,
  fetchErrors,
  mode = 'create',
  quoteId,
  initialState,
  initialPricingFingerprint,
  existingSnapshot,
  linkedCustomer = null,
  initialStep = 0,
}: {
  customers: Customer[]
  packages: Package[]
  additionalItems: AdditionalItem[]
  packageOptionGroups?: PackageOptionGroup[]
  packageItems?: PackageItem[]
  packageSideItems?: PackageSideItem[]
  commercialRules: CommercialRulesSnapshot
  fetchErrors: string[]
  mode?: 'create' | 'edit'
  quoteId?: string
  initialState?: WizardState
  initialPricingFingerprint?: string
  existingSnapshot?: QuoteSnapshotRecord
  linkedCustomer?: Customer | null
  initialStep?: number
}) {
  const isEditMode = mode === 'edit' && Boolean(quoteId)
  const { branchId: tenantBranchId } = useTenant()
  const [step, setStep] = useState(() =>
    Math.min(Math.max(initialStep, 0), STEPS.length - 1),
  )
  const [state, setState] = useState<WizardState>(
    () => initialState ?? createInitialWizardState(commercialRules),
  )
  const [customerSearch, setCustomerSearch] = useState('')
  const [endTimeCustomized, setEndTimeCustomized] = useState(false)
  const [openAdditionalCategories, setOpenAdditionalCategories] = useState<
    Set<string>
  >(() => new Set())
  const [reservationAmountCustomized, setReservationAmountCustomized] =
    useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErrorInfo, setSaveErrorInfo] = useState<SaveQuoteErrorInfo | null>(
    null,
  )
  const [localCustomers, setLocalCustomers] = useState(() =>
    dedupeCustomersList(sortCustomersByRecency(customers)),
  )
  const [customersRefreshing, setCustomersRefreshing] = useState(false)
  const [customerLinkSuccess, setCustomerLinkSuccess] = useState<string | null>(
    null,
  )
  const [packageStepMessage, setPackageStepMessage] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (!tenantBranchId || state.branchId) return
    setState((prev) => ({ ...prev, branchId: tenantBranchId }))
  }, [tenantBranchId, state.branchId])
  const [packageSelectionAttempted, setPackageSelectionAttempted] =
    useState(false)
  const [packageExplorerKey, setPackageExplorerKey] = useState(0)
  const router = useRouter()
  const distanceInputRef = useRef<HTMLInputElement>(null)
  const previousStepRef = useRef(step)

  useEffect(() => {
    setLocalCustomers((current) => {
      const merged = sortCustomersByRecency([...customers])
      for (const row of current) {
        if (!merged.some((customer) => customer.id === row.id)) {
          merged.unshift(row)
        }
      }
      return dedupeCustomersList(sortCustomersByRecency(merged))
    })
  }, [customers])

  const refreshCustomersFromApi = async (query = customerSearch) => {
    setCustomersRefreshing(true)
    try {
      const params = new URLSearchParams({ _: String(Date.now()) })
      if (query.trim()) params.set('q', query.trim())
      const response = await fetch(`/api/customers?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const result = (await response.json()) as {
        data?: Customer[]
        error?: string
      }
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? 'Não foi possível atualizar clientes.')
      }
      setLocalCustomers((current) => {
        const merged = sortCustomersByRecency(result.data ?? [])
        for (const row of current) {
          if (!merged.some((customer) => customer.id === row.id)) {
            merged.unshift(row)
          }
        }
        return dedupeCustomersList(sortCustomersByRecency(merged))
      })
    } catch (refreshError) {
      updateState({
        customerPhoneLinkError:
          refreshError instanceof Error
            ? refreshError.message
            : 'Erro ao atualizar lista de clientes.',
      })
    } finally {
      setCustomersRefreshing(false)
    }
  }

  const selectedCustomer = isEditMode
    ? linkedCustomer ??
      (state.customerId ? { id: state.customerId } as Customer : null)
    : localCustomers.find((c) => c.id === state.customerId) ?? null

  const editCustomerDisplayName = linkedCustomer
    ? getCustomerDisplayName(linkedCustomer)
    : state.customerId
      ? 'Cliente vinculado não encontrado'
      : CUSTOMER_DISPLAY_NAME_EMPTY
  const selectedPackage = packages.find((p) => p.id === state.packageId) ?? null

  const packageImageUrl = useMemo(
    () =>
      resolvePackageCatalogImageUrl(
        selectedPackage,
        packages,
        state.packageId,
      ),
    [selectedPackage, packages, state.packageId],
  )

  const filteredCustomers = useMemo(
    () => filterCustomersBySearch(localCustomers, customerSearch),
    [localCustomers, customerSearch],
  )

  const packagesWithoutSides = useMemo(
    () =>
      sortPackagesByCommercialTier(
        packages.filter((p) => !p.package_key?.trim().endsWith('+')),
      ),
    [packages],
  )

  const packagesWithSides = useMemo(
    () =>
      sortPackagesByCommercialTier(
        packages.filter((p) => p.package_key?.trim().endsWith('+')),
      ),
    [packages],
  )

  const fromWithSidesSection = useMemo(
    () =>
      packagesWithSides.some((pkg) => pkg.id === state.packageId),
    [packagesWithSides, state.packageId],
  )

  const optionGroupsForPackage = useMemo(() => {
    const cache = new Map<string, PackageOptionGroup[]>()
    return (packageId: string) => {
      if (!packageId?.trim()) return []
      if (!cache.has(packageId)) {
        cache.set(
          packageId,
          getPackageOptionGroupsForPackage(packageId, packageOptionGroups),
        )
      }
      return cache.get(packageId) ?? []
    }
  }, [packageOptionGroups])

  const activePackageOptionGroups = useMemo(
    () =>
      state.packageId
        ? optionGroupsForPackage(state.packageId)
        : [],
    [state.packageId, optionGroupsForPackage],
  )

  const blockedAdditionalItemIds = useMemo(() => {
    if (!state.packageId || !selectedPackage) return []
    return getBlockedAdditionalItemIds(
      state.packageId,
      packageOptionGroups,
      isCustomPackage(selectedPackage),
      { packageItems, packageSideItems },
    )
  }, [
    state.packageId,
    packageOptionGroups,
    packageItems,
    packageSideItems,
    selectedPackage,
  ])

  const visibleAdditionalItems = useMemo(
    () =>
      additionalItems.filter(
        (item) => !blockedAdditionalItemIds.includes(item.id),
      ),
    [additionalItems, blockedAdditionalItemIds],
  )

  const additionalItemsByCategory = useMemo(() => {
    const grouped = visibleAdditionalItems.reduce(
      (acc, item) => {
        const category = item.category_pt || 'Outros'
        if (!acc[category]) acc[category] = []
        acc[category].push(item)
        return acc
      },
      {} as Record<string, AdditionalItem[]>,
    )

    return Object.entries(grouped)
      .sort(([a], [b]) => compareAdditionalCategories(a, b))
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => {
          const priceDiff =
            getAdditionalUnitPrice(b) - getAdditionalUnitPrice(a)
          if (priceDiff !== 0) return priceDiff
          return getAdditionalLabel(a).localeCompare(
            getAdditionalLabel(b),
            'pt-BR',
          )
        }),
      }))
  }, [visibleAdditionalItems])

  const selectedCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const { category, items } of additionalItemsByCategory) {
      counts[category] = items.reduce(
        (sum, item) => sum + (state.additionals[item.id] ?? 0),
        0,
      )
    }
    return counts
  }, [additionalItemsByCategory, state.additionals])

  useEffect(() => {
    if (blockedAdditionalItemIds.length === 0) return
    setState((prev) => {
      let changed = false
      const nextAdditionals = { ...prev.additionals }
      for (const itemId of blockedAdditionalItemIds) {
        if (nextAdditionals[itemId]) {
          delete nextAdditionals[itemId]
          changed = true
        }
      }
      if (!changed) return prev
      return { ...prev, additionals: nextAdditionals }
    })
  }, [blockedAdditionalItemIds])

  useEffect(() => {
    if (step !== 4) {
      setOpenAdditionalCategories(new Set())
    }
  }, [step])

  function toggleAdditionalCategory(category: string) {
    setOpenAdditionalCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const quoteTotals = useMemo(() => {
    const additionals = Object.entries(state.additionals)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const item = additionalItems.find((row) => row.id === itemId)
        if (!item) return null
        const normalizedQty = normalizeAdditionalQuantity(item, quantity)
        return {
          quantity: normalizedQty,
          unitPrice: getAdditionalUnitPrice(item),
          perPerson: isPerPersonAdditional(item),
        }
      })
      .filter((line): line is NonNullable<typeof line> => line !== null)

    return calculateQuoteDraftFromSupabasePricing({
      guestCounts: {
        adultCount: state.adultCount,
        childrenUnder3Count: state.childrenUnder3Count,
        children4To12Count: state.children4To12Count,
      },
      packagePricePerPerson: selectedPackage ? getPackagePrice(selectedPackage) : 0,
      additionals,
      mileageDistance: state.distance,
      pricing: commercialRules,
      reservationPercentage: state.reservationPercentage,
      reservationAmountOverride: state.reservationAmount,
      useCustomReservation: reservationAmountCustomized,
    })
  }, [
    state.adultCount,
    state.childrenUnder3Count,
    state.children4To12Count,
    state.additionals,
    state.distance,
    state.reservationPercentage,
    state.reservationAmount,
    selectedPackage,
    additionalItems,
    reservationAmountCustomized,
    commercialRules,
  ])

  const billableGuestCount = quoteTotals.billableGuestCount
  const packageUnitPrice = selectedPackage ? getPackagePrice(selectedPackage) : 0
  const packageTotal = quoteTotals.packageTotal

  const selectedAdditionalsByCategory = useMemo(() => {
    return additionalItemsByCategory
      .map(({ category, items }) => ({
        category,
        items: items
          .filter((item) => (state.additionals[item.id] ?? 0) > 0)
          .map((item) =>
            mapSelectedAdditionalRow(
              item,
              state.additionals[item.id] ?? 0,
              billableGuestCount,
            ),
          ),
      }))
      .filter(({ items }) => items.length > 0)
  }, [additionalItemsByCategory, state.additionals, billableGuestCount])

  const selectedAdditionals = useMemo(
    () => selectedAdditionalsByCategory.flatMap(({ items }) => items),
    [selectedAdditionalsByCategory],
  )

  const reviewAdditionals = useMemo(
    () =>
      selectedAdditionalsByCategory.flatMap(({ category, items }) =>
        items.map(({ item, quantity, unitPrice, perPerson, totalPrice }) => ({
          id: item.id,
          label: getAdditionalLabel(item),
          category,
          quantity,
          unitPrice,
          totalPrice,
          imageUrl: getAdditionalImage(item),
          perPerson,
        })),
      ),
    [selectedAdditionalsByCategory],
  )

  const additionalTotal = quoteTotals.additionalTotal

  const mileageFee = quoteTotals.mileageFee

  const quoteTotal = quoteTotals.quoteTotal

  const reservationAmount = quoteTotals.reservationAmount

  const balanceDue = quoteTotals.balanceDue

  const additionalsCount = selectedAdditionals.length

  const stepStatusCtx = useMemo<StepStatusContext>(
    () => ({
      state,
      selectedCustomer,
      selectedPackage,
      currentStep: step,
      reservationAmount,
      additionalsCount,
      packageOptionGroups,
      commercialRules,
      isEditMode,
    }),
    [
      state,
      selectedCustomer,
      selectedPackage,
      step,
      reservationAmount,
      additionalsCount,
      packageOptionGroups,
      commercialRules,
      isEditMode,
    ],
  )

  useEffect(() => {
    if (!reservationAmountCustomized) return
    setState((prev) => ({
      ...prev,
      reservationPercentage:
        quoteTotal > 0
          ? roundPercentage(
              Math.min(
                100,
                Math.max(0, (prev.reservationAmount / quoteTotal) * 100),
              ),
            )
          : prev.reservationPercentage,
    }))
  }, [quoteTotal, reservationAmountCustomized])

  function updateReservationPercentage(raw: string) {
    const percentage = roundPercentage(
      Math.min(100, Math.max(0, Number(raw) || 0)),
    )
    const amount = roundMoney(quoteTotal * (percentage / 100))
    setReservationAmountCustomized(false)
    updateState({
      reservationPercentage: percentage,
      reservationAmount: amount,
    })
  }

  function updateReservationAmount(raw: string) {
    const amount = roundMoney(
      Math.min(quoteTotal, Math.max(0, Number.parseFloat(raw) || 0)),
    )
    const percentage =
      quoteTotal > 0
        ? roundPercentage(
            Math.min(100, Math.max(0, (amount / quoteTotal) * 100)),
          )
        : 0
    setReservationAmountCustomized(true)
    updateState({
      reservationAmount: amount,
      reservationPercentage: percentage,
    })
  }

  function updateState(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }))
  }

  function selectCustomer(customerId: string) {
    const customer = localCustomers.find((c) => c.id === customerId)
    if (!customer) {
      updateState({ customerId })
      return
    }

    const eventDefaults = getEventDefaultsFromCustomer(customer)
    setState((prev) => ({
      ...prev,
      customerId,
      customerDraftPhone: customer.phone ?? '',
      customerDraftName: getCustomerDisplayName(customer),
      customerDraftEmail: customer.email ?? '',
      customerPhoneLinkError: null,
      ...eventDefaults,
    }))
  }

  async function lookupCustomerByPhone(phone: string): Promise<string | null> {
    if (!isUsablePhone(phone)) return null

    updateState({ customerPhoneLinking: true, customerPhoneLinkError: null })
    setCustomerLinkSuccess(null)

    try {
      const response = await fetch('/api/customers/lookup-by-phone', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ phone }),
      })
      const result = (await response.json()) as {
        customer?: Customer
        found?: boolean
        error?: string
      }

      if (!response.ok) {
        updateState({
          customerPhoneLinking: false,
          customerPhoneLinkError:
            result.error ?? 'Não foi possível buscar cliente pelo telefone.',
        })
        return null
      }

      if (result.customer) {
        const customer = result.customer
        setLocalCustomers((current) => mergeCustomerIntoList(current, customer))
        setCustomerLinkSuccess('Cliente existente vinculado.')

        const eventDefaults = getEventDefaultsFromCustomer(customer)
        setState((prev) => ({
          ...prev,
          customerId: customer.id,
          customerDraftPhone: customer.phone ?? phone,
          customerDraftName: getCustomerDisplayName(customer),
          customerDraftEmail: customer.email ?? prev.customerDraftEmail,
          customerPhoneLinking: false,
          customerPhoneLinkError: null,
          ...eventDefaults,
        }))
        return customer.id
      }

      setState((prev) => ({
        ...prev,
        customerId: null,
        customerPhoneLinking: false,
        customerPhoneLinkError: null,
      }))
      setCustomerLinkSuccess(
        'Novo cliente — será cadastrado ao finalizar a cotação.',
      )
      return null
    } catch {
      updateState({
        customerPhoneLinking: false,
        customerPhoneLinkError: 'Erro de rede ao buscar cliente.',
      })
      return null
    }
  }

  useEffect(() => {
    if (isEditMode) return
    if (!isUsablePhone(state.customerDraftPhone)) return
    if (
      state.customerId &&
      selectedCustomer?.phone &&
      normalizePhone(selectedCustomer.phone) ===
        normalizePhone(state.customerDraftPhone)
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      void lookupCustomerByPhone(state.customerDraftPhone)
    }, 600)

    return () => window.clearTimeout(timer)
  }, [
    isEditMode,
    state.customerDraftPhone,
    state.customerDraftName,
    state.customerDraftEmail,
    state.customerId,
    selectedCustomer,
  ])

  function selectCustomerAndAdvance(customerId: string) {
    selectCustomer(customerId)
    setStep(1)
  }

  function setGrillPhotoStatus(status: GrillPhotoStatus) {
    updateState({
      grillPhotoStatus: status,
      grillPhotoRequired: grillPhotoStatusToRequired(status),
      grillPhotoAnswered: true,
    })
  }

  useEffect(() => {
    if (step !== 5) return
    const timer = window.setTimeout(() => {
      distanceInputRef.current?.focus()
      distanceInputRef.current?.select()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [step])

  function setAdditionalQty(itemId: string, quantity: number) {
    const item = additionalItems.find((row) => row.id === itemId)
    const normalizedQty = item
      ? normalizeAdditionalQuantity(item, quantity)
      : Math.max(0, quantity)

    setState((prev) => {
      const next = { ...prev.additionals }
      if (normalizedQty <= 0) {
        delete next[itemId]
      } else {
        next[itemId] = normalizedQty
      }
      return { ...prev, additionals: next }
    })
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1)
  }

  function handlePackageSelectionChange(groupId: string, itemId: string) {
    setState((prev) => ({
      ...prev,
      packageSelections: {
        ...prev.packageSelections,
        [groupId]: itemId,
      },
    }))
    setPackageStepMessage(null)
  }

  function handlePackageSelect(packageId: string | null) {
    if (!packageId) {
      updateState({ packageId: null, packageSelections: {} })
      return
    }

    const prunedSelections = prunePackageSelectionsForPackage(
      packageId,
      state.packageSelections,
      packageOptionGroups,
    )
    updateState({ packageId, packageSelections: prunedSelections })
  }

  function goNext() {
    if (step === 2 && !state.packageId) {
      setPackageStepMessage('Selecione um pacote para continuar.')
      return
    }
    if (step === 2 && state.packageId && selectedPackage) {
      if (!isCustomPackage(selectedPackage)) {
        const issues = validatePackageSelections(
          activePackageOptionGroups,
          state.packageSelections,
        )
        if (issues.length > 0) {
          setPackageSelectionAttempted(true)
          setPackageStepMessage(issues[0])
          return
        }
      }
    }
    setPackageSelectionAttempted(false)
    setPackageStepMessage(null)
    if (step === 4 && !state.grillSetupAnswered) {
      updateState({ grillSetupAnswered: true })
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  useEffect(() => {
    if (state.packageId) {
      setPackageStepMessage(null)
      setPackageSelectionAttempted(false)
    }
  }, [state.packageId, state.packageSelections])

  const pendingSelectionGroupIds = useMemo(() => {
    if (!packageSelectionAttempted || !selectedPackage) return []
    if (isCustomPackage(selectedPackage)) return []
    return getPendingPackageSelectionGroupIds(
      activePackageOptionGroups,
      state.packageSelections,
    )
  }, [
    packageSelectionAttempted,
    selectedPackage,
    activePackageOptionGroups,
    state.packageSelections,
  ])

  useEffect(() => {
    const previousStep = previousStepRef.current
    previousStepRef.current = step
    if (step === 2 && previousStep === 1 && !isEditMode) {
      updateState({ packageId: null, packageSelections: {} })
      setPackageExplorerKey((key) => key + 1)
    }
  }, [step, isEditMode])

  const mandatoryPendingSteps = useMemo(
    () => getMandatoryPendingSteps(stepStatusCtx),
    [stepStatusCtx],
  )

  const quoteReady = isQuoteReadyToSave(stepStatusCtx)

  async function handleSaveQuote(openReview = false) {
    if (saving) return

    if (mandatoryPendingSteps.length > 0) {
      const errorInfo = buildSaveQuoteError(
        'validation',
        new Error('Existem pendências obrigatórias nas etapas anteriores.'),
      )
      setSaveErrorInfo(errorInfo)
      return
    }

    const customerIdToSave = isEditMode
      ? state.customerId ??
        (existingSnapshot as { customer_id?: string | null } | undefined)
          ?.customer_id ??
        null
      : state.customerId ?? selectedCustomer?.id ?? null

    if (!state.packageId) {
      const errorInfo = buildSaveQuoteError(
        'validation',
        new Error('Pacote não selecionado.'),
      )
      setSaveErrorInfo(errorInfo)
      return
    }

    const packageForSave =
      selectedPackage ??
      packages.find((pkg) => pkg.id === state.packageId) ??
      null

    if (!packageForSave) {
      const errorInfo = buildSaveQuoteError(
        'validation',
        new Error('Pacote selecionado não encontrado no catálogo.'),
      )
      setSaveErrorInfo(errorInfo)
      return
    }

    setSaving(true)
    setSaveErrorInfo(null)

    const currentPricingFingerprint = buildPricingFingerprint(state)
    const recalculateSnapshot =
      !isEditMode ||
      currentPricingFingerprint !== (initialPricingFingerprint ?? '')

    const payload: QuoteSaveInput = {
      language: state.language,
      customerId: customerIdToSave,
      customerDraft:
        !isEditMode && !customerIdToSave && isUsablePhone(state.customerDraftPhone)
          ? {
              phone: state.customerDraftPhone,
              name: state.customerDraftName || null,
              email: state.customerDraftEmail || null,
            }
          : null,
      packageId: packageForSave.id,
      branchId: state.branchId ?? tenantBranchId ?? null,
      eventName: state.eventName,
      eventDate: state.eventDate,
      startTime: state.startTime,
      endTime: state.endTime,
      adultCount: state.adultCount,
      childrenUnder3Count: state.childrenUnder3Count,
      children4To12Count: state.children4To12Count,
      address: state.address,
      city: state.city,
      state: state.state,
      zipCode: state.zipCode,
      hasGrill: state.hasGrill,
      grillPhotoRequired: state.grillPhotoRequired,
      grillRentalRequired: state.grillRentalRequired,
      grillRentalQty: state.grillRentalQty,
      grillNotes: state.grillNotes,
      baseLocation: state.baseLocation,
      distance: state.distance,
      pricing: commercialRules,
      reservationPercentage: state.reservationPercentage,
      reservationAmount,
      packagePricePerPerson: getPackagePrice(packageForSave),
      packageSelections: isCustomPackage(packageForSave)
        ? []
        : activePackageOptionGroups
            .map((group) => {
              const optionItemId = state.packageSelections[group.id]?.trim()
              if (!optionItemId) return null
              return {
                optionGroupId: group.id,
                optionItemId,
                packageId: packageForSave.id,
              }
            })
            .filter(
              (
                line,
              ): line is {
                optionGroupId: string
                optionItemId: string
                packageId: string
              } => line !== null,
            ),
      additionals: selectedAdditionals.map(
        ({ item, quantity, unitPrice, perPerson, totalPrice }) => ({
          itemId: item.id,
          quantity,
          unitPrice,
          perPerson,
          totalPrice,
        }),
      ),
      recalculateSnapshot,
      existingSnapshot: isEditMode ? existingSnapshot : undefined,
    }

    try {
      const result = isEditMode
        ? await updateQuote(quoteId!, payload)
        : await createQuote(payload)

      if (result.error || !result.data?.id) {
        const errorInfo = normalizeSaveQuoteError(
          result.error ??
            new Error('Cotação não foi criada — resposta sem id do Supabase.'),
          isEditMode ? 'quote' : 'quote',
        )
        logSaveQuoteError(errorInfo, result.error)
        setSaveErrorInfo(errorInfo)
        return
      }

      const createdId = result.data.id
      const params = new URLSearchParams()
      params.set(isEditMode ? 'updated' : 'created', '1')
      if (openReview) {
        params.set('review', '1')
      }
      router.push(`/quotes/${createdId}?${params.toString()}`)
    } catch (error) {
      const errorInfo = normalizeSaveQuoteError(error, 'quote')
      logSaveQuoteError(errorInfo, error)
      setSaveErrorInfo(errorInfo)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-cdl-bg px-4 py-4 text-cdl-fg sm:px-8 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex flex-col gap-2">
          <AppMainNav />
          <Link
            href={isEditMode && quoteId ? `/quotes/${quoteId}` : '/quotes'}
            className="inline-flex items-center text-sm text-cdl-muted transition-colors hover:text-cdl-brand"
          >
            {isEditMode ? '← Voltar para cotação' : '← Voltar às cotações'}
          </Link>
        </div>

        <QuoteHeaderCompact isEditMode={isEditMode} />
        <QuoteHeroBanner isEditMode={isEditMode} />
        <BuildVersionBadge className="mb-3 md:mb-4" />

        <nav
          className="mb-4 rounded-2xl border border-cdl-border bg-cdl-surface p-3 shadow-cdl sm:mb-5 sm:p-4"
          aria-label="Etapas do wizard"
        >
          <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
            <p className="cdl-eyebrow">
              Etapa {step + 1} de {STEPS.length}
            </p>
            <p className="truncate text-right text-sm font-bold uppercase tracking-wide text-cdl-brand">
              {STEPS[step]}
            </p>
          </div>

          <div
            className="mb-3 flex h-1 gap-0.5 overflow-hidden rounded-full"
            aria-hidden
          >
            {STEPS.map((label, index) => (
              <div
                key={`segment-${label}`}
                className={`h-full flex-1 rounded-full transition-colors duration-300 ${stepSegmentClass(getStepVisualStatus(index, stepStatusCtx))}`}
              />
            ))}
          </div>

          <ol className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 snap-x snap-mandatory lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-1.5 lg:overflow-visible lg:pb-0">
            {STEPS.map((label, index) => {
              const status = getStepVisualStatus(index, stepStatusCtx)
              const isCurrent = index === step
              const stepTitle =
                index === 4 && additionalsCount > 0
                  ? `${label} · ${additionalsCount} adicionais selecionados`
                  : label

              return (
                <li
                  key={label}
                  className="min-w-[4.25rem] shrink-0 snap-start lg:min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => setStep(index)}
                    title={stepTitle}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors lg:px-1.5 lg:py-2.5 ${stepButtonClass(status, isCurrent)}`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black lg:h-6 lg:w-6 lg:text-xs ${stepBadgeClass(status)}`}
                    >
                      {status === 'complete' ? '✓' : status === 'error' ? '!' : index + 1}
                    </span>
                    <span className="w-full text-center text-[8px] font-semibold uppercase leading-tight tracking-wide lg:text-[9px] xl:text-[10px]">
                      {label}
                    </span>
                    {index === 4 && additionalsCount > 0 && (
                      <span className="text-[7px] font-bold uppercase tracking-wide opacity-80 lg:text-[8px]">
                        {additionalsCount} sel.
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        {fetchErrors.length > 0 && (
          <div className="mb-6 rounded-3xl border border-red-500/40 bg-cdl-surface p-4 text-sm text-red-400">
            {fetchErrors.map((msg) => (
              <p key={msg}>{msg}</p>
            ))}
          </div>
        )}

        {step === 0 && isEditMode ? (
          <SectionCard title="Etapa 1 — Cliente">
            <div className="sm:col-span-2">
              <label className="flex flex-col gap-2">
                <span className="cdl-eyebrow">Idioma da cotação</span>
                <select
                  value={state.language}
                  onChange={(e) =>
                    updateState({
                      language: e.target.value as 'pt' | 'en' | 'es',
                    })
                  }
                  className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
                >
                  <option value="pt">Português (PT)</option>
                  <option value="en">English (EN)</option>
                  <option value="es">Español (ES)</option>
                </select>
              </label>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-cdl-border bg-cdl-inset p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-cdl-muted">
                Cliente atual
              </p>
              <p className="mt-2 text-xl font-black text-cdl-title">
                {editCustomerDisplayName}
              </p>
              {linkedCustomer?.email ? (
                <p className="mt-1 text-sm text-cdl-muted">{linkedCustomer.email}</p>
              ) : null}
              {linkedCustomer?.phone ? (
                <p className="text-sm text-cdl-muted">{linkedCustomer.phone}</p>
              ) : null}
              {!linkedCustomer && state.customerId ? (
                <p className="mt-2 font-mono text-xs text-cdl-subtle">
                  ID: {state.customerId}
                </p>
              ) : null}
              <p className="mt-4 text-sm text-cdl-text-secondary">
                O cliente não pode ser alterado nesta tela.
              </p>
            </div>
          </SectionCard>
        ) : null}

        {step === 0 && !isEditMode && (
          <SectionCard title="Etapa 1 — Cliente">
            <div className="sm:col-span-2">
              <label className="flex flex-col gap-2">
                <span className="cdl-eyebrow">Idioma da cotação</span>
                <select
                  value={state.language}
                  onChange={(e) =>
                    updateState({
                      language: e.target.value as 'pt' | 'en' | 'es',
                    })
                  }
                  className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
                >
                  <option value="pt">Português (PT)</option>
                  <option value="en">English (EN)</option>
                  <option value="es">Español (ES)</option>
                </select>
                <p className="text-xs text-cdl-muted">
                  Usado no PDF, visualização pública e comunicações futuras.
                </p>
              </label>
            </div>
            {!selectedCustomer ? (
              <div className="sm:col-span-2 rounded-xl border border-cdl-warning-border bg-cdl-warning-soft px-4 py-3">
                <p className="text-sm leading-relaxed text-cdl-text-secondary">
                  Cliente ainda não vinculado. A cotação pode ser criada, mas
                  deverá ser revisada antes do envio final.
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
              <InputField
                label="Telefone do cliente"
                value={state.customerDraftPhone}
                onChange={(v) =>
                  updateState({
                    customerDraftPhone: v,
                    customerPhoneLinkError: null,
                  })
                }
                placeholder="(555) 123-4567"
                completion={
                  selectedCustomer || isUsablePhone(state.customerDraftPhone)
                    ? 'filled'
                    : 'empty'
                }
              />
              <InputField
                label="Nome do cliente"
                value={state.customerDraftName}
                onChange={(v) => updateState({ customerDraftName: v })}
                placeholder="Nome para contato"
                completion={getFieldCompletion(state.customerDraftName)}
              />
              <InputField
                label="E-mail"
                value={state.customerDraftEmail}
                onChange={(v) => updateState({ customerDraftEmail: v })}
                placeholder="email@exemplo.com"
                className="sm:col-span-2"
                completion={getFieldCompletion(state.customerDraftEmail)}
              />
            </div>

            {state.customerPhoneLinking ? (
              <p className="sm:col-span-2 text-sm text-cdl-muted">
                Buscando ou criando cliente pelo telefone…
              </p>
            ) : null}
            {state.customerPhoneLinkError ? (
              <p className="sm:col-span-2 text-sm text-cdl-action">
                {state.customerPhoneLinkError}
              </p>
            ) : null}
            {customerLinkSuccess ? (
              <p className="sm:col-span-2 text-sm font-semibold text-cdl-success">
                {customerLinkSuccess}
              </p>
            ) : null}
            {selectedCustomer ? (
              <div className="sm:col-span-2 rounded-xl border border-cdl-success-border bg-cdl-success-soft px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-cdl-success">
                  Cliente vinculado
                </p>
                <p className="mt-1 font-bold text-cdl-fg">
                  {getCustomerName(selectedCustomer)}
                </p>
                {selectedCustomer.ab_number ? (
                  <p className="mt-1 text-xs text-cdl-muted">
                    {selectedCustomer.ab_number}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <InputField
                    label="Pesquisar cliente existente"
                    value={customerSearch}
                    onChange={(value) => {
                      setCustomerSearch(value)
                      setCustomerLinkSuccess(null)
                    }}
                    onFocus={() => void refreshCustomersFromApi(customerSearch)}
                    placeholder="Nome, telefone, e-mail ou AB number"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void refreshCustomersFromApi(customerSearch)}
                  disabled={customersRefreshing}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-4 py-3 text-xs font-bold uppercase tracking-wider text-cdl-fg disabled:opacity-50"
                >
                  {customersRefreshing ? 'Atualizando…' : 'Atualizar'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
              {filteredCustomers.length === 0 ? (
                <p className="text-sm text-cdl-muted sm:col-span-2">
                  Nenhum cliente encontrado.
                </p>
              ) : (
                filteredCustomers.map((customer) => {
                  const selected = state.customerId === customer.id
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer.id)}
                      className={`rounded-xl border p-5 text-left shadow-cdl transition-colors ${
                        selected
                          ? 'border-cdl-success-border bg-cdl-success-soft'
                          : 'border-cdl-border bg-cdl-inset hover:border-cdl-accent-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className="cursor-pointer font-bold text-cdl-fg"
                          title="Duplo clique para ir ao evento"
                          onDoubleClick={() =>
                            selectCustomerAndAdvance(customer.id)
                          }
                        >
                          {getCustomerName(customer)}
                        </h3>
                        {selected && (
                          <span className="text-sm font-bold text-cdl-success">
                            ✓
                          </span>
                        )}
                      </div>
                      {customer.email && (
                        <p className="mt-1 text-sm text-cdl-muted">{customer.email}</p>
                      )}
                      {customer.phone && (
                        <p className="text-sm text-cdl-muted">{customer.phone}</p>
                      )}
                      {customer.ab_number && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                          {customer.ab_number}
                        </p>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </SectionCard>
        )}

        {step === 1 && (
          <SectionCard title="Etapa 2 — Evento">
            <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
              <InputField
                label="Event Name"
                value={state.eventName}
                onChange={(v) => updateState({ eventName: v })}
                placeholder="Nome do evento"
                completion={getFieldCompletion(state.eventName)}
              />
              <DatePickerField
                label="Event Date"
                value={state.eventDate}
                onChange={(v) => updateState({ eventDate: v })}
                completion={getFieldCompletion(state.eventDate)}
              />
              <TimePickerField
                label="Horário início"
                value={state.startTime}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    startTime: v,
                    endTime: endTimeCustomized
                      ? prev.endTime
                      : addHoursToTime(v, 4),
                  }))
                }
                completion={getFieldCompletion(state.startTime)}
              />
              <div>
                <TimePickerField
                  label="Horário fim"
                  value={state.endTime}
                  onChange={(v) => {
                    setEndTimeCustomized(true)
                    updateState({ endTime: v })
                  }}
                  completion={getFieldCompletion(state.endTime)}
                />
                <p className="mt-2 text-xs text-cdl-subtle">
                  Preenchido automaticamente com +4h. Você pode alterar se
                  quiser.
                </p>
              </div>
              <QuantityField
                label="Adultos"
                value={state.adultCount}
                onChange={(v) => updateState({ adultCount: v })}
                completion={getFieldCompletion(state.adultCount)}
              />
              <QuantityField
                label="Crianças até 3 anos"
                value={state.childrenUnder3Count}
                onChange={(v) => updateState({ childrenUnder3Count: v })}
              />
              <QuantityField
                label="Crianças 4 a 12 anos"
                value={state.children4To12Count}
                onChange={(v) => updateState({ children4To12Count: v })}
              />
              <AddressAutocompleteFields
                className="sm:col-span-2"
                values={{
                  address: state.address,
                  city: state.city,
                  state: state.state,
                  zipCode: state.zipCode,
                }}
                fieldCompletions={{
                  city: getFieldCompletion(state.city),
                  state: getFieldCompletion(state.state),
                  zipCode: getFieldCompletion(state.zipCode),
                }}
                onChange={(patch) => updateState(patch)}
              />
            </div>
          </SectionCard>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-cdl-border bg-cdl-surface p-7 shadow-cdl sm:p-9">
              <h2 className="cdl-section-title !mb-0 !border-0 !pb-0">
                Escolha o pacote
              </h2>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                Etapa 3 — Pacote
              </p>
              <p className="mt-2 text-sm text-cdl-muted">
                Selecione o tipo de pacote, escolha a opção e confira os
                detalhes antes de continuar
              </p>
            </section>

            <QuotePackageStepExplorer
              key={packageExplorerKey}
              packagesWithoutSides={packagesWithoutSides}
              packagesWithSides={packagesWithSides}
              allPackages={packages}
              selectedPackageId={state.packageId}
              language={state.language}
              sidesPricePerPerson={commercialRules.sidesPricePerPerson}
              optionGroupsForPackage={optionGroupsForPackage}
              packageItems={packageItems}
              packageSideItems={packageSideItems}
              selections={state.packageSelections}
              onSelectionChange={handlePackageSelectionChange}
              pendingSelectionGroupIds={pendingSelectionGroupIds}
              onSelect={handlePackageSelect}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-cdl-border bg-cdl-surface p-7 shadow-cdl sm:p-9">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="cdl-section-title !mb-0 !border-0 !pb-0">
                    Etapa 4 — Adicionais
                  </h2>
                  <p className="mt-1 text-sm text-cdl-muted">
                    Clique em uma categoria para ver os itens com foto
                  </p>
                </div>
                {additionalsCount > 0 && (
                  <span className="inline-flex rounded-full border border-cdl-success-border bg-cdl-success-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-cdl-success">
                    {additionalsCount} adicionais selecionados
                  </span>
                )}
              </div>
            </section>

            {additionalItemsByCategory.length === 0 ? (
              <p className="text-sm text-cdl-muted">Nenhum adicional disponível.</p>
            ) : (
              <div className="space-y-3">
                {additionalItemsByCategory.map(({ category, items }) => (
                  <AdditionalCategorySection
                    key={category}
                    category={category}
                    items={items}
                    expanded={openAdditionalCategories.has(category)}
                    selectedCount={selectedCountByCategory[category] ?? 0}
                    quantities={state.additionals}
                    billableGuestCount={billableGuestCount}
                    onToggle={() => toggleAdditionalCategory(category)}
                    onChangeQty={setAdditionalQty}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end rounded-2xl border border-cdl-border bg-cdl-surface p-7 shadow-cdl sm:p-9">
              <WizardStepButton
                label="Continuar para Churrasqueira →"
                onClick={() => setStep(4)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <SectionCard title="Etapa 5 — Churrasqueira">
            <div className="grid grid-cols-1 gap-5 sm:col-span-2 sm:grid-cols-2">
              <CheckboxField
                label="Cliente tem churrasqueira?"
                checked={state.hasGrill}
                onChange={(v) =>
                  updateState(
                    v
                      ? {
                          hasGrill: true,
                          grillSetupAnswered: true,
                          grillPhotoStatus: 'pending',
                          grillPhotoRequired: true,
                          grillPhotoAnswered: false,
                        }
                      : {
                          hasGrill: false,
                          grillSetupAnswered: true,
                          grillPhotoStatus: 'not_applicable',
                          grillPhotoRequired: false,
                          grillPhotoAnswered: true,
                        },
                  )
                }
              />
              <GrillPhotoStatusField
                value={state.grillPhotoStatus}
                disabled={!state.hasGrill}
                onChange={setGrillPhotoStatus}
              />
              <div className="sm:col-span-2">
                <button
                  type="button"
                  disabled
                  title="Em breve"
                  className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-dashed border-cdl-border bg-cdl-inset px-4 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted opacity-70"
                >
                  Anexar foto da churrasqueira
                </button>
                {/* Future: upload grill photo to Supabase Storage and save media id/url on events.grill_photo_media_id / grill_photo_url. */}
                <p className="mt-3 rounded-xl border border-cdl-border-subtle bg-cdl-inset px-4 py-3 text-sm leading-relaxed text-cdl-text-secondary">
                  Se o cliente possui churrasqueira própria, confirme se a foto
                  foi recebida para validar tamanho, condição e estrutura antes
                  do evento.
                </p>
              </div>
              <CheckboxField
                label="Necessário alugar churrasqueira?"
                checked={state.grillRentalRequired}
                onChange={(v) =>
                  updateState({
                    grillRentalRequired: v,
                    grillRentalQty: v ? Math.max(1, state.grillRentalQty) : 0,
                  })
                }
              />
              <QuantityField
                label="Quantidade de churrasqueiras para aluguel"
                value={state.grillRentalQty}
                min={state.grillRentalRequired ? 1 : 0}
                disabled={!state.grillRentalRequired}
                placeholder={state.grillRentalRequired ? '1' : '0'}
                onChange={(v) =>
                  updateState({
                    grillRentalQty: state.grillRentalRequired
                      ? Math.max(1, v)
                      : 0,
                  })
                }
              />
              <div className="sm:col-span-2">
                <label className="flex flex-col gap-2">
                  <span className="cdl-eyebrow">
                    Observações sobre a churrasqueira
                  </span>
                  <textarea
                    value={state.grillNotes}
                    onChange={(e) => updateState({ grillNotes: e.target.value })}
                    rows={4}
                    placeholder="Ex.: cliente possui churrasqueira, mas foto ainda pendente"
                    className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none transition-colors placeholder:text-cdl-faint focus:border-cdl-accent-border"
                  />
                </label>
              </div>
            </div>
          </SectionCard>
        )}

        {step === 5 && (
          <SectionCard title="Etapa 6 — Milhagem">
            <div className="sm:col-span-2 rounded-xl border border-cdl-warning-border bg-cdl-warning-soft px-4 py-3">
              <p className="text-sm leading-relaxed text-cdl-text-secondary">
                Base atual: {commercialRules.mileageBaseLocation}. Até{' '}
                {commercialRules.mileageFreeLimit} mi grátis. Acima de{' '}
                {commercialRules.mileageFreeLimit} mi, aplicar regra comercial
                configurada.
              </p>
              {/* TODO: Future: calculate mileage automatically using event destination address and base location. */}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
              <InputField
                label="Base Location"
                value={state.baseLocation}
                onChange={(v) => updateState({ baseLocation: v })}
                placeholder="Local base"
                completion={getFieldCompletion(state.baseLocation)}
              />
              <InputField
                label="Distance (mi)"
                type="number"
                value={state.distance}
                inputRef={distanceInputRef}
                onChange={(v) =>
                  updateState({ distance: Math.max(0, Number(v) || 0) })
                }
                completion={getFieldCompletion(state.distance)}
              />
              <InputField
                label="Free Limit (mi)"
                type="number"
                value={state.freeLimit}
                onChange={(v) =>
                  updateState({ freeLimit: Math.max(0, Number(v) || 0) })
                }
              />
              <InputField
                label="Rate ($/mi)"
                type="number"
                value={state.rate}
                onChange={(v) =>
                  updateState({ rate: Math.max(0, Number(v) || 0) })
                }
              />
              <MileageSummaryPanel
                distance={state.distance}
                freeLimit={state.freeLimit}
                rate={state.rate}
                mileageFee={mileageFee}
              />
            </div>
          </SectionCard>
        )}

        {step === 6 && (
          <SectionCard title="Etapa 7 — Reserva">
            <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="rounded-2xl border border-cdl-accent-border bg-cdl-inset px-4 py-4">
                  <p className="text-sm leading-relaxed text-cdl-text-secondary">
                    {RESERVATION_PAYMENT_TEXT}
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="rounded-2xl border border-cdl-border bg-cdl-inset px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                    Total da cotação
                  </p>
                  <p className="mt-1 text-2xl font-black text-cdl-price">
                    {formatCurrency(quoteTotal)}
                  </p>
                </div>
              </div>
              <InputField
                label="Reservation Percentage (%)"
                type="number"
                step="0.001"
                min={0}
                max={100}
                value={state.reservationPercentage}
                onChange={updateReservationPercentage}
              />
              <InputField
                label="Reservation Amount ($)"
                type="number"
                step="0.01"
                min={0}
                max={quoteTotal}
                value={reservationAmount}
                onChange={updateReservationAmount}
              />
              <p className="sm:col-span-2 text-xs text-cdl-subtle">
                Percentual com até 3 casas decimais ou valor absoluto em $ — o
                outro campo é recalculado automaticamente. Reserva:{' '}
                {formatReservationSummary(
                  state.reservationPercentage,
                  reservationAmount,
                  reservationAmountCustomized,
                )}{' '}
                · Saldo: {formatCurrency(balanceDue)}
              </p>
              <div className="sm:col-span-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                    Notes
                  </span>
                  <textarea
                    value={state.reservationNotes}
                    onChange={(e) =>
                      updateState({ reservationNotes: e.target.value })
                    }
                    rows={4}
                    placeholder="Observações da reserva..."
                    className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none transition-colors placeholder:text-cdl-faint focus:border-cdl-accent-border"
                  />
                </label>
              </div>
            </div>
          </SectionCard>
        )}

        {step === 7 && (
          <QuoteWizardSummaryStep
            state={state}
            quoteTotals={quoteTotals}
            customerName={
              isEditMode
                ? editCustomerDisplayName
                : selectedCustomer
                  ? getCustomerName(selectedCustomer)
                  : state.customerDraftName.trim() ||
                    'Cliente ainda não vinculado'
            }
            packageName={
              selectedPackage ? getPackageName(selectedPackage) : null
            }
            packageImageUrl={packageImageUrl}
            packageUnitPrice={packageUnitPrice}
            selectedPackage={selectedPackage}
            allPackages={packages}
            packageOptionGroups={packageOptionGroups}
            packageItems={packageItems}
            packageSideItems={packageSideItems}
            fromWithSidesSection={fromWithSidesSection}
            billableGuestCount={billableGuestCount}
            additionals={reviewAdditionals}
            commercialRules={commercialRules}
            stepStatusCtx={stepStatusCtx}
            mandatoryPendingSteps={mandatoryPendingSteps}
            quoteReady={quoteReady}
            saving={saving}
            saveErrorInfo={saveErrorInfo}
            isEditMode={isEditMode}
            quoteId={quoteId}
            onGoToStep={setStep}
            onBack={goBack}
            onSave={handleSaveQuote}
          />
        )}

        {step !== 7 && (
        <div className="mt-8 space-y-3">
          {step === 2 && selectedPackage ? (
            <p className="text-center text-sm text-cdl-muted sm:text-right">
              Pacote selecionado:{' '}
              <span className="font-semibold text-cdl-fg">
                {getPackageDetailTitle(selectedPackage)}
              </span>
              {' — '}
              <span className="font-semibold text-cdl-price">
                {formatCurrency(packageUnitPrice)} / pessoa
              </span>
            </p>
          ) : null}
          {step === 2 && packageStepMessage ? (
            <p className="text-center text-sm font-medium text-red-600 sm:text-right">
              {packageStepMessage}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="rounded-xl border border-cdl-border bg-cdl-surface px-6 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border disabled:cursor-not-allowed disabled:opacity-40"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={
                step === STEPS.length - 1 || (step === 2 && !state.packageId)
              }
              className="cdl-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próximo
            </button>
          </div>
        </div>
        )}
      </div>
    </main>
  )
}
