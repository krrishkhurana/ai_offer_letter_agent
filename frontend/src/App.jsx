import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  Copy,
  Printer,
  Download,
  ArrowLeft,
  Shield,
  BookOpen,
  Filter,
  AlertCircle,
  Building,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Eye,
  Send,
  SlidersHorizontal,
  FileCheck,
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  Save,
  HelpCircle
} from 'lucide-react';

const DEPARTMENT_BADGES = {
  Engineering: 'bg-blue-50 text-blue-700 border-blue-200',
  Sales: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HR: 'bg-violet-50 text-violet-700 border-violet-200',
  Operations: 'bg-amber-50 text-amber-700 border-amber-200',
  Finance: 'bg-slate-100 text-slate-700 border-slate-200',
};

const BAND_GUIDE = {
  L1: { title: 'Associate / Junior', range: '₹4.0L - ₹6.0L' },
  L2: { title: 'Senior Associate', range: '₹8.0L - ₹10.0L' },
  L3: { title: 'Specialist / Lead', range: '₹14.0L - ₹17.0L' },
  L4: { title: 'Staff / Manager', range: '₹23.0L - ₹29.0L' },
  L5: { title: 'Principal / Director', range: '₹32.0L - ₹47.0L' },
};

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

// Base API URL: uses VITE_API_URL if set (e.g. Render backend when hosted on Vercel), otherwise relative path
const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';

