"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Search, LayoutGrid, List, ArrowLeft, ArrowRight, Cpu, Shirt, Home, Activity, BookOpen, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  createdAt: string;
}

export default function ProductBrowser() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  
  // Pagination State
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  
  // Toast State
  const [toast, setToast] = useState<string | null>(null);

  const fetchProducts = useCallback(async (cursor: string | null, cat: string | null) => {
    setIsLoading(true);
    try {
      const url = new URL('/api/products', window.location.origin);
      url.searchParams.set('limit', '20'); // Claude's UI blueprint uses 20 items per page
      if (cursor) url.searchParams.set('cursor', cursor);
      if (cat && cat !== 'All') url.searchParams.set('category', cat);

      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (data.data) {
        setProducts(data.data);
        setNextCursor(data.nextCursor);
      } else {
        console.error("API Error:", data.error);
        setProducts([]);
        setToast("Database Connection Error. Did you set Vercel Environment Variables?");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts(currentCursor, category);
  }, [fetchProducts, currentCursor, category]);

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorHistory(prev => [...prev, currentCursor || '']);
      setCurrentCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const prevCursor = newHistory.pop() || null;
      setCursorHistory(newHistory);
      setCurrentCursor(prevCursor === '' ? null : prevCursor);
    }
  };

  const handleCategorySelect = (cat: string | null) => {
    setCategory(cat);
    setCurrentCursor(null);
    setCursorHistory([]);
  };

  const handleInject = async () => {
    setIsInjecting(true);
    try {
      await fetch('/api/products/inject', { method: 'POST' });
      
      setToast("50 products injected — cursor stable");
      setTimeout(() => setToast(null), 3000);
      
      // If we are on the first page and viewing all or the category they landed in,
      // refresh the page to show the new ones at the top.
      // If we are paginated, we do NOT refresh so the user can see that the cursor stays stable!
      if (!currentCursor) {
        fetchProducts(null, category);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsInjecting(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Electronics': return <Cpu size={10} />;
      case 'Clothing': return <Shirt size={10} />;
      case 'Home': return <Home size={10} />;
      case 'Sports': return <Activity size={10} />;
      case 'Books': return <BookOpen size={10} />;
      default: return <Package size={10} />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Electronics': return 'tag-electronics';
      case 'Clothing': return 'tag-clothing';
      case 'Home': return 'tag-home';
      case 'Sports': return 'tag-sports';
      case 'Books': return 'tag-books';
      default: return 'tag-other';
    }
  };

  const isNew = (dateString: string) => {
    const ageInMs = Date.now() - new Date(dateString).getTime();
    return ageInMs < 60000; // younger than 60 seconds
  };

  const formatRelativeTime = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} d ago`;
  };

  return (
    <div className="shell">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="logo">Product<span>Scope</span></div>
          <div className="pill">● Live</div>
          <div className="meta-txt">200,000 products · cursor-stable</div>
        </div>
        <div className="topbar-right">
          <div className="meta-txt">Injecting resets cursor · stays consistent</div>
          <button 
            className="chaos-btn" 
            onClick={handleInject}
            disabled={isInjecting}
          >
            <Zap size={14} />
            {isInjecting ? 'Injecting...' : 'Inject 50 products'}
          </button>
        </div>
      </div>

      <div className="body-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Category</div>
            {['All', 'Electronics', 'Clothing', 'Home', 'Sports', 'Books'].map(cat => (
              <div 
                key={cat}
                className={`filter-item ${category === cat || (cat === 'All' && !category) ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat === 'All' ? null : cat)}
              >
                <div className="filter-item-left">
                  <div className="filter-dot" style={{
                    background: cat === 'All' ? '#378ADD' : 
                                cat === 'Electronics' ? '#185FA5' : 
                                cat === 'Clothing' ? '#993556' : 
                                cat === 'Home' ? '#0F6E56' : 
                                cat === 'Sports' ? '#854F0B' : '#534AB7'
                  }}></div>
                  {cat === 'All' ? 'All products' : cat}
                </div>
              </div>
            ))}
          </div>

          <div className="divider"></div>

          <div className="price-range sidebar-section">
            <div className="sidebar-label">Price range</div>
            <div className="price-inputs">
              <input className="price-input-box" value="$0" readOnly />
              <span className="price-sep">—</span>
              <input className="price-input-box" value="$999" readOnly />
            </div>
          </div>

          <div className="divider"></div>

          <div className="sidebar-section" style={{marginTop: 'auto'}}>
            <div className="sidebar-label">Cursor debug</div>
            <div style={{fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', wordBreak: 'break-all', lineHeight: '1.6'}}>
              {currentCursor ? currentCursor : "null (Page 1)"}
            </div>
            <div style={{fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '6px'}}>
              Page depth: {cursorHistory.length + 1}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="toolbar">
            <div className="search-wrap">
              <Search size={14} color="var(--color-text-tertiary)" />
              <span style={{fontSize: '13px', color: 'var(--color-text-tertiary)'}}>Search products...</span>
            </div>
            <div className="toolbar-right">
              <select className="sort-select" defaultValue="Newest first">
                <option>Newest first</option>
              </select>
            </div>
          </div>

          <div className="product-grid">
            {isLoading ? (
              // Skeleton Loading State
              Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="product-card" style={{ borderStyle: 'dashed', opacity: 0.5 }}>
                  <div className="sk-tag skeleton"></div>
                  <div className="sk-name skeleton"></div>
                  <div className="sk-name2 skeleton"></div>
                  <div className="sk-id skeleton"></div>
                  <div className="sk-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--color-border-secondary)' }}>
                    <div className="sk-price skeleton"></div>
                    <div className="sk-date skeleton"></div>
                  </div>
                </div>
              ))
            ) : (
              // Actual Products
              products.map(product => {
                const fresh = isNew(product.createdAt);
                return (
                  <div key={product.id} className={`product-card ${fresh ? 'new-flash' : ''}`}>
                    {fresh && <div className="new-badge">NEW</div>}
                    <div className={`card-tag ${getCategoryColor(product.category)}`}>
                      {getCategoryIcon(product.category)} {product.category}
                    </div>
                    <div className="card-name">{product.name}</div>
                    <div className="card-id">{product.id.split('-')[0]}...</div>
                    <div className="card-footer">
                      <div className="card-price">${product.price.toFixed(2)}</div>
                      <div className="card-date">{formatRelativeTime(product.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
            
            {!isLoading && products.length === 0 && (
              <div style={{gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)'}}>
                No products found.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="cursor-badge">
              <div className="cursor-dot" style={{ opacity: isInjecting ? 0 : 1, transition: 'opacity 0.2s' }}></div>
              Cursor anchored · no drift
            </div>
            <div className="page-info">Showing page <strong>{cursorHistory.length + 1}</strong> of ~10,000</div>
            <div className="page-btns">
              <button 
                className="page-btn" 
                onClick={handlePrevPage} 
                disabled={cursorHistory.length === 0 || isLoading}
              >
                <ArrowLeft size={13} /> Prev
              </button>
              <button 
                className="page-btn" 
                style={{ background: nextCursor ? 'var(--color-text-primary)' : '', color: nextCursor ? 'white' : '' }}
                onClick={handleNextPage} 
                disabled={!nextCursor || isLoading}
              >
                Next <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <div className="toast-icon">✓</div>
            <div>
              <div className="toast-title">Injection Successful</div>
              <div className="toast-sub">{toast}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
