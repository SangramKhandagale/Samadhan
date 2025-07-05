// File: src/models/SupportTicket.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  // Form data
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  
  // Ticket info
  ticketId: string;
  callId?: string;
  
  // Groq analysis
  analysis: {
    category: string;
    priority: string;
    department: string;
    language: string;
    solveable: string;
    solution: string;
  };
  
  // Call summary (optional - populated after call ends)
  callSummary?: {
    conversationSummary: string;
    keyPoints: string[];
    customerSatisfaction: string;
    issueResolved: string;
    followUpRequired: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}

const SupportTicketSchema: Schema = new Schema({
  // Form data
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Ticket info
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  callId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // Groq analysis
  analysis: {
    category: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      required: true,
      enum: ['High', 'Medium', 'Low']
    },
    department: {
      type: String,
      required: true,
      enum: ['Loans', 'Scam', 'Inquiry', 'Services']
    },
    language: {
      type: String,
      required: true
    },
    solveable: {
      type: String,
      required: true,
      enum: ['Yes', 'No']
    },
    solution: {
      type: String,
      required: true
    }
  },
  
  // Call summary (optional)
  callSummary: {
    conversationSummary: {
      type: String
    },
    keyPoints: [{
      type: String
    }],
    customerSatisfaction: {
      type: String,
      enum: ['High', 'Medium', 'Low']
    },
    issueResolved: {
      type: String,
      enum: ['Yes', 'No', 'Partially']
    },
    followUpRequired: {
      type: String,
      enum: ['Yes', 'No']
    }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ 'analysis.priority': 1 });
SupportTicketSchema.index({ 'analysis.department': 1 });

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