export default function App() {
  // Navigation tabs: 'pipeline' | 'candidates' | 'policies' | 'compensation'
  const [activeTab, setActiveTab] = useState('pipeline');

  // Employee Directory state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedBand, setSelectedBand] = useState('All');

  // New Custom Offer Modal state
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    band: 'L3',
    salary: '1450000',
    location: 'Bengaluru',
    joining_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  });

  // Offer Letter Studio state
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [offerData, setOfferData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLetter, setEditedLetter] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Load candidate list on mount
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/list-employees/`);
        if (res.ok) {
          const data = await res.json();
          // Enhance with email and initial status for authentic feel
          const enhanced = (data.employees || []).map(emp => ({
            ...emp,
            email: `${emp.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            status: 'Ready'
          }));
          setEmployees(enhanced);
        }
      } catch (err) {
        console.error('Failed to load candidate list:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchBand = selectedBand === 'All' || emp.band === selectedBand;
      return matchSearch && matchDept && matchBand;
    });
  }, [employees, searchQuery, selectedDept, selectedBand]);

  // Generate or open offer letter
  const openOfferStudio = async (candidate, customParams = null) => {
    setGenerating(true);
    setActiveCandidate(candidate);
    setIsEditing(false);

    try {
      let url = `${API_BASE}/api/generate-offer/?name=${encodeURIComponent(candidate.name)}`;
      if (customParams) {
        if (customParams.department) url += `&department=${encodeURIComponent(customParams.department)}`;
        if (customParams.band) url += `&band=${encodeURIComponent(customParams.band)}`;
        if (customParams.location) url += `&location=${encodeURIComponent(customParams.location)}`;
        if (customParams.salary) url += `&salary=${encodeURIComponent(customParams.salary)}`;
        if (customParams.joining_date) url += `&joining_date=${encodeURIComponent(customParams.joining_date)}`;
      } else if (candidate.salary) {
        url += `&department=${encodeURIComponent(candidate.department)}&band=${encodeURIComponent(candidate.band)}&location=${encodeURIComponent(candidate.location)}&salary=${encodeURIComponent(candidate.salary)}&joining_date=${encodeURIComponent(candidate.joining_date)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setOfferData(data);
      setEditedLetter(data.offer_letter || '');

      // Mark candidate as Generated
      setEmployees(prev => prev.map(e => e.name === candidate.name ? { ...e, status: 'Generated' } : e));
      showToast(`Offer letter ready for ${candidate.name}`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to generate letter: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateCustomOffer = (e) => {
    e.preventDefault();
    if (!newCandidateForm.name.trim()) return;

    const newCandidate = {
      name: newCandidateForm.name.trim(),
      email: newCandidateForm.email.trim() || `${newCandidateForm.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      department: newCandidateForm.department,
      band: newCandidateForm.band,
      location: newCandidateForm.location,
      salary: Number(newCandidateForm.salary),
      joining_date: newCandidateForm.joining_date,
      status: 'Ready'
    };

    // Add to state if not exists
    setEmployees(prev => [newCandidate, ...prev.filter(e => e.name.toLowerCase() !== newCandidate.name.toLowerCase())]);
    setShowNewOfferModal(false);
    openOfferStudio(newCandidate, newCandidate);
  };

  const copyToClipboard = () => {
    const textToCopy = isEditing ? editedLetter : (offerData?.offer_letter || '');
    navigator.clipboard.writeText(textToCopy);
    showToast('Copied offer letter to clipboard');
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadTextFile = () => {
    const text = isEditing ? editedLetter : (offerData?.offer_letter || '');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Offer_Letter_${(activeCandidate?.name || 'Candidate').replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded text document');
  };

  const simulateSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => {
      setEmailModalOpen(false);
      setEmailSent(false);
      setEmployees(prev => prev.map(e => e.name === activeCandidate?.name ? { ...e, status: 'Sent' } : e));
      showToast(`Offer dispatched to ${activeCandidate?.email || 'candidate'}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Corporate Header */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Company Brand & Breadcrumb */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
                ABC
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-slate-900">ABC Global</span>
                <span className="text-slate-400 font-normal text-xs ml-1.5 hidden sm:inline">People Operations</span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab('pipeline'); setOfferData(null); }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'pipeline' && !offerData
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Offer Pipeline
              </button>
              <button
                onClick={() => { setActiveTab('candidates'); setOfferData(null); }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'candidates' && !offerData
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Candidates ({employees.length})
              </button>
              <button
                onClick={() => { setActiveTab('policies'); setOfferData(null); }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'policies'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Policy Vault
              </button>
              <button
                onClick={() => { setActiveTab('compensation'); setOfferData(null); }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'compensation'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Compensation Bands
              </button>
            </nav>
          </div>

          {/* User Profile & Quick Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewOfferModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Offer</span>
            </button>

            <div className="h-4 w-px bg-slate-200"></div>

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-300">
                AN
              </div>
              <div className="hidden lg:block text-left text-xs leading-tight">
                <p className="font-semibold text-slate-800">Aarti Nair</p>
                <p className="text-[11px] text-slate-400 font-normal">HR Partner</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* ======================================================== */}
        {/* VIEW A: OFFER LETTER STUDIO (DOCUMENT VIEWER / EDITOR)   */}
        {/* ======================================================== */}
        {offerData ? (
          <div className="space-y-4">
            {/* Studio Navigation & Action Bar */}
            <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOfferData(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Pipeline</span>
                </button>
                <div className="h-4 w-px bg-slate-200"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-slate-900">{activeCandidate?.name}</h2>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Band {offerData.employee_details?.band} • {offerData.employee_details?.department}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Generated: {offerData.generated_on} • Target Join Date: {offerData.employee_details?.joining_date}
                  </p>
                </div>
              </div>

              {/* Document Actions */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                    isEditing
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Preview Mode' : 'Edit Document'}</span>
                </button>

                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </button>

                <button
                  onClick={downloadTextFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download .txt</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  onClick={() => setEmailModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Email to Candidate</span>
                </button>
              </div>
            </div>

            {/* Document Viewer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Official Paper Document (8 cols) */}
              <div className="lg:col-span-8">
                {isEditing ? (
                  /* Live Document Editor */
                  <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700">Document Editor</span>
                      <span className="text-slate-400">Edit text directly. Changes reflect in print and download.</span>
                    </div>
                    <textarea
                      value={editedLetter}
                      onChange={(e) => setEditedLetter(e.target.value)}
                      rows={24}
                      className="w-full font-mono text-xs leading-relaxed p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                      <span>Words: {editedLetter.split(/\s+/).filter(Boolean).length}</span>
                      <button
                        onClick={() => { setIsEditing(false); showToast('Document draft saved'); }}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-md font-semibold text-xs"
                      >
                        Save & Preview
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formal Document Paper Sheet */
                  <div className="print-document bg-white p-8 sm:p-12 rounded-xl border border-slate-200/90 shadow-sm text-slate-800 space-y-6">
                    {/* Corporate Letterhead */}
                    <div className="border-b-2 border-slate-800 pb-5 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                          ABC
                        </div>
                        <div>
                          <h1 className="text-lg font-bold text-slate-900 leading-none">ABC CORPORATION</h1>
                          <p className="text-xs text-slate-500 mt-1">People Operations • Global Talent Acquisition</p>
                          <p className="text-xs text-slate-500">456 Corporate Drive, Los Angeles, CA 90001</p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-mono text-slate-500">REF: OFF-2025-{offerData.employee_details?.band}-{(activeCandidate?.name || '00').slice(0, 3).toUpperCase()}</p>
                        <p className="text-slate-600 mt-1 font-medium">
                          Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Candidate Recipient Block */}
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Strictly Confidential</p>
                      <p className="font-bold text-slate-900 text-sm">{offerData.employee_details?.name}</p>
                      <p className="text-slate-600">{offerData.employee_details?.location}</p>
                    </div>

                    {/* Subject Line */}
                    <div className="py-2 px-3 bg-slate-50 border-l-4 border-slate-900 rounded-r text-xs">
                      <span className="font-bold text-slate-900">
                        Subject: Formal Offer of Employment — Band {offerData.employee_details?.band} ({offerData.employee_details?.department})
                      </span>
                    </div>

                    {/* Letter Body */}
                    <div className="text-xs text-slate-700 leading-relaxed space-y-3.5">
                      <p>
                        Dear <span className="font-semibold text-slate-900">{offerData.employee_details?.name}</span>,
                      </p>
                      <p>
                        We are pleased to extend this formal offer of employment with ABC Corporation. Following our evaluation of your background and achievements, we believe your skills will make a substantial contribution to our organization.
                      </p>

                      {/* Position Specification Table */}
                      <div className="rounded-lg border border-slate-200 overflow-hidden my-3">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-semibold text-slate-700 text-xs">
                          Position Details
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
                          <div className="p-2.5">
                            <span className="text-slate-400 block text-[11px]">Position Band</span>
                            <span className="font-semibold text-slate-900">{offerData.employee_details?.band}</span>
                          </div>
                          <div className="p-2.5">
                            <span className="text-slate-400 block text-[11px]">Department</span>
                            <span className="font-semibold text-slate-900">{offerData.employee_details?.department}</span>
                          </div>
                          <div className="p-2.5">
                            <span className="text-slate-400 block text-[11px]">Work Location</span>
                            <span className="font-semibold text-slate-900">{offerData.employee_details?.location}</span>
                          </div>
                          <div className="p-2.5">
                            <span className="text-slate-400 block text-[11px]">Date of Joining</span>
                            <span className="font-semibold text-slate-900">{offerData.employee_details?.joining_date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Compensation Table */}
                      <div className="rounded-lg border border-slate-200 overflow-hidden my-3">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Annual Compensation Structure</span>
                          <span className="font-bold text-slate-900">
                            Total CTC: {formatINR(offerData.employee_details?.salary)}
                          </span>
                        </div>
                        <div className="p-3 bg-white space-y-1.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-600">Base Salary (Annual)</span>
                            <span className="font-medium text-slate-900">{formatINR(offerData.employee_details?.base_salary || offerData.employee_details?.salary * 0.7)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-600">Performance Incentive (Target Annual)</span>
                            <span className="font-medium text-slate-900">{formatINR(offerData.employee_details?.bonus || offerData.employee_details?.salary * 0.2)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-600">Retention / Loyalty Bonus</span>
                            <span className="font-medium text-slate-900">{formatINR(offerData.employee_details?.retention || offerData.employee_details?.salary * 0.1)}</span>
                          </div>
                          <div className="flex justify-between pt-1 font-bold text-slate-900">
                            <span>Total Annual Cost to Company (CTC)</span>
                            <span>{formatINR(offerData.employee_details?.salary)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Company Policy Clauses */}
                      <div className="rounded-lg border border-slate-200 overflow-hidden my-3">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-semibold text-slate-700 text-xs">
                          Governing Terms & Policy Provisions
                        </div>
                        <div className="p-3 space-y-2 text-xs text-slate-600">
                          <p>This offer and subsequent employment are governed by official company policies:</p>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            <li><strong>Leave & Time Off:</strong> Annual paid leaves, sick leaves, and public holidays accrue per the guidelines in the HR Leave Policy.</li>
                            <li><strong>Travel & Business Expenses:</strong> Business-related conveyance and per-diem allowances will be reimbursed in accordance with the corporate HR Travel Policy.</li>
                            <li><strong>Probationary Period:</strong> An initial probationary period of 90 days applies from your effective joining date.</li>
                            <li><strong>Background Verification:</strong> Employment is contingent upon satisfactory completion of references and background credentials check.</li>
                          </ul>
                        </div>
                      </div>

                      <p>
                        This offer is valid for 7 business days from the date of issuance. Please sign and return the acceptance copy to confirm your agreement.
                      </p>

                      <p>
                        We welcome you to ABC Corporation and look forward to building a rewarding professional association together.
                      </p>
                    </div>

                    {/* Signature Block */}
                    <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">For ABC Corporation,</p>
                        <div className="h-12 flex items-end">
                          <span className="font-serif italic font-semibold text-slate-700 text-sm">Aarti Nair</span>
                        </div>
                        <div className="border-t border-slate-300 pt-1">
                          <p className="font-bold text-slate-900">Aarti Nair</p>
                          <p className="text-slate-500">Lead HR Business Partner</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">Candidate Acceptance:</p>
                        <div className="h-12 flex items-end">
                          <span className="text-slate-300 italic">Signature</span>
                        </div>
                        <div className="border-t border-slate-300 pt-1">
                          <p className="font-bold text-slate-900">{offerData.employee_details?.name}</p>
                          <p className="text-slate-500">Date: ____________________</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Metadata & Controls (4 cols) */}
              <div className="no-print lg:col-span-4 space-y-4">
                {/* Candidate Overview Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Candidate Summary</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm">
                      {offerData.employee_details?.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{offerData.employee_details?.name}</p>
                      <p className="text-xs text-slate-500">{activeCandidate?.email || 'candidate@example.com'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Department</span>
                      <span className="font-semibold text-slate-800">{offerData.employee_details?.department}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Job Band</span>
                      <span className="font-semibold text-slate-800">Band {offerData.employee_details?.band}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Work Location</span>
                      <span className="font-semibold text-slate-800">{offerData.employee_details?.location}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Target Join Date</span>
                      <span className="font-semibold text-slate-800">{offerData.employee_details?.joining_date}</span>
                    </div>
                  </div>
                </div>

                {/* Audit & Legal Info */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">Audit & Document Log</h3>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Document Status</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Governing Policies</span>
                      <span className="font-medium text-slate-800">Leave & Travel 2025</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Offer Expiration</span>
                      <span className="font-medium text-slate-800">7 Business Days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sign-off Authority</span>
                      <span className="font-medium text-slate-800">HR Business Partner</span>
                    </div>
                  </div>
                </div>

                {/* Quick Policy References */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                  <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">Referenced Policies</h3>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">HR Leave Policy.pdf</p>
                      <p className="text-[11px] text-slate-500">Annual, Casual & Medical leaves</p>
                    </div>
                    <FileCheck className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">HR Travel Policy.pdf</p>
                      <p className="text-[11px] text-slate-500">Business per-diem & conveyance</p>
                    </div>
                    <FileCheck className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'pipeline' || activeTab === 'candidates' ? (
          /* ======================================================== */
          /* VIEW B: CANDIDATE DIRECTORY & OFFER PIPELINE TABLE       */
          /* ======================================================== */
          <div className="space-y-4">
            {/* Header Banner / Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-slate-900">Employment Offer Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate, customize, and issue formal employment contracts grounded in company policies.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewOfferModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Offer</span>
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, department, or location..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-slate-400 pl-1 font-medium">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter:</span>
                </div>

                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                </select>

                <select
                  value={selectedBand}
                  onChange={(e) => setSelectedBand(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All">All Bands</option>
                  <option value="L1">Band L1 (Associate)</option>
                  <option value="L2">Band L2 (Senior Associate)</option>
                  <option value="L3">Band L3 (Lead)</option>
                  <option value="L4">Band L4 (Manager)</option>
                  <option value="L5">Band L5 (Director)</option>
                </select>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Band</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Target Date</th>
                      <th className="py-3 px-4 text-right">Annual CTC</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                          <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                          <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
                          <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                          <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                          <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                          <td className="py-3 px-4 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                          <td className="py-3 px-4 text-right"><div className="h-6 bg-slate-200 rounded w-24 ml-auto"></div></td>
                        </tr>
                      ))
                    ) : filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => {
                        const deptClass = DEPARTMENT_BADGES[emp.department] || 'bg-slate-100 text-slate-700 border-slate-200';
                        return (
                          <tr key={emp.name} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{emp.name}</div>
                              <div className="text-[11px] text-slate-400">{emp.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${deptClass}`}>
                                {emp.department}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {emp.band}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {emp.location}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {emp.joining_date}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                              {formatINR(emp.salary)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                                emp.status === 'Sent'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : emp.status === 'Generated'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => openOfferStudio(emp)}
                                disabled={generating}
                                className="px-3 py-1 bg-white hover:bg-slate-900 hover:text-white text-slate-700 font-semibold border border-slate-300 rounded-md transition-all text-xs shadow-sm"
                              >
                                {emp.status === 'Generated' ? 'View Offer' : 'Generate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No candidates found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Showing {filteredEmployees.length} of {employees.length} candidates</span>
                <span className="text-[11px]">Database Source: Employee_List.csv</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'policies' ? (
          /* ======================================================== */
          /* VIEW C: POLICY VAULT (COMPANY POLICY DOCUMENTS)          */
          /* ======================================================== */
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Corporate Policy Vault</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official HR policy documents indexed and retrieved to ground offer contract provisions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">HR Leave Policy.pdf</h3>
                  <p className="text-xs text-slate-500 mt-0.5">166 KB • Revised Jan 2025</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Defines annual paid time off, casual leave balances, medical leaves, bereavement policy, and public holiday calendar.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    Active & Indexed
                  </span>
                  <span className="text-slate-400">8 Clauses</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">HR Travel Policy.pdf</h3>
                  <p className="text-xs text-slate-500 mt-0.5">192 KB • Corporate Standard</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Details official domestic and international conveyance claims, daily per-diem allowances, lodging categories, and expense filing.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    Active & Indexed
                  </span>
                  <span className="text-slate-400">12 Clauses</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">HR Offer Letter.pdf</h3>
                  <p className="text-xs text-slate-500 mt-0.5">142 KB • Standard Template</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The approved legal boilerplate containing confidentiality covenants, intellectual property assignment, and termination notices.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    Active & Indexed
                  </span>
                  <span className="text-slate-400">6 Clauses</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW D: COMPENSATION BANDS MATRIX                        */
          /* ======================================================== */
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Corporate Compensation Bands Guide</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official compensation tiers across departments for FY 2025–2026.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {Object.entries(BAND_GUIDE).map(([band, info]) => (
                <div key={band} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Band {band}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-800">{info.title}</h3>
                  <p className="text-xs font-semibold text-blue-700">{info.range}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Standard 70% Base, 20% Performance Variable, 10% Annual Retention.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Modal: Create Custom Candidate Offer */}
      {showNewOfferModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Create New Offer</h3>
                <p className="text-xs text-slate-500">Enter candidate and compensation parameters</p>
              </div>
              <button
                onClick={() => setShowNewOfferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomOffer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCandidateForm.name}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })}
                  placeholder="e.g. Krrish Khurana"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newCandidateForm.department}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Band</label>
                  <select
                    value={newCandidateForm.band}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, band: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                  >
                    <option value="L1">L1 (Associate)</option>
                    <option value="L2">L2 (Senior Associate)</option>
                    <option value="L3">L3 (Specialist / Lead)</option>
                    <option value="L4">L4 (Staff / Manager)</option>
                    <option value="L5">L5 (Principal / Director)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Annual CTC (INR) *</label>
                  <input
                    type="number"
                    required
                    value={newCandidateForm.salary}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, salary: e.target.value })}
                    placeholder="e.g. 1500000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatINR(newCandidateForm.salary)}</p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={newCandidateForm.location}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, location: e.target.value })}
                    placeholder="e.g. Bengaluru, Mumbai, Remote"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Date of Joining</label>
                <input
                  type="date"
                  value={newCandidateForm.joining_date}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, joining_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOfferModal(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Generate Offer Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Email Offer Package</h3>
              <button onClick={() => setEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">To:</span>
                <span className="font-medium text-slate-900">{activeCandidate?.email || 'candidate@example.com'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">From:</span>
                <span className="font-medium text-slate-900">aarti.nair@company.com (People Operations)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Attachments:</span>
                <span className="font-medium text-slate-900">Offer_Letter_{activeCandidate?.name}.pdf, HR_Leave_Policy.pdf</span>
              </div>
              <p className="text-slate-500 text-[11px] pt-1">
                The candidate will receive the formal appointment agreement and an invitation to sign electronically within 7 business days.
              </p>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={simulateSendEmail}
                disabled={emailSent}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5"
              >
                {emailSent ? <Check className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{emailSent ? 'Sending...' : 'Dispatch Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} ABC Corporation • People Operations & Talent Systems</p>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Version 2.4</span>
            <span>•</span>
            <span>Internal HR Use Only</span>
            <span>•</span>
            <span>Confidential</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
