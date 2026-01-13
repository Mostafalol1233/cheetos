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
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="language" content="Arabic" />
      <meta httpEquiv="content-language" content="ar-EG" />
      <meta name="geo.region" content="EG" />
      <meta name="geo.country" content="Egypt" />
      <meta name="geo.placename" content="Cairo, Egypt" />
      <meta name="ICBM" content="30.0444, 31.2357" />
      <meta name="revisit-after" content="1 days" />

      {/* Voice Search Optimization */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta property="og:audio" content="" />
      <meta property="og:video" content="" />

      {/* Additional Open Graph for better social sharing */}
      <meta property="og:locale" content="ar_EG" />
      <meta property="og:locale:alternate" content="en_EG" />
      <meta property="og:determiner" content="the" />
      <meta property="og:rich_attachment" content="true" />
      <meta property="og:ttl" content="345600" />

      {/* Article specific (for blog-like content) */}
      <meta property="article:author" content="Diaa Sadek" />
      <meta property="article:publisher" content="https://www.facebook.com/diaasadek" />
      <meta property="article:section" content="Gaming" />
      <meta property="article:tag" content="Gaming Top-Up" />

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

      {/* Logo and Branding */}
      <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/logo.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/logo.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
      <link rel="apple-touch-icon-precomposed" href="/logo.png" />
      <meta name="msapplication-TileImage" content="/logo.png" />
      <meta name="msapplication-TileColor" content="#FFD700" />

      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Enhanced Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "متجر ضياء",
          "alternateName": ["Diaa Sadek", "Diaa Gaming Store", "ضياء ألعاب"],
          "description": "متجر ضياء متخصص في شحن ألعاب إلكترونية في مصر. اشحن عملات ألعابك بأمان وسرعة مع Diaa Sadek.",
          "url": window.location.origin,
          "logo": `${window.location.origin}/logo.png`,
          "image": `${window.location.origin}/logo.png`,
          "foundingDate": "2024",
          "founders": [{
            "@type": "Person",
            "name": "Diaa Sadek"
          }],
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "EG",
            "addressRegion": "Egypt"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+20-XXX-XXXXXXX",
            "contactType": "customer service",
            "availableLanguage": ["Arabic", "English"]
          },
          "sameAs": [
            "https://www.facebook.com/diaasadek",
            "https://www.instagram.com/diaasadek",
            "https://wa.me/20XXXXXXXXX"
          ],
          "areaServed": {
            "@type": "Country",
            "name": "Egypt"
          },
          "serviceType": "Gaming Top-Up Store",
          "priceRange": "$$"
        })}
      </script>

      {/* Local Business Schema for Egypt */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "متجر ضياء",
          "alternateName": "Diaa Gaming Store",
          "description": "متجر متخصص في شحن ألعاب إلكترونية في مصر",
          "url": window.location.origin,
          "telephone": "+20-XXX-XXXXXXX",
          "email": "support@diaasadek.com",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "EG",
            "addressRegion": "Egypt",
            "addressLocality": "Cairo"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 30.0444,
            "longitude": 31.2357
          },
          "areaServed": {
            "@type": "Country",
            "name": "Egypt"
          },
          "serviceType": ["Gaming Top-Up", "Digital Gaming Currency"],
          "priceRange": "$$",
          "openingHours": "Mo-Su 00:00-23:59",
          "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer"],
          "currenciesAccepted": "EGP",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "2000",
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": [
            {
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": "أحمد محمد"
              },
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
              },
              "reviewBody": "خدمة ممتازة وشحن سريع جداً، أنصح الجميع"
            }
          ]
        })}
      </script>

      {/* Google Search Console Verification */}
      <meta name="google-site-verification" content="your-verification-code-here" />

      {/* Bing Webmaster Tools */}
      <meta name="msvalidate.01" content="your-bing-verification-code" />

      {/* Yandex Webmaster */}
      <meta name="yandex-verification" content="your-yandex-code" />

      {/* Additional SEO */}
      <meta name="theme-color" content="#FFD700" />
      <meta name="msapplication-TileColor" content="#FFD700" />
      <link rel="icon" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/logo.png" />

      {/* Preload critical resources */}
      <link rel="preload" href="/logo.png" as="image" />
      <link rel="preload" href="/favicon.png" as="image" />

      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//connect.facebook.net" />
      <link rel="dns-prefetch" href="//platform.twitter.com" />

      {/* Google Analytics */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID');
        `}
      </script>

      {/* Google Tag Manager */}
      <script>
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-XXXXXXX');
        `}
      </script>
    </Helmet>
  );
}