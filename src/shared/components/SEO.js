import Head from 'next/head';

/**
 * SEO component for optimizing page metadata for search engines
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.canonical - Canonical URL
 * @param {string} props.image - OG image URL
 */
const SEO = ({ 
  title = 'ApplyLoop Dashboard', 
  description = 'Track your applications, monitor progress, and stay in control of your job search.', 
  canonical, 
  image = '/images/og-image.png'
}) => {
  const siteTitle = title.includes('ApplyLoop') ? title : `${title} | ApplyLoop`;
  
  return (
    <Head>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      
      {/* Viewport meta */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* Canonical link */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Performance optimizations */}
      <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" as="style" />
    </Head>
  );
};

export default SEO; 