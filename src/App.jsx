import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import PunchCard from './components/PunchCard';
import QRCodeDisplay from './components/QRCodeDisplay';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, getDocs, query, where } from "firebase/firestore";

const ClaimPunchPage = lazy(() => import('./components/ClaimPunchPage'));
const CustomerRecords = lazy(() => import('./components/CustomerRecords'));
const CustomerPage = lazy(() => import('./components/CustomerPage'));

const CORRECT_PIN = "1234";

const AdminPanel = ({
  handleLockAdmin,
  customerPhoneNumber,
  handlePhoneNumberChange,
  customerNameInput,
  handleCustomerNameChange,
  loadCustomerData,
  isLoadingCustomer,
  activeCustomerData,
  currentPunches,
  totalPunches,
  isRewardAvailable,
  addPunch,
  isSavingPunch,
  handleGeneratePunchQrCode,
  redeemReward,
  isRedeemingReward,
  feedbackMessage,
  customers,
  onSelectCustomerByLast4
}) => {
  const customerPageUrl =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? window.location.origin + (import.meta.env.BASE_URL || '/') + 'customer'
      : 'https://ufoger-usa.github.io/loyalty_app/customer';

  const [last4, setLast4] = React.useState("");
  const [matchingCustomers, setMatchingCustomers] = React.useState([]);

  React.useEffect(() => {
    if (/^\d{4}$/.test(last4) && customers && customers.length > 0) {
      setMatchingCustomers(customers.filter(c => c.id && c.id.slice(-4) === last4));
    } else {
      setMatchingCustomers([]);
    }
  }, [last4, customers]);

  return (
    <div className="admin-main-container" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      boxSizing: 'border-box',
      overflowY: 'auto',
      padding: '0.1rem',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D1D1D6',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1C1C1E' }}>Admin Controls</h2>
          <button 
            onClick={handleLockAdmin} 
            style={{
              backgroundColor: '#D1D1D6',
              color: '#1C1C1E',
              padding: '0.375rem 0.75rem', 
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              border: 'none'
            }}
          >Lock</button>
        </div>
        <input 
          type="tel"
          value={customerPhoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder="Customer Phone (ID)" 
          disabled={isLoadingCustomer}
          style={{
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            backgroundColor: '#FFFFFF',
            color: '#1C1C1E',
            border: '1px solid #D1D1D6',
            '::placeholder': { color: '#8E8E93' },
            boxSizing: 'border-box'
          }}
        />
        <input 
          type="text" 
          value={customerNameInput}
          onChange={handleCustomerNameChange}
          placeholder="Customer Name" 
          disabled={isLoadingCustomer}
          style={{
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            backgroundColor: '#FFFFFF',
            color: '#1C1C1E',
            border: '1px solid #D1D1D6',
            '::placeholder': { color: '#8E8E93' },
            boxSizing: 'border-box'
          }}
        />
        <button 
          onClick={loadCustomerData} 
          disabled={isLoadingCustomer || (!customerPhoneNumber.trim())}
          style={{
            width: '100%', 
            backgroundColor: '#E5E5EA',
            color: '#1C1C1E',
            fontWeight: '600', 
            paddingBlock: '0.75rem', 
            borderRadius: '0.5rem',
            border: 'none',
            boxSizing: 'border-box'
          }}
        >
          {isLoadingCustomer ? "Loading..." : "Load/Create"}
        </button>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={last4}
            onChange={e => setLast4(e.target.value.replace(/[^\d]/g, '').slice(0,4))}
            placeholder="Find by last 4 digits"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #D1D1D6',
              marginBottom: '0.5rem',
              boxSizing: 'border-box'
            }}
          />
          {matchingCustomers.length > 0 && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Select customer:</div>
              {matchingCustomers.map(c => (
                <button key={c.id} onClick={() => onSelectCustomerByLast4(c)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: 6, border: 'none', background: '#fff', borderRadius: 4, marginBottom: 4, cursor: 'pointer' }}>
                  {c.name || 'N/A'} <span style={{ color: '#007bff' }}>({c.id})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeCustomerData && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D1D1D6',
          borderRadius: '1rem',
          padding: '1.5rem',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          textAlign: 'center', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{ color: '#1C1C1E', fontWeight: 'bold', fontSize: '1.125rem' }}>
            {activeCustomerData.name || 'N/A'} 
            <span style={{ fontSize: '0.875rem', color: '#3C3C3E' }}> ({activeCustomerData.id})</span>
          </h3>
          <PunchCard currentPunches={currentPunches} totalPunches={totalPunches} isRewardAvailable={isRewardAvailable} />
          <p style={{ fontSize: '0.875rem', color: '#3C3C3E' }}>{currentPunches} / {totalPunches}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              onClick={addPunch} 
              disabled={isSavingPunch || currentPunches >= totalPunches || isLoadingCustomer}
              style={{
                backgroundColor: '#E5E5EA',
                color: '#1C1C1E',
                fontWeight: '600',
                paddingBlock: '0.75rem', 
                borderRadius: '0.5rem',
                border: 'none'
              }}
            >
              {isSavingPunch ? "..." : "Add Punch"}
            </button>
            <button 
              onClick={handleGeneratePunchQrCode} 
              disabled={!activeCustomerData || currentPunches >= totalPunches || isLoadingCustomer}
              style={{
                backgroundColor: '#E5E5EA',
                color: '#1C1C1E',
                fontWeight: '600',
                paddingBlock: '0.75rem', 
                borderRadius: '0.5rem',
                border: 'none'
              }}
            >
              Generate Punch QR
            </button>
            <button 
              onClick={redeemReward} 
              disabled={isRedeemingReward || !isRewardAvailable || isLoadingCustomer}
              style={{
                backgroundColor: '#E5E5EA',
                color: '#1C1C1E',
                fontWeight: '600',
                paddingBlock: '0.75rem', 
                borderRadius: '0.5rem',
                border: 'none'
              }}
            >
              {isRedeemingReward ? "..." : "Redeem"}
            </button>
          </div>
        </div>
      )}

      {feedbackMessage.text && (
        <div style={{
          position: 'fixed', 
          bottom: '1.5rem', 
          left: '50%', 
          transform: 'translateX(-50%)',
          padding: '0.75rem 1.25rem',
          borderRadius: '0.5rem',
          backgroundColor: feedbackMessage.type === 'error' ? '#FFEBEB' : feedbackMessage.type === 'success' ? '#E6F7E9' : '#E0F2FE',
          color: feedbackMessage.type === 'error' ? '#BF2C2C' : feedbackMessage.type === 'success' ? '#1D7A2E' : '#0C5A8A',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontSize: '0.875rem',
          border: '1px solid ',
          borderColor: feedbackMessage.type === 'error' ? '#FAD1D1' : feedbackMessage.type === 'success' ? '#C6E6CC' : '#B8DFF8'
        }}>
          {feedbackMessage.text}
        </div>
      )}
    </div>
  );
};

