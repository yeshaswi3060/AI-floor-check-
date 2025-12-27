import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { analyzeFloorPlan, isGeminiConfigured } from '../services/geminiService'
import { pointToDirection } from '../utils/direction'
import { generateVastuReport } from '../services/pdfReportService'
import './FloorPlanAnalysis.css'

function Results() {
    const location = useLocation()
    const navigate = useNavigate()
    const data = location.state || {}
    const canvasRef = useRef(null)
    const imageRef = useRef(null)

    // Extract Vastu data from navigation state
    const { wallCentroid, northPos, directionRotationDeg = 0 } = data

    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [error, setError] = useState(null)
    const [hoveredRoomIndex, setHoveredRoomIndex] = useState(null)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageSize, setImageSize] = useState({ width: 800, height: 600 })
    const [draggingIndex, setDraggingIndex] = useState(null)

    // Get Vastu direction for a room based on its position
    const getRoomVastuDirection = (room) => {
        if (!northPos || !imageSize.width) return null

        // Convert room x,y percentages to actual coordinates based on image size
        const roomX = (room.x / 100) * imageSize.width
        const roomY = (room.y / 100) * imageSize.height

        // Use center from wall centroid or image center
        const centerX = wallCentroid?.x || imageSize.width / 2
        const centerY = wallCentroid?.y || imageSize.height / 2

        return pointToDirection(roomX, roomY, {
            center: { x: centerX, y: centerY },
            north: northPos,
            rotationDeg: directionRotationDeg
        })
    }

    // Auto-analyze when page loads
    useEffect(() => {
        if (data.imageData && !analysisResult && !isAnalyzing) {
            runAnalysis()
        }
    }, [data.imageData])

    // Draw overlays (compass + dots) when image loads or data changes
    useEffect(() => {
        if (imageLoaded) {
            drawRoomDots()
        }
    }, [analysisResult, hoveredRoomIndex, imageLoaded, imageSize, northPos, draggingIndex])

    // Get canvas coordinates from mouse event
    const getCanvasCoords = (e) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    // Find which room dot is at the given coordinates
    const findRoomAtCoords = (x, y) => {
        if (!analysisResult?.rooms || !canvasRef.current) return -1
        const canvas = canvasRef.current
        const baseRadius = Math.min(canvas.width, canvas.height) * 0.04

        for (let i = 0; i < analysisResult.rooms.length; i++) {
            const room = analysisResult.rooms[i]
            const rx = (room.x / 100) * canvas.width
            const ry = (room.y / 100) * canvas.height
            const dist = Math.sqrt((x - rx) ** 2 + (y - ry) ** 2)
            if (dist <= baseRadius * 1.5) {
                return i
            }
        }
        return -1
    }

    // Mouse down - start dragging if on a dot
    const handleMouseDown = (e) => {
        const coords = getCanvasCoords(e)
        if (!coords) return
        const roomIndex = findRoomAtCoords(coords.x, coords.y)
        if (roomIndex >= 0) {
            setDraggingIndex(roomIndex)
            setHoveredRoomIndex(roomIndex)
        }
    }

    // Mouse move - drag the dot
    const handleMouseMove = (e) => {
        const coords = getCanvasCoords(e)
        if (!coords) return

        if (draggingIndex !== null && analysisResult?.rooms) {
            // Update the room's position
            const canvas = canvasRef.current
            const newX = (coords.x / canvas.width) * 100
            const newY = (coords.y / canvas.height) * 100

            // Clamp to canvas bounds
            const clampedX = Math.max(5, Math.min(95, newX))
            const clampedY = Math.max(5, Math.min(95, newY))

            // Update the room position in state
            setAnalysisResult(prev => {
                const updated = { ...prev }
                updated.rooms = [...prev.rooms]
                updated.rooms[draggingIndex] = {
                    ...updated.rooms[draggingIndex],
                    x: clampedX,
                    y: clampedY
                }
                return updated
            })
        } else {
            // Just hover detection
            const roomIndex = findRoomAtCoords(coords.x, coords.y)
            setHoveredRoomIndex(roomIndex >= 0 ? roomIndex : null)
        }
    }

    // Mouse up - stop dragging
    const handleMouseUp = () => {
        setDraggingIndex(null)
    }

    // Mouse leave - stop dragging and clear hover
    const handleMouseLeave = () => {
        setDraggingIndex(null)
        setHoveredRoomIndex(null)
    }

    const runAnalysis = async () => {
        if (!data.imageData) {
            setError('No image data available')
            return
        }

        if (!isGeminiConfigured()) {
            setError('AI API key not configured. Please add VITE_OPENROUTER_API_KEY to .env file.')
            return
        }

        setIsAnalyzing(true)
        setError(null)

        try {
            let mimeType = 'image/png'
            if (data.imageData.includes('data:image/jpeg')) {
                mimeType = 'image/jpeg'
            } else if (data.imageData.includes('data:image/webp')) {
                mimeType = 'image/webp'
            }

            const result = await analyzeFloorPlan(data.imageData, mimeType)
            setAnalysisResult(result)
        } catch (err) {
            console.error('Analysis error:', err)
            setError(err.message || 'Failed to analyze floor plan')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // Convert location text to canvas coordinates
    const getLocationCoords = (locationText, canvasWidth, canvasHeight) => {
        const loc = locationText?.toLowerCase() || 'center'
        const padding = 0.15 // 15% padding from edges

        const positions = {
            'top-left': { x: canvasWidth * padding, y: canvasHeight * padding },
            'top-center': { x: canvasWidth * 0.5, y: canvasHeight * padding },
            'top-right': { x: canvasWidth * (1 - padding), y: canvasHeight * padding },
            'top': { x: canvasWidth * 0.5, y: canvasHeight * padding },
            'left': { x: canvasWidth * padding, y: canvasHeight * 0.5 },
            'center': { x: canvasWidth * 0.5, y: canvasHeight * 0.5 },
            'right': { x: canvasWidth * (1 - padding), y: canvasHeight * 0.5 },
            'bottom-left': { x: canvasWidth * padding, y: canvasHeight * (1 - padding) },
            'bottom-center': { x: canvasWidth * 0.5, y: canvasHeight * (1 - padding) },
            'bottom-right': { x: canvasWidth * (1 - padding), y: canvasHeight * (1 - padding) },
            'bottom': { x: canvasWidth * 0.5, y: canvasHeight * (1 - padding) }
        }

        // Find matching position or default to center
        for (const [key, coords] of Object.entries(positions)) {
            if (loc.includes(key)) {
                // Add some randomness to prevent overlap
                return {
                    x: coords.x + (Math.random() - 0.5) * canvasWidth * 0.1,
                    y: coords.y + (Math.random() - 0.5) * canvasHeight * 0.1
                }
            }
        }

        return positions['center']
    }

    // Draw overlays: 16-direction compass + room dots
    const drawRoomDots = () => {
        const canvas = canvasRef.current
        const image = imageRef.current
        if (!canvas || !image) return

        const ctx = canvas.getContext('2d')
        const rect = image.getBoundingClientRect()

        canvas.width = rect.width
        canvas.height = rect.height
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Scale factors for converting stored coordinates to display coordinates
        const scaleX = canvas.width / imageSize.width
        const scaleY = canvas.height / imageSize.height

        // Calculate centers
        const centerX = wallCentroid ? wallCentroid.x * scaleX : canvas.width / 2
        const centerY = wallCentroid ? wallCentroid.y * scaleY : canvas.height / 2

        // Draw center point
        if (wallCentroid) {
            ctx.save()
            ctx.fillStyle = '#111827'
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            ctx.restore()
        }

        // Draw 16-direction compass if north is set (professional, subtle lines)
        if (northPos) {
            const scaledNorthX = northPos.x * scaleX
            const scaledNorthY = northPos.y * scaleY
            const vx = scaledNorthX - centerX
            const vy = scaledNorthY - centerY
            const northAngle = Math.atan2(vy, vx)
            const rotationRad = (directionRotationDeg || 0) * Math.PI / 180
            const radius = Math.max(canvas.width, canvas.height)
            const step = (Math.PI * 2) / 16

            ctx.save()

            // Draw 16 subtle direction lines
            for (let i = 0; i < 16; i++) {
                const lineAng = northAngle + i * step - step / 2 - rotationRad
                const ex = centerX + Math.cos(lineAng) * radius
                const ey = centerY + Math.sin(lineAng) * radius

                const isCardinal = i % 4 === 0
                ctx.strokeStyle = isCardinal ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.15)'
                ctx.lineWidth = isCardinal ? 1 : 0.5
                ctx.beginPath()
                ctx.moveTo(centerX, centerY)
                ctx.lineTo(ex, ey)
                ctx.stroke()
            }

            ctx.restore()
        }

        // Draw room dots if analysis is complete
        if (!analysisResult?.rooms) return

        analysisResult.rooms.forEach((room, index) => {
            const x = (room.x / 100) * canvas.width
            const y = (room.y / 100) * canvas.height

            const isHovered = hoveredRoomIndex === index || draggingIndex === index
            const baseRadius = Math.min(canvas.width, canvas.height) * 0.022
            const radius = isHovered ? baseRadius * 1.4 : baseRadius
            const color = getRoomColor(room.type)

            // Draw subtle shadow
            ctx.beginPath()
            ctx.arc(x + 1, y + 1, radius, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(0,0,0,0.2)'
            ctx.fill()

            // Draw dot
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'
            ctx.lineWidth = isHovered ? 2 : 1
            ctx.stroke()

            // Draw label (only abbreviation)
            if (radius > 8) {
                ctx.font = `600 ${Math.max(8, radius * 0.7)}px Inter, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillStyle = '#fff'
                const abbrev = room.type.substring(0, 3).toUpperCase()
                ctx.fillText(abbrev, x, y)
            }
        })
    }

    // Room type colors
    const getRoomColor = (type) => {
        const colors = {
            'Bedroom': 'rgb(99, 102, 241)',
            'Kitchen': 'rgb(14, 165, 233)',
            'Bathroom': 'rgb(16, 185, 129)',
            'Living Room': 'rgb(245, 158, 11)',
            'Hall': 'rgb(234, 179, 8)',
            'Corridor': 'rgb(234, 179, 8)',
            'Balcony': 'rgb(107, 114, 128)',
            'Study': 'rgb(59, 130, 246)',
            'Study Room': 'rgb(59, 130, 246)',
            'Pooja Room': 'rgb(236, 72, 153)',
            'Pooja': 'rgb(236, 72, 153)',
            'Dining Room': 'rgb(249, 115, 22)',
            'Dining': 'rgb(249, 115, 22)',
            'Store Room': 'rgb(139, 92, 246)',
            'Store': 'rgb(139, 92, 246)',
            'Toilet': 'rgb(239, 68, 68)',
            'Utility': 'rgb(75, 85, 99)',
            'Terrace': 'rgb(34, 197, 94)',
            'Entrance': 'rgb(34, 197, 94)'
        }
        return colors[type] || 'rgb(100, 116, 139)'
    }

    return (
        <div className="floor-plan-page" style={{ background: '#0f0f0f' }}>
            {/* Compact Header */}
            <header style={{
                padding: '8px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <button
                    onClick={() => navigate('/analysis', { state: { imageData: data.imageData } })}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        padding: '6px 8px',
                        borderRadius: '4px'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500', flex: 1 }}>Vastu Analysis</span>

                {/* Download Report Button - Top Right */}
                {analysisResult && (
                    <button
                        onClick={() => {
                            const roomsWithDirections = analysisResult.rooms?.map(room => ({
                                ...room,
                                vastuDirection: getRoomVastuDirection(room)
                            }))
                            generateVastuReport({ ...analysisResult, rooms: roomsWithDirections }, data.imageData, northPos)
                        }}
                        style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Download Report
                    </button>
                )}
            </header>

            <div className="analysis-container" style={{ height: 'calc(100vh - 45px)' }}>
                {/* Compact Sidebar */}
                <aside className="analysis-sidebar" style={{ width: '220px', padding: '12px', background: '#111' }}>
                    {/* Status */}
                    <div style={{ marginBottom: '12px' }}>
                        {isAnalyzing && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                color: '#60a5fa'
                            }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    border: '2px solid #60a5fa',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                Analyzing...
                            </div>
                        )}
                        {error && (
                            <div style={{
                                padding: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '4px',
                                color: '#f87171',
                                fontSize: '0.75rem'
                            }}>
                                {error}
                            </div>
                        )}
                        {analysisResult && (
                            <div style={{
                                padding: '8px',
                                background: 'rgba(34, 197, 94, 0.1)',
                                borderRadius: '4px',
                                color: '#4ade80',
                                fontSize: '0.75rem'
                            }}>
                                ✓ Analysis Complete
                            </div>
                        )}
                    </div>

                    {analysisResult && (
                        <>
                            <div className="sidebar-section">
                                <h3 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>
                                    Detected Rooms ({analysisResult.rooms?.length || 0})
                                </h3>
                                <p style={{ fontSize: '0.65rem', color: '#4b5563', marginBottom: '8px' }}>
                                    Drag dots to adjust • Hover to highlight
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '45vh', overflowY: 'auto' }}>
                                    {analysisResult.rooms?.map((room, index) => (
                                        <div
                                            key={index}
                                            onMouseEnter={() => setHoveredRoomIndex(index)}
                                            onMouseLeave={() => setHoveredRoomIndex(null)}
                                            style={{
                                                padding: '8px 10px',
                                                background: (hoveredRoomIndex === index || draggingIndex === index) ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                borderRadius: '6px',
                                                borderLeft: `3px solid ${getRoomColor(room.type)}`,
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: '500',
                                                    color: '#e5e7eb'
                                                }}>
                                                    {room.type}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 8px',
                                                    background: northPos ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    borderRadius: '4px',
                                                    color: northPos ? '#4ade80' : '#6b7280',
                                                    fontWeight: '600',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {getRoomVastuDirection(room) || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="sidebar-section">
                                <h3>Floor Plan Info</h3>
                                <div style={{
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ color: '#9ca3af' }}>Type: </span>
                                        <span style={{ color: '#fff' }}>{analysisResult.floorPlanType || 'Unknown'}</span>
                                    </div>
                                    {analysisResult.additionalNotes && (
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: '1.5' }}>
                                            {analysisResult.additionalNotes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Action Button */}
                    <div style={{ marginTop: 'auto' }}>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#9ca3af',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            New Analysis
                        </button>
                    </div>
                </aside>

                {/* Main content with image and overlay canvas */}
                <main className="analysis-main">
                    {data.imageData ? (
                        <div style={{
                            position: 'relative',
                            display: 'inline-block'
                        }}>
                            <img
                                ref={imageRef}
                                src={data.imageData}
                                alt="Floor Plan"
                                onLoad={(e) => {
                                    setImageLoaded(true)
                                    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight })
                                }}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: 'calc(100vh - 100px)',
                                    objectFit: 'contain',
                                    borderRadius: '4px',
                                    background: '#fff',
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
                                }}
                            />
                            {/* Overlay canvas for dots - interactive */}
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    cursor: draggingIndex !== null ? 'grabbing' : (hoveredRoomIndex !== null ? 'grab' : 'default')
                                }}
                            />

                            {!isAnalyzing && !analysisResult && (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}>
                                    <button
                                        onClick={runAnalysis}
                                        style={{
                                            padding: '16px 48px',
                                            background: '#22c55e',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '9999px',
                                            fontSize: '1.1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)'
                                        }}
                                    >
                                        🔍 Analyze with AI
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                            <p>No floor plan image available</p>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    marginTop: '16px',
                                    padding: '12px 32px',
                                    background: '#fff',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '9999px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Upload Floor Plan
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default Results
