'use client'

import { useMemo, useState } from 'react'

const MAX = 50

type Item = { name: string; status: 'queued' | 'processing' | 'done' | 'error'; url?: string; error?: string }

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [removeWatermark, setRemoveWatermark] = useState(false)
  const [running, setRunning] = useState(false)

  const completed = useMemo(() => items.filter(i => i.status === 'done').length, [items])

  function choose(list: FileList | null) {
    if (!list) return
    const selected = Array.from(list).filter(f => f.type.startsWith('image/')).slice(0, MAX)
    setFiles(selected)
    setItems(selected.map(f => ({ name: f.name, status: 'queued' })))
  }

  async function enhance() {
    if (!files.length || running) return
    setRunning(true)
    for (let i = 0; i < files.length; i++) {
      setItems(prev => prev.map((x, n) => n === i ? { ...x, status: 'processing' } : x))
      const body = new FormData()
      body.append('image', files[i])
      body.append('removeWatermark', String(removeWatermark))
      try {
        const res = await fetch('/api/enhance', { method: 'POST', body })
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Enhancement failed')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setItems(prev => prev.map((x, n) => n === i ? { ...x, status: 'done', url } : x))
      } catch (e) {
        setItems(prev => prev.map((x, n) => n === i ? { ...x, status: 'error', error: e instanceof Error ? e.message : 'Failed' } : x))
      }
    }
    setRunning(false)
  }

  return <main className="shell"><section className="card">
    <div className="brand">Vintage Press</div>
    <h1 className="title">Image Enhancer</h1>
    <p className="sub">Upload your editorial photos and enhance them in one go. Originals are never changed.</p>
    <label className="drop">
      <input className="hidden" type="file" accept="image/*" multiple onChange={e => choose(e.target.files)} />
      <strong>{files.length ? `${files.length} photo${files.length === 1 ? '' : 's'} selected` : 'Choose photos'}</strong>
      <span>Up to 50 images per batch</span>
    </label>
    <div className="toolbar">
      <label className="check"><input type="checkbox" checked={removeWatermark} onChange={e => setRemoveWatermark(e.target.checked)} /> Remove watermark</label>
      <button className="primary" disabled={!files.length || running} onClick={enhance}>{running ? `Enhancing ${completed}/${files.length}…` : 'Enhance All'}</button>
    </div>
    {items.length > 0 && <div className="summary">
      <strong>{running ? `Processing ${completed} of ${items.length}` : `${completed} of ${items.length} enhanced`}</strong>
      <div className="progress"><div className="bar" style={{width: `${items.length ? completed / items.length * 100 : 0}%`}} /></div>
      <div className="files">{items.map((item, i) => <div className="file" key={`${item.name}-${i}`}><span>{item.name}</span>{item.status === 'done' && item.url ? <a className="ok" href={item.url} download={`enhanced-${item.name}`}>Download</a> : <span className={item.status === 'error' ? 'err' : ''}>{item.status === 'processing' ? 'Processing…' : item.status === 'error' ? item.error : 'Queued'}</span>}</div>)}</div>
    </div>}
    <p className="note">Enhancement uses your fixed Gemini instruction: “Enhance this image and increase the resolution.”</p>
  </section></main>
}
