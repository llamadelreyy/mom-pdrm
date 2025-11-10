
import React, { useState, useEffect, useRef, useCallback } from 'react'

// Constants from original HTML
const LOCAL_STORAGE_KEY = 'transcription_text'
const PROCESSED_TRANSCRIPTION_KEY = 'processed_transcription'
const METADATA_KEY = 'meeting_metadata'
const SYSTEM_PROMPTS_KEY = 'system_prompts'
const DEFAULT_SYSTEM_PROMPT = `Convert the meeting transcript into a clean PDRM meeting minutes document in Bahasa Malaysia.

Start with header information:
[Extract descriptive meeting title from context]
Rujukan: [Generate reference like PDRM/MM/2025/001]
Bil. Mesyuarat: [Infer number like 1/2025]
Tarikh: [Extract or infer date]
Masa: [Extract meeting duration]
Tempat: [Extract location]

Then provide content sections:

## KEHADIRAN
1.1 [Name/Title] (Pengerusi) [Hadir]
1.2 [Name/Title] [Hadir/Tidak Hadir]

## AGENDA 1: [EXTRACT MAIN TOPIC]

For each point, classify correctly:
- **[Makluman]** - ONLY for pure information with no action required
- **[Tindakan: Specific Person/Department]** - For ALL action items, identify WHO is responsible
- **[Perbincangan]** - For ongoing discussions needing follow-up

CRITICAL: For action items like training, follow-ups, implementations - ALWAYS specify the responsible party, never use [Makluman].

Examples:
✅ Attend refresher course [Tindakan: Pegawai Ahmad]
✅ Submit report by Friday [Tindakan: MCSB]
✅ Schedule follow-up meeting [Tindakan: Ketua Unit]
❌ Training required [Makluman] ← WRONG

Use sub-numbering (1.1.1, 1.1.2) for related items.

## PENUTUP
1. Mesyuarat ditangguhkan pada [time]
2. Disediakan oleh: [name]
3. Disemak oleh: [name]

Output ONLY the structured content - no preambles or explanatory text.`

