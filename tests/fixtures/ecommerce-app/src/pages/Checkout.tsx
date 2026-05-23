import { useState } from 'react';

export default function Checkout() {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h2>Checkout</h2>
      <form onSubmit={() => {}}>
        <input placeholder="Email address" />
        <input placeholder="Card number" />
        <button type="submit">Place Order</button>
      </form>
      {loading && <div>Processing...</div>}
    </div>
  );
}
