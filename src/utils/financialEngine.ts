import { Tenant, Property } from '../App'

export interface MonthlyObligation {
  tenantId: number
  month: string // YYYY-MM
  amount: number
}

export interface TenantFinancialStatus {
  tenantId: number
  totalObligation: number
  totalPaid: number
  balance: number
  isUpToDate: boolean
}

const getMonthRange = (start: string, end: string) => {
  const months: string[] = []

  const startDate = new Date(start)
  const endDate = new Date(end)

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)

  while (current <= endDate) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

export const generateObligations = (
  tenants: Tenant[],
  properties: Property[]
): MonthlyObligation[] => {
  const obligations: MonthlyObligation[] = []

  tenants.forEach((tenant) => {
    if (!tenant.contractStart || !tenant.contractEnd) return
    if (!tenant.propertyId) return

    const property = properties.find(p => p.id === tenant.propertyId)
    if (!property) return

    const months = getMonthRange(tenant.contractStart, tenant.contractEnd)

    months.forEach(month => {
      obligations.push({
        tenantId: tenant.id,
        month,
        amount: property.rent
      })
    })
  })

  return obligations
}

export const calculateTenantFinancialStatus = (
  tenantId: number,
  obligations: MonthlyObligation[],
  payments: { tenantId: number; amount: number }[]
): TenantFinancialStatus => {

  const tenantObligations = obligations.filter(o => o.tenantId === tenantId)
  const totalObligation = tenantObligations.reduce((acc, o) => acc + o.amount, 0)

  const tenantPayments = payments.filter(p => p.tenantId === tenantId)
  const totalPaid = tenantPayments.reduce((acc, p) => acc + p.amount, 0)

  const balance = totalObligation - totalPaid

  return {
    tenantId,
    totalObligation,
    totalPaid,
    balance,
    isUpToDate: balance <= 0
  }
}