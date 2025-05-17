import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore'; // Added doc, deleteDoc
import { db } from '../firebaseConfig';

const CustomerRecords = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'totalRedemptions', direction: 'desc' }); // Changed default sort

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const customersData = [];
      querySnapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() });
      });
      setCustomers(customersData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching customer records: ", err);
      setError('Failed to load customer records.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteCustomer = async (customerId, customerName) => {
    const customerDisplayName = customerName || customerId;
    if (window.confirm(`Are you sure you want to delete customer ${customerDisplayName}? This action cannot be undone.`)) {
      try {
        const customerRef = doc(db, 'customers', customerId);
        await deleteDoc(customerRef);
        alert(`Customer ${customerDisplayName} deleted successfully.`);
        // The list will update automatically due to the onSnapshot listener
      } catch (err) {
        console.error("Error deleting customer: ", err);
        alert(`Failed to delete customer ${customerDisplayName}. Error: ${err.message}`);
      }
    }
  };

  const processedCustomers = useMemo(() => {
    let processedData = [...customers];

    // Filtering
    if (searchTerm) {
      const trimmed = searchTerm.trim();
      // If search is exactly 4 digits, match last 4 digits of phone number (customer.id)
      if (/^\d{4}$/.test(trimmed)) {
        processedData = processedData.filter(customer =>
          customer.id && customer.id.slice(-4) === trimmed
        );
      } else {
        processedData = processedData.filter(customer =>
          customer.id.toLowerCase().includes(trimmed.toLowerCase()) ||
          (customer.name && customer.name.toLowerCase().includes(trimmed.toLowerCase()))
        );
      }
    }

    // Sorting
    if (sortConfig.key) {
      processedData.sort((a, b) => {
        const getSortValue = (item, key) => {
          if (!item) return null;
          if (key === 'createdAt' || key === 'lastRedeemedAt') {
            return item[key] ? item[key].seconds : null;
          }
          if (key === 'name') {
            return item[key] || ''; // Ensure name is a string for sorting
          }
          return item[key];
        };

        const valA = getSortValue(a, sortConfig.key);
        const valB = getSortValue(b, sortConfig.key);

        let comparison = 0;

        if (valA === null || valA === undefined) {
          comparison = (valB === null || valB === undefined) ? 0 : 1;
        } else if (valB === null || valB === undefined) {
          comparison = -1;
        } else {
          if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.toLowerCase().localeCompare(valB.toLowerCase());
          } else if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          } else {
            comparison = String(valA).localeCompare(String(valB));
          }
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    return processedData;
  }, [customers, searchTerm, sortConfig]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <div 
      style={{
        backgroundColor: 'white',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', // Tailwind shadow-lg
        borderRadius: '0.5rem', // Tailwind rounded-lg
        padding: '1.5rem', // Tailwind p-6
        border: '1px solid #e5e7eb', // Tailwind border border-gray-200
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Fill parent
        minHeight: '0', // Allow shrinking for scroll
        boxSizing: 'border-box'
      }}
    >
      <h2 
        style={{
          fontSize: '1.25rem', // Tailwind text-xl
          fontWeight: '600', // Tailwind font-semibold
          color: '#1f2937', // Tailwind text-gray-800
          marginBottom: '1rem', // Tailwind mb-4
          flexShrink: 0
        }}
      >Customer Records</h2>
      <input
        type="text"
        placeholder="Search by Phone, Name, or Last 4 digits..."
        style={{
          width: '100%',
          padding: '0.5rem', // Tailwind p-2
          marginBottom: '1rem', // Tailwind mb-4
          border: '1px solid #d1d5db', // Tailwind border-gray-300
          borderRadius: '0.375rem', // Tailwind rounded-md
          flexShrink: 0,
          boxSizing: 'border-box'
        }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div 
        style={{
          display: 'flex',
          gap: '0.5rem', // Tailwind space-x-2
          marginBottom: '1rem', // Tailwind mb-4
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <select
          value={sortConfig.key}
          onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
          style={{
            padding: '0.5rem', // Tailwind p-2
            border: '1px solid #d1d5db', // Tailwind border-gray-300
            borderRadius: '0.375rem', // Tailwind rounded-md
            backgroundColor: 'white',
            fontSize: '0.875rem' // Tailwind text-sm
          }}
        >
          <option value="createdAt">Created Date</option>
          <option value="name">Name</option>
          <option value="punches">Punches</option>
          <option value="lastRedeemedAt">Last Redeemed</option>
          <option value="totalRedemptions">Total Redemptions</option>
        </select>
        <button
          onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
          style={{
            padding: '0.375rem 0.75rem', // Tailwind px-3 py-1.5
            border: '1px solid #d1d5db', // Tailwind border-gray-300
            borderRadius: '0.375rem', // Tailwind rounded-md
            transition: 'background-color 0.2s', // Tailwind transition-colors
            fontSize: '0.875rem' // Tailwind text-sm
          }}
        >
          Sort {sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
        </button>
      </div>
      {isLoading ? (
        <div 
          style={{ textAlign: 'center', padding: '1rem', flexShrink: 0 }}
        >Loading customer records...</div>
      ) : error ? (
        <div 
          style={{ textAlign: 'center', padding: '1rem', color: '#ef4444', flexShrink: 0 }} // Tailwind text-red-500
        >{error}</div>
      ) : processedCustomers.length === 0 ? (
        <p 
          style={{ color: '#6b7280', flexShrink: 0 }} // Tailwind text-gray-500
        >No customers found.</p>
      ) : (
        <ul 
          style={{
            listStyle: 'none',
            margin: 0,
            paddingLeft: 0,
            flexGrow: 1,
            overflowY: 'auto',
            minHeight: '0',
            maxHeight: '400px', // Added for mobile scrollability
            paddingBottom: '0.5rem', // Tailwind pb-2
            boxSizing: 'border-box'
          }}
        >
          {processedCustomers.map(customer => (
            <li 
              key={customer.id} 
              style={{
                padding: '0.75rem', // Tailwind p-3
                backgroundColor: '#f9fafb', // Tailwind bg-gray-50
                borderRadius: '0.375rem', // Tailwind rounded-md
                border: '1px solid #e5e7eb', // Tailwind border-gray-200
                marginBottom: '0.75rem', // Simulating space-y-3 for li items
                display: 'flex',
                flexDirection: 'column', // Keep content stacked
                gap: '0.5rem' // Space between content and button
              }}
            >
              <div> {/* Wrapper for existing customer info */}
                <div className="font-medium text-gray-700">
                  {customer.name || 'N/A'} - <span className="text-sm text-sky-600">{customer.id}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Punches: {customer.punches || 0} / {customer.totalPunches || 10}
                </div>
                <div className="text-sm text-gray-600">
                  Total Redemptions: {customer.totalRedemptions || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Created: {formatDate(customer.createdAt)}
                </div>
                {customer.lastRedeemedAt && (
                  <div className="text-xs text-gray-400">
                    Last Redeemed: {formatDate(customer.lastRedeemedAt)}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                style={{
                  backgroundColor: '#fee2e2', // Tailwind bg-red-100
                  color: '#b91c1c', // Tailwind text-red-700
                  padding: '0.25rem 0.5rem', // Tailwind px-2 py-1
                  borderRadius: '0.25rem', // Tailwind rounded
                  border: '1px solid #fecaca', // Tailwind border-red-200
                  fontSize: '0.75rem', // Tailwind text-xs
                  cursor: 'pointer',
                  alignSelf: 'flex-start' // Align button to the start of the flex container
                }}
              >
                Delete Customer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerRecords;
