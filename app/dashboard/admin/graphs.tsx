'use client';

import React, { useEffect, useState } from 'react';
import { fetchCustomerTickets, CustomerTicket } from '@/app/api/get-queries';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Graphs: React.FC = () => {
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTicketData = async () => {
      try {
        const data = await fetchCustomerTickets();
        setTickets(data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load ticket data");
        setLoading(false);
      }
    };

    loadTicketData();
  }, []);

  const getPriorityData = () => {
    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    
    tickets.forEach(ticket => {
      priorityCounts[ticket.Priority]++;
    });
    
    return [
      { name: 'High', value: priorityCounts.High },
      { name: 'Medium', value: priorityCounts.Medium },
      { name: 'Low', value: priorityCounts.Low },
    ];
  };

  const getChannelData = () => {
    const channelCounts: Record<string, number> = {};
    
    tickets.forEach(ticket => {
      channelCounts[ticket.Channel] = (channelCounts[ticket.Channel] || 0) + 1;
    });
    
    return Object.entries(channelCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getDepartmentData = () => {
    const departmentCounts: Record<string, number> = {};
    
    tickets.forEach(ticket => {
      departmentCounts[ticket.Department] = (departmentCounts[ticket.Department] || 0) + 1;
    });
    
    return Object.entries(departmentCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">Loading visualization data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-gray-200 rounded p-4 bg-gray-50 text-gray-600">
        <p>{error}</p>
      </div>
    );
  }

  const COLORS = ['#000000', '#444444', '#888888', '#bbbbbb', '#e0e0e0'];

  return (
    <div className="space-y-10">
      {/* Priority Distribution - Pie Chart */}
      <div>
        <h3 className="text-lg font-medium mb-4">Query Priority Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getPriorityData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {getPriorityData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip formatter={(value) => [`${value} queries`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel Distribution - Bar Chart */}
      <div>
        <h3 className="text-lg font-medium mb-4">Queries by Channel</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChannelData()}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} queries`, 'Count']} />
              <Bar dataKey="value" fill="#000000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Distribution - Bar Chart */}
      <div>
        <h3 className="text-lg font-medium mb-4">Queries by Department</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getDepartmentData()}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} queries`, 'Count']} />
              <Bar dataKey="value" fill="#444444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Graphs;