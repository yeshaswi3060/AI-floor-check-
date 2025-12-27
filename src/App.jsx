import { useState, useRef, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import FloorPlanAnalysis from './pages/FloorPlanAnalysis'
import Results from './pages/Results'

// SVG Icons
const Icons = {
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Analyze: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Lightbulb: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  )
}

// Home Page Component
function HomePage() {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = (e) => {
    e.stopPropagation()
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalyze = () => {
    if (!selectedImage || !imagePreview) return
    setIsAnalyzing(true)
    // Navigate to analysis page with image data
    setTimeout(() => {
      navigate('/analysis', { state: { imageData: imagePreview } })
    }, 500)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="app">
      {/* Hero Section */}
      <main className="hero">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          AI-Powered Analysis
        </div>

        <h1 className="hero-title">
          Transform Your Space with Vastu Intelligence
        </h1>

        <p className="hero-subtitle">
          Upload your floor plan or room image and receive instant AI-powered
          Vastu recommendations for optimal energy flow and harmonious living.
        </p>

        {/* Upload Section */}
        <div className="upload-section">
          <div
            className={`upload-container ${isDragging ? 'dragging' : ''} ${imagePreview ? 'has-image' : ''}`}
            onClick={!imagePreview ? handleClick : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="upload-input"
              accept="image/*"
              onChange={handleInputChange}
            />

            {!imagePreview ? (
              <div className="upload-content">
                <div className="upload-icon">
                  <Icons.Upload />
                </div>
                <h3 className="upload-title">Upload Your Image</h3>
                <p className="upload-subtitle">
                  Drag and drop your floor plan here, or click to browse
                </p>
                <div className="upload-formats">
                  <span className="format-tag">PNG</span>
                  <span className="format-tag">JPG</span>
                  <span className="format-tag">JPEG</span>
                  <span className="format-tag">WEBP</span>
                </div>
              </div>
            ) : (
              <div className="preview-container">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="preview-image"
                />
                <div className="preview-overlay">
                  <div className="preview-info">
                    <p className="preview-name">{selectedImage?.name}</p>
                    <p className="preview-size">{formatFileSize(selectedImage?.size || 0)}</p>
                  </div>
                  <div className="preview-actions">
                    <button className="btn-icon" onClick={handleClick} title="Change image">
                      <Icons.Refresh />
                    </button>
                    <button className="btn-icon" onClick={removeImage} title="Remove image">
                      <Icons.Close />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <div className="analyze-section">
          <button
            className="btn-analyze"
            onClick={handleAnalyze}
            disabled={!selectedImage || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span>
                Analyzing
              </>
            ) : (
              <>
                <Icons.Analyze />
                Analyze Vastu
              </>
            )}
          </button>
        </div>

        {/* Features */}
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">
              <Icons.Target />
            </div>
            <h4 className="feature-title">Precise Detection</h4>
            <p className="feature-desc">
              Advanced AI algorithms accurately detect room layouts and directional alignments.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Icons.Zap />
            </div>
            <h4 className="feature-title">Instant Results</h4>
            <p className="feature-desc">
              Get comprehensive Vastu insights within seconds of uploading your image.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Icons.Lightbulb />
            </div>
            <h4 className="feature-title">Smart Recommendations</h4>
            <p className="feature-desc">
              Receive personalized suggestions to enhance positive energy in your space.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 AI Vastu Analise. All rights reserved.</p>
      </footer>
    </div>
  )
}

// Main App with Routes
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/analysis" element={<FloorPlanAnalysis />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  )
}

export default App
