export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ')
}

const WHATSAPP_PHONE = '916003426591'

export function formatPriceINR(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function buildWhatsAppMessage(productName: string, price: number) {
  return [
    'Hello! 👋',
    '',
    'I would like to purchase this product.',
    '',
    'Product:',
    productName,
    '',
    'Price:',
    formatPriceINR(price),
    '',
    'Please let me know if it is available.',
    '',
    'Thank you!',
  ].join('\n')
}

export function getWhatsAppProductUrl(productName: string, price: number) {
  const text = encodeURIComponent(buildWhatsAppMessage(productName, price))
  return `https://wa.me/${WHATSAPP_PHONE}?text=${text}`
}