function App() {
  // State management - all states from original
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [selectedFile, setSelectedFile] = useState(null)
  const [maxWorkers, setMaxWorkers] = useState(6)
  const [model, setModel] = useState('Whisper')
  const [language, setLanguage] = useState('auto')
  const [transcription, setTranscription] = useState('')
  const [processedTranscription, setProcessedTranscription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [systemPrompts, setSystemPrompts] = useState([])
  const [selectedPromptId, setSelectedPromptId] = useState('default')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '', visible: false })
  const [metadata, setMetadata] = useState({
    rujukan: '', bil: '', tarikh: '', masa: '', tempat: ''
  })

  const fileInputRef = useRef(null)

  // Status management
  const showStatus = useCallback((message, type) => {
    setStatus({ message, type, visible: true })
    setTimeout(() => setStatus(prev => ({ ...prev, visible: false })), 3800)
  }, [])

  // Theme management
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Initialize data from localStorage
  useEffect(() => {
    const savedTranscription = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedTranscription) setTranscription(savedTranscription)

    const savedProcessed = localStorage.getItem(PROCESSED_TRANSCRIPTION_KEY)
    if (savedProcessed) setProcessedTranscription(savedProcessed)

    try {
      const savedMetadata = JSON.parse(localStorage.getItem(METADATA_KEY) || '{}')
      setMetadata(prev => ({ ...prev, ...savedMetadata }))
    } catch (err) {
      console.error('Failed to load metadata:', err)
    }

    initPrompts()
  }, [])

  // Initialize system prompts
  const initPrompts = () => {
    let savedPrompts = []
    try {
      savedPrompts = JSON.parse(localStorage.getItem(SYSTEM_PROMPTS_KEY) || '[]')
    } catch {
      savedPrompts = []
    }
    
    if (savedPrompts.length === 0) {
      savedPrompts.push({ 
        id: 'default', 
        name: 'Default Meeting Minutes', 
        content: DEFAULT_SYSTEM_PROMPT 
      })
      localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(savedPrompts))
    }
    
    setSystemPrompts(savedPrompts)
    setSystemPrompt(savedPrompts[0].content)
    setSelectedPromptId(savedPrompts[0].id)
  }

  // Save data to localStorage
  useEffect(() => {
    if (transcription) localStorage.setItem(LOCAL_STORAGE_KEY, transcription)
  }, [transcription])

  useEffect(() => {
    if (processedTranscription) localStorage.setItem(PROCESSED_TRANSCRIPTION_KEY, processedTranscription)
  }, [processedTranscription])

  useEffect(() => {
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata))
  }, [metadata])

  // File handling
  const handleFileClick = () => fileInputRef.current?.click()
  const handleFileChange = (e) => setSelectedFile(e.target.files?.[0])
  const handleFileDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) setSelectedFile(file)
  }

  // Transcription handler - exact from HTML
  const handleTranscription = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      showStatus('Sila pilih fail audio terlebih dahulu', 'error')
      return
    }

    setIsTranscribing(true)
    showStatus('Memuat naik & mentranskripsi audio…', 'loading')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('max_workers', maxWorkers.toString())
    formData.append('model_name', model)
    formData.append('language', language)

    try {
      const response = await fetch('/transcribe', { method: 'POST', body: formData })
      const data = await response.json()
      
      if (response.ok) {
        setTranscription(data.transcription)
        showStatus('Transkripsi selesai!', 'success')
      } else {
        showStatus(`Ralat: ${data.detail || 'Gagal mentranskripsi'}`, 'error')
      }
    } catch (err) {
      showStatus(`Ralat rangkaian: ${err.message}`, 'error')
    } finally {
      setIsTranscribing(false)
    }
  }

  // AI Processing - exact from HTML
  const handleProcessing = async () => {
    if (!transcription.trim()) {
      showStatus('Tiada transkripsi untuk diproses', 'error')
      return
    }

    setIsProcessing(true)
    showStatus('Memproses minit…', 'loading')

    try {
      const response = await fetch('/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcription }
        ])
      })

      const data = await response.json()
      
      if (response.ok) {
        setProcessedTranscription(data.text)
        showStatus('Minit berjaya diproses!', 'success')
      } else {
        showStatus(`Ralat: ${data.detail || 'Gagal memproses minit'}`, 'error')
      }
    } catch (err) {
      showStatus(`Ralat rangkaian: ${err.message}`, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  // System prompt handlers
  const handlePromptChange = (e) => {
    const selectedId = e.target.value
    setSelectedPromptId(selectedId)
    const selectedPrompt = systemPrompts.find(p => p.id === selectedId)
    if (selectedPrompt) setSystemPrompt(selectedPrompt.content)
  }

  const handleSystemPromptChange = (e) => {
    const newContent = e.target.value
    setSystemPrompt(newContent)
    
    const updatedPrompts = systemPrompts.map(p => 
      p.id === selectedPromptId ? { ...p, content: newContent } : p
    )
    setSystemPrompts(updatedPrompts)
    localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(updatedPrompts))
  }

  const addSystemPrompt = () => {
    const name = prompt('Nama bagi arahan sistem baharu:')
    if (!name || !name.trim()) return
    
    const newPrompt = {
      id: 'prompt_' + Date.now(),
      name: name.trim(),
      content: systemPrompt
    }
    
    const updatedPrompts = [...systemPrompts, newPrompt]
    setSystemPrompts(updatedPrompts)
    localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(updatedPrompts))
    setSelectedPromptId(newPrompt.id)
    showStatus('Arahan sistem ditambah', 'success')
  }

  const deleteSystemPrompt = () => {
    if (!selectedPromptId) {
      showStatus('Sila pilih arahan untuk dipadam', 'error')
      return
    }
    
    if (selectedPromptId === 'default') {
      showStatus('Arahan lalai tidak boleh dipadam', 'error')
      return
    }
    
    if (confirm('Padam arahan ini?')) {
      let updatedPrompts = systemPrompts.filter(p => p.id !== selectedPromptId)
      if (updatedPrompts.length === 0) {
        updatedPrompts.push({
          id: 'default', name: 'Default Meeting Minutes', content: DEFAULT_SYSTEM_PROMPT
        })
      }
      
      setSystemPrompts(updatedPrompts)
      localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(updatedPrompts))
      setSystemPrompt(updatedPrompts[0].content)
      setSelectedPromptId(updatedPrompts[0].id)
      showStatus('Arahan dipadam', 'success')
    }
  }

  const clearSavedData = () => {
    if (confirm('Padam semua data simpanan (transkripsi, arahan sistem, hasil diproses, maklumat mesyuarat)?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      localStorage.removeItem('system_prompts')
      localStorage.removeItem('processed_transcription')
      localStorage.removeItem(METADATA_KEY)
      
      setTranscription('')
      setProcessedTranscription('')
      setMetadata({ rujukan: '', bil: '', tarikh: '', masa: '', tempat: '' })
      initPrompts()
      showStatus('Data simpanan dibersihkan', 'success')
    }
  }

  // Copy function
  const copyToClipboard = (text, buttonId) => {
    navigator.clipboard.writeText(text).then(() => {
      const button = document.getElementById(buttonId)
      if (button) {
        const originalText = button.textContent
        button.textContent = 'Disalin!'
        setTimeout(() => { button.textContent = originalText }, 1500)
      }
    }).catch(() => alert('Gagal menyalin ke papan klip'))
  }

  // PDRM PDF Download - EXACT same function as HTML version
  const downloadPdrmMinutes = async () => {
    if (!processedTranscription.trim()) {
      showStatus('Tiada transkripsi diproses untuk dimuat turun', 'error')
      return
    }

    try {
      showStatus('Menjana PDF format PDRM...', 'loading')
      const fd = new FormData()
      fd.append('text', processedTranscription)
      fd.append('footer_text', '')
      fd.append('logo_path', 'static/asset/logo.png')

      const res = await fetch('/minutes/render?output_format=pdf', { 
        method: 'POST', 
        body: fd 
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Render failed')

      const link = document.createElement('a')
      link.href = data.pdf_url
      link.download = 'Minit Mesyuarat (PDRM).pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      showStatus('PDF format PDRM berjaya dijana!', 'success')
    } catch (err) {
      showStatus(`Ralat: ${err.message}`, 'error')
    }
  }

  // Download functions
  const downloadTranscription = async (format) => {
    if (!transcription) {
      showStatus('Tiada transkripsi untuk dimuat turun', 'error')
      return
    }
    
    try {
      showStatus(`Menjana fail ${format.toUpperCase()}…`, 'loading')
      const fd = new FormData()
      fd.append('text', transcription)
      fd.append('template', 'pdrm')
      fd.append('title', 'MINIT MESYUARAT')
      
      const url = new URL('/process_text', window.location.origin)
      url.searchParams.append('output_format', format)
      url.searchParams.append('template', 'pdrm')
      
      const response = await fetch(url, { method: 'POST', body: fd })
      const data = await response.json()
      
      if (response.ok) {
        const link = document.createElement('a')
        link.href = data[`${format}_url`]
        link.download = `minit.${format}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        showStatus(`${format.toUpperCase()} sedia untuk dimuat turun`, 'success')
      }
    } catch (err) {
      showStatus(`Ralat rangkaian: ${err.message}`, 'error')
    }
  }

  const downloadProcessedTranscription = async (format) => {
    if (!processedTranscription) {
      showStatus('Tiada hasil diproses untuk dimuat turun', 'error')
      return
    }
    
    try {
      showStatus(`Menjana fail ${format.toUpperCase()}…`, 'loading')
      const fd = new FormData()
      fd.append('text', processedTranscription)
      fd.append('template', 'pdrm')
      fd.append('title', 'MINIT MESYUARAT')
      
      const url = new URL('/process_text', window.location.origin)
      url.searchParams.append('output_format', format)
      url.searchParams.append('template', 'pdrm')
      
      const response = await fetch(url, { method: 'POST', body: fd })
      const data = await response.json()
      
      if (response.ok) {
        const link = document.createElement('a')
        link.href = data[`${format}_url`]
        link.download = `minit-diproses.${format}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        showStatus(`${format.toUpperCase()} sedia untuk dimuat turun`, 'success')
      }
    } catch (err) {
      showStatus(`Ralat rangkaian: ${err.message}`, 'error')
    }
  }

  return (
    <>
      {/* Status Toast */}
      {status.visible && (
        <div className={`status ${status.type}`} role="status" aria-live="polite" aria-hidden="false">
          {status.message}
        </div>
      )}

      {/* Sidebar */}
      <aside>
        <div className="side-top">
          <div className="user-card" aria-label="Maklumat Pengguna">
            <div className="avatar">AD</div>
            <div style={{lineHeight: '1.2'}}>
              <div style={{fontWeight: 700, color: '#fff'}}>admin</div>
              <a href="/logout" title="Log keluar">Log keluar</a>
            </div>
          </div>
        </div>

        <nav className="nav" aria-label="Navigasi Utama">
          <button className="active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1v22M5 8l7-7 7 7"/>
            </svg>
            Transkripsi
          </button>
          <button>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v5h5M3 3l7 7"/><path d="M12 8a8 8 0 1 1-7 5"/>
            </svg>
            Sejarah
          </button>
          <button>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6v12M6 12h12"/>
            </svg>
            Tetapan
          </button>
        </nav>
      </aside>

      {/* Header */}
      <header>
        <div className="brand">
          <div className="crest" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="8" r="3"/>
              <path d="M3 21c2.5-5 7-8 9-8s6.5 3 9 8"/>
            </svg>
          </div>
          <div>
            <h1>PDRM • Transkripsi Audio & Minit</h1>
            <small style={{opacity: .85}}>Aplikasi Dalaman • Sulit</small>
          </div>
        </div>

        <div className="header-actions">
          <span className="chip">v1.0</span>
          <label className="toggle" title="Tukar mod terang/gelap">
            <input 
              type="checkbox"
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
            />
            <span>Gelap</span>
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="scroll-container">
          <div className="container">
            <div className="page-header">
              <h2 style={{display: 'flex', alignItems: 'center'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '16px'}}>
                  <path d="M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                </svg>
                Muat Naik & Transkripsi Audio
              </h2>
              <div className="meta-row">
                <span className="badge">Disambung sebagai: <strong>admin</strong></span>
              </div>
            </div>

            <section className="grid-2">
              {/* Left Column */}
              <div>
                <form onSubmit={handleTranscription}>
                  <div className="form-row">
                    <div>
                      <label htmlFor="audioFile">Fail Audio/Video</label>
                      <div 
                        className="dropzone" 
                        onClick={handleFileClick}
                        onDrop={handleFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                        role="button" 
                        tabIndex="0" 
                        aria-label="Klik atau seret fail ke sini"
                      >
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14"/>
                          <path d="M5 12l7-7 7 7"/>
                          <path d="M3 19h18"/>
                        </svg>
                        <div className="dz-help">Klik untuk pilih atau seret & lepas fail di sini</div>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="audio/*,video/*" 
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                        />
                        {selectedFile && (
                          <div className="file-name">✅ Dipilih: {selectedFile.name}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="maxWorkers">Prestasi (Bil. Pekerja)</label>
                      <input 
                        className="control" 
                        type="number" 
                        min="1" 
                        max="16" 
                        value={maxWorkers} 
                        onChange={(e) => setMaxWorkers(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label htmlFor="modelSelect">Model</label>
                      <select className="control" value={model} onChange={(e) => setModel(e.target.value)}>
                        <option value="Whisper">Whisper</option>
                        <option value="Malaysia Whisper">Malaysia Whisper</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="languageSelect">Bahasa</label>
                      <select className="control" value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="auto">Auto</option>
                        <option value="ms">Melayu</option>
                        <option value="en">Inggeris</option>
                      </select>
                    </div>
                  </div>

                  <div className="btn-group" style={{marginTop: '24px'}}>
                    <button className="btn btn-primary" type="submit" disabled={isTranscribing}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>
                      </svg>
                      {isTranscribing ? 'Memproses...' : 'Transkripsikan'}
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={clearSavedData}>
                      Kosongkan Data Simpanan
                    </button>
                  </div>
                  <p style={{color: 'var(--muted)', margin: '16px 2px 0', fontSize: '13px'}}>
                    Fail diproses di pelayan dalaman. Data kekal sulit.
                  </p>
                </form>

                <div className="card" style={{marginTop: '32px'}}>
                  <div className="card-hd">
                    <h2>Keputusan Transkripsi</h2>
                  </div>
                  <div className="card-bd">
                    <textarea 
                      className="textarea" 
                      placeholder="Teks transkripsi akan dipaparkan di sini..."
                      value={transcription} 
                      onChange={(e) => setTranscription(e.target.value)}
                    />
                    <div className="btn-group" style={{marginTop: '16px'}}>
                      <button className="btn btn-outline" id="copyBtn" onClick={() => copyToClipboard(transcription, 'copyBtn')}>
                        Salin
                      </button>
                      <button className="btn btn-ghost" onClick={() => downloadTranscription('docx')}>
                        Muat turun DOCX
                      </button>
                      <button className="btn btn-ghost" onClick={() => downloadTranscription('pdf')}>
                        Muat turun PDF
                      </button>
                      <button className="btn btn-ghost" onClick={() => downloadTranscription('txt')}>
                        Muat turun TXT
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                {/* Meeting Metadata */}
                <div className="card" style={{marginBottom: '16px'}}>
                  <div className="card-hd">
                    <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <path d="M14 2v6h6"/>
                        <path d="M16 13H8"/>
                        <path d="M16 17H8"/>
                        <path d="M10 9H8"/>
                      </svg>
                      Maklumat Mesyuarat
                    </h2>
                  </div>
                  <div className="card-bd">
                    <div className="form-row">
                      <div>
                        <label htmlFor="rujukan">Rujukan</label>
                        <input 
                          type="text" 
                          className="control" 
                          placeholder="Contoh: PDRM/MM/2025/001"
                          value={metadata.rujukan} 
                          onChange={(e) => setMetadata({...metadata, rujukan: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label htmlFor="bil">Bil. Mesyuarat</label>
                        <input 
                          type="text" 
                          className="control" 
                          placeholder="Contoh: 1/2025"
                          value={metadata.bil} 
                          onChange={(e) => setMetadata({...metadata, bil: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <label htmlFor="tarikh">Tarikh</label>
                        <input 
                          type="text" 
                          className="control" 
                          placeholder="Contoh: 5 November 2025"
                          value={metadata.tarikh} 
                          onChange={(e) => setMetadata({...metadata, tarikh: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label htmlFor="masa">Masa</label>
                        <input 
                          type="text" 
                          className="control" 
                          placeholder="Contoh: 10:00 Pagi - 12:00 Tengahari"
                          value={metadata.masa} 
                          onChange={(e) => setMetadata({...metadata, masa: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <label htmlFor="tempat">Tempat</label>
                        <input 
                          type="text" 
                          className="control" 
                          placeholder="Contoh: Bilik Mesyuarat Utama, IPK"
                          value={metadata.tempat} 
                          onChange={(e) => setMetadata({...metadata, tempat: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Prompt */}
                <div className="card">
                  <div className="card-hd">
                    <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <path d="M14 2v6h6"/>
                        <path d="M8 13h8M8 17h8M8 9h2"/>
                      </svg>
                      Proses Minit Mesyuarat
                    </h2>
                  </div>
                  <div className="card-bd">
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap: '12px', marginBottom: '12px'}}>
                      <label htmlFor="systemPrompt" style={{margin:0}}>Arahan Sistem</label>
                      <div className="btn-group">
                        <select 
                          className="control" 
                          style={{padding:'8px 10px', width: 'auto', minWidth: '240px'}}
                          value={selectedPromptId} 
                          onChange={handlePromptChange}
                        >
                          {systemPrompts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <button className="btn btn-outline" onClick={addSystemPrompt} title="Tambah arahan">
                          Tambah
                        </button>
                        <button className="btn btn-danger" onClick={deleteSystemPrompt} title="Padam arahan">
                          Padam
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="textarea"
                      rows="6"
                      placeholder="Masukkan arahan sistem di sini..."
                      value={systemPrompt}
                      onChange={handleSystemPromptChange}
                    />
                    <div className="btn-group" style={{marginTop:'16px'}}>
                      <button className="btn btn-primary" onClick={handleProcessing} disabled={isProcessing}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4"/><path d="M21 6a12 12 0 0 1-18 0"/>
                        </svg>
                        {isProcessing ? 'Memproses...' : 'Proses Minit'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Processed Results */}
                <div className="card">
                  <div className="card-hd">
                    <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <path d="M14 2v6h6"/>
                        <path d="M16 13H8"/>
                        <path d="M16 17H8"/>
                        <path d="M10 9H8"/>
                      </svg>
                      Hasil Diproses
                    </h2>
                  </div>
                  <div className="card-bd">
                    <textarea
                      className="textarea"
                      placeholder="Output minit mesyuarat akan dipaparkan di sini..."
                      value={processedTranscription}
                      onChange={(e) => setProcessedTranscription(e.target.value)}
                    />
                    <div className="btn-group" style={{marginTop: '16px'}}>
                      <button className="btn btn-outline" id="copyProcessedBtn" onClick={() => copyToClipboard(processedTranscription, 'copyProcessedBtn')}>
                        Salin
                      </button>
                      <button className="btn btn-ghost" onClick={() => downloadProcessedTranscription('docx')}>
                        Muat turun DOCX
                      </button>
                      <button className="btn btn-ghost" onClick={() => downloadProcessedTranscription('pdf')}>
                        Muat turun PDF
                      </button>
                      <button className="btn btn-ghost" onClick={() => downloadProcessedTranscription('txt')}>
                        Muat turun TXT
                      </button>
                      <button className="btn btn-primary" onClick={downloadPdrmMinutes}>
                        Muat turun PDF Format PDRM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

export default App