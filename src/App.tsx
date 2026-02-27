import React from 'react';
import { Layout } from './components/layout/Layout';
import { ProductsPage } from './pages/ProductsPage';
import './App.css';

function App() {
  return (
    <Layout>
      <ProductsPage />
    </Layout>
  );
}

export default App;
