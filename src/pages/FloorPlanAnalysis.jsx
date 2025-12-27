import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { dominantDirectionForRect, pointToDirection } from '../utils/direction'
import { loadGuidanceFromLocal } from '../utils/guidanceLoader'
import './FloorPlanAnalysis.css'

function FloorPlanAnalysis() {
    const location = useLocation()
    const navigate = useNavigate()
    const imageData = location.state?.imageData || null

    const canvasRef = useRef(null)
    const overlayCanvasRef = useRef(null)
    const containerRef = useRef(null)
    const fileInputRef = useRef(null)

    // Image state
    const [baseImg, setBaseImg] = useState(null)
    const [hasImage, setHasImage] = useState(false)
    const [info, setInfo] = useState('Upload an image to get started')

    // Wall/Center state
    const [isSelectingWall, setIsSelectingWall] = useState(false)
    const [wallPoints, setWallPoints] = useState([])
    const [wallCentroid, setWallCentroid] = useState(null)
    const [showCenter, setShowCenter] = useState(false)

    // North direction state
    const [northPos, setNorthPos] = useState(null)
    const [northFixed, setNorthFixed] = useState(false)
    const [isDraggingNorth, setIsDraggingNorth] = useState(false)
    const dragOffsetRef = useRef({ dx: 0, dy: 0 })

    // 16-direction compass
    const [showDirections, setShowDirections] = useState(false)
    const [directionRotationDeg, setDirectionRotationDeg] = useState(0)

    // Progress stages
    const [progressStage, setProgressStage] = useState('idle') // idle, wall, center, north

    // Room areas
    const AREA_TYPES = ['Bedroom', 'Bathroom', 'Kitchen', 'Hall', 'Entrance', 'Balcony', 'Study', 'Puja', 'Toilet']
    const [areas, setAreas] = useState([])
    const [activeAreaKey, setActiveAreaKey] = useState(null)
    const [isAreaDragging, setIsAreaDragging] = useState(false)
    const areaDragModeRef = useRef(null)
    const areaResizeHandleRef = useRef(null)
    const areaDragOffsetRef = useRef({ dx: 0, dy: 0 })

    // Guidance
    const [guidance, setGuidance] = useState({})

    // Load guidance on mount
    useEffect(() => {
        const dataModules = import.meta.glob('../data/*.json', { eager: true })
        loadGuidanceFromLocal(dataModules).then(setGuidance)
    }, [])

    // Load image from navigation state
    useEffect(() => {
        if (imageData) {
            const img = new Image()
            img.onload = () => {
                setBaseImg(img)
                setHasImage(true)
                setInfo(`${img.width}×${img.height}`)
                const canvas = canvasRef.current
                if (canvas) {
                    canvas.width = img.width
                    canvas.height = img.height
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0)
                }
                const overlay = overlayCanvasRef.current
                if (overlay) {
                    overlay.width = img.width
                    overlay.height = img.height
                }
            }
            img.src = imageData
        }
    }, [imageData])

    // Utility functions
    const typeColor = (type) => ({
        Bedroom: 'rgba(99,102,241,0.25)',
        Bathroom: 'rgba(16,185,129,0.25)',
        Hall: 'rgba(234,179,8,0.25)',
        Study: 'rgba(59,130,246,0.25)',
        Puja: 'rgba(236,72,153,0.25)',
        Toilet: 'rgba(239,68,68,0.25)',
        Kitchen: 'rgba(14,165,233,0.25)',
        Balcony: 'rgba(107,114,128,0.20)',
        Entrance: 'rgba(34,197,94,0.25)'
    }[type] || 'rgba(148,163,184,0.2)')

    const typePrefix = (type) => ({
        Bedroom: 'BR', Bathroom: 'BA', Hall: 'HL', Study: 'ST',
        Puja: 'PJ', Toilet: 'TL', Kitchen: 'KT', Balcony: 'BL', Entrance: 'EN'
    }[type] || type[0])

    // Polygon centroid calculation
    const computePolygonCentroid = (points) => {
        if (points.length < 3) return null
        let areaTwice = 0
        let cxSum = 0
        let cySum = 0
        for (let i = 0; i < points.length; i++) {
            const p0 = points[i]
            const p1 = points[(i + 1) % points.length]
            const cross = p0.x * p1.y - p1.x * p0.y
            areaTwice += cross
            cxSum += (p0.x + p1.x) * cross
            cySum += (p0.y + p1.y) * cross
        }
        if (areaTwice === 0) return null
        return { x: Math.round(cxSum / (3 * areaTwice)), y: Math.round(cySum / (3 * areaTwice)) }
    }

    // Draw overlays on canvas
    const drawOverlays = useCallback((ctx, drawW, drawH) => {
        // Draw center point
        if (showCenter) {
            const cx = wallCentroid ? wallCentroid.x : Math.round(drawW / 2)
            const cy = wallCentroid ? wallCentroid.y : Math.round(drawH / 2)
            ctx.save()
            ctx.lineWidth = 2
            ctx.strokeStyle = '#ffffff'
            ctx.fillStyle = '#111827'
            ctx.beginPath()
            ctx.arc(cx, cy, 8, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(cx, cy, 9, 0, Math.PI * 2)
            ctx.stroke()
            ctx.restore()
        }

        // Draw North indicator (when not showing full compass)
        if (northPos && !showDirections) {
            ctx.save()
            // Draw bright red circle for North
            ctx.fillStyle = '#ef4444'
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(northPos.x, northPos.y, 12, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            // Draw large N label with high contrast
            ctx.font = 'bold 32px Arial, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            // White outline for readability
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 5
            ctx.strokeText('N', northPos.x, northPos.y - 30)
            // Red fill
            ctx.fillStyle = '#ef4444'
            ctx.fillText('N', northPos.x, northPos.y - 30)
            ctx.restore()
        }

        // Draw 16-direction compass
        if (showDirections && northPos) {
            const centerX = wallCentroid ? wallCentroid.x : Math.round(drawW / 2)
            const centerY = wallCentroid ? wallCentroid.y : Math.round(drawH / 2)
            const vx = northPos.x - centerX
            const vy = northPos.y - centerY
            const northAngle = Math.atan2(vy, vx)
            const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
            const step = (Math.PI * 2) / 16
            const radius = Math.max(drawW, drawH) * 2
            const rotationRad = (directionRotationDeg || 0) * Math.PI / 180

            ctx.save()

            for (let i = 0; i < 16; i++) {
                // OFFSET LINES by half step so that the N label (between lines) 
                // aligns with where user placed the North marker
                const lineAng = northAngle + i * step - step / 2 - rotationRad
                const ex = centerX + Math.cos(lineAng) * radius
                const ey = centerY + Math.sin(lineAng) * radius

                // Choose color based on direction
                const isCardinal = i % 4 === 0 // N, E, S, W
                const lineColor = isCardinal ? '#ef4444' : '#3b82f6'

                // Draw thick colored line with white border
                ctx.save()
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 5
                ctx.beginPath()
                ctx.moveTo(centerX, centerY)
                ctx.lineTo(ex, ey)
                ctx.stroke()
                ctx.restore()

                ctx.save()
                ctx.strokeStyle = lineColor
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(centerX, centerY)
                ctx.lineTo(ex, ey)
                ctx.stroke()
                ctx.restore()

                // Labels are placed BETWEEN the lines (at sector center)
                // For sector i, the center is at northAngle + i * step
                const labelAng = northAngle + i * step - rotationRad
                const labelDist = Math.min(drawW, drawH) * 0.25
                const lx = centerX + Math.cos(labelAng) * labelDist
                const ly = centerY + Math.sin(labelAng) * labelDist

                ctx.save()
                ctx.font = 'bold 18px Arial, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                // Draw background box for label
                const textWidth = ctx.measureText(labels[i]).width
                ctx.fillStyle = isCardinal ? '#ef4444' : '#3b82f6'
                ctx.fillRect(lx - textWidth / 2 - 6, ly - 12, textWidth + 12, 24)

                // Draw white text
                ctx.fillStyle = '#ffffff'
                ctx.fillText(labels[i], lx, ly)
                ctx.restore()
            }
            ctx.restore()
        }

        // Draw wall points
        if (wallPoints.length > 0) {
            ctx.save()

            // Connect points with thick bright line
            if (wallPoints.length > 1) {
                ctx.strokeStyle = '#22c55e' // Bright green
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.moveTo(wallPoints[0].x, wallPoints[0].y)
                for (let i = 1; i < wallPoints.length; i++) {
                    ctx.lineTo(wallPoints[i].x, wallPoints[i].y)
                }
                ctx.closePath()
                ctx.stroke()
            }

            // Draw numbered points
            wallPoints.forEach((p, i) => {
                // Outer white circle
                ctx.fillStyle = '#ffffff'
                ctx.beginPath()
                ctx.arc(p.x, p.y, 12, 0, Math.PI * 2)
                ctx.fill()

                // Inner green circle
                ctx.fillStyle = '#22c55e'
                ctx.beginPath()
                ctx.arc(p.x, p.y, 10, 0, Math.PI * 2)
                ctx.fill()

                // Point number
                ctx.fillStyle = '#ffffff'
                ctx.font = 'bold 12px Arial'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText((i + 1).toString(), p.x, p.y)
            })

            ctx.restore()
        }

        // Draw room areas
        if (areas.length > 0) {
            ctx.save()
            for (const a of areas) {
                const { x, y, w, h } = a.rect
                ctx.fillStyle = a.color
                ctx.fillRect(x, y, w, h)
                ctx.lineWidth = activeAreaKey === a.key ? 3 : 1.5
                ctx.strokeStyle = activeAreaKey === a.key ? '#111827' : 'rgba(17,24,39,0.7)'
                ctx.strokeRect(x, y, w, h)

                // Draw label
                const label = `${typePrefix(a.type)}${a.index}`
                ctx.font = 'bold 14px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.save()
                ctx.strokeStyle = 'rgba(255,255,255,0.9)'
                ctx.lineWidth = 3
                ctx.strokeText(label, x + w / 2, y + h / 2)
                ctx.restore()
                ctx.fillStyle = '#111827'
                ctx.fillText(label, x + w / 2, y + h / 2)

                // Direction label
                if (northPos) {
                    const centerX = wallCentroid ? wallCentroid.x : Math.round(drawW / 2)
                    const centerY = wallCentroid ? wallCentroid.y : Math.round(drawH / 2)
                    const dir = dominantDirectionForRect(a.rect, {
                        center: { x: centerX, y: centerY },
                        north: northPos,
                        rotationDeg: directionRotationDeg
                    })
                    ctx.save()
                    ctx.font = 'bold 11px sans-serif'
                    ctx.textAlign = 'left'
                    ctx.textBaseline = 'top'
                    const tw = ctx.measureText(dir).width
                    ctx.fillStyle = 'rgba(255,255,255,0.9)'
                    ctx.fillRect(x + 2, y + 2, tw + 10, 16)
                    ctx.fillStyle = '#111827'
                    ctx.fillText(dir, x + 7, y + 5)
                    ctx.restore()
                }
            }
            ctx.restore()
        }
    }, [showCenter, wallCentroid, northPos, showDirections, directionRotationDeg, wallPoints, areas, activeAreaKey])

    // Redraw canvas
    const redraw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || !baseImg) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const drawW = baseImg.width
        const drawH = baseImg.height
        canvas.width = drawW
        canvas.height = drawH
        ctx.clearRect(0, 0, drawW, drawH)
        ctx.drawImage(baseImg, 0, 0)
        drawOverlays(ctx, drawW, drawH)
    }, [baseImg, drawOverlays])

    // Redraw when state changes
    useEffect(() => {
        redraw()
    }, [redraw, northPos, showCenter, wallPoints, wallCentroid, showDirections, areas, activeAreaKey, directionRotationDeg])

    // Handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                setBaseImg(img)
                setHasImage(true)
                setInfo(`${img.width}×${img.height}`)
                setWallPoints([])
                setWallCentroid(null)
                setNorthPos(null)
                setShowCenter(false)
                setShowDirections(false)
                setProgressStage('idle')
                setAreas([])
            }
            img.src = event.target.result
        }
        reader.readAsDataURL(file)
    }

    // Hit testing for areas
    const hitTestArea = (x, y) => {
        for (let i = areas.length - 1; i >= 0; i--) {
            const a = areas[i]
            const { x: ax, y: ay, w, h } = a.rect
            if (x >= ax && x <= ax + w && y >= ay && y <= ay + h) return a
        }
        return null
    }

    const hitTestResizeHandle = (a, x, y) => {
        const handleSize = 12
        const { x: ax, y: ay, w, h } = a.rect
        const handles = [
            { key: 'nw', hx: ax, hy: ay },
            { key: 'ne', hx: ax + w, hy: ay },
            { key: 'sw', hx: ax, hy: ay + h },
            { key: 'se', hx: ax + w, hy: ay + h }
        ]
        for (const hdl of handles) {
            if (Math.abs(x - hdl.hx) <= handleSize && Math.abs(y - hdl.hy) <= handleSize) return hdl.key
        }
        return null
    }

    // Add area
    const addArea = (type) => {
        const count = areas.filter(a => a.type === type).length + 1
        const canvas = canvasRef.current
        const w = canvas?.width || 800
        const h = canvas?.height || 600
        const rectW = Math.max(80, Math.round(w * 0.15))
        const rectH = Math.max(60, Math.round(h * 0.12))
        const newArea = {
            key: `${type}-${count}`,
            type,
            index: count,
            color: typeColor(type),
            rect: { x: Math.round(w / 2 - rectW / 2), y: Math.round(h / 2 - rectH / 2), w: rectW, h: rectH }
        }
        setAreas([...areas, newArea])
        setActiveAreaKey(newArea.key)
    }

    // Delete active area
    const deleteActiveArea = () => {
        if (!activeAreaKey) return
        setAreas(areas.filter(a => a.key !== activeAreaKey))
        setActiveAreaKey(null)
    }

    // Get scaled canvas coordinates (handle CSS scaling)
    const getCanvasCoords = (e, canvas) => {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY
        return { x: Math.round(x), y: Math.round(y) }
    }

    // Canvas mouse handlers
    const handleCanvasMouseDown = (e) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const { x, y } = getCanvasCoords(e, canvas)

        // Wall point selection
        if (isSelectingWall) {
            const next = [...wallPoints, { x, y }]
            setWallPoints(next)
            setInfo(`${next.length} points selected`)
            return
        }

        // North placement
        if (progressStage === 'north' && !northFixed) {
            if (!northPos) {
                setNorthPos({ x, y })
                setInfo('North placed. Drag to adjust, then click "Show 16 Directions"')
                return
            }
            dragOffsetRef.current = { dx: x - northPos.x, dy: y - northPos.y }
            setIsDraggingNorth(true)
            return
        }

        // Area interactions
        if (areas.length > 0) {
            const a = hitTestArea(x, y)
            if (a) {
                setActiveAreaKey(a.key)
                const handle = hitTestResizeHandle(a, x, y)
                if (handle) {
                    areaDragModeRef.current = 'resize'
                    areaResizeHandleRef.current = handle
                    setIsAreaDragging(true)
                    return
                }
                areaDragModeRef.current = 'move'
                areaDragOffsetRef.current = { dx: x - a.rect.x, dy: y - a.rect.y }
                setIsAreaDragging(true)
                return
            } else {
                setActiveAreaKey(null)
            }
        }
    }

    const handleCanvasMouseMove = (e) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const { x: mx, y: my } = getCanvasCoords(e, canvas)

        // North dragging
        if (isDraggingNorth && baseImg && northPos) {
            const x = mx - dragOffsetRef.current.dx
            const y = my - dragOffsetRef.current.dy
            setNorthPos({
                x: Math.max(0, Math.min(baseImg.width, x)),
                y: Math.max(0, Math.min(baseImg.height, y))
            })
            return
        }

        // Area dragging/resizing
        if (isAreaDragging && activeAreaKey) {
            setAreas(prev => prev.map(area => {
                if (area.key !== activeAreaKey) return area
                const r = { ...area.rect }
                if (areaDragModeRef.current === 'move') {
                    r.x = Math.round(mx - areaDragOffsetRef.current.dx)
                    r.y = Math.round(my - areaDragOffsetRef.current.dy)
                } else if (areaDragModeRef.current === 'resize') {
                    const minW = 40, minH = 30
                    switch (areaResizeHandleRef.current) {
                        case 'nw': r.w += r.x - mx; r.h += r.y - my; r.x = mx; r.y = my; break
                        case 'ne': r.w = mx - r.x; r.h += r.y - my; r.y = my; break
                        case 'sw': r.w += r.x - mx; r.x = mx; r.h = my - r.y; break
                        case 'se': r.w = mx - r.x; r.h = my - r.y; break
                    }
                    r.w = Math.max(minW, r.w)
                    r.h = Math.max(minH, r.h)
                }
                return { ...area, rect: r }
            }))
        }
    }

    const handleCanvasMouseUp = () => {
        setIsDraggingNorth(false)
        setIsAreaDragging(false)
        areaDragModeRef.current = null
        areaResizeHandleRef.current = null
    }

    return (
        <div className="floor-plan-page">
            {/* Header */}
            <header className="analysis-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1>Floor Plan Analysis</h1>
                </div>
                <div className="header-info">
                    {info && <span className="info-badge">{info}</span>}
                </div>
            </header>

            <div className="analysis-container">
                {/* Sidebar */}
                <aside className="analysis-sidebar">
                    <div className="sidebar-section">
                        <h3>Step 1: Define Boundary</h3>
                        <button
                            className={`btn-tool ${isSelectingWall ? 'active' : ''}`}
                            onClick={() => {
                                setIsSelectingWall(!isSelectingWall)
                                setProgressStage('wall')
                                if (!isSelectingWall) setWallPoints([])
                            }}
                        >
                            {isSelectingWall ? 'Stop Selection' : 'Get Wall'}
                        </button>
                        <button
                            className="btn-tool"
                            onClick={() => {
                                if (wallPoints.length >= 3) {
                                    const centroid = computePolygonCentroid(wallPoints)
                                    if (centroid) {
                                        setWallCentroid(centroid)
                                        setShowCenter(true)
                                        setProgressStage('center')
                                        setIsSelectingWall(false)
                                        setInfo('Center calculated')
                                    }
                                }
                            }}
                            disabled={wallPoints.length < 3}
                        >
                            Get Center
                        </button>
                        <button
                            className="btn-tool"
                            onClick={() => setWallPoints([])}
                        >
                            Clear Points
                        </button>
                    </div>

                    <div className="sidebar-section">
                        <h3>Step 2: Set North</h3>
                        <button
                            className={`btn-tool ${progressStage === 'north' ? 'active' : ''}`}
                            onClick={() => {
                                setProgressStage('north')
                                setNorthFixed(false)
                            }}
                            disabled={!showCenter}
                        >
                            Get North
                        </button>
                        <button
                            className="btn-tool"
                            onClick={() => {
                                setNorthFixed(true)
                                setShowDirections(true)
                            }}
                            disabled={!northPos}
                        >
                            Show 16 Directions
                        </button>
                        {showDirections && (
                            <div className="rotation-control">
                                <label>Rotate:</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        value={directionRotationDeg}
                                        onChange={(e) => setDirectionRotationDeg(Number(e.target.value))}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="-180"
                                        max="180"
                                        value={directionRotationDeg}
                                        onChange={(e) => setDirectionRotationDeg(Number(e.target.value) || 0)}
                                        style={{
                                            width: '60px',
                                            padding: '4px 8px',
                                            border: '1px solid #374151',
                                            borderRadius: '4px',
                                            background: '#1f2937',
                                            color: '#fff',
                                            textAlign: 'center'
                                        }}
                                    />
                                    <span style={{ color: '#9ca3af' }}>°</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Analyze Button */}
                    <div className="sidebar-section" style={{ marginTop: 'auto', paddingTop: 'var(--space-lg)' }}>
                        <button
                            className="btn-tool"
                            onClick={() => {
                                // Navigate to results page with analysis data
                                navigate('/results', {
                                    state: {
                                        imageData: imageData,
                                        wallPoints: wallPoints,
                                        wallCentroid: wallCentroid,
                                        northPos: northPos,
                                        directionRotationDeg: directionRotationDeg
                                    }
                                })
                            }}
                            disabled={!showDirections}
                            style={{
                                width: '100%',
                                padding: 'var(--space-md)',
                                background: showDirections ? '#22c55e' : 'rgba(34, 197, 94, 0.3)',
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: '600'
                            }}
                        >
                            Analyze →
                        </button>
                        {!showDirections && (
                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px', textAlign: 'center' }}>
                                Complete Steps 1 & 2 first
                            </p>
                        )}
                    </div>
                </aside>

                {/* Main Canvas */}
                <main className="analysis-main">
                    {!hasImage ? (
                        <div className="upload-prompt">
                            <div className="upload-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </div>
                            <h2>No Floor Plan Loaded</h2>
                            <p>Upload a floor plan image to start the analysis</p>
                            <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
                                Upload Floor Plan
                            </button>
                        </div>
                    ) : (
                        <div className="canvas-wrapper" ref={containerRef}>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                            />
                            <canvas
                                ref={overlayCanvasRef}
                                className="overlay-canvas"
                                style={{ pointerEvents: isSelectingWall ? 'auto' : 'none' }}
                                onMouseDown={(e) => {
                                    if (!isSelectingWall) return
                                    // IMPORTANT: Use main canvas for coordinate calculation
                                    // because overlay canvas may not have proper dimensions
                                    const mainCanvas = canvasRef.current
                                    if (!mainCanvas) return
                                    const { x, y } = getCanvasCoords(e, mainCanvas)
                                    const next = [...wallPoints, { x, y }]
                                    setWallPoints(next)
                                    setInfo(`${next.length} points selected. Click 3+ points then "Get Center"`)
                                }}
                            />
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                </main>
            </div>
        </div>
    )
}

export default FloorPlanAnalysis
