import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#dc3545' }}>⚠️</div>
            <h2 style={{ color: '#212529', marginBottom: '12px', fontSize: '22px' }}>
              कुछ गलत हो गया (Something went wrong)
            </h2>
            <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
              एप्लिकेशन में एक अप्रत्याशित त्रुटि आई है। कृपया पेज रीलोड करें या होम पेज पर जाएं।
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#0d6efd',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                पेज रीलोड करें
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                होम पेज पर जाएं
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
