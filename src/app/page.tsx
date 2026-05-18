export default function RenovationPage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #003300 0%, #006700 50%, #004d00 100%)',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: '#ffffff',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      {/* Logo / Icon */}
      <div style={{
        width: 90,
        height: 90,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        fontSize: 40,
        border: '2px solid rgba(255,255,255,0.3)',
      }}>
        🔧
      </div>

      {/* Brand */}
      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 48px)',
        fontWeight: 800,
        margin: '0 0 8px',
        letterSpacing: '-0.5px',
      }}>
        IndabaX Kenya
      </h1>

      <p style={{
        fontSize: 'clamp(13px, 2vw, 16px)',
        opacity: 0.75,
        margin: '0 0 40px',
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}>
        Deep Learning Indaba — Kenya Chapter
      </p>

      {/* Divider */}
      <div style={{
        width: 60,
        height: 3,
        background: 'rgba(255,255,255,0.4)',
        borderRadius: 2,
        marginBottom: 40,
      }} />

      {/* Message */}
      <h2 style={{
        fontSize: 'clamp(20px, 3.5vw, 32px)',
        fontWeight: 700,
        margin: '0 0 16px',
      }}>
        Closed for Renovations
      </h2>

      <p style={{
        fontSize: 'clamp(14px, 2vw, 18px)',
        opacity: 0.85,
        maxWidth: 480,
        lineHeight: 1.7,
        margin: '0 0 48px',
      }}>
        We are working hard to bring you a brand new experience.
        Our website will be back shortly — bigger and better than ever.
      </p>

      {/* Contact */}
      <a
        href="mailto:info@deeplearningindabaxkenya.com"
        style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.15)',
          border: '1.5px solid rgba(255,255,255,0.4)',
          color: '#ffffff',
          textDecoration: 'none',
          padding: '12px 32px',
          borderRadius: 50,
          fontSize: 15,
          fontWeight: 500,
          backdropFilter: 'blur(4px)',
        }}
      >
        Contact Us
      </a>

      {/* Footer */}
      <p style={{
        fontSize: 12,
        opacity: 0.45,
        margin: '48px 0 0',
      }}>
        © {new Date().getFullYear()} IndabaX Kenya. All rights reserved.
      </p>
    </main>
  )
}
