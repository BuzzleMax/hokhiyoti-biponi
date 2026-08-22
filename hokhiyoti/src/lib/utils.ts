export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ')
}

export const WHATSAPP_PHONE = '916003426591'

export function calculateCommission(
  price: number,
  commissionPercentage: number
): { commissionAmount: number; sellerEarnings: number } {
  const commissionAmount = Math.round(price * (commissionPercentage / 100))
  const sellerEarnings = price - commissionAmount
  return { commissionAmount, sellerEarnings }
}

export function formatPriceINR(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function buildWhatsAppMessage(options: {
  productName: string
  price: number
  productId?: string
  selectedColour?: string
  selectedSize?: string
  enableSizes?: boolean
  productUrl?: string
  customerNote?: string
}) {
  const { productName, price, productId, selectedColour, selectedSize, enableSizes, productUrl, customerNote } = options

  const lines = [
    'Hello Hokhiyoti Biponi, I would like to enquire about:',
    '',
    `Product: ${productName}`,
    `Price: ₹${price.toLocaleString('en-IN')}`,
  ]

  if (productId) {
    lines.push(`Product ID: ${productId}`)
  }

  if (selectedColour) {
    lines.push(`Colour: ${selectedColour}`)
  }

  if (enableSizes && selectedSize) {
    lines.push(`Size: ${selectedSize}`)
  }

  if (productUrl) {
    lines.push('', `Product URL: ${productUrl}`)
  }

  if (customerNote) {
    lines.push('', `Note: ${customerNote}`)
  }

  lines.push('', 'Please let me know about availability and shipping.')

  return lines.join('\n')
}

export function getWhatsAppProductUrl(options: {
  productName: string
  price: number
  productId?: string
  selectedColour?: string
  selectedSize?: string
  enableSizes?: boolean
  productUrl?: string
  customerNote?: string
}) {
  const text = encodeURIComponent(buildWhatsAppMessage(options))
  return `https://wa.me/${WHATSAPP_PHONE}?text=${text}`
}
