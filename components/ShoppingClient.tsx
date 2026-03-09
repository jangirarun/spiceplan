'use client';
import { useEffect, useState } from 'react';

export default function ShoppingClient() {
  const [items, setItems] = useState<{ingredient:string; count:number}[]>([]);
  useEffect(() => { fetch('/api/shopping').then(r=>r.json()).then(d=>setItems(d.items)); }, []);
  const grouped = {
    Produce: items.filter(i => /onion|tomato|potato|peas|spinach|beans|carrot|cauliflower|okra|eggplant|methi|cabbage|capsicum|drumstick|banana|yam|coriander|ginger|garlic|lemon|ash gourd|mushroom/.test(i.ingredient)),
    Dairy: items.filter(i => /paneer|curd|cream|butter|milk|ghee|coconut milk/.test(i.ingredient)),
    Grains: items.filter(i => /rice|poha|rava|wheat flour|basmati|sabudana/.test(i.ingredient)),
    Pantry: items.filter(i => !/onion|tomato|potato|peas|spinach|beans|carrot|cauliflower|okra|eggplant|methi|cabbage|capsicum|drumstick|banana|yam|coriander|ginger|garlic|lemon|ash gourd|mushroom|paneer|curd|cream|butter|milk|ghee|coconut milk|rice|poha|rava|wheat flour|basmati|sabudana/.test(i.ingredient)),
  };
  return (
    <main className="container col">
      <section className="card card-pad premium">
        <div className="hero-title">Shopping List</div>
        <div className="muted">Built from all meals in your current weekly plan.</div>
      </section>
      <section className="shopping-list">
        {Object.entries(grouped).map(([group, list]) => (
          <div key={group} className="list-box">
            <div className="section-title">{group}</div>
            <div className="col" style={{marginTop:12}}>
              {list.length ? list.map(item => <div key={item.ingredient} className="row" style={{justifyContent:'space-between'}}><span>{item.ingredient}</span><span className="badge">x{item.count}</span></div>) : <div className="muted">Nothing here yet.</div>}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
