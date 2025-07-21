'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  HardDrive,
  Loader2,
  MessageCircle,
  Mic,
  Scan,
  Search,
  Shield,
  Sparkles,
  Ticket,
  X
} from 'lucide-react';

interface SupportTicket {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  ticketId: string;
  callId?: string;
  analysis: {
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    department: 'Loans' | 'Scam' | 'Inquiry' | 'Services';
    language: string;
    solveable: 'Yes' | 'No';
    solution: string;
  };
  callSummary?: {
    conversationSummary: string;
    keyPoints: string[];
    customerSatisfaction: 'High' | 'Medium' | 'Low';
    issueResolved: 'Yes' | 'No' | 'Partially';
    followUpRequired: 'Yes' | 'No';
  };
  createdAt: string;
  updatedAt?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    tickets: SupportTicket[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTickets: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
  };
  error?: string;
  message?: string;
}

const AdminPage = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ApiResponse['data']['pagination'] | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    priority: '',
    department: '',
    solveable: ''
  });

  // Generate particles for background animation
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3
  }));

  const fetchTickets = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/admin/supportticket?page=${page}&limit=20`;
      if (searchQuery) url += `&search=${searchQuery}`;
      if (filters.priority) url += `&priority=${filters.priority}`;
      if (filters.department) url += `&department=${filters.department}`;
      if (filters.solveable) url += `&solveable=${filters.solveable}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response');
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setTickets(data.data.tickets);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || data.message || 'Failed to fetch tickets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(currentPage);
  }, [currentPage, searchQuery, filters]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/10 text-black';
      case 'Medium': return 'bg-yellow-500/10 text-black';
      case 'Low': return 'bg-green-500/10 text-black';
      default: return 'bg-gray-500/10 text-black';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'Loans': return 'bg-blue-500/10 text-black';
      case 'Scam': return 'bg-purple-500/10 text-black';
      case 'Inquiry': return 'bg-cyan-500/10 text-black';
      case 'Services': return 'bg-emerald-500/10 text-black';
      default: return 'bg-gray-500/10 text-black';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Yes': return 'bg-green-500/10 text-black';
      case 'No': return 'bg-red-500/10 text-black';
      case 'Partially': return 'bg-yellow-500/10 text-black';
      default: return 'bg-gray-500/10 text-black';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const resetFilters = () => {
    setFilters({
      priority: '',
      department: '',
      solveable: ''
    });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-16 h-16 mb-6"
          >
            <Loader2 className="w-full h-full text-[#32CD32]" />
          </motion.div>
          <motion.p
            className="text-xl font-medium text-black"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading support tickets...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] flex items-center justify-center">
        <motion.div
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AlertCircle className="w-10 h-10 text-red-500" />
          </motion.div>
          <h3 className="text-2xl font-bold text-black mb-4">Error Loading Data</h3>
          <p className="text-black mb-6">{error}</p>
          <motion.button
            onClick={() => fetchTickets(currentPage)}
            className="bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-black px-6 py-3 rounded-xl font-semibold shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Header Component with animated particles
  const Header = () => (
    <motion.div 
      className="relative h-[400px] w-full bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute bg-white/20 rounded-full backdrop-blur-sm"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [-10, 10, -10],
              x: [-5, 5, -5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6 + particle.id * 0.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col px-8 py-8">
        <motion.nav 
          className="flex items-center justify-between w-full"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="flex items-center gap-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-2xl"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <motion.div 
                  className="text-lg font-bold text-white"
                  animate={{ textShadow: ["0 0 0px #7FFF00", "0 0 10px #7FFF00", "0 0 0px #7FFF00"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  S
                </motion.div>
                <motion.div 
                  className="absolute -right-1 top-1 w-2 h-2 bg-[#7FFF00] rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
              </div>
            </motion.div>
            <div>
              <motion.div 
                className="text-2xl font-bold text-black"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                SAMADHAN ADMIN
              </motion.div>
              <motion.div 
                className="text-black font-medium text-sm"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Support Ticket Dashboard
              </motion.div>
            </div>
          </motion.div>
          
          <motion.button
            className="bg-black text-white px-6 py-2.5 rounded-2xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 25px -5px rgba(26, 35, 50, 0.3)",
              y: -2
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Activity className="w-5 h-5" />
            Analytics
          </motion.button>
        </motion.nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-black"
              animate={{ 
                textShadow: ["0 0 0px rgba(26, 35, 50, 0.3)", "0 5px 10px rgba(26, 35, 50, 0.3)", "0 0 0px rgba(26, 35, 50, 0.3)"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Support Ticket Management
            </motion.h1>
            <motion.p 
              className="text-xl text-black mb-6 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Monitor, analyze and resolve customer support tickets efficiently
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <motion.div
                className="relative"
                whileHover={{ y: -3 }}
              >
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 rounded-2xl border-2 border-black/20 focus:border-[#32CD32] focus:outline-none w-full sm:w-80 bg-white/90 text-black"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black" />
              </motion.div>
              
              <motion.button
                onClick={() => setFilterOpen(!filterOpen)}
                className="bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-black px-6 py-3 rounded-2xl font-semibold shadow-md flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Filter className="w-5 h-5" />
                Filters
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced gradient overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20 z-0"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );

  // Filter Panel
  const FilterPanel = () => (
    <motion.div
      className="bg-white rounded-2xl shadow-xl p-6 mb-8"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="w-full p-3 rounded-xl border-2 border-black/20 focus:border-[#32CD32] focus:outline-none bg-white text-black"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-black mb-2">Department</label>
          <select
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
            className="w-full p-3 rounded-xl border-2 border-black/20 focus:border-[#32CD32] focus:outline-none bg-white text-black"
          >
            <option value="">All Departments</option>
            <option value="Loans">Loans</option>
            <option value="Scam">Scam</option>
            <option value="Inquiry">Inquiry</option>
            <option value="Services">Services</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-black mb-2">Solveable</label>
          <select
            value={filters.solveable}
            onChange={(e) => setFilters({...filters, solveable: e.target.value})}
            className="w-full p-3 rounded-xl border-2 border-black/20 focus:border-[#32CD32] focus:outline-none bg-white text-black"
          >
            <option value="">All Statuses</option>
            <option value="Yes">Solveable</option>
            <option value="No">Not Solveable</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <motion.button
          onClick={resetFilters}
          className="text-black font-medium flex items-center gap-2"
          whileHover={{ x: -5 }}
        >
          <X className="w-4 h-4" />
          Reset Filters
        </motion.button>
      </div>
    </motion.div>
  );

  // Ticket Card Component
  const TicketCard = ({ ticket }: { ticket: SupportTicket }) => (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#7FFF00]/20 hover:border-[#32CD32]/50 transition-all"
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(50, 205, 50, 0.2)"
      }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-5 h-5 text-[#32CD32]" />
              <span className="font-bold text-black">#{ticket.ticketId}</span>
            </div>
            <h3 className="text-lg font-semibold text-black line-clamp-1">{ticket.subject}</h3>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(ticket.analysis.priority)}`}>
              {ticket.analysis.priority}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getDepartmentColor(ticket.analysis.department)}`}>
              {ticket.analysis.department}
            </span>
          </div>
        </div>
        
        <p className="text-black text-sm mb-4 line-clamp-2">{ticket.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-black">
            <Clock className="w-4 h-4" />
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
          <motion.button
            onClick={() => setSelectedTicket(ticket)}
            className="text-black hover:text-[#32CD32] flex items-center gap-1 text-sm font-medium"
            whileHover={{ x: 5 }}
          >
            View Details <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  // Ticket Detail Modal
  const TicketModal = () => (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {selectedTicket && (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Ticket className="w-6 h-6 text-[#32CD32]" />
                  <h2 className="text-2xl font-bold text-black">Ticket #{selectedTicket.ticketId}</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-sm px-3 py-1 rounded-full ${getPriorityColor(selectedTicket.analysis.priority)}`}>
                    {selectedTicket.analysis.priority} Priority
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${getDepartmentColor(selectedTicket.analysis.department)}`}>
                    {selectedTicket.analysis.department}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedTicket.analysis.solveable)}`}>
                    {selectedTicket.analysis.solveable} Solveable
                  </span>
                  {selectedTicket.callSummary && (
                    <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedTicket.callSummary.issueResolved)}`}>
                      {selectedTicket.callSummary.issueResolved} Resolved
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-black hover:text-black"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-black">Name</p>
                    <p className="font-medium text-black">{selectedTicket.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Email</p>
                    <p className="font-medium text-black">{selectedTicket.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Phone</p>
                    <p className="font-medium text-black">{selectedTicket.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Created At</p>
                    <p className="font-medium text-black">{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Ticket Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-black">Subject</p>
                    <p className="font-medium text-black">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Description</p>
                    <p className="font-medium text-black whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">AI Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-black">Category</p>
                    <p className="font-medium text-black">{selectedTicket.analysis.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Language</p>
                    <p className="font-medium text-black">{selectedTicket.analysis.language}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Proposed Solution</p>
                    <p className="font-medium text-black whitespace-pre-wrap">{selectedTicket.analysis.solution}</p>
                  </div>
                </div>
              </div>
              
              {selectedTicket.callSummary && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Call Summary</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-black">Summary</p>
                      <p className="font-medium text-black whitespace-pre-wrap">{selectedTicket.callSummary.conversationSummary}</p>
                    </div>
                    <div>
                      <p className="text-sm text-black">Key Points</p>
                      <ul className="list-disc list-inside font-medium text-black">
                        {selectedTicket.callSummary.keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-black">Satisfaction</p>
                        <p className="font-medium text-black">{selectedTicket.callSummary.customerSatisfaction}</p>
                      </div>
                      <div>
                        <p className="text-sm text-black">Follow Up</p>
                        <p className="font-medium text-black">{selectedTicket.callSummary.followUpRequired}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-4">
              <motion.button
                className="px-6 py-2.5 rounded-xl border border-black/20 text-black font-medium"
                whileHover={{ backgroundColor: "#f0f0f0" }}
              >
                Assign to Team
              </motion.button>
              <motion.button
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-black font-medium shadow-md"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Mark as Resolved
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  // Stats Cards
  const StatsCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
    <motion.div
      className={`bg-white rounded-2xl shadow-md p-6 ${color}`}
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-black">{title}</p>
          <h3 className="text-2xl font-bold text-black mt-1">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0]">
      {/* Header with Search */}
      <Header />
      
      {/* Main Content */}
      <div className="container mx-auto px-8 py-12 -mt-20 relative z-10">
        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <StatsCard 
            title="Total Tickets" 
            value={pagination?.totalTickets.toString() || "0"} 
            icon={<Ticket className="w-6 h-6 text-[#32CD32]" />}
            color="border-t-4 border-[#32CD32]" 
          />
          <StatsCard 
            title="High Priority" 
            value={tickets.filter(t => t.analysis.priority === 'High').length.toString()} 
            icon={<AlertCircle className="w-6 h-6 text-red-500" />}
            color="border-t-4 border-red-500" 
          />
          <StatsCard 
            title="Resolved" 
            value={tickets.filter(t => t.callSummary?.issueResolved === 'Yes').length.toString()} 
            icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
            color="border-t-4 border-green-500" 
          />
          <StatsCard 
            title="Avg. Response" 
            value="2.4h" 
            icon={<Clock className="w-6 h-6 text-blue-500" />}
            color="border-t-4 border-blue-500" 
          />
        </motion.div>
        
        {/* Filter Panel */}
        <AnimatePresence>
          {filterOpen && <FilterPanel />}
        </AnimatePresence>
        
        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <motion.div
            className="bg-white rounded-2xl shadow-md p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <HardDrive className="w-16 h-16 text-black/30 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-black mb-2">No Tickets Found</h3>
            <p className="text-black mb-6">Try adjusting your search or filters</p>
            <motion.button
              onClick={resetFilters}
              className="bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-black px-6 py-3 rounded-xl font-medium shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reset Filters
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {tickets.map((ticket) => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
            </motion.div>
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-sm text-black">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-2 rounded-xl border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-black"
                    whileHover={{ backgroundColor: "#f0f0f0" }}
                  >
                    Previous
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-black font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
      
      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && <TicketModal />}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;