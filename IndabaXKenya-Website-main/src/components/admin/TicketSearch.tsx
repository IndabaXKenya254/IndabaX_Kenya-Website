// ═══════════════════════════════════════════════════════════════════════
// ADMIN - TICKET SEARCH COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Search tickets by attendee name for check-in
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';

interface Ticket {
  id: string;
  ticket_number: string;
  attendee_name: string;
  attendee_email: string;
  status: string;
  event_id: string;
}

interface TicketSearchProps {
  eventId: string | null;
  onSelectTicket: (ticketNumber: string) => void;
}

export default function TicketSearch({ eventId, onSelectTicket }: TicketSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '10',
      });

      if (eventId) {
        params.append('event_id', eventId);
      }

      const response = await fetch(`/api/tickets/search?${params}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      if (data.success) {
        setResults(data.data || []);
        if (data.data.length === 0) {
          setError(`No tickets found for "${searchQuery}"`);
        }
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectTicket = (ticketNumber: string) => {
    setSearchQuery('');
    setResults([]);
    setError(null);
    onSelectTicket(ticketNumber);
  };

  return (
    <div className="ticket-search-component">
      <h5 className="mb-3">
        <i className="icofont-search-user me-2"></i>
        Search by Attendee Name
      </h5>

      <div className="input-group mb-3">
        <span className="input-group-text">
          <i className="icofont-search"></i>
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Enter attendee name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading || searchQuery.length < 2}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Searching...
            </>
          ) : (
            <>
              <i className="icofont-search me-2"></i>
              Search
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-warning">
          <i className="icofont-warning me-2"></i>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <p className="text-muted mb-2">
            <strong>Found {results.length} result(s):</strong>
          </p>
          <div className="list-group">
            {results.map((ticket) => (
              <button
                key={ticket.id}
                className="list-group-item list-group-item-action"
                onClick={() => handleSelectTicket(ticket.ticket_number)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h6 className="mb-1">
                      <i className="icofont-user me-2"></i>
                      {ticket.attendee_name}
                    </h6>
                    <p className="mb-0 text-muted small">
                      <i className="icofont-email me-1"></i>
                      {ticket.attendee_email}
                    </p>
                  </div>
                  <div className="text-end ms-3">
                    <span className="badge bg-info mb-1 d-block">
                      {ticket.ticket_number}
                    </span>
                    <span
                      className={`badge ${
                        ticket.status === 'checked_in'
                          ? 'bg-success'
                          : ticket.status === 'cancelled'
                          ? 'bg-danger'
                          : 'bg-secondary'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .ticket-search-component {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 0.375rem;
        }

        .search-results {
          max-height: 400px;
          overflow-y: auto;
        }

        .list-group-item {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .list-group-item:hover {
          background-color: #f0f0f0;
          transform: translateX(5px);
        }
      `}</style>
    </div>
  );
}
