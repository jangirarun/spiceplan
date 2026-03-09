'use client';

import { useEffect, useMemo, useState } from 'react';
import { DAYS, MEALS } from '@/lib/constants';

type Dish = { id:number; name:string; mealType:string; region:string; prepTime:number; ingredients:string[]; recipe:string; tags:string[] };
type PlannedMeal = { dayOfWeek:string; mealType:string; dish:Dish };
type SuggestDish = Dish & { score?:number; matchRatio?:number; matched?:string[]; missing?:string[] };

const mealLabel = (meal: string) => meal.charAt(0).toUpperCase() + meal.slice(1);

export default function PlannerClient() {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMeal, setSelectedMeal] = useState<'breakfast'|'lunch'|'dinner'>('breakfast');
  const [plan, setPlan] = useState<PlannedMeal[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [avoids, setAvoids] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [mealFilter, setMealFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [homeIngredients, setHomeIngredients] = useState('');
  const [alternatives, setAlternatives] = useState<SuggestDish[]>([]);
  const [ingredientMatches, setIngredientMatches] = useState<SuggestDish[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [ingredientMessage, setIngredientMessage] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ name:'', mealType:'breakfast', region:'Home Kitchen', prepTime:'20', ingredients:'', tags:'homemade,custom', recipe:'' });
  const [manualError, setManualError] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [planRes, dishesRes] = await Promise.all([
      fetch('/api/planner').then(r=>r.json()),
      fetch(`/api/dishes?q=${encodeURIComponent(q)}&meal=${mealFilter}&region=${encodeURIComponent(regionFilter)}&favorites=${favoriteOnly ? '1' : '0'}`).then(r=>r.json())
    ]);
    setPlan(planRes.plan.plannedMeals);
    setFavorites(planRes.favorites);
    setAvoids(planRes.avoids);
    setDishes(dishesRes.dishes);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [q, mealFilter, regionFilter, favoriteOnly]);

  const nextMeal = useMemo(() => {
    for (const day of DAYS) {
      for (const meal of MEALS) {
        const match = plan.find((p) => p.dayOfWeek === day && p.mealType === meal);
        if (!match) return { day, meal, label: `${day} ${meal}` };
      }
    }
    return { day: 'Monday', meal: 'breakfast', label: 'Week full' };
  }, [plan]);

  const selectedText = `${selectedDay} ${mealLabel(selectedMeal)}`;
  const selectedEntry = useMemo(
    () => plan.find((p) => p.dayOfWeek === selectedDay && p.mealType === selectedMeal),
    [plan, selectedDay, selectedMeal]
  );

  async function assignDish(dishId:number) {
    await fetch('/api/save-plan', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dayOfWeek:selectedDay, mealType:selectedMeal, dishId }) });
    await loadAll();
    await loadSuggestions(homeIngredients, false);
  }

  async function clearSlot(day:string, mealType:string) {
    await fetch(`/api/save-plan?dayOfWeek=${day}&mealType=${mealType}`, { method:'DELETE' });
    await loadAll();
    if (day === selectedDay && mealType === selectedMeal) {
      setAlternatives([]);
    }
  }

  async function toggleFavorite(dishId:number) {
    const exists = favorites.includes(dishId);
    await fetch(exists ? `/api/favorites?dishId=${dishId}` : '/api/favorites', {
      method: exists ? 'DELETE' : 'POST',
      headers: exists ? undefined : { 'Content-Type':'application/json' },
      body: exists ? undefined : JSON.stringify({ dishId })
    });
    await loadAll();
  }

  async function loadSuggestions(ingredientsValue = homeIngredients, showLoading = true) {
    if (showLoading) setSuggesting(true);
    setIngredientMessage('');
    const params = new URLSearchParams();
    params.set('dayOfWeek', selectedDay);
    params.set('mealType', selectedMeal);
    if (ingredientsValue.trim()) params.set('ingredients', ingredientsValue);
    if (selectedEntry?.dish?.id) params.set('dishId', String(selectedEntry.dish.id));
    const data = await fetch(`/api/suggest?${params.toString()}`).then(r => r.json());
    setAlternatives(data.alternatives || []);
    setIngredientMatches(data.ingredientMatches || []);
    if (ingredientsValue.trim()) {
      setIngredientMessage((data.ingredientMatches || []).length ? `Found ${(data.ingredientMatches || []).length} matching dishes for ${ingredientsValue}.` : `No strong matches found for ${ingredientsValue}. Try adding one more ingredient like onion, tomato, rice, dahi, or switch the selected meal slot.`);
    }
    if (showLoading) setSuggesting(false);
  }

  useEffect(() => {
    loadSuggestions(homeIngredients, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, selectedMeal, plan]);

  async function addManualDish() {
    setManualError('');
    setManualSaving(true);
    const res = await fetch('/api/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...manual,
        prepTime: Number(manual.prepTime || 20),
        ingredients: manual.ingredients,
        tags: manual.tags,
      })
    });
    const data = await res.json();
    setManualSaving(false);
    if (!res.ok) {
      setManualError(data.error || 'Could not save dish');
      return;
    }
    setManualOpen(false);
    setManual({ name:'', mealType:selectedMeal, region:'Home Kitchen', prepTime:'20', ingredients:'', tags:'homemade,custom', recipe:'' });
    await loadAll();
    await assignDish(data.dish.id);
  }

  return (
    <main className="container grid grid-2">
      <div className="col">
        <section className="card card-pad premium">
          <div className="row" style={{justifyContent:'space-between'}}>
            <div>
              <div className="badge">This week</div>
              <div className="hero-title" style={{marginTop:12}}>Weekly Meal Planner</div>
              <div className="muted" style={{marginTop:8}}>Database-backed planner, alternatives, ingredient matching, favorites, and a manual dish builder.</div>
            </div>
            <div className="row" style={{flexWrap:'wrap'}}>
              <button className="btn btn-secondary" onClick={async()=>{ for (const day of DAYS) for (const meal of MEALS) await clearSlot(day, meal); }}>Clear week</button>
              <button className="btn btn-primary" onClick={()=>{setSelectedDay(nextMeal.day); setSelectedMeal(nextMeal.meal as any);}}>Pick next meal</button>
            </div>
          </div>
        </section>

        <section className="card" style={{overflow:'hidden'}}>
          <table className="planner-table">
            <thead>
              <tr>
                <th>Meal</th>
                {DAYS.map(day => <th key={day}>{day}</th>)}
              </tr>
            </thead>
            <tbody>
              {MEALS.map(meal => (
                <tr key={meal}>
                  <th style={{textTransform:'capitalize'}}>{meal}</th>
                  {DAYS.map(day => {
                    const entry = plan.find((p)=>p.dayOfWeek===day && p.mealType===meal);
                    const selected = selectedDay===day && selectedMeal===meal;
                    return (
                      <td key={day}>
                        <div className={`slot ${selected ? 'selected' : ''}`}>
                          {!entry ? (
                            <div className="slot-inner" onClick={()=>{setSelectedDay(day); setSelectedMeal(meal as any);}}>+ Add meal</div>
                          ) : (
                            <div className="slot-inner" style={{justifyContent:'flex-start'}} onClick={()=>{setSelectedDay(day); setSelectedMeal(meal as any);}}>
                              <div className="dish-chip">
                                <div>
                                  <div style={{fontWeight:800,color:'#14264a'}}>{entry.dish.name}</div>
                                  <div className="muted" style={{fontSize:13,marginTop:6}}>{entry.dish.region} • {entry.dish.prepTime} min</div>
                                </div>
                                <div className="row">
                                  <button className="btn btn-secondary btn-small">Change</button>
                                  <button className="btn btn-secondary btn-small" onClick={(e)=>{e.stopPropagation(); clearSlot(day, meal);}}>Remove</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="col">
        <section className="card card-pad premium">
          <div className="badge">Selected slot</div>
          <div className="title" style={{marginTop:10}}>{selectedText}</div>
          <div className="muted" style={{marginTop:8}}>
            Current: {selectedEntry ? selectedEntry.dish.name : 'nothing planned yet'}
          </div>
          <div className="muted" style={{marginTop:4}}>Avoiding: {avoids.length ? avoids.join(', ') : 'nothing yet'}</div>
          <div className="row" style={{marginTop:16, flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={()=>{setSelectedDay(nextMeal.day); setSelectedMeal(nextMeal.meal as any);}}>Change next meal</button>
            <button className="btn btn-secondary" onClick={()=>loadSuggestions()}>Suggest alternatives</button>
          </div>
        </section>

        <section className="card card-pad">
          <div className="title">Suggest from what you have at home</div>
          <div className="muted">Type ingredients like onion, tomato, paneer, rice — or Hindi names in English like pyaz, tamatar, aloo, dahi. We will suggest the best matches for {selectedText}.</div>
          <div className="row" style={{marginTop:14}}>
            <input className="input" placeholder="onion, tomato, paneer, rice or pyaz, tamatar, aloo, dahi" value={homeIngredients} onChange={e=>setHomeIngredients(e.target.value)} onKeyDown={e=>{ if (e.key === 'Enter') loadSuggestions(); }} />
            <button className="btn btn-primary" onClick={()=>loadSuggestions()}>{suggesting ? 'Finding…' : 'Find dishes'}</button>
          </div>

          <div className="col" style={{marginTop:18}}>
            <div className="section-title">Alternative dishes</div>
            <div className="muted">Based on the currently planned dish for this slot.</div>
            <div className="dish-list" style={{marginTop:12, maxHeight:260}}>
              {alternatives.length ? alternatives.map(dish => (
                <div key={`alt-${dish.id}`} className="dish-item">
                  <div>
                    <div style={{fontWeight:800,fontSize:20}}>{dish.name}</div>
                    <div className="muted" style={{marginTop:4}}>{dish.region} • {dish.prepTime} min</div>
                    <div className="muted" style={{marginTop:8}}>{dish.ingredients.join(', ')}</div>
                    <details style={{marginTop:10}}>
                      <summary style={{cursor:'pointer', color:'#ea580c', fontWeight:700}}>Recipe</summary>
                      <div style={{marginTop:8}}>{dish.recipe}</div>
                    </details>
                  </div>
                  <button className="btn btn-primary" onClick={()=>assignDish(dish.id)}>Use</button>
                </div>
              )) : <div className="muted" style={{marginTop:8}}>{selectedEntry ? 'Click “Suggest alternatives” to load similar dishes.' : 'Plan a dish in this slot first to get similar replacements.'}</div>}
            </div>
          </div>

          <div className="col" style={{marginTop:18}}>
            <div className="section-title">Matches from home ingredients</div>
            <div className="muted">Best dishes from the ingredients you entered.</div>
            {!!ingredientMessage && <div className="muted" style={{marginTop:8}}>{ingredientMessage}</div>}
            <div className="dish-list" style={{marginTop:12, maxHeight:320}}>
              {ingredientMatches.length ? ingredientMatches.map(dish => (
                <div key={`ing-${dish.id}`} className="dish-item">
                  <div>
                    <div style={{fontWeight:800,fontSize:20}}>{dish.name}</div>
                    <div className="muted" style={{marginTop:4}}>{dish.region} • {dish.prepTime} min • {Math.round((dish.matchRatio || 0) * 100)}% match</div>
                    {!!dish.matched?.length && <div className="muted" style={{marginTop:8}}><strong>Using now:</strong> {dish.matched.join(', ')}</div>}
                    {!!dish.missing?.length && <div className="muted" style={{marginTop:4}}><strong>Still need:</strong> {dish.missing.slice(0, 4).join(', ')}</div>}
                    <details style={{marginTop:10}}>
                      <summary style={{cursor:'pointer', color:'#ea580c', fontWeight:700}}>Recipe</summary>
                      <div style={{marginTop:8}}>{dish.recipe}</div>
                    </details>
                  </div>
                  <button className="btn btn-primary" onClick={()=>assignDish(dish.id)}>Use</button>
                </div>
              )) : <div className="muted" style={{marginTop:8}}>Enter ingredients and click “Find dishes” to get smart meal replacements. Hindi names like pyaz, tamatar, aloo, dahi also work now.</div>}
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div className="title">Choose a dish</div>
              <div className="muted">Assign a dish to {selectedText}.</div>
            </div>
            <button className="btn btn-secondary" onClick={()=>setManualOpen(v => !v)}>{manualOpen ? 'Close manual form' : 'Add dish manually'}</button>
          </div>

          {manualOpen && (
            <div className="col" style={{marginTop:16, padding:16, border:'1px solid #fde7d3', borderRadius:16, background:'#fff9f3'}}>
              <div className="section-title">Manual dish entry</div>
              <div className="row" style={{marginTop:12}}>
                <input className="input" placeholder="Dish name" value={manual.name} onChange={e=>setManual({...manual, name:e.target.value})} />
                <select className="select" value={manual.mealType} onChange={e=>setManual({...manual, mealType:e.target.value})}>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div className="row" style={{marginTop:12}}>
                <input className="input" placeholder="Region, e.g. Home Kitchen / North Indian" value={manual.region} onChange={e=>setManual({...manual, region:e.target.value})} />
                <input className="input" placeholder="Prep time in minutes" value={manual.prepTime} onChange={e=>setManual({...manual, prepTime:e.target.value})} />
              </div>
              <input className="input" style={{marginTop:12}} placeholder="Ingredients, comma separated" value={manual.ingredients} onChange={e=>setManual({...manual, ingredients:e.target.value})} />
              <input className="input" style={{marginTop:12}} placeholder="Tags, comma separated" value={manual.tags} onChange={e=>setManual({...manual, tags:e.target.value})} />
              <textarea className="input" style={{marginTop:12, minHeight:110}} placeholder="Recipe steps" value={manual.recipe} onChange={e=>setManual({...manual, recipe:e.target.value})} />
              {manualError ? <div style={{color:'#b91c1c', fontWeight:700}}>{manualError}</div> : null}
              <div className="row" style={{marginTop:12}}>
                <button className="btn btn-primary" disabled={manualSaving} onClick={addManualDish}>{manualSaving ? 'Saving…' : 'Save and use this dish'}</button>
              </div>
            </div>
          )}

          <div className="col" style={{marginTop:14}}>
            <input className="input" placeholder="Search by dish or ingredient" value={q} onChange={e=>setQ(e.target.value)} />
            <div className="row">
              <select className="select" value={mealFilter} onChange={e=>setMealFilter(e.target.value)}>
                <option value="">All meals</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
              <select className="select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
                <option value="">All regions</option>
                <option value="North">North Indian</option>
                <option value="South">South Indian</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Kerala">Kerala</option>
                <option value="Home Kitchen">Home Kitchen</option>
              </select>
            </div>
            <label className="row" style={{fontSize:14}}><input type="checkbox" checked={favoriteOnly} onChange={e=>setFavoriteOnly(e.target.checked)} /> Favorites only</label>
          </div>
          <div className="dish-list" style={{marginTop:16}}>
            {loading ? <div className="muted">Loading...</div> : dishes.map(dish => (
              <div key={dish.id} className="dish-item">
                <div>
                  <div className="row" style={{justifyContent:'space-between'}}>
                    <div style={{fontWeight:800,fontSize:24}}>{dish.name}</div>
                    <button className="btn btn-secondary btn-small" onClick={()=>toggleFavorite(dish.id)}>{favorites.includes(dish.id) ? '★ Favorite' : '☆ Favorite'}</button>
                  </div>
                  <div className="muted" style={{marginTop:4}}>{dish.region} • {dish.prepTime} min • {dish.mealType}</div>
                  <div className="row" style={{marginTop:10}}>
                    {(dish.tags || []).slice(0,3).map((t:string) => <span className="pill" key={t}>{t}</span>)}
                  </div>
                  <div className="muted" style={{marginTop:10}}>{dish.ingredients.join(', ')}</div>
                  <details style={{marginTop:10}}>
                    <summary style={{cursor:'pointer', color:'#ea580c', fontWeight:700}}>Recipe</summary>
                    <div style={{marginTop:8}}>{dish.recipe}</div>
                  </details>
                </div>
                <div>
                  <button className="btn btn-primary" onClick={()=>assignDish(dish.id)}>Use</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
