import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import PunchCard from './PunchCard';

const BUSINESS_INFO = {
  name: 'UFOGER Loyalty Program',
  description: 'Collect punches and earn rewards at our store!'
};

const TOTAL_PUNCHES = 10;

function CustomerPage() {
  const [step, setStep] = useState('form');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer && customer.name) setName(customer.name);
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const phoneTrim = phone.trim();
    if (!phoneTrim) {
      setError('Please enter your phone number.');
      setLoading(false);
      return;
    }
    const customerRef = doc(db, 'customers', phoneTrim);
    try {
      const docSnap = await getDoc(customerRef);
      if (docSnap.exists()) {
        setCustomer({ id: phoneTrim, ...docSnap.data() });
        setStep('info');
      } else {
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        const newCustomer = {
          id: phoneTrim,
          name: name.trim(),
          punches: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          totalRedemptions: 0
        };
        await setDoc(customerRef, newCustomer);
        setCustomer(newCustomer);
        setStep('info');
      }
    } catch {
      setError('Error accessing your record. Please try again.');
    }
    setLoading(false);
  };

  // Responsive container style
  const containerStyle = {
    maxWidth: 400,
    width: '100%',
    margin: '2rem auto',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px #0001',
    padding: '5vw 4vw', // Use relative padding for mobile
    boxSizing: 'border-box',
    minHeight: '100vh', // Ensure full height on mobile
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  if (step === 'form') {
    return (
      <div
        className="customer-main-container"
        style={containerStyle}
      >
        <h2 style={{ textAlign: 'center' }}>{BUSINESS_INFO.name}</h2>
        <p style={{ textAlign: 'center', color: '#555' }}>{BUSINESS_INFO.description}</p>
        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <label>Phone Number:<br />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }} required />
          </label>
          {!customer && (
            <label>Name:<br />
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }} />
            </label>
          )}
          <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6 }} disabled={loading}>{loading ? 'Loading...' : 'Continue'}</button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      </div>
    );
  }

  if (step === 'info' && customer) {
    return (
      <div
        className="customer-main-container"
        style={containerStyle}
      >
        <h2 style={{ textAlign: 'center' }}>{BUSINESS_INFO.name}</h2>
        <p style={{ textAlign: 'center', color: '#555' }}>{BUSINESS_INFO.description}</p>
        <div style={{ margin: '1.5rem 0', textAlign: 'center' }}>
          <PunchCard currentPunches={customer.punches || 0} totalPunches={TOTAL_PUNCHES} />
          <div style={{ marginTop: 8, fontWeight: 500 }}>{customer.punches || 0} / {TOTAL_PUNCHES} punches</div>
          {customer.punches >= TOTAL_PUNCHES && <div style={{ color: '#28a745', marginTop: 8 }}>🎉 Reward available! Please redeem in store.</div>}
        </div>
        <div style={{ marginTop: 24, textAlign: 'center', color: '#888', fontSize: 13 }}>Your phone: {customer.id}</div>
        <div style={{ marginTop: 16, textAlign: 'center', color: '#007bff', fontSize: 13 }}>
          To add a punch, please visit UFOGER and ask a staff member.
        </div>
      </div>
    );
  }

  return null;
}

export default CustomerPage;
