import { useState } from 'react';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [search, setSearch] = useState('');

  return (
    <div>
      <h1>Welcome to our store</h1>
      <input placeholder="Search products..." onChange={(e) => setSearch(e.target.value)} />
      <ProductCard />
    </div>
  );
}
