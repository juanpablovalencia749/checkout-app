import React from 'react';
import { Layout } from './components/layout/Layout';
import { ProductsPage } from './pages/ProductsPage';
import { TransactionSSEManager } from './components/TransactionSSEManager';
// import './App.css';

function App() {
  return (
    <Layout>
      <TransactionSSEManager />
      <ProductsPage />
    </Layout>
  );
}

export default App;