const MainAppContent = ({
  isAdminUnlocked,
  pinInput,
  handlePinInputChange,
  handlePinSubmit,
  handleLockAdmin,
  customerPhoneNumber,
  handlePhoneNumberChange,
  customerNameInput,
  handleCustomerNameChange,
  loadCustomerData,
  isLoadingCustomer,
  activeCustomerData,
  currentPunches,
  totalPunches,
  isRewardAvailable,
  addPunch,
  isSavingPunch,
  handleGeneratePunchQrCode,
  redeemReward,
  isRedeemingReward,
  feedbackMessage,
  isPunchQrModalOpen,
  actionableQrUrl,
  setIsPunchQrModalOpen,
  matchingCustomers,
  showMatchModal,
  setShowMatchModal,
  customers,
  onSelectCustomerByLast4
}) => {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isAdminUnlocked) {
    return (
      <>
        <div style={{
          display: 'flex',
          flexDirection: isMobileView ? 'column' : 'row',
          gap: '1.5rem',
          width: '100%',
          maxWidth: isMobileView ? '100%' : '72rem',
          margin: '0 auto',
          boxSizing: 'border-box',
          flexGrow: 1,
          padding: '0 0.75rem 1rem 0.75rem',
          overflowY: isMobileView ? 'auto' : 'hidden',
          overflowX: 'hidden'
        }}>
          <div style={{
            flex: isMobileView ? '1 1 auto' : '1 1 0%',
            width: isMobileView ? '100%' : 'auto',
            minWidth: isMobileView ? 'unset' : '18rem',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: isMobileView ? '1.5rem' : '0'
          }}>
            <AdminPanel
              handleLockAdmin={handleLockAdmin}
              customerPhoneNumber={customerPhoneNumber}
              handlePhoneNumberChange={handlePhoneNumberChange}
              customerNameInput={customerNameInput}
              handleCustomerNameChange={handleCustomerNameChange}
              loadCustomerData={loadCustomerData}
              isLoadingCustomer={isLoadingCustomer}
              activeCustomerData={activeCustomerData}
              currentPunches={currentPunches}
              totalPunches={totalPunches}
              isRewardAvailable={isRewardAvailable}
              addPunch={addPunch}
              isSavingPunch={isSavingPunch}
              handleGeneratePunchQrCode={handleGeneratePunchQrCode}
              redeemReward={redeemReward}
              isRedeemingReward={isRedeemingReward}
              feedbackMessage={feedbackMessage}
              customers={customers}
              onSelectCustomerByLast4={onSelectCustomerByLast4}
            />
          </div>
          <div style={{
            flex: isMobileView ? '1 1 auto' : '2 1 0%',
            width: isMobileView ? '100%' : 'auto',
            minWidth: isMobileView ? 'unset' : '24rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Suspense fallback={<div style={{textAlign: 'center', fontSize: '1.1rem', paddingTop: '2rem'}}>Loading records...</div>}>
              <CustomerRecords />
            </Suspense>
          </div>
        </div>

        {showMatchModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setShowMatchModal(false)}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 2px 8px #0002' }} onClick={e => e.stopPropagation()}>
              <h3 style={{marginTop:0}}>Select Customer</h3>
              <ul style={{listStyle:'none',padding:0,margin:0}}>
                {matchingCustomers.map(c => (
                  <li key={c.id} style={{marginBottom:12}}>
                    <button style={{width:'100%',padding:10,borderRadius:6,border:'1px solid #ccc',background:'#f5f5f5',cursor:'pointer'}} onClick={() => {
                      setCustomerPhoneNumber(c.id);
                      setCustomerNameInput(c.name || "");
                      setShowMatchModal(false);
                      setTimeout(() => loadCustomerData(), 100); // re-trigger load
                    }}>{c.name || 'N/A'} - {c.id}</button>
                  </li>
                ))}
              </ul>
              <button style={{marginTop:16,background:'#eee',padding:8,borderRadius:6,border:'none',width:'100%',cursor:'pointer'}} onClick={() => setShowMatchModal(false)}>Cancel</button>
            </div>
          </div>
        )}

        {isPunchQrModalOpen && actionableQrUrl && (
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.6)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 1000 
            }}
            onClick={() => setIsPunchQrModalOpen(false)}
          >
            <div 
              style={{ 
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                textAlign: 'center',
                color: '#333333'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 style={{ marginBottom: '15px', fontSize: '1.2rem', color: '#333333' }}>Scan to Punch Your Card</h4>
              <QRCodeDisplay value={actionableQrUrl} size={200} /> 
              <p style={{ fontSize: '1rem', marginTop: '15px', color: '#555555' }}>
                Your loyalty punch will be added automatically.
              </p>
              <button 
                onClick={() => setIsPunchQrModalOpen(false)} 
                style={{
                  marginTop: '20px',
                  backgroundColor: '#007bff',
                  color: '#ffffff', 
                  padding: '10px 15px', 
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >Close</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem 0.75rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '24rem',
        width: '100%',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D1D1D6',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
      }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1C1C1E' }}>Admin Access</h2>
        <input
          type="password"
          value={pinInput}
          onChange={handlePinInputChange}
          placeholder="Enter PIN"
          style={{
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            backgroundColor: '#FFFFFF',
            color: '#1C1C1E',
            border: '1px solid #D1D1D6',
            '::placeholder': { color: '#8E8E93' },
            boxSizing: 'border-box'
          }}
        />
        <button 
          onClick={handlePinSubmit} 
          style={{
            width: '100%', 
            backgroundColor: '#E5E5EA',
            color: '#1C1C1E',
            fontWeight: '600', 
            paddingBlock: '0.75rem', 
            borderRadius: '0.5rem',
            border: 'none',
            boxSizing: 'border-box'
          }}
        >Unlock</button>
      </div>

      {feedbackMessage.text && (
        <div style={{
          position: 'fixed', 
          bottom: '1.5rem', 
          left: '50%', 
          transform: 'translateX(-50%)',
          padding: '0.75rem 1.25rem',
          borderRadius: '0.5rem',
          backgroundColor: feedbackMessage.type === 'error' ? '#FFEBEB' : feedbackMessage.type === 'success' ? '#E6F7E9' : '#E0F2FE',
          color: feedbackMessage.type === 'error' ? '#BF2C2C' : feedbackMessage.type === 'success' ? '#1D7A2E' : '#0C5A8A',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontSize: '0.875rem',
          border: '1px solid ',
          borderColor: feedbackMessage.type === 'error' ? '#FAD1D1' : feedbackMessage.type === 'success' ? '#C6E6CC' : '#B8DFF8'
        }}>
          {feedbackMessage.text}
        </div>
      )}
    </div>
  );
};

function App() {
  const [currentPunches, setCurrentPunches] = useState(0);
  const totalPunches = 10;

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [activeCustomerData, setActiveCustomerData] = useState(null);
  const [isRewardAvailable, setIsRewardAvailable] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isSavingPunch, setIsSavingPunch] = useState(false);
  const [isRedeemingReward, setIsRedeemingReward] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ text: "", type: "" });

  const [actionableQrUrl, setActionableQrUrl] = useState("");
  const [isPunchQrModalOpen, setIsPunchQrModalOpen] = useState(false);

  const [matchingCustomers, setMatchingCustomers] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  const unsubscribeCustomerListenerRef = useRef(null);

  useEffect(() => {
    if (activeCustomerData) {
      setCurrentPunches(activeCustomerData.punches);
      setIsRewardAvailable(activeCustomerData.punches >= totalPunches);
      if (!customerNameInput && activeCustomerData.name) {
        setCustomerNameInput(activeCustomerData.name);
      }
    } else {
      setCurrentPunches(0);
      setIsRewardAvailable(false);
    }
  }, [activeCustomerData, totalPunches, customerNameInput]);

  useEffect(() => {
    return () => {
      if (unsubscribeCustomerListenerRef.current) {
        unsubscribeCustomerListenerRef.current();
      }
    };
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      const q = query(collection(db, "customers"));
      const snapshot = await getDocs(q);
      const allCustomers = [];
      snapshot.forEach(docSnap => {
        allCustomers.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCustomers(allCustomers);
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Listen to all customers for last-4 search
    const q = query(collection(db, 'customers'));
    const unsub = onSnapshot(q, (snap) => {
      setAllCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const showFeedback = (text, type = "info") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage({ text: "", type: "" });
    }, 2500);
  };

  const handleGeneratePunchQrCode = () => {
    if (!activeCustomerData || !activeCustomerData.id) {
      showFeedback("Please load a customer first.", "error");
      return;
    }
    if (activeCustomerData.punches >= totalPunches) {
      showFeedback("Reward is already available. Cannot add more punches.", "error");
      return;
    }

    const uniqueClaimToken = `PUNCH_TOKEN_${activeCustomerData.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    let claimUrl;
    const isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalPreview) {
      const baseUrl = window.location.origin + (import.meta.env.BASE_URL || '/'); 
      claimUrl = `${baseUrl}claim?token=${uniqueClaimToken}`;
      console.log("Generated local preview QR URL:", claimUrl); 
    } else {
      claimUrl = `https://ufoger-usa.github.io/loyalty_app/claim?token=${uniqueClaimToken}`;
      console.log("Generated production QR URL:", claimUrl);
    }

    setActionableQrUrl(claimUrl);
    setIsPunchQrModalOpen(true);
    showFeedback("QR code for customer to scan and get a punch is ready.", "info");
  };

  const addPunch = async () => {
    if (!isAdminUnlocked) {
      showFeedback("Please unlock admin access.", "error");
      return;
    }
    if (!activeCustomerData) {
      showFeedback("Please load a customer first.", "error");
      return;
    }
    if (activeCustomerData.punches >= totalPunches) {
      showFeedback("Reward is available! Please redeem before adding more punches.", "error");
      return;
    }

    setIsSavingPunch(true);
    setFeedbackMessage({ text: "", type: "" });
    const newPunches = activeCustomerData.punches < totalPunches ? activeCustomerData.punches + 1 : activeCustomerData.punches;

    const customerNameToSave = activeCustomerData.name || customerNameInput.trim();

    try {
      const customerRef = doc(db, "customers", activeCustomerData.id);
      await setDoc(customerRef, {
        punches: newPunches,
        name: customerNameToSave,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showFeedback(`Punch added for ${customerNameToSave || activeCustomerData.id}!`, "success");
    } catch (error) {
      console.error("Error saving punch to Firestore:", error);
      showFeedback("Error saving punch. Please try again.", "error");
    } finally {
      setIsSavingPunch(false);
    }
  };

  const redeemReward = async () => {
    if (!isAdminUnlocked) {
      showFeedback("Please unlock admin access.", "error");
      return;
    }
    if (!activeCustomerData || activeCustomerData.punches < totalPunches) {
      showFeedback("Customer is not eligible for a reward yet or no customer loaded.", "error");
      return;
    }

    setIsRedeemingReward(true);
    setFeedbackMessage({ text: "", type: "" });
    const customerNameFromData = activeCustomerData.name || "Customer";
    const currentTotalRedemptions = activeCustomerData.totalRedemptions || 0;

    try {
      const customerRef = doc(db, "customers", activeCustomerData.id);
      await setDoc(customerRef,
        {
          punches: 0,
          lastRewardRedeemedAt: serverTimestamp(),
          totalRedemptions: currentTotalRedemptions + 1,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      showFeedback(`Reward redeemed for ${customerNameFromData}! Punches reset.`, "success");
    } catch (error) {
      console.error("Error redeeming reward in Firestore:", error);
      showFeedback("Error redeeming reward. Please try again.", "error");
    } finally {
      setIsRedeemingReward(false);
    }
  };

  const handlePinInputChange = useCallback((event) => {
    setPinInput(event.target.value);
  }, []);

  const handlePinSubmit = () => {
    if (pinInput === CORRECT_PIN) {
      setIsAdminUnlocked(true);
      setPinInput("");
      setFeedbackMessage({ text: "", type: "" });
    } else {
      showFeedback("Incorrect PIN", "error");
      setPinInput("");
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setFeedbackMessage({ text: "", type: "" });
    setActiveCustomerData(null);
    setCustomerPhoneNumber("");
    setCustomerNameInput("");
    if (unsubscribeCustomerListenerRef.current) {
      unsubscribeCustomerListenerRef.current();
      unsubscribeCustomerListenerRef.current = null;
    }
  };

  const handlePhoneNumberChange = useCallback((event) => {
    setCustomerPhoneNumber(event.target.value);
  }, []);

  const handleCustomerNameChange = useCallback((event) => {
    setCustomerNameInput(event.target.value);
  }, []);

  const loadCustomerData = useCallback(async () => {
    const phoneNumber = customerPhoneNumber.trim();
    const nameToSave = customerNameInput.trim();

    if (!phoneNumber) {
      showFeedback("Please enter a customer phone number.", "error");
      return;
    }

    // If input is exactly 4 digits, search for all customers ending with those digits
    if (/^\d{4}$/.test(phoneNumber)) {
      setIsLoadingCustomer(true);
      setFeedbackMessage({ text: "", type: "" });
      const q = query(collection(db, "customers"));
      const snapshot = await getDocs(q);
      const matches = [];
      snapshot.forEach(docSnap => {
        if (docSnap.id.slice(-4) === phoneNumber) {
          matches.push({ id: docSnap.id, ...docSnap.data() });
        }
      });
      setIsLoadingCustomer(false);
      if (matches.length === 0) {
        showFeedback("No customers found with those last 4 digits.", "error");
        return;
      } else if (matches.length === 1) {
        setCustomerPhoneNumber(matches[0].id);
        setCustomerNameInput(matches[0].name || "");
        // Continue as if full phone entered
        if (unsubscribeCustomerListenerRef.current) {
          unsubscribeCustomerListenerRef.current();
          unsubscribeCustomerListenerRef.current = null;
        }
        setIsLoadingCustomer(true);
        setFeedbackMessage({ text: "", type: "" });
        const customerId = matches[0].id;
        const customerRef = doc(db, "customers", customerId);
        try {
          unsubscribeCustomerListenerRef.current = onSnapshot(customerRef, async (docSnap) => {
            setIsLoadingCustomer(false);
            if (docSnap.exists()) {
              const data = docSnap.data();
              const customerData = {
                id: docSnap.id,
                punches: data.punches || 0,
                name: data.name || "",
                lastRewardRedeemedAt: data.lastRewardRedeemedAt,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                totalRedemptions: data.totalRedemptions || 0
              };
              setActiveCustomerData(customerData);

              if (nameToSave && nameToSave !== data.name) {
                await setDoc(customerRef, { name: nameToSave, updatedAt: serverTimestamp() }, { merge: true });
                showFeedback("Customer name updated.", "success");
              } else if (!data.name && nameToSave) {
                await setDoc(customerRef, { name: nameToSave, updatedAt: serverTimestamp() }, { merge: true });
                showFeedback("Customer name added.", "success");
              } else {
                showFeedback(`Customer ${data.name || customerId} loaded.`, "info");
              }

            } else {
              const newCustomerData = {
                id: customerId,
                punches: 0,
                name: nameToSave,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastRewardRedeemedAt: null,
                totalRedemptions: 0
              };
              await setDoc(customerRef, newCustomerData);
              showFeedback(`New customer ${nameToSave || customerId} created.`, "success");
            }
          }, (error) => {
            console.error("Error in Firestore listener:", error);
            showFeedback("Error listening to customer data. Try reloading.", "error");
            setIsLoadingCustomer(false);
            if (unsubscribeCustomerListenerRef.current) {
              unsubscribeCustomerListenerRef.current();
              unsubscribeCustomerListenerRef.current = null;
            }
          });

        } catch (error) {
          console.error("Error loading or creating customer data:", error);
          showFeedback("Error accessing customer data. Please try again.", "error");
          setIsLoadingCustomer(false);
          if (unsubscribeCustomerListenerRef.current) {
            unsubscribeCustomerListenerRef.current();
            unsubscribeCustomerListenerRef.current = null;
          }
        }
        return;
      } else {
        setMatchingCustomers(matches);
        setShowMatchModal(true);
        return;
      }
    }

    if (unsubscribeCustomerListenerRef.current) {
      unsubscribeCustomerListenerRef.current();
      unsubscribeCustomerListenerRef.current = null;
    }

    setIsLoadingCustomer(true);
    setFeedbackMessage({ text: "", type: "" });

    const customerId = phoneNumber;
    const customerRef = doc(db, "customers", customerId);

    try {
      unsubscribeCustomerListenerRef.current = onSnapshot(customerRef, async (docSnap) => {
        setIsLoadingCustomer(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const customerData = {
            id: docSnap.id,
            punches: data.punches || 0,
            name: data.name || "",
            lastRewardRedeemedAt: data.lastRewardRedeemedAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            totalRedemptions: data.totalRedemptions || 0
          };
          setActiveCustomerData(customerData);

          if (nameToSave && nameToSave !== data.name) {
            await setDoc(customerRef, { name: nameToSave, updatedAt: serverTimestamp() }, { merge: true });
            showFeedback("Customer name updated.", "success");
          } else if (!data.name && nameToSave) {
            await setDoc(customerRef, { name: nameToSave, updatedAt: serverTimestamp() }, { merge: true });
            showFeedback("Customer name added.", "success");
          } else {
            showFeedback(`Customer ${data.name || customerId} loaded.`, "info");
          }

        } else {
          const newCustomerData = {
            id: customerId,
            punches: 0,
            name: nameToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastRewardRedeemedAt: null,
            totalRedemptions: 0
          };
          await setDoc(customerRef, newCustomerData);
          showFeedback(`New customer ${nameToSave || customerId} created.`, "success");
        }
      }, (error) => {
        console.error("Error in Firestore listener:", error);
        showFeedback("Error listening to customer data. Try reloading.", "error");
        setIsLoadingCustomer(false);
        if (unsubscribeCustomerListenerRef.current) {
          unsubscribeCustomerListenerRef.current();
          unsubscribeCustomerListenerRef.current = null;
        }
      });

    } catch (error) {
      console.error("Error loading or creating customer data:", error);
      showFeedback("Error accessing customer data. Please try again.", "error");
      setIsLoadingCustomer(false);
      if (unsubscribeCustomerListenerRef.current) {
        unsubscribeCustomerListenerRef.current();
        unsubscribeCustomerListenerRef.current = null;
      }
    }
  }, [customerPhoneNumber, customerNameInput, unsubscribeCustomerListenerRef]);

  const onSelectCustomerByLast4 = (customer) => {
    setCustomerPhoneNumber(customer.id);
    setCustomerNameInput(customer.name || "");
    setTimeout(() => loadCustomerData(), 100); // re-trigger load
  };

  const handleSelectCustomerByLast4 = (customer) => {
    setCustomerPhoneNumber(customer.id);
    setCustomerNameInput(customer.name || "");
    // Load customer data into panel
    setActiveCustomerData({
      id: customer.id,
      punches: customer.punches || 0,
      name: customer.name || "",
      lastRewardRedeemedAt: customer.lastRewardRedeemedAt,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      totalRedemptions: customer.totalRedemptions || 0
    });
  };

  const location = useLocation();

  return (
    <>
      {location.pathname === '/' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
          color: '#1C1C1E',
          fontFamily: 'sans-serif',
          boxSizing: 'border-box'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '1rem 0.75rem',
            flexShrink: 0
          }}>
            <h2 style={{
                fontSize: '0.75rem', 
                letterSpacing: '0.1em', 
                color: '#3C3C3E',
                textTransform: 'uppercase',
                fontWeight: '600', 
                marginBottom: '0.25rem' 
              }}>UFOGER Loyalty System</h2>
            <h1 style={{ 
                fontSize: '1.5rem',
                fontWeight: 'bold', 
                color: '#1C1C1E'
              }}>Admin Panel</h1>
          </div>
          <main style={{
            width: '100%',
            boxSizing: 'border-box',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Suspense fallback={
              <div style={{textAlign: 'center', fontSize: '1.25rem', paddingTop: '2rem'}}>Loading page...</div>
            }>
              <Routes>
                <Route path="/" element={
                  <MainAppContent
                    isAdminUnlocked={isAdminUnlocked}
                    pinInput={pinInput}
                    handlePinInputChange={handlePinInputChange}
                    handlePinSubmit={handlePinSubmit}
                    handleLockAdmin={handleLockAdmin}
                    customerPhoneNumber={customerPhoneNumber}
                    handlePhoneNumberChange={handlePhoneNumberChange}
                    customerNameInput={customerNameInput}
                    handleCustomerNameChange={handleCustomerNameChange}
                    loadCustomerData={loadCustomerData}
                    isLoadingCustomer={isLoadingCustomer}
                    activeCustomerData={activeCustomerData}
                    currentPunches={currentPunches}
                    totalPunches={totalPunches}
                    isRewardAvailable={isRewardAvailable}
                    addPunch={addPunch}
                    isSavingPunch={isSavingPunch}
                    handleGeneratePunchQrCode={handleGeneratePunchQrCode}
                    redeemReward={redeemReward}
                    isRedeemingReward={isRedeemingReward}
                    feedbackMessage={feedbackMessage}
                    isPunchQrModalOpen={isPunchQrModalOpen}
                    actionableQrUrl={actionableQrUrl}
                    setIsPunchQrModalOpen={setIsPunchQrModalOpen}
                    matchingCustomers={matchingCustomers}
                    showMatchModal={showMatchModal}
                    setShowMatchModal={setShowMatchModal}
                    customers={allCustomers}
                    onSelectCustomerByLast4={handleSelectCustomerByLast4}
                  />
                } />
              </Routes>
            </Suspense>
          </main>
        </div>
      )}
      {location.pathname === '/claim' && (
        <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
          <Suspense fallback={<div style={{textAlign: 'center', fontSize: '1.25rem', paddingTop: '2rem'}}>Loading page...</div>}>
            <ClaimPunchPage />
          </Suspense>
        </div>
      )}
      {location.pathname === '/customer' && (
        <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
          <Suspense fallback={<div style={{textAlign: 'center', fontSize: '1.25rem', paddingTop: '2rem'}}>Loading page...</div>}>
            <CustomerPage />
          </Suspense>
        </div>
      )}
    </>
  );
}

export default App;
