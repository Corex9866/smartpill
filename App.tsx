import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, 
  Pill, 
  Calendar, 
  Settings, 
  Plus, 
  CheckCircle2, 
  Bell, 
  Clock, 
  X, 
  Trash2, 
  Battery, 
  Zap, 
  Quote, 
  Smartphone, 
  UserCircle, 
  Settings2, 
  HelpCircle, 
  MessageSquare, 
  ChevronRight,
  RefreshCw,
  Heart,
  Stethoscope,
  TrendingUp,
  Target,
  AlertTriangle,
  RotateCcw,
  PhoneCall,
  Info,
  Check,
  ShieldAlert
} from 'lucide-react';
import { Medication, AdherenceLog, AdherenceStatus, UserProfile, CaregiverProfile } from './types';
import { NAV_ITEMS, COLORS, MEDICINE_QUOTES } from './constants';
import AdherenceChart from './components/AdherenceChart';
import { getHealthInsights } from './services/geminiService';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: Date;
  type: 'info' | 'warning' | 'success';
  read: boolean;
}

interface DoseException {
  medicationId: string;
  time: string;
  dayIndex: number;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsSection, setSettingsSection] = useState('user');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dailyQuote, setDailyQuote] = useState("");
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  // Shared Device/Profile State
  const [battery] = useState(82);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Aditya",
    age: 28,
    notes: "Chronic hypertension; sensitive to dairy-based pill coatings."
  });
  const [caregiver, setCaregiver] = useState<CaregiverProfile>({
    name: "Ramesh",
    contact: "9876543210 / ramesh.care@example.com"
  });
  const [emergencyContact, setEmergencyContact] = useState({
    name: "Emergency Services",
    phone: "102 / 911"
  });

  const [removedDoseExceptions, setRemovedDoseExceptions] = useState<DoseException[]>([]);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(new Date().getDay());

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      compartment: 1,
      frequency: 'daily',
      times: ['08:00', '12:55'],
      inventory: 24,
      totalCapacity: 30,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      name: 'Atorvastatin',
      dosage: '20mg',
      compartment: 2,
      frequency: 'daily',
      times: ['20:00'],
      inventory: 4,
      totalCapacity: 30,
      color: 'bg-rose-500'
    }
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'n1', title: 'Welcome to DoseMate', message: 'Your smart pillbox is successfully connected and ready.', time: new Date(Date.now() - 3600000), type: 'success', read: true },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    compartment: '',
    frequencyCount: 1,
    time1: '08:00',
    time2: '14:00',
    time3: '20:00'
  });

  const [logs, setLogs] = useState<AdherenceLog[]>(() => {
    const mockLogs: AdherenceLog[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      mockLogs.push({
        id: `mock-1-${i}`,
        medicationId: '1',
        medicationName: 'Lisinopril',
        scheduledTime: date.toISOString(),
        status: Math.random() > 0.1 ? AdherenceStatus.TAKEN : AdherenceStatus.MISSED,
        compartment: 1
      });
      mockLogs.push({
        id: `mock-2-${i}`,
        medicationId: '2',
        medicationName: 'Atorvastatin',
        scheduledTime: date.toISOString(),
        status: Math.random() > 0.2 ? AdherenceStatus.TAKEN : AdherenceStatus.MISSED,
        compartment: 2
      });
    }
    return mockLogs;
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDailyQuote(MEDICINE_QUOTES[Math.floor(Math.random() * MEDICINE_QUOTES.length)]);
  }, []);

  useEffect(() => {
    medications.forEach(med => {
      if (med.inventory <= 5) {
        const exists = notifications.some(n => n.title === 'Low Inventory' && n.message.includes(med.name));
        if (!exists) {
          setNotifications(prev => [
            {
              id: `low-${med.id}-${Date.now()}`,
              title: 'Low Inventory',
              message: `${med.name} is running low (${med.inventory} left). Please refill soon.`,
              time: new Date(),
              type: 'warning',
              read: false
            },
            ...prev
          ]);
        }
      }
    });
  }, [medications]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (logs.length > 0 && notifications.filter(n => n.title === 'DoseMate Insight').length === 0) {
        const insight = await getHealthInsights(medications, logs);
        setNotifications(prev => [
          {
            id: `insight-${Date.now()}`,
            title: 'DoseMate Insight',
            message: insight,
            time: new Date(),
            type: 'info',
            read: false
          },
          ...prev
        ]);
      }
    };
    fetchInsight();
  }, [logs.length]);

  const adherenceRate = useMemo(() => {
    const last7Days = logs.filter(l => {
      const logDate = new Date(l.scheduledTime);
      const limit = new Date();
      limit.setDate(limit.getDate() - 7);
      return logDate >= limit;
    });
    if (last7Days.length === 0) return 0;
    const taken = last7Days.filter(l => l.status === AdherenceStatus.TAKEN).length;
    return Math.round((taken / last7Days.length) * 100);
  }, [logs]);

  const handleTakePill = useCallback((medId: string, compId: number) => {
    const med = medications.find(m => m.id === medId);
    if (!med) return;
    const newLog: AdherenceLog = {
      id: Date.now().toString(),
      medicationId: medId,
      medicationName: med.name,
      scheduledTime: new Date().toISOString(),
      actualTime: new Date().toISOString(),
      status: AdherenceStatus.TAKEN,
      compartment: compId
    };
    setLogs(prev => [newLog, ...prev]);
    setMedications(prev => prev.map(m => m.id === medId ? { ...m, inventory: Math.max(0, m.inventory - 1) } : m));
  }, [medications]);

  const handleResetInventory = () => {
    if (window.confirm("Are you sure you want to reset ALL pill counts to full capacity?")) {
      setMedications(prev => prev.map(m => ({ ...m, inventory: m.totalCapacity })));
      setNotifications(prev => [
        { id: `reset-${Date.now()}`, title: 'Refill Successful', message: 'All medication compartments have been refilled.', time: new Date(), type: 'success', read: false },
        ...prev
      ]);
    }
  };

  const handleRefillSingle = (medId: string) => {
    setMedications(prev => prev.map(m => m.id === medId ? { ...m, inventory: m.totalCapacity } : m));
  };

  const handleRecalibrate = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
      alert("Weight sensor recalibration successful.");
    }, 2500);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatDisplayTime = (time: string | Date) => {
    const date = typeof time === 'string' ? new Date(`1970-01-01T${time}:00`) : time;
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: timeFormat === '12h' 
    });
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTimes = [];
    if (formData.frequencyCount >= 1) selectedTimes.push(formData.time1);
    if (formData.frequencyCount >= 2) selectedTimes.push(formData.time2);
    if (formData.frequencyCount >= 3) selectedTimes.push(formData.time3);

    const newMed: Medication = {
      id: Date.now().toString(),
      name: formData.name,
      dosage: formData.dosage,
      compartment: parseInt(formData.compartment),
      frequency: 'daily',
      times: selectedTimes,
      inventory: 30,
      totalCapacity: 30,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };

    setMedications(prev => [...prev, newMed]);
    setIsAddModalOpen(false);
    setFormData({ 
      name: '', 
      dosage: '', 
      compartment: '', 
      frequencyCount: 1, 
      time1: '08:00',
      time2: '14:00',
      time3: '20:00'
    });
  };

  const renderDashboard = () => {
    const today = new Date().getDay();
    const todayDoses = medications.flatMap(med => 
      med.times
        .filter(time => !removedDoseExceptions.some(ex => ex.medicationId === med.id && ex.time === time && ex.dayIndex === today))
        .map(time => ({ ...med, doseTime: time }))
    ).sort((a, b) => a.doseTime.localeCompare(b.doseTime));

    return (
      <div className="space-y-6 animate-in">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">Health Overview</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-blue-500" />
              {formatDisplayTime(currentTime)}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className={`p-2 rounded-xl bg-slate-50 ${battery < 20 ? 'text-rose-500' : 'text-emerald-500'}`}>
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">{battery}%</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Pillbox Power</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Target className="w-24 h-24 text-emerald-500" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Weekly Adherence Level</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-slate-800 tracking-tighter">{adherenceRate}%</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${adherenceRate >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {adherenceRate >= 80 ? 'Excellent' : 'Needs Focus'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 w-full max-w-md space-y-2">
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                      <div className={`h-full rounded-full transition-all duration-1000 ${adherenceRate >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${adherenceRate}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>0%</span>
                      <span>Target: 100%</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-[380px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" /> Weekly Activity
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Daily adherence trends for the last 7 days</p>
                </div>
              </div>
              <div className="flex-1">
                <AdherenceChart logs={logs} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Today's Schedule
                </h3>
              </div>
              <div className="space-y-3">
                {todayDoses.length > 0 ? todayDoses.slice(0, 3).map((dose, idx) => (
                  <div key={`${dose.id}-${dose.doseTime}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-xl font-bold text-xs text-slate-800 shadow-sm border border-slate-100">
                        {formatDisplayTime(dose.doseTime)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{dose.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{dose.dosage} • Comp {dose.compartment}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${dose.color} animate-pulse`}></div>
                  </div>
                )) : <p className="text-center py-8 text-slate-400 italic text-sm">All set for today!</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-500" /> My Pills
                </h3>
              </div>
              <div className="space-y-4">
                {medications.map(med => (
                  <div key={med.id} className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${med.color} flex items-center justify-center text-white shrink-0`}>
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-800 text-xs truncate">{med.name}</p>
                          <button 
                            onClick={() => handleRefillSingle(med.id)}
                            className="text-[10px] text-blue-600 font-bold hover:underline"
                          >
                            Refill
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{med.inventory} pills left</p>
                      </div>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${med.color} transition-all duration-500`} style={{ width: `${(med.inventory / med.totalCapacity) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
              <Quote className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 -rotate-12 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-4 flex items-center gap-2">
                  <Heart className="w-3 h-3" /> Health Wisdom
                </h3>
                <p className="text-sm italic font-medium leading-relaxed">
                  "{dailyQuote}"
                </p>
                <button 
                  onClick={() => setDailyQuote(MEDICINE_QUOTES[Math.floor(Math.random() * MEDICINE_QUOTES.length)])}
                  className="mt-6 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                >
                  <RefreshCw className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSchedule = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const allDoseEvents = medications.flatMap(med => 
      med.times
        .filter(time => !removedDoseExceptions.some(ex => ex.medicationId === med.id && ex.time === time && ex.dayIndex === selectedScheduleDay))
        .map(time => ({ ...med, doseTime: time }))
    ).sort((a, b) => a.doseTime.localeCompare(b.doseTime));

    return (
      <div className="space-y-6 animate-in pb-24 md:pb-0">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Weekly Schedule</h2>
            <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto max-w-full">
              {days.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setSelectedScheduleDay(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedScheduleDay === idx ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="relative pl-12 space-y-8 before:absolute before:left-[1.375rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {allDoseEvents.length > 0 ? allDoseEvents.map((dose, idx) => (
              <div key={`${dose.id}-${dose.doseTime}-${idx}`} className="relative group">
                <div className={`absolute -left-12 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${dose.color}`}></div>
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-md transition-all">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{formatDisplayTime(dose.doseTime)}</div>
                    <h4 className="font-bold text-slate-800">{dose.name}</h4>
                    <p className="text-xs text-slate-500">{dose.dosage} • Comp {dose.compartment}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTakePill(dose.id, dose.compartment)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => setRemovedDoseExceptions(prev => [...prev, { medicationId: dose.id, time: dose.doseTime, dayIndex: selectedScheduleDay }])} className="p-2 text-slate-300 hover:text-rose-500 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="text-center py-24 text-slate-400 italic text-sm">No doses scheduled for this day.</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    const sections = [
      { id: 'user', label: 'User Profile', icon: <UserCircle className="w-4 h-4" /> },
      { id: 'device', label: 'Device Info', icon: <Smartphone className="w-4 h-4" /> },
      { id: 'prefs', label: 'Preferences', icon: <Settings2 className="w-4 h-4" /> },
      { id: 'about', label: 'Support', icon: <HelpCircle className="w-4 h-4" /> },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-in pb-20">
        <div className="md:col-span-1 space-y-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSettingsSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${settingsSection === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-white hover:text-blue-600'}`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          {settingsSection === 'user' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Stethoscope className="w-5 h-5 text-rose-500" /> Patients</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Name</label>
                    <input type="text" value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Age</label>
                    <input type="number" value={userProfile.age} onChange={e => setUserProfile({...userProfile, age: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Medical notes (optional)</label>
                    <textarea value={userProfile.notes} onChange={e => setUserProfile({...userProfile, notes: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none font-medium" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><UserCircle className="w-5 h-5 text-indigo-500" /> Caregiver Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Name</label>
                    <input type="text" value={caregiver.name} onChange={e => setCaregiver({...caregiver, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Phone / Email</label>
                    <input type="text" value={caregiver.contact} onChange={e => setCaregiver({...caregiver, contact: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><PhoneCall className="w-5 h-5 text-rose-600" /> Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Contact Name</label>
                    <input type="text" value={emergencyContact.name} onChange={e => setEmergencyContact({...emergencyContact, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Emergency Phone</label>
                    <input type="text" value={emergencyContact.phone} onChange={e => setEmergencyContact({...emergencyContact, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsSection === 'device' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Device & Power</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <Battery className={`w-6 h-6 ${battery < 20 ? 'text-rose-500' : 'text-emerald-500'}`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{battery}%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Current Level</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <Smartphone className="w-6 h-6 text-blue-500 mb-4" />
                    <p className="text-sm font-bold text-slate-800">DoseMate XP-2025</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Hardware ID: DM-8829</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" /> Maintenance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handleResetInventory}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-blue-500" />
                      <span className="font-bold text-slate-800 text-sm">Reset pill count</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                  <button 
                    onClick={handleRecalibrate}
                    disabled={isCalibrating}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <RotateCcw className={`w-5 h-5 text-indigo-500 ${isCalibrating ? 'animate-spin' : ''}`} />
                      <span className="font-bold text-slate-800 text-sm">{isCalibrating ? 'Calibrating...' : 'Recalibrate weight sensor'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {settingsSection === 'prefs' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Settings2 className="w-5 h-5 text-blue-500" /> App Preferences</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Time Format</label>
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 w-full">
                    <button 
                      onClick={() => setTimeFormat('12h')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${timeFormat === '12h' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      12 Hour
                    </button>
                    <button 
                      onClick={() => setTimeFormat('24h')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${timeFormat === '24h' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      24 Hour
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-700 text-sm">Notifications</span>
                    <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-700 text-sm">Cloud Backup</span>
                    <div className="w-10 h-5 bg-slate-200 rounded-full relative"><div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsSection === 'about' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5 text-blue-600" /> Support</h3>
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
                <span className="font-bold text-slate-800 text-sm">Contact Support Desk</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
                <span className="font-bold text-slate-800 text-sm">Hardware User Manual</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'medications': return (
        <div className="space-y-6 animate-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">My Medications</h2>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medications.map(med => (
              <div key={med.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                   <div className={`w-12 h-12 rounded-xl ${med.color} flex items-center justify-center text-white shadow-lg shadow-blue-100`}><Pill className="w-6 h-6" /></div>
                   <button 
                    onClick={() => handleRefillSingle(med.id)}
                    className="p-2 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-xl transition-all"
                    title="Refill to capacity"
                   >
                     <RefreshCw className="w-4 h-4" />
                   </button>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{med.name}</h3>
                <p className="text-slate-500 text-sm font-medium">{med.dosage}</p>
                <div className="mt-6 pt-4 border-t border-slate-50">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    <span>Inventory</span>
                    <span>{med.inventory}/{med.totalCapacity} pills</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div className={`h-full ${med.inventory < 5 ? 'bg-rose-500' : med.color} transition-all duration-700`} style={{ width: `${(med.inventory / med.totalCapacity) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case 'schedule': return renderSchedule();
      case 'settings': return renderSettings();
      default: return null;
    }
  };

  const renderNotifications = () => {
    return (
      <>
        <div 
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isNotificationsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsNotificationsOpen(false)}
        />
        
        <div className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-[160] transition-transform duration-300 ease-in-out transform ${isNotificationsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tighter">Notifications</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{notifications.filter(n => !n.read).length} Unread</p>
              </div>
              <button onClick={() => setIsNotificationsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {notifications.length > 0 && (
              <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between">
                <button onClick={markAllAsRead} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Mark read</button>
                <button onClick={clearNotifications} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500">Clear</button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length > 0 ? notifications.map(notif => (
                <div key={notif.id} className={`p-4 rounded-2xl border transition-all relative group ${notif.read ? 'bg-white border-slate-100 opacity-70' : 'bg-blue-50/30 border-blue-100 shadow-sm'}`}>
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${notif.type === 'warning' ? 'bg-rose-100 text-rose-500' : notif.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'}`}>
                      {notif.type === 'warning' ? <ShieldAlert className="w-5 h-5" /> : notif.type === 'success' ? <Check className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-800 text-sm truncate pr-6">{notif.title}</h4>
                        <button onClick={() => deleteNotification(notif.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-lg transition-all"><X className="w-3 h-3 text-slate-400" /></button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{notif.message}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {!notif.read && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />}
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 py-20">
                  <Bell className="w-12 h-12 text-slate-300" />
                  <p className="font-bold text-slate-800">No Notifications</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setIsNotificationsOpen(false)} className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 transition-all">Close</button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-0 md:pl-64">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
      
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 hidden md:flex flex-col p-6 z-50">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200"><Pill className="w-6 h-6" /></div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800 uppercase">DoseMate</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <header className="mb-12 flex justify-between items-center">
          <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em]">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsNotificationsOpen(true)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-blue-600 shadow-sm relative transition-all active:scale-95">
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.read) && <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>}
            </button>
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-black">A</div>
              <span className="text-xs font-bold text-slate-700">{userProfile.name}</span>
            </div>
          </div>
        </header>
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 inset-x-0 h-20 bg-white border-t border-slate-100 flex items-center justify-around md:hidden z-50">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`}>
            {item.icon} <span className="text-[10px] font-black mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {renderNotifications()}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in relative overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tighter">Add New Pill</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddMedication} className="space-y-6">
              <div className="space-y-4">
                <input type="text" placeholder="Medication Name" required className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input type="text" placeholder="Dosage (e.g. 10mg)" required className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Compartment Slot</label>
                <select className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm appearance-none" value={formData.compartment} onChange={e => setFormData({...formData, compartment: e.target.value})} required>
                  <option value="">Select Slot</option>
                  {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>Slot {n}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Daily Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                   {[1, 2, 3].map(count => (
                     <button key={count} type="button" onClick={() => setFormData({...formData, frequencyCount: count})} className={`py-3 rounded-2xl border font-bold text-sm transition-all ${formData.frequencyCount === count ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'}`}>
                       {count === 1 ? 'Once' : count === 2 ? 'Twice' : 'Thrice'}
                     </button>
                   ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Dose Times</label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-300 uppercase w-12">1st</span>
                    <input type="time" required className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-black" value={formData.time1} onChange={e => setFormData({...formData, time1: e.target.value})} />
                  </div>
                  {formData.frequencyCount >= 2 && (
                    <div className="flex items-center gap-3 animate-in">
                      <span className="text-[10px] font-black text-slate-300 uppercase w-12">2nd</span>
                      <input type="time" required className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-black" value={formData.time2} onChange={e => setFormData({...formData, time2: e.target.value})} />
                    </div>
                  )}
                  {formData.frequencyCount >= 3 && (
                    <div className="flex items-center gap-3 animate-in">
                      <span className="text-[10px] font-black text-slate-300 uppercase w-12">3rd</span>
                      <input type="time" required className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-black" value={formData.time3} onChange={e => setFormData({...formData, time3: e.target.value})} />
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all mt-4">Save Schedule</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;