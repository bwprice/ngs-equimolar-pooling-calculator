import React from 'react';
import EquimolarPoolingCalculator from './components/EquimolarPoolingCalculator';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-800 text-white py-4 mb-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-center">NGS Equimolar Pooling Calculator</h1>
        </div>
      </header>
      <main className="container mx-auto px-4">
        <EquimolarPoolingCalculator />
      </main>
      <footer className="mt-12 py-4 bg-gray-100">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} NGS Equimolar Pooling Calculator</p>
          <p className="mt-1">
            <a 
              href="https://github.com/bwprice/ngs-equimolar-pooling-calculator" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
