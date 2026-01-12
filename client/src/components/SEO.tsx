import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
  structuredData?: object;
}

export function SEO({
  title = "متجر ضياء - شحن ألعاب إلكترونية في مصر | Diaa Gaming Store",
  description = "متجر ضياء متخصص في شحن ألعاب إلكترونية في مصر. اشحن عملات ألعابك بأمان وسرعة مع Diaa Sadek. خدمة موثوقة لجميع الألعاب الإلكترونية.",
  keywords = [
    "متجر ألعاب", "شحن ألعاب", "Diaa", "ضياء", "top up games Egypt",
    "شحن ألعاب إلكترونية", "gaming store Egypt", "Diaa Sadek", "متجر ضياء",
    "شحن عملات ألعاب", "ألعاب إلكترونية مصر", "top up Egypt", "gaming top up",
    "ضياء ألعاب", "Diaa gaming", "شحن ألعاب اونلاين", "متجر ألعاب مصر",
    "gaming store", "شحن ألعاب سريع"
  ],
  image = "/logo.png",
  url = window.location.href,
  type = "website",
  siteName = "متجر ضياء",
  locale = "ar_EG",
  alternateLocales = ["en_EG"],
  structuredData
}: SEOProps) {
  const fullTitle = title;
  const keywordsString = keywords.join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="author" content="Diaa Sadek" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Arabic" />
      <meta httpEquiv="content-language" content="ar-EG" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map(loc => (
        <meta key={loc} property="og:locale:alternate" content={loc} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* PWA */}
      <link rel="manifest" href="/manifest.json" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Additional SEO */}
      <meta name="theme-color" content="#FFD700" />
      <meta name="msapplication-TileColor" content="#FFD700" />
      <link rel="icon" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/logo.png" />
    </Helmet>
  );
}