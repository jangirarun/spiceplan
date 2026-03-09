'use client';
import { useEffect, useState } from 'react';

export default function SettingsClient() {
  const [avoids, setAvoids] = useState<string[]>([]);
  const [value, setValue] = useState('');
  async function load() { const d = await fetch('/api/settings/avoids').then(r=>r.json()); setAvoids(d.avoids); }
  useEffect(()=>{ load(); }, []);
  async function add() {
    if (!value.trim()) return;
    await fetch('/api/settings/avoids', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ingredient:value }) });
    setValue(''); load();
  }
  async function remove(ingredient:string) {
    await fetch(`/api/settings/avoids?ingredient=${encodeURIComponent(ingredient)}`, { method:'DELETE' });
    load();
  }
  return (
    <main className="container col">
      <section className="card card-pad premium">
        <div className="hero-title">Settings</div>
        <div className="muted">Add ingredients to avoid. The planner and library will filter out matching dishes.</div>
      </section>
      <section className="card card-pad">
        <div className="section-title">Ingredients to avoid</div>
        <div className="row" style={{marginTop:14}}>
          <input className="input" placeholder="Example: mushroom, garlic, onion" value={value} onChange={e=>setValue(e.target.value)} />
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
        <div className="row" style={{marginTop:18}}>
          {avoids.length ? avoids.map(a => <button key={a} className="btn btn-secondary btn-small" onClick={()=>remove(a)}>{a} ✕</button>) : <div className="muted">No avoided ingredients yet.</div>}
        </div>
      </section>
    </main>
  );
}
