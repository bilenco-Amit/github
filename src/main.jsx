import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, ShoppingBag, Heart, ArrowRight, Menu, X, Plus, Minus, Trash2, SlidersHorizontal } from 'lucide-react';
import './styles.css';

function App() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Featured');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [checkout, setCheckout] = useState({ email: '', address: '', city: '', postalCode: '' });
  const [orderStatus, setOrderStatus] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/products')
      .then(response => response.json())
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'Price: Low') result = [...result].sort((a,b) => a.price - b.price);
    if (sort === 'Price: High') result = [...result].sort((a,b) => b.price - a.price);
    if (sort === 'Newest') result = [...result].sort((a,b) => Number(b.tag === 'New') - Number(a.tag === 'New'));
    return result;
  }, [category, search, sort]);

  const addToCart = product => {
    setCart(items => {
      const existing = items.find(i => i.id === product.id);
      return existing ? items.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i) : [...items, {...product, qty: 1}];
    });
  };

  const updateQty = (id, delta) => setCart(items => items.map(i => i.id === id ? {...i, qty: i.qty + delta} : i).filter(i => i.qty > 0));
  const toggleWishlist = id => setWishlist(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const placeOrder = async () => {
    setOrderStatus('processing');
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkout, items: cart.map(item => ({ id: item.id, qty: item.qty })) })
      });
      if (!response.ok) throw new Error('Unable to place order');
      const order = await response.json();
      setOrderStatus('success');
      setCheckoutOpen(false);
      setCartOpen(false);
      setCart([]);
      alert(`Order ${order.id} confirmed — thank you!`);
    } catch (error) {
      setOrderStatus(error.message);
    }
  };

  return (
    <>
      <header>
        <div className="announcement">Complimentary shipping on orders over $100</div>
        <nav>
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={21}/></button>
          <a className="logo" href="#">NUVORA</a>
          <div className="nav-links">
            <button>New arrivals</button><button>Shop</button><button>Collections</button><button>About</button>
          </div>
          <div className="nav-actions">
            <button aria-label="Search" onClick={() => document.querySelector('.search-box input')?.focus()}><Search size={20}/></button>
            <button className="desktop-heart" aria-label="Wishlist"><Heart size={20}/>{wishlist.length > 0 && <span className="tiny-count">{wishlist.length}</span>}</button>
            <button aria-label="Shopping bag" onClick={() => setCartOpen(true)}><ShoppingBag size={20}/>{cartCount > 0 && <b>{cartCount}</b>}</button>
          </div>
        </nav>
      </header>

      {menuOpen && <div className="mobile-drawer"><button className="close-btn" onClick={() => setMenuOpen(false)}><X/></button><a>New arrivals</a><a>Shop</a><a>Collections</a><a>About</a></div>}

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">THE SPRING EDIT · 2026</p>
            <h1>Objects for a<br/><em>considered life.</em></h1>
            <p className="hero-text">Thoughtfully made essentials for everyday rituals, where quiet design meets lasting quality.</p>
            <button className="primary-btn" onClick={() => document.querySelector('.shop')?.scrollIntoView({behavior:'smooth'})}>Shop the collection <ArrowRight size={18}/></button>
          </div>
          <div className="hero-image"><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=90" alt="Model wearing modern neutral clothing"/><div className="image-caption"><span>01</span><span>THE EVERYDAY EDIT</span></div></div>
        </section>

        <section className="shop" id="shop">
          <div className="section-heading"><div><p className="eyebrow">CURATED SELECTION</p><h2>Made for everyday</h2></div><p className="product-count">{filtered.length} pieces</p></div>
          <div className="toolbar">
            <div className="categories">{['All','Apparel','Accessories','Living','Footwear'].map(cat => <button key={cat} className={category === cat ? 'active' : ''} onClick={() => setCategory(cat)}>{cat}</button>)}</div>
            <div className="toolbar-right">
              <label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"/></label>
              <label className="sort-box"><SlidersHorizontal size={16}/><select value={sort} onChange={e => setSort(e.target.value)}><option>Featured</option><option>Newest</option><option>Price: Low</option><option>Price: High</option></select></label>
            </div>
          </div>

          <div className="product-grid">
            {productsLoading ? Array(8).fill().map((_,i) => <div className="product-card skeleton" key={i}><div className="skeleton-image"/><div className="skeleton-info"><div className="skeleton-title"/><div className="skeleton-price"/></div></div>) : filtered.map(product => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  {product.tag && <span className="tag">{product.tag}</span>}
                  <button className={`heart ${wishlist.includes(product.id) ? 'liked' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist"><Heart size={19} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}/></button>
                  <img src={product.image} alt={product.name}/>
                  <button className="quick-add" onClick={() => addToCart(product)}><Plus size={17}/> Quick add</button>
                </div>
                <div className="product-info"><div><p>{product.category}</p><h3>{product.name}</h3></div><strong>${product.price}</strong></div>
                <div className="swatches"><i style={{background: product.color}}/><i/><i/></div>
              </article>
            ))}
          </div>
        </section>

        <section className="story">
          <div className="story-image"><img src="https://images.unsplash.com/photo-1497215842964-888b5e527e76?auto=format&fit=crop&w=1200&q=85" alt="Calm modern studio interior"/></div>
          <div className="story-copy"><p className="eyebrow">OUR APPROACH</p><h2>Less, but better.</h2><p>We believe the things you live with should be useful, beautiful, and made to endure. Each piece is selected for honest materials and enduring form.</p><button className="text-btn">Discover our story <ArrowRight size={17}/></button></div>
        </section>
      </main>

      <footer><a className="logo">NUVORA</a><p>© 2026 Nuvora Studio</p><div><a>Instagram</a><a>Privacy</a><a>Terms</a></div></footer>

      {cartOpen && <><div className="overlay" onClick={() => setCartOpen(false)}/><aside className="cart-drawer"><div className="cart-header"><h2>Bag <span>({cartCount})</span></h2><button onClick={() => setCartOpen(false)}><X/></button></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={38}/><h3>Your bag is empty</h3><p>Discover pieces made for every day.</p><button className="primary-btn" onClick={() => setCartOpen(false)}>Continue shopping</button></div> : <><div className="cart-items">{cart.map(item => <div className="cart-item" key={item.id}><img src={item.image} alt={item.name}/><div className="cart-item-info"><h3>{item.name}</h3><p>Natural / One size</p><div className="quantity"><button onClick={() => updateQty(item.id,-1)}><Minus size={14}/></button><span>{item.qty}</span><button onClick={() => updateQty(item.id,1)}><Plus size={14}/></button></div></div><div className="cart-item-end"><strong>${item.price * item.qty}</strong><button onClick={() => setCart(items => items.filter(i => i.id !== item.id))}><Trash2 size={16}/></button></div></div>)}</div><div className="cart-footer"><div><span>Subtotal</span><strong>${subtotal}</strong></div><p>Shipping and taxes calculated at checkout</p><button className="checkout-btn" onClick={() => setCheckoutOpen(true)}>Checkout</button></div></>}</aside></>}

      {checkoutOpen && <><div className="overlay" onClick={() => setCheckoutOpen(false)}/><div className="checkout-modal"><button className="close-btn" onClick={() => setCheckoutOpen(false)}><X/></button><p className="eyebrow">SECURE CHECKOUT</p><h2>Complete your order</h2><label>Email address<input type="email" value={checkout.email} onChange={e => setCheckout({...checkout, email: e.target.value})} placeholder="you@example.com"/></label><label>Shipping address<input value={checkout.address} onChange={e => setCheckout({...checkout, address: e.target.value})} placeholder="Street address"/></label><div className="checkout-row"><label>City<input value={checkout.city} onChange={e => setCheckout({...checkout, city: e.target.value})} placeholder="City"/></label><label>Postal code<input value={checkout.postalCode} onChange={e => setCheckout({...checkout, postalCode: e.target.value})} placeholder="Postal code"/></label></div><div className="checkout-total"><span>Total</span><strong>${subtotal}</strong></div>{orderStatus && orderStatus !== 'success' && <p style={{fontSize:'11px',color:'#9a563c'}}>{orderStatus}</p>}<button className="checkout-btn" disabled={orderStatus === 'processing'} onClick={placeOrder}>{orderStatus === 'processing' ? 'Processing...' : 'Place order'}</button></div></>}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
