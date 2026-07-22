import { useEffect } from 'react'
import type { Product } from '../types/product.types'

export type SEOProps = {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  product?: Product
  breadcrumbs?: Array<{ name: string; item: string }>
}

export function useSEO({
  title = 'Hokhiyoti Biponi | Luxury Assam Silk & Handloom Collections',
  description = 'Discover handcrafted Assam Silk, pure Mekhela Chador, royal Sarees, and timeless handwoven heritage garments at Hokhiyoti Biponi.',
  image = 'https://hokhiyotibiponi.com/logo.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  product,
  breadcrumbs,
}: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    const finalTitle = title.includes('Hokhiyoti Biponi') ? title : `${title} | Hokhiyoti Biponi`
    document.title = finalTitle

    // Helper to set or create meta tag
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attrName, attrValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', contentValue)
    }

    // 2. Meta Description
    setMetaTag('name', 'description', description)

    // 3. OpenGraph
    setMetaTag('property', 'og:title', finalTitle)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:image', image)
    setMetaTag('property', 'og:url', url)
    setMetaTag('property', 'og:type', product ? 'og:product' : type)
    setMetaTag('property', 'og:site_name', 'Hokhiyoti Biponi')

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', finalTitle)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', image)

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', url)

    // 6. JSON-LD Schemas
    const jsonLdScripts: HTMLScriptElement[] = []

    // Organization Schema
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Hokhiyoti Biponi',
      url: 'https://hokhiyotibiponi.com',
      logo: 'https://hokhiyotibiponi.com/logo.png',
      sameAs: ['https://instagram.com/hokhiyotibiponi', 'https://facebook.com/hokhiyotibiponi'],
    }

    const orgScript = document.createElement('script')
    orgScript.type = 'application/ld+json'
    orgScript.text = JSON.stringify(orgSchema)
    document.head.appendChild(orgScript)
    jsonLdScripts.push(orgScript)

    // Product Schema (if product provided)
    if (product) {
      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images.map((i) => i.url),
        description: product.description,
        sku: product.id,
        brand: {
          '@type': 'Brand',
          name: 'Hokhiyoti Biponi',
        },
        offers: {
          '@type': 'Offer',
          url: url,
          priceCurrency: product.currency || 'INR',
          price: product.price,
          availability:
            product.availabilityStatus === 'out_of_stock'
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating || 5.0,
          reviewCount: product.reviewsCount || 1,
        },
      }

      const prodScript = document.createElement('script')
      prodScript.type = 'application/ld+json'
      prodScript.text = JSON.stringify(productSchema)
      document.head.appendChild(prodScript)
      jsonLdScripts.push(prodScript)
    }

    // Breadcrumb Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((bc, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: bc.name,
          item: bc.item,
        })),
      }

      const bcScript = document.createElement('script')
      bcScript.type = 'application/ld+json'
      bcScript.text = JSON.stringify(breadcrumbSchema)
      document.head.appendChild(bcScript)
      jsonLdScripts.push(bcScript)
    }

    return () => {
      jsonLdScripts.forEach((s) => s.remove())
    }
  }, [title, description, image, url, type, product, breadcrumbs])
}
