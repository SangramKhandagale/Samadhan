import React from 'react';
import Stats from './stats';
import Graphs from './graphs';
import QueryList from './query';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-black">
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-600 mt-2">Analytics overview and performance metrics</p>
        </header>
        
        <div className="grid gap-6">
          {/* Stats Section */}
          <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
            <Stats />
          </section>
          
          {/* Graphs Section */}
          <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Performance Trends</h2>
            <Graphs />
          </section>
          
          {/* Query List Section */}
          <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Queries</h2>
            <QueryList />
          </section>
        </div>
      </main>
      
      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Dashboard Analytics</p>
      </footer>
    </div>
  );
}