'use client';

import React, { useEffect, useState } from 'react';
import { fetchCustomerTickets, CustomerTicket } from '@/app/api/get-queries';

const Stats: React.FC = () => {
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    solveable: 0,
    notSolveable: 0,
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    const loadTicketStats = async () => {
      try {
        const tickets = await fetchCustomerTickets();
        
        const total = tickets.length;
        const solveable = tickets.filter(ticket => ticket.Solveable === "Yes").length;
        const notSolveable = tickets.filter(ticket => ticket.Solveable === "No").length;
        
        setTicketStats({
          total,
          solveable,
          notSolveable,
          loading: false,
          error: null,
        });
      } catch (error) {
        setTicketStats(prev => ({
          ...prev,
          loading: false,
          error: "Failed to load ticket data",
        }));
      }
    };

    loadTicketStats();
  }, []);

  if (ticketStats.loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-pulse text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (ticketStats.error) {
    return (
      <div className="border border-gray-200 rounded p-4 bg-gray-50 text-gray-600">
        <p>{ticketStats.error}</p>
      </div>
    );
  }

  const solveablePercentage = ticketStats.total > 0 
    ? Math.round((ticketStats.solveable / ticketStats.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-4xl font-bold">{ticketStats.total}</p>
        <p className="text-gray-600 mt-2">Total Queries</p>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-4xl font-bold">{ticketStats.solveable}</p>
        <p className="text-gray-600 mt-2">AI Solveable</p>
        <p className="text-sm text-gray-500 mt-1">{solveablePercentage}% of total</p>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-4xl font-bold">{ticketStats.notSolveable}</p>
        <p className="text-gray-600 mt-2">Not AI Solveable</p>
        <p className="text-sm text-gray-500 mt-1">{100 - solveablePercentage}% of total</p>
      </div>
    </div>
  );
};

export default Stats;