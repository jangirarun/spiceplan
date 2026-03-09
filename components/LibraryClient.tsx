'use client';
import { normalizeDish, parseList } from '@/lib/serializers';
import { useEffect, useState } from 'react';

type Dish = { id:number; name:string; mealType:string; region:string; prepTime:number; ingredients:string[]; recipe:string; tags:string[] };

export default function LibraryClient() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [q, setQ] = useState('');
  const [meal, setMeal] = useState('');

  async function load() {
    const data = await fetch(`/api/dishes?q=${encodeURIComponent(q)}&meal=${meal}`).then(r=>r.json());
    setDishes(data.dishes); setFavorites(data.favoriteIds);
  }
  useEffect(()=>{ load(); }, [q, meal]);

  async function toggleFavorite(dishId:number) {
    const exists = favorites.includes(dishId);
    await fetch(exists ? `/api/favorites?dishId=${dishId}` : '/api/favorites', {
      method: exists ? 'DELETE' : 'POST',
      headers: exists ? undefined : {'Content-Type':'application/json'},
      body: exists ? undefined : JSON.stringify({ dishId })
    });
    load();
  }

  return (
    <main className="container col">
      <section className="card card-pad premium">
        <div className="hero-title">Dish Library</div>
        <div className="muted">Browse the larger vegetarian dataset and manage favorites.</div>
        <div className="row" style={{marginTop:16}}>
          <input className="input" placeholder="Search dish or ingredient" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="select" value={meal} onChange={e=>setMeal(e.target.value)}>
            <option value="">All meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
      </section>
      <section className="card card-pad">
        <div className="dish-list" style={{maxHeight:'none'}}>
          {dishes.map(dish => (
            <div key={dish.id} className="dish-item">
              <div>
                <div style={{fontWeight:800,fontSize:24}}>{dish.name}</div>
                <div className="muted" style={{marginTop:4}}>{dish.region} • {dish.prepTime} min • {dish.mealType}</div>
                <div className="row" style={{marginTop:10}}>{dish.tags?.map((t:string)=><span className="pill" key={t}>{t}</span>)}</div>
                <div className="muted" style={{marginTop:10}}>{dish.ingredients.join(', ')}</div>
                <div style={{marginTop:10}}>{dish.recipe}</div>
              </div>
              <div>
                <button className="btn btn-secondary" onClick={()=>toggleFavorite(dish.id)}>{favorites.includes(dish.id) ? '★ Favorite' : '☆ Favorite'}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
